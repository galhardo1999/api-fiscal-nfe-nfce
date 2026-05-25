import { NextRequest, NextResponse } from 'next/server';
import { autenticarApiPublica } from '@/lib/api-publica/chaves-api';
import { obterRequestId, responderErro } from '@/lib/api-publica/respostas';
import { ehRegistro, lerNumero, lerTexto, paraJsonPrisma } from '@/lib/api-publica/validacao';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
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

  const empresaId = lerTexto(corpo, 'empresaId');
  const modelo = lerTexto(corpo, 'modelo');
  const serie = lerNumero(corpo, 'serie');
  const numeroInicial = lerNumero(corpo, 'numeroInicial');
  const numeroFinal = lerNumero(corpo, 'numeroFinal');
  const justificativa = lerTexto(corpo, 'justificativa');

  if (!empresaId || !modelo || serie === null || numeroInicial === null || numeroFinal === null || !justificativa) {
    return responderErro(400, 'VALIDACAO_FALHOU', 'empresaId, modelo, serie, numeroInicial, numeroFinal e justificativa sao obrigatorios.', requestId);
  }

  if (justificativa.length < 15) {
    return responderErro(400, 'JUSTIFICATIVA_INVALIDA', 'justificativa deve ter pelo menos 15 caracteres.', requestId);
  }

  const empresa = await prisma.empresa.findFirst({
    where: {
      id: empresaId,
      user: { clientId: contexto.client.id },
    },
    select: { id: true },
  });

  if (!empresa) {
    return responderErro(404, 'EMPRESA_NAO_ENCONTRADA', 'Empresa emitente nao encontrada para este cliente.', requestId);
  }

  const documento = await prisma.documentoFiscal.create({
    data: {
      clientId: contexto.client.id,
      empresaId: empresa.id,
      chaveApiId: contexto.chaveApi.id,
      requestId,
      modelo: modelo === '65' || modelo.toUpperCase() === 'NFCE' ? 'NFCE' : 'NFE',
      ambiente: contexto.ambiente,
      status: 'ENFILEIRADA',
      payload: paraJsonPrisma({ empresaId, modelo, serie, numeroInicial, numeroFinal, justificativa }),
      eventos: {
        create: {
          tipo: 'INUTILIZACAO',
          statusNovo: 'ENFILEIRADA',
          mensagem: 'Inutilizacao recebida e aguardando processamento fiscal.',
          payload: paraJsonPrisma({ serie, numeroInicial, numeroFinal, justificativa }),
        },
      },
    },
  });

  return NextResponse.json({
    requestId,
    documentoId: documento.id,
    status: documento.status,
  }, { status: 202 });
}
