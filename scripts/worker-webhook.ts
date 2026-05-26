import { PrismaClient } from '@prisma/client';
import { calcularAssinaturaWebhook } from '../src/lib/api-publica/webhooks';

const prisma = new PrismaClient();

async function enviarWebhook(entregaId: string) {
  console.log(`[Worker Webhook] Processando webhook ID ${entregaId}...`);

  // Buscar entrega e endpoint associado
  const entrega = await prisma.entregaWebhook.findUnique({
    where: { id: entregaId },
    include: { endpointWebhook: true },
  });

  if (!entrega) {
    console.error(`[Worker Webhook] Entrega ${entregaId} nao encontrada.`);
    return;
  }

  const endpoint = entrega.endpointWebhook;
  if (!endpoint || !endpoint.ativo) {
    console.warn(`[Worker Webhook] Endpoint para entrega ${entregaId} esta inativo ou foi deletado.`);
    await prisma.entregaWebhook.update({
      where: { id: entregaId },
      data: {
        status: 'ESGOTADO',
        ultimoErro: 'Endpoint inativo ou deletado.',
      },
    });
    return;
  }

  // 1. Marcar como ENVIANDO
  await prisma.entregaWebhook.update({
    where: { id: entregaId },
    data: { status: 'ENVIANDO' },
  });

  const payloadString = JSON.stringify(entrega.payload);
  const assinatura = calcularAssinaturaWebhook(payloadString, endpoint.segredo);

  try {
    const Controller = new AbortController();
    const timeoutId = setTimeout(() => Controller.abort(), 10000); // 10 segundos de timeout

    console.log(`[Worker Webhook] Efetuando POST para ${endpoint.url}...`);
    const resposta = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'X-Hub-Signature-256': assinatura,
        'X-Webhook-Delivery-Id': entrega.id,
        'X-Webhook-Event': entrega.evento,
      },
      body: payloadString,
      signal: Controller.signal,
    });

    clearTimeout(timeoutId);

    const statusHttp = resposta.status;

    if (resposta.ok) {
      console.log(`[Worker Webhook] Webhook ID ${entrega.id} entregue com sucesso! Status HTTP: ${statusHttp}`);
      await prisma.entregaWebhook.update({
        where: { id: entregaId },
        data: {
          status: 'ENTREGUE',
          ultimoStatusHttp: statusHttp,
          tentativas: { increment: 1 },
        },
      });
    } else {
      console.warn(`[Worker Webhook] Erro ao entregar Webhook ID ${entrega.id}. Status HTTP: ${statusHttp}`);
      throw new Error(`Status HTTP: ${statusHttp}`);
    }
  } catch (error: any) {
    console.error(`[Worker Webhook] Falha ao enviar Webhook ID ${entregaId}:`, error);

    const proximaTentativa = calcularProximaTentativa(entrega.tentativas + 1);

    await prisma.entregaWebhook.update({
      where: { id: entregaId },
      data: {
        status: entrega.tentativas + 1 >= 5 ? 'FALHOU' : 'PENDENTE',
        tentativas: { increment: 1 },
        proximaTentativaEm: proximaTentativa,
        ultimoErro: error.message || 'Erro de rede desconhecido.',
      },
    });
  }
}

function calcularProximaTentativa(tentativa: number): Date {
  const minutos = Math.pow(2, tentativa); // Backoff exponencial: 2, 4, 8, 16, 32 minutos
  const data = new Date();
  data.setMinutes(data.getMinutes() + minutos);
  return data;
}

async function loop() {
  console.log('[Worker Webhook] Iniciado e monitorando entregas pendentes...');
  while (true) {
    try {
      const entrega = await prisma.entregaWebhook.findFirst({
        where: {
          status: 'PENDENTE',
          OR: [
            { proximaTentativaEm: null },
            { proximaTentativaEm: { lte: new Date() } },
          ],
        },
        orderBy: { criadoEm: 'asc' },
        select: { id: true },
      });

      if (entrega) {
        await enviarWebhook(entrega.id);
      } else {
        await new Promise((res) => setTimeout(res, 2000));
      }
    } catch (err) {
      console.error('[Worker Webhook] Erro no loop do worker:', err);
      await new Promise((res) => setTimeout(res, 5000));
    }
  }
}

loop().catch((err) => {
  console.error('[Worker Webhook] Falha critica no worker:', err);
  process.exit(1);
});