import { PrismaClient, AmbienteFiscalApi } from '@prisma/client';
import { hashPassword } from '../src/lib/password';
import { gerarChaveApi } from '../src/lib/api-publica/chaves-api';

const prisma = new PrismaClient();

async function inicializarSimulador() {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
  if (isProduction) {
    throw new Error('O simulador de emissão contínua não pode ser executado em ambiente de produção.');
  }

  console.log('================================================================');
  console.log('🤖 INICIALIZANDO SIMULADOR DE EMISSÃO CONTÍNUA (10 SEGUNDOS) 🤖');
  console.log('================================================================');

  const email = 'cliente@sistema.com.br';
  console.log(`[Simulador] Configurando cliente: ${email}...`);

  // 1. Buscar ou Criar o Administrador padrão para poder associar o Client
  let admin = await prisma.admin.findFirst();
  if (!admin) {
    const adminHash = await hashPassword('Admin@123456');
    admin = await prisma.admin.create({
      data: {
        name: 'Administrador Principal',
        email: 'admin@apifiscal.local',
        password: adminHash,
        active: true,
      }
    });
    console.log('[Simulador] Administrador padrão criado.');
  }

  // 2. Buscar ou Criar o Client
  let user = await prisma.user.findUnique({
    where: { email },
    include: { client: true }
  });

  let clientId: string;

  if (!user) {
    console.log('[Simulador] Usuário não encontrado. Criando novo cliente e usuário...');
    
    const client = await prisma.client.create({
      data: {
        companyName: 'Empresa Demonstrativa Sistema LTDA',
        tradeName: 'Sistema B2B Emissor',
        document: '55666777000188',
        email: email,
        status: 'ATIVO',
        saldoCreditos: 1000, // Inicia com 1000 créditos
        createdById: admin.id
      }
    });

    clientId = client.id;
    const userHash = await hashPassword('Sistema@123456');
    
    user = await prisma.user.create({
      data: {
        name: 'Cliente Sistema',
        email: email,
        document: '55666777888',
        password: userHash,
        clientId: client.id,
        active: true
      },
      include: { client: true }
    });

    console.log('[Simulador] Cliente e Usuário cadastrados com sucesso!');
  } else {
    clientId = user.clientId!;
    console.log('[Simulador] Cliente já cadastrado. Garantindo créditos ativos...');
    
    // Adiciona saldo de créditos se necessário para não travar na emissão pré-paga
    await prisma.client.update({
      where: { id: clientId },
      data: {
        saldoCreditos: {
          increment: 500
        }
      } as any
    });
  }

  // 3. Buscar ou Criar a Empresa vinculada ao Usuário (emitente)
  let empresa = await prisma.empresa.findFirst({
    where: { userId: user.id }
  });

  if (!empresa) {
    console.log('[Simulador] Empresa emitente não encontrada. Criando empresa padrão de testes...');
    empresa = await prisma.empresa.create({
      data: {
        userId: user.id,
        cnpj: '55666777000188',
        nome: 'Empresa Demonstrativa Sistema LTDA',
        nomeFantasia: 'Sistema Emissor',
        ie: '123456789012',
        logradouro: 'Avenida das Nações Unidas',
        numero: '12901',
        bairro: 'Brooklin Novo',
        municipio: 'SAO PAULO',
        uf: 'SP',
        cep: '04578000',
        ambiente: '2', // Homologação
        proximoNumeroNfe: 1,
        proximoNumeroNfce: 1,
        active: true
      }
    });

    // Cria um certificado simulado para a empresa poder emitir sem erros
    await prisma.certificadoDigital.create({
      data: {
        empresaId: empresa.id,
        nome: 'CERTIFICADO_HOMOLOGACAO.p12',
        arquivo: Buffer.from('CERTIFICADO_SIMULADO_DATA'),
        senha: 'senha_criptografada_exemplo',
        validoAte: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Válido por 1 ano
        active: true
      }
    });
    console.log('[Simulador] Empresa emitente e certificado digital criados.');
  }

  // 4. Buscar ou Criar Chave de API de Produção para testar consumo de crédito
  // Criamos uma nova chave para podermos obter o token em formato texto plano
  console.log('[Simulador] Gerando chave de API de Produção ativa...');
  const gerada = gerarChaveApi(AmbienteFiscalApi.PRODUCAO);
  const chaveApi = await prisma.chaveApi.create({
    data: {
      clientId,
      nome: 'Chave Simulação Contínua',
      prefixo: gerada.prefixo,
      hashSegredo: gerada.hashSegredo,
      ambiente: AmbienteFiscalApi.PRODUCAO,
      escopos: ['*'],
      ativa: true
    }
  });

  console.log(`[Simulador] Chave de API ativa gerada! Token: ${gerada.token}`);
  console.log('================================================================');

  // Retorna os dados necessários para o loop de disparo
  return {
    token: gerada.token,
    empresaId: empresa.id,
    clienteId: clientId,
  };
}

async function loopEmissao(token: string, empresaId: string, clienteId: string) {
  let contador = 1;

  console.log('[Simulador] Iniciando loop infinito de emissão. Pressione Ctrl+C para encerrar.');
  
  setInterval(async () => {
    const num = contador++;
    console.log(`\n------------------ NOTA #${num} ------------------`);
    console.log(`[${new Date().toLocaleTimeString()}] Iniciando envio da NF-e #${num}...`);

    const payload = {
      empresaId: empresaId,
      valorTotal: 120.00,
      itens: [
        {
          codigo: `PROD-${num}`,
          descricao: `Item Exemplo Simulador Auto #${num}`,
          quantidade: 3,
          valorUnitario: 40.00,
          valorTotal: 120.00,
          ncm: '61091000',
          cfop: '5102',
          unidade: 'UN'
        }
      ]
    };

    try {
      const response = await fetch('http://localhost:3000/api/v1/nfe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': token,
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        console.log(`[${new Date().toLocaleTimeString()}] ✅ Nota Fiscal Recebida!`);
        console.log(`   - ID do Documento: ${data.documentoId}`);
        console.log(`   - Status: ${data.status}`);
        
        // Consultar saldo de créditos atualizado no banco
        const clientDb = await prisma.client.findUnique({
          where: { id: clienteId },
          select: { saldoCreditos: true }
        });
        console.log(`   - Saldo de Créditos Atual: ${(clientDb as any)?.saldoCreditos} notas`);
      } else {
        console.error(`[${new Date().toLocaleTimeString()}] ❌ Erro ao receber nota:`, data.error || data);
      }
    } catch (err: any) {
      console.error(`[${new Date().toLocaleTimeString()}] 💥 Erro de rede/conexão: ${err.message}`);
      console.log('   Dica: Certifique-se de que o servidor local (bun dev) está rodando na porta 3000!');
    }
  }, 10000);
}

// Iniciar o Script
async function main() {
  try {
    const config = await inicializarSimulador();
    await loopEmissao(config.token, config.empresaId, config.clienteId);
  } catch (err: any) {
    console.error('Falha crítica ao iniciar simulador:', err);
    process.exit(1);
  }
}

main();
