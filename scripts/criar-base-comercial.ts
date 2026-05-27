import { AdminRole, BillingPeriod, ClientStatus, PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/password';

const prisma = new PrismaClient();

function lerTexto(nome: string, valorPadrao: string): string {
  const valor = process.env[nome]?.trim();
  return valor && valor.length > 0 ? valor : valorPadrao;
}

function lerDocumento(nome: string, valorPadrao: string): string {
  return lerTexto(nome, valorPadrao).replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

function lerPeriodoCobranca(valor: string): BillingPeriod {
  const normalizado = valor.toUpperCase();
  if (normalizado === BillingPeriod.TRIMESTRAL) return BillingPeriod.TRIMESTRAL;
  if (normalizado === BillingPeriod.SEMESTRAL) return BillingPeriod.SEMESTRAL;
  if (normalizado === BillingPeriod.ANUAL) return BillingPeriod.ANUAL;
  if (normalizado === BillingPeriod.TRIAL) return BillingPeriod.TRIAL;
  return BillingPeriod.MENSAL;
}

async function principal() {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';

  const rawSenhaAdmin = process.env.ADMIN_SENHA;
  if (!rawSenhaAdmin && isProduction) {
    throw new Error('A variavel de ambiente ADMIN_SENHA e obrigatoria em producao para criar a base comercial com seguranca.');
  }

  const rawSenhaUsuario = process.env.CLIENTE_USUARIO_SENHA;
  if (!rawSenhaUsuario && isProduction) {
    throw new Error('A variavel de ambiente CLIENTE_USUARIO_SENHA e obrigatoria em producao para criar a base comercial com seguranca.');
  }

  const emailAdmin = lerTexto('ADMIN_EMAIL', 'admin@apifiscal.local').toLowerCase();
  const nomeAdmin = lerTexto('ADMIN_NOME', 'Administrador API Fiscal');
  const senhaAdmin = rawSenhaAdmin || 'Admin@123456';

  const planoId = lerTexto('PLANO_ID', 'plano_api_fiscal_base');
  const planoNome = lerTexto('PLANO_NOME', 'API Fiscal Base');
  const planoDescricao = lerTexto('PLANO_DESCRICAO', 'Plano base para emissao de NF-e e NFC-e por API.');
  const planoPreco = lerTexto('PLANO_PRECO', '69.90');
  const planoPeriodo = lerPeriodoCobranca(lerTexto('PLANO_PERIODO', BillingPeriod.MENSAL));

  const clienteCodigo = lerTexto('CLIENTE_CODIGO', 'CLI-0001');
  const clienteRazaoSocial = lerTexto('CLIENTE_RAZAO_SOCIAL', 'Cliente Demonstracao API Fiscal');
  const clienteNomeFantasia = lerTexto('CLIENTE_NOME_FANTASIA', 'Cliente API Fiscal');
  const clienteDocumento = lerDocumento('CLIENTE_CNPJ', '00000000000191');
  const clienteEmail = lerTexto('CLIENTE_EMAIL', 'contratante@apifiscal.local').toLowerCase();
  const usuarioClienteEmail = lerTexto('CLIENTE_USUARIO_EMAIL', 'cliente@apifiscal.local').toLowerCase();
  const usuarioClienteNome = lerTexto('CLIENTE_USUARIO_NOME', 'Usuario Cliente API Fiscal');
  const usuarioClienteDocumento = lerDocumento('CLIENTE_USUARIO_DOCUMENTO', '00000000000');
  const usuarioClienteSenha = rawSenhaUsuario || '123';

  const admin = await prisma.admin.upsert({
    where: { email: emailAdmin },
    update: {
      name: nomeAdmin,
      password: await hashPassword(senhaAdmin),
      role: AdminRole.SUPER_ADMIN,
      active: true,
    },
    create: {
      name: nomeAdmin,
      email: emailAdmin,
      password: await hashPassword(senhaAdmin),
      role: AdminRole.SUPER_ADMIN,
      active: true,
    },
  });

  const plano = await prisma.planos.upsert({
    where: { id: planoId },
    update: {
      name: planoNome,
      description: planoDescricao,
      price: planoPreco,
      billingPeriod: planoPeriodo,
      trialDays: Number(lerTexto('PLANO_DIAS_TESTE', '0')),
      features: [
        'NF-e modelo 55',
        'NFC-e modelo 65',
        'Chaves de homologacao e producao',
        'Webhooks',
        'Cobranca por nota emitida',
      ],
      menuItems: ['dashboard', 'chaves-api', 'empresas', 'documentos', 'webhooks', 'cobranca'],
      active: true,
    },
    create: {
      id: planoId,
      name: planoNome,
      description: planoDescricao,
      price: planoPreco,
      billingPeriod: planoPeriodo,
      trialDays: Number(lerTexto('PLANO_DIAS_TESTE', '0')),
      features: [
        'NF-e modelo 55',
        'NFC-e modelo 65',
        'Chaves de homologacao e producao',
        'Webhooks',
        'Cobranca por nota emitida',
      ],
      menuItems: ['dashboard', 'chaves-api', 'empresas', 'documentos', 'webhooks', 'cobranca'],
      active: true,
    },
  });

  const clienteExistente = await prisma.client.findFirst({
    where: {
      OR: [
        { email: clienteEmail },
        { document: clienteDocumento },
      ],
    },
    select: { id: true },
  });

  const dadosCliente = {
    code: clienteCodigo,
    companyName: clienteRazaoSocial,
    tradeName: clienteNomeFantasia,
    document: clienteDocumento,
    email: clienteEmail,
    phone: lerTexto('CLIENTE_TELEFONE', '(11) 4000-0000'),
    city: lerTexto('CLIENTE_CIDADE', 'Sao Paulo'),
    state: lerTexto('CLIENTE_UF', 'SP').toUpperCase(),
    zipCode: lerTexto('CLIENTE_CEP', '01001000'),
    status: ClientStatus.ATIVO,
    planId: plano.id,
  };

  const cliente = clienteExistente
    ? await prisma.client.update({
        where: { id: clienteExistente.id },
        data: dadosCliente,
      })
    : await prisma.client.create({
        data: {
          ...dadosCliente,
          createdById: admin.id,
        },
      });

  const usuarioCliente = await prisma.user.upsert({
    where: { email: usuarioClienteEmail },
    update: {
      name: usuarioClienteNome,
      document: usuarioClienteDocumento,
      password: await hashPassword(usuarioClienteSenha),
      active: true,
      clientId: cliente.id,
    },
    create: {
      name: usuarioClienteNome,
      email: usuarioClienteEmail,
      document: usuarioClienteDocumento,
      password: await hashPassword(usuarioClienteSenha),
      active: true,
      clientId: cliente.id,
    },
  });

  console.log('Base comercial criada/atualizada.');
  console.log(`Administrador: ${admin.email}`);
  console.log(`Plano: ${plano.name} (${plano.id})`);
  console.log(`Cliente: ${cliente.companyName} (${cliente.document})`);
  console.log(`Usuario cliente: ${usuarioCliente.email}`);
}

principal()
  .catch((erro) => {
    console.error('Erro ao criar base comercial:', erro);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
