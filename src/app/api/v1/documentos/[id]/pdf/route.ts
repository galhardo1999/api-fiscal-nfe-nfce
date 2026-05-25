import { NextRequest, NextResponse } from 'next/server';
import { autenticarApiPublica } from '@/lib/api-publica/chaves-api';
import { obterRequestId, responderErro } from '@/lib/api-publica/respostas';
import { generateDanfePdf } from '@/lib/fiscal/emissor/nfe/danfe-generator';
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
      status: true,
      nfeId: true,
    },
  });

  if (!documento) {
    return responderErro(404, 'DOCUMENTO_NAO_ENCONTRADO', 'Documento fiscal nao encontrado.', requestId);
  }

  if (!documento.nfeId) {
    return responderErro(409, 'PDF_AINDA_INDISPONIVEL', 'PDF ainda nao esta disponivel porque o documento nao foi autorizado/processado.', requestId, {
      status: documento.status,
    });
  }

  const nfe = await prisma.nfe.findFirst({
    where: {
      id: documento.nfeId,
      user: {
        clientId: contexto.client.id,
      },
    },
    include: {
      empresa: true,
      itens: true,
    },
  });

  if (!nfe) {
    return responderErro(404, 'NFE_NAO_ENCONTRADA', 'NF-e vinculada nao encontrada.', requestId);
  }

  const pdfBuffer = generateDanfePdf({
    chaveAcesso: nfe.chaveAcesso,
    numero: nfe.numero,
    serie: nfe.serie,
    dataEmissao: nfe.dataEmissao,
    naturezaOperacao: nfe.naturezaOperacao,
    protocolo: nfe.protocolo || undefined,
    dataProtocolo: nfe.updatedAt,
    ambiente: nfe.ambiente as '1' | '2',
    emitente: {
      razaoSocial: nfe.empresa.nome,
      cnpj: nfe.empresa.cnpj,
      ie: nfe.empresa.ie,
      logradouro: nfe.empresa.logradouro,
      numero: nfe.empresa.numero,
      complemento: nfe.empresa.complemento || undefined,
      bairro: nfe.empresa.bairro,
      municipio: nfe.empresa.municipio,
      uf: nfe.empresa.uf,
      cep: nfe.empresa.cep,
      telefone: nfe.empresa.telefone || undefined,
    },
    destinatario: {
      nome: nfe.destinatarioNome,
      cnpjCpf: nfe.destinatarioCnpjCpf || '',
      ie: nfe.destinatarioIe || undefined,
      logradouro: nfe.empresa.logradouro,
      numero: nfe.empresa.numero,
      bairro: nfe.empresa.bairro,
      municipio: nfe.empresa.municipio,
      uf: nfe.empresa.uf,
      cep: nfe.empresa.cep,
    },
    valores: {
      valorProdutos: Number(nfe.valorProdutos || 0),
      valorTotal: Number(nfe.valorTotal || 0),
      valorIcms: Number(nfe.valorIcms || 0),
      valorIpis: Number(nfe.valorIpi || 0),
      valorPis: Number(nfe.valorPis || 0),
      valorCofins: Number(nfe.valorCofins || 0),
    },
    itens: nfe.itens.map((item) => ({
      codigo: item.codigo,
      descricao: item.descricao,
      ncm: item.ncm,
      cstCsosn: item.icmsCst,
      cfop: item.cfop,
      unidade: item.unidade,
      quantidade: Number(item.quantidade),
      valorUnitario: Number(item.valorUnitario),
      valorTotal: Number(item.valorTotal),
      icmsAliquota: Number(item.icmsAliquota || 0),
      icmsValor: Number(item.icmsValor || 0),
    })),
    informacoesAdicionais: nfe.informacoesAdicionais || undefined,
  });

  return new NextResponse(pdfBuffer as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="DANFE_${nfe.numero}_serie_${nfe.serie}.pdf"`,
      'X-Request-Id': requestId,
    },
  });
}
