import { ModeloDocumentoFiscal, StatusDocumentoFiscal } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { autenticarApiPublica } from '@/lib/api-publica/chaves-api';
import { obterRequestId, responderErro } from '@/lib/api-publica/respostas';
import { prisma } from '@/lib/prisma';

function lerStatus(valor: string | null): StatusDocumentoFiscal | undefined {
  if (!valor) {
    return undefined;
  }

  const valores = Object.values(StatusDocumentoFiscal);
  return valores.includes(valor as StatusDocumentoFiscal) ? (valor as StatusDocumentoFiscal) : undefined;
}

function lerModelo(valor: string | null): ModeloDocumentoFiscal | undefined {
  if (!valor) {
    return undefined;
  }

  const valores = Object.values(ModeloDocumentoFiscal);
  return valores.includes(valor as ModeloDocumentoFiscal) ? (valor as ModeloDocumentoFiscal) : undefined;
}

export async function GET(request: NextRequest) {
  const requestId = obterRequestId(request);
  const contexto = await autenticarApiPublica(request, 'documentos:ler');

  if (!contexto) {
    return responderErro(401, 'NAO_AUTORIZADO', 'API key invalida ou sem escopo documentos:ler.', requestId);
  }

  const pagina = Math.max(1, Number(request.nextUrl.searchParams.get('page') || '1'));
  const limite = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get('limit') || '20')));
  const status = lerStatus(request.nextUrl.searchParams.get('status'));
  const modelo = lerModelo(request.nextUrl.searchParams.get('modelo'));

  const where = {
    clientId: contexto.client.id,
    ambiente: contexto.ambiente,
    ...(status ? { status } : {}),
    ...(modelo ? { modelo } : {}),
  };

  const [documentos, total] = await Promise.all([
    prisma.documentoFiscal.findMany({
      where,
      orderBy: { criadoEm: 'desc' },
      skip: (pagina - 1) * limite,
      take: limite,
      select: {
        id: true,
        requestId: true,
        modelo: true,
        ambiente: true,
        status: true,
        numero: true,
        serie: true,
        chaveAcesso: true,
        protocolo: true,
        cStat: true,
        motivoSefaz: true,
        valorTotal: true,
        criadoEm: true,
        atualizadoEm: true,
      },
    }),
    prisma.documentoFiscal.count({ where }),
  ]);

  return NextResponse.json({
    requestId,
    documentos,
    paginacao: {
      pagina,
      limite,
      total,
      paginas: Math.ceil(total / limite),
    },
  });
}
