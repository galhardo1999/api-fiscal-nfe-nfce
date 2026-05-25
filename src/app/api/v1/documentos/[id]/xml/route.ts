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
    select: {
      id: true,
      status: true,
      xmlNfe: true,
      xmlProtocolo: true,
      nfe: {
        select: {
          xmlNfe: true,
          xmlProtocolo: true,
        },
      },
    },
  });

  if (!documento) {
    return responderErro(404, 'DOCUMENTO_NAO_ENCONTRADO', 'Documento fiscal nao encontrado.', requestId);
  }

  const xml = documento.xmlProtocolo || documento.nfe?.xmlProtocolo || documento.xmlNfe || documento.nfe?.xmlNfe;
  if (!xml) {
    return responderErro(409, 'XML_AINDA_INDISPONIVEL', 'XML ainda nao esta disponivel para este documento.', requestId, {
      status: documento.status,
    });
  }

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'X-Request-Id': requestId,
    },
  });
}
