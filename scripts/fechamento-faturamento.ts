import { PrismaClient, AmbienteFiscalApi, ModeloDocumentoFiscal, StatusDocumentoFiscal } from '@prisma/client';
import { calcularCobrancaNotas, obterAnoMes, obterIntervaloAnoMes } from '../src/lib/cobranca/cobranca';

const prisma = new PrismaClient();

async function processarFechamento(anoMes: string) {
  console.log(`[Billing] Iniciando processamento de faturamento para o periodo: ${anoMes}`);

  const intervalo = obterIntervaloAnoMes(anoMes);
  const clientes = await prisma.client.findMany({
    where: { status: 'ATIVO' },
  });

  console.log(`[Billing] Encontrados ${clientes.length} clientes ativos para faturar.`);

  for (const cliente of clientes) {
    console.log(`[Billing] Processando cliente: ${cliente.companyName} (${cliente.document})`);

    // Obter todas as notas autorizadas do cliente no mês
    const totalNotasAutorizadas = await prisma.documentoFiscal.count({
      where: {
        clientId: cliente.id,
        status: StatusDocumentoFiscal.AUTORIZADA,
        criadoEm: {
          gte: intervalo.inicio,
          lt: intervalo.fim,
        },
      },
    });

    const totalCanceladas = await prisma.documentoFiscal.count({
      where: {
        clientId: cliente.id,
        status: StatusDocumentoFiscal.CANCELADA,
        criadoEm: {
          gte: intervalo.inicio,
          lt: intervalo.fim,
        },
      },
    });

    const totalInutilizadas = await prisma.documentoFiscal.count({
      where: {
        clientId: cliente.id,
        status: StatusDocumentoFiscal.INUTILIZADA,
        criadoEm: {
          gte: intervalo.inicio,
          lt: intervalo.fim,
        },
      },
    });

    // Calcular cobrança pelas novas regras pré-pagas
    const resultado = calcularCobrancaNotas(totalNotasAutorizadas);

    console.log(`[Billing] - Notas autorizadas: ${totalNotasAutorizadas}`);
    console.log(`[Billing] - Preco unitario: R$ ${resultado.precoUnitario.toFixed(2)}`);
    console.log(`[Billing] - Faturamento calculado: R$ ${resultado.valorTotal.toFixed(2)} (Faixa: ${resultado.faixa})`);

    // Atualizar ou criar o UsoMensal
    const usoMensal = await prisma.usoMensal.upsert({
      where: {
        clientId_anoMes_ambiente_modelo: {
          clientId: cliente.id,
          anoMes,
          ambiente: AmbienteFiscalApi.PRODUCAO,
          modelo: ModeloDocumentoFiscal.NFE,
        },
      },
      update: {
        quantidadeAutorizada: totalNotasAutorizadas,
        quantidadeCancelamento: totalCanceladas,
        quantidadeInutilizacao: totalInutilizadas,
        valorNotas: resultado.valorNotas,
        valorTotal: resultado.valorTotal,
        valorMinimo: 0.00,
        fechadoEm: new Date(),
      },
      create: {
        clientId: cliente.id,
        anoMes,
        ambiente: AmbienteFiscalApi.PRODUCAO,
        modelo: ModeloDocumentoFiscal.NFE,
        quantidadeAutorizada: totalNotasAutorizadas,
        quantidadeCancelamento: totalCanceladas,
        quantidadeInutilizacao: totalInutilizadas,
        valorNotas: resultado.valorNotas,
        valorTotal: resultado.valorTotal,
        valorMinimo: 0.00,
        fechadoEm: new Date(),
      },
    });

    // Auditoria de cobrança
    await prisma.auditoria.create({
      data: {
        clientId: cliente.id,
        tipo: 'COBRANCA',
        acao: 'fechamento_mensal_faturamento',
        recurso: 'UsoMensal',
        recursoId: usoMensal.id,
        metadata: {
          anoMes,
          totalNotas: totalNotasAutorizadas,
          valorTotal: resultado.valorTotal,
          faixa: resultado.faixa,
        },
      },
    });

    console.log(`[Billing] Fechamento do cliente ${cliente.companyName} gravado com sucesso!`);
  }

  console.log(`[Billing] Fechamento do faturamento para ${anoMes} concluido.`);
}

const args = process.argv.slice(2);
const periodo = args[0] || obterAnoMes();

processarFechamento(periodo)
  .catch((err) => {
    console.error('[Billing] Erro no fechamento de faturamento:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });