import { NextRequest, NextResponse } from 'next/server';
import { autenticarApiPublica } from '@/lib/api-publica/chaves-api';
import { registrarEntregasWebhook } from '@/lib/api-publica/documentos';
import { obterRequestId, responderErro } from '@/lib/api-publica/respostas';
import { ehRegistro, lerTexto, paraJsonPrisma } from '@/lib/api-publica/validacao';
import { prisma } from '@/lib/prisma';

interface ContextoRota {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, contextoRota: ContextoRota) {
  const requestId = obterRequestId(request);
  const contexto = await autenticarApiPublica(request, 'documentos:eventos');

  if (!contexto) {
    return responderErro(401, 'NAO_AUTORIZADO', 'API key invalida ou sem escopo documentos:eventos.', requestId);
  }

  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return responderErro(400, 'JSON_INVALIDO', 'Corpo da requisicao deve ser JSON valido.', requestId);
  }

  if (!ehRegistro(corpo)) {
    return responderErro(400, 'PAYLOAD_INVALIDO', 'Corpo JSON deve ser um objeto.', requestId);
  }

  const correcao = lerTexto(corpo, 'correcao') || lerTexto(corpo, 'texto');
  if (!correcao || correcao.length < 15 || correcao.length > 1000) {
    return responderErro(400, 'CORRECAO_INVALIDA', 'correcao deve ter entre 15 e 1000 caracteres.', requestId);
  }

  const { id } = await contextoRota.params;
  const documento = await prisma.documentoFiscal.findFirst({
    where: {
      id,
      clientId: contexto.client.id,
      ambiente: contexto.ambiente,
    },
    select: { id: true, status: true, modelo: true },
  });

  if (!documento) {
    return responderErro(404, 'DOCUMENTO_NAO_ENCONTRADO', 'Documento fiscal nao encontrado.', requestId);
  }

  if (documento.modelo !== 'NFE') {
    return responderErro(422, 'CCE_NAO_PERMITIDA', 'Carta de correcao e permitida apenas para NF-e modelo 55.', requestId);
  }

  const evento = await prisma.documentoFiscalEvento.create({
    data: {
      documentoFiscalId: documento.id,
      tipo: 'CARTA_CORRECAO',
      statusAnterior: documento.status,
      mensagem: 'Carta de correcao recebida e aguardando processamento fiscal.',
      payload: paraJsonPrisma({ correcao, requestId }),
    },
  });

  await registrarEntregasWebhook({
    clientId: contexto.client.id,
    documentoFiscalId: documento.id,
    documentoFiscalEventoId: evento.id,
    evento: 'documento.carta_correcao.recebida',
    payload: {
      documentoId: documento.id,
      modelo: documento.modelo,
      status: documento.status,
      requestId,
    },
  });

  return NextResponse.json({
    requestId,
    eventoId: evento.id,
    documentoId: documento.id,
    status: 'EVENTO_RECEBIDO',
  }, { status: 202 });
}
