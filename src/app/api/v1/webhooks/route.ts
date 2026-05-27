import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { autenticarApiPublica } from '@/lib/api-publica/chaves-api';
import { isSafeUrl } from '@/lib/seguranca/ssrf';
import { obterRequestId, responderErro } from '@/lib/api-publica/respostas';
import { ehRegistro, lerTexto } from '@/lib/api-publica/validacao';
import { prisma } from '@/lib/prisma';

const eventosPadrao = [
  'documento.recebido',
  'documento.autorizado',
  'documento.rejeitado',
  'documento.cancelado',
  'documento.contingencia',
  'documento.inutilizado',
  'certificado.vencendo',
];

function lerEventos(valor: unknown): string[] {
  if (!Array.isArray(valor)) {
    return eventosPadrao;
  }

  const eventos = valor.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  return eventos.length > 0 ? eventos : eventosPadrao;
}

export async function GET(request: NextRequest) {
  const requestId = obterRequestId(request);
  const contexto = await autenticarApiPublica(request, 'webhooks:gerenciar');

  if (!contexto) {
    return responderErro(401, 'NAO_AUTORIZADO', 'API key invalida ou sem escopo webhooks:gerenciar.', requestId);
  }

  const endpoints = await prisma.endpointWebhook.findMany({
    where: { clientId: contexto.client.id },
    orderBy: { criadoEm: 'desc' },
    select: {
      id: true,
      url: true,
      eventos: true,
      ativo: true,
      criadoEm: true,
      atualizadoEm: true,
    },
  });

  return NextResponse.json({ requestId, endpoints });
}

export async function POST(request: NextRequest) {
  const requestId = obterRequestId(request);
  const contexto = await autenticarApiPublica(request, 'webhooks:gerenciar');

  if (!contexto) {
    return responderErro(401, 'NAO_AUTORIZADO', 'API key invalida ou sem escopo webhooks:gerenciar.', requestId);
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

  const url = lerTexto(corpo, 'url');
  if (!url) {
    return responderErro(400, 'URL_OBRIGATORIA', 'url e obrigatoria.', requestId);
  }

  const ssrfValidacao = await isSafeUrl(url);
  if (!ssrfValidacao.safe) {
    return responderErro(400, 'URL_INVALIDA', ssrfValidacao.error || 'A URL informada nao e segura.', requestId);
  }

  const urlValidada = new URL(url);

  const segredo = randomBytes(32).toString('base64url');
  const endpoint = await prisma.endpointWebhook.upsert({
    where: {
      clientId_url: {
        clientId: contexto.client.id,
        url: urlValidada.toString(),
      },
    },
    update: {
      eventos: lerEventos(corpo.eventos),
      ativo: true,
    },
    create: {
      clientId: contexto.client.id,
      url: urlValidada.toString(),
      segredo,
      eventos: lerEventos(corpo.eventos),
    },
    select: {
      id: true,
      url: true,
      eventos: true,
      ativo: true,
      criadoEm: true,
      atualizadoEm: true,
    },
  });

  return NextResponse.json({
    requestId,
    endpoint,
    segredo,
    aviso: 'Guarde este segredo para validar a assinatura HMAC dos webhooks.',
  }, { status: 201 });
}
