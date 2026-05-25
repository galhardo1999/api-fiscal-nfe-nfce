import { NextRequest, NextResponse } from 'next/server';
import { autenticarApiPublica } from '@/lib/api-publica/chaves-api';
import { obterRequestId, responderErro } from '@/lib/api-publica/respostas';
import { prisma } from '@/lib/prisma';

interface ContextoRota {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, contextoRota: ContextoRota) {
  const requestId = obterRequestId(request);
  const contexto = await autenticarApiPublica(request, 'documentos:ler');

  if (!contexto) {
    return responderErro(401, 'NAO_AUTORIZADO', 'API key invalida ou sem escopo documentos:ler.', requestId);
  }

  const { id } = await contextoRota.params;
  const documento = await prisma.documentoFiscal.findFirst({
    where: {
      id,
      clientId: contexto.client.id,
      ambiente: contexto.ambiente,
    },
    include: {
      itens: {
        orderBy: { numeroItem: 'asc' },
      },
      eventos: {
        orderBy: { criadoEm: 'asc' },
      },
    },
  });

  if (!documento) {
    return responderErro(404, 'DOCUMENTO_NAO_ENCONTRADO', 'Documento fiscal nao encontrado.', requestId);
  }

  return NextResponse.json({ requestId, documento });
}
