import { ModeloDocumentoFiscal } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { autenticarApiPublica } from '@/lib/api-publica/chaves-api';
import { obterRequestId, responderErro } from '@/lib/api-publica/respostas';
import { calcularCobrancaNotas, obterAnoMes, obterIntervaloAnoMes } from '@/lib/cobranca/cobranca';
import { prisma } from '@/lib/prisma';

function lerModelo(valor: string | null): ModeloDocumentoFiscal | undefined {
  if (!valor) {
    return undefined;
  }

  const normalizado = valor.toUpperCase();
  if (normalizado === 'NFE' || normalizado === 'NFCE') {
    return normalizado;
  }

  return undefined;
}

export async function GET(request: NextRequest) {
  const requestId = obterRequestId(request);
  const contexto = await autenticarApiPublica(request, 'cobranca:ler');

  if (!contexto) {
    return responderErro(401, 'NAO_AUTORIZADO', 'API key invalida ou sem escopo cobranca:ler.', requestId);
  }

  const anoMes = request.nextUrl.searchParams.get('anoMes') || obterAnoMes();
  const modelo = lerModelo(request.nextUrl.searchParams.get('modelo'));

  let intervalo: { inicio: Date; fim: Date };
  try {
    intervalo = obterIntervaloAnoMes(anoMes);
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : 'anoMes invalido.';
    return responderErro(400, 'ANO_MES_INVALIDO', mensagem, requestId);
  }

  const where = {
    clientId: contexto.client.id,
    ambiente: contexto.ambiente,
    status: 'AUTORIZADA' as const,
    criadoEm: {
      gte: intervalo.inicio,
      lt: intervalo.fim,
    },
    ...(modelo ? { modelo } : {}),
  };

  const quantidadeAutorizada = await prisma.documentoFiscal.count({ where });
  const cobranca = calcularCobrancaNotas(quantidadeAutorizada);

  return NextResponse.json({
    requestId,
    anoMes,
    ambiente: contexto.ambiente,
    modelo: modelo || 'TODOS',
    quantidadeAutorizada,
    cobranca,
  });
}
