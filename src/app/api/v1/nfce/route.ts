import { ModeloDocumentoFiscal } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { autenticarApiPublica } from '@/lib/api-publica/chaves-api';
import { criarDocumentoFiscalRecebido } from '@/lib/api-publica/documentos';
import { obterRequestId, responderErro } from '@/lib/api-publica/respostas';
import { validarPayloadDocumento } from '@/lib/api-publica/validacao';

export async function POST(request: NextRequest) {
  const requestId = obterRequestId(request);
  const contexto = await autenticarApiPublica(request, 'documentos:emitir');

  if (!contexto) {
    return responderErro(401, 'NAO_AUTORIZADO', 'API key invalida ou sem escopo documentos:emitir.', requestId);
  }

  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return responderErro(400, 'JSON_INVALIDO', 'Corpo da requisicao deve ser JSON valido.', requestId);
  }

  const validacao = validarPayloadDocumento(corpo);
  if (validacao.erros || !validacao.dados) {
    return responderErro(400, 'VALIDACAO_FALHOU', 'Payload de NFC-e invalido.', requestId, validacao.erros);
  }

  const idempotencyKey = request.headers.get('idempotency-key');

  try {
    const documento = await criarDocumentoFiscalRecebido({
      contexto,
      dados: validacao.dados,
      modelo: ModeloDocumentoFiscal.NFCE,
      requestId,
      idempotencyKey,
    });

    return NextResponse.json({
      requestId: documento.requestId,
      documentoId: documento.id,
      modelo: documento.modelo,
      ambiente: documento.ambiente,
      status: documento.status,
      idempotente: documento.idempotente,
      links: {
        self: `/api/v1/documentos/${documento.id}`,
        xml: `/api/v1/documentos/${documento.id}/xml`,
        pdf: `/api/v1/documentos/${documento.id}/pdf`,
      },
    }, { status: documento.idempotente ? 200 : 202 });
  } catch (erro) {
    if (erro instanceof Error && erro.message === 'EMPRESA_NAO_ENCONTRADA') {
      return responderErro(404, 'EMPRESA_NAO_ENCONTRADA', 'Empresa emitente nao encontrada para este cliente.', requestId);
    }

    const mensagem = erro instanceof Error ? erro.message : 'Erro interno ao receber NFC-e.';
    return responderErro(500, 'ERRO_INTERNO', mensagem, requestId);
  }
}
