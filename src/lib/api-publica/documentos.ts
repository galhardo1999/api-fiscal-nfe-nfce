import { AmbienteFiscalApi, ModeloDocumentoFiscal, Prisma, StatusDocumentoFiscal, TipoEventoDocumentoFiscal } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ContextoApiPublica } from './chaves-api';
import { PayloadDocumentoNormalizado } from './validacao';

export interface DocumentoCriado {
  id: string;
  status: StatusDocumentoFiscal;
  modelo: ModeloDocumentoFiscal;
  ambiente: AmbienteFiscalApi;
  requestId: string;
  idempotente: boolean;
}

export async function buscarEmpresaDoCliente(empresaId: string, clientId: string) {
  return prisma.empresa.findFirst({
    where: {
      id: empresaId,
      active: true,
      user: {
        clientId,
      },
    },
  });
}

export async function registrarEntregasWebhook(params: {
  clientId: string;
  documentoFiscalId: string;
  documentoFiscalEventoId: string;
  evento: string;
  payload: Prisma.InputJsonValue;
}) {
  const endpoints = await prisma.endpointWebhook.findMany({
    where: {
      clientId: params.clientId,
      ativo: true,
      OR: [
        { eventos: { has: params.evento } },
        { eventos: { has: '*' } },
      ],
    },
    select: { id: true },
  });

  if (endpoints.length === 0) {
    return;
  }

  await prisma.entregaWebhook.createMany({
    data: endpoints.map((endpoint) => ({
      clientId: params.clientId,
      endpointWebhookId: endpoint.id,
      documentoFiscalId: params.documentoFiscalId,
      documentoFiscalEventoId: params.documentoFiscalEventoId,
      evento: params.evento,
      payload: params.payload,
    })),
  });
}

export async function criarDocumentoFiscalRecebido(params: {
  contexto: ContextoApiPublica;
  dados: PayloadDocumentoNormalizado;
  modelo: ModeloDocumentoFiscal;
  requestId: string;
  idempotencyKey: string | null;
}): Promise<DocumentoCriado> {
  const existente = params.idempotencyKey
    ? await prisma.documentoFiscal.findUnique({
        where: {
          clientId_idempotencyKey: {
            clientId: params.contexto.client.id,
            idempotencyKey: params.idempotencyKey,
          },
        },
      })
    : null;

  if (existente) {
    return {
      id: existente.id,
      status: existente.status,
      modelo: existente.modelo,
      ambiente: existente.ambiente,
      requestId: existente.requestId,
      idempotente: true,
    };
  }

  const empresa = await buscarEmpresaDoCliente(params.dados.empresaId, params.contexto.client.id);
  if (!empresa) {
    throw new Error('EMPRESA_NAO_ENCONTRADA');
  }

  const documento = await prisma.$transaction(async (transacao) => {
    const criado = await transacao.documentoFiscal.create({
      data: {
        clientId: params.contexto.client.id,
        empresaId: empresa.id,
        chaveApiId: params.contexto.chaveApi.id,
        requestId: params.requestId,
        idempotencyKey: params.idempotencyKey,
        modelo: params.modelo,
        ambiente: params.contexto.ambiente,
        status: 'ENFILEIRADA',
        payload: params.dados.payload,
        valorTotal: params.dados.valorTotal,
        itens: {
          create: params.dados.itens.map((item) => ({
            numeroItem: item.numeroItem,
            codigo: item.codigo,
            descricao: item.descricao,
            ncm: item.ncm,
            cfop: item.cfop,
            unidade: item.unidade,
            quantidade: item.quantidade,
            valorUnitario: item.valorUnitario,
            valorTotal: item.valorTotal,
            ...(item.payloadTributos === null ? {} : { payloadTributos: item.payloadTributos }),
          })),
        },
      },
    });

    await transacao.documentoFiscalEvento.create({
      data: {
        documentoFiscalId: criado.id,
        tipo: 'RECEBIDO',
        statusNovo: 'ENFILEIRADA',
        mensagem: 'Documento recebido pela API publica e enfileirado para processamento fiscal.',
        payload: {
          requestId: params.requestId,
          modelo: params.modelo,
          ambiente: params.contexto.ambiente,
        },
      },
    });

    await transacao.auditoria.create({
      data: {
        clientId: params.contexto.client.id,
        chaveApiId: params.contexto.chaveApi.id,
        tipo: 'EMISSAO',
        acao: 'documento_fiscal_enfileirado',
        recurso: 'DocumentoFiscal',
        recursoId: criado.id,
        metadata: {
          modelo: params.modelo,
          ambiente: params.contexto.ambiente,
          requestId: params.requestId,
        },
      },
    });

    return criado;
  });

  const evento = await prisma.documentoFiscalEvento.findFirst({
    where: {
      documentoFiscalId: documento.id,
      tipo: TipoEventoDocumentoFiscal.RECEBIDO,
    },
    orderBy: { criadoEm: 'desc' },
  });

  if (evento) {
    await registrarEntregasWebhook({
      clientId: params.contexto.client.id,
      documentoFiscalId: documento.id,
      documentoFiscalEventoId: evento.id,
      evento: 'documento.recebido',
      payload: {
        documentoId: documento.id,
        modelo: documento.modelo,
        ambiente: documento.ambiente,
        status: documento.status,
        requestId: params.requestId,
      },
    });
  }

  return {
    id: documento.id,
    status: documento.status,
    modelo: documento.modelo,
    ambiente: documento.ambiente,
    requestId: documento.requestId,
    idempotente: false,
  };
}
