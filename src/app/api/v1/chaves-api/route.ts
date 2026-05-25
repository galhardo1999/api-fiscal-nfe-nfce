import { AmbienteFiscalApi } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { gerarChaveApi, validarTokenAdmin } from '@/lib/api-publica/chaves-api';
import { obterRequestId, responderErro } from '@/lib/api-publica/respostas';
import { ehRegistro, lerTexto } from '@/lib/api-publica/validacao';
import { prisma } from '@/lib/prisma';

function lerAmbiente(valor: string | null): AmbienteFiscalApi | null {
  if (!valor) {
    return AmbienteFiscalApi.HOMOLOGACAO;
  }

  const normalizado = valor.toUpperCase();
  if (normalizado === AmbienteFiscalApi.HOMOLOGACAO) {
    return AmbienteFiscalApi.HOMOLOGACAO;
  }
  if (normalizado === AmbienteFiscalApi.PRODUCAO) {
    return AmbienteFiscalApi.PRODUCAO;
  }

  return null;
}

function lerEscopos(valor: unknown): string[] {
  if (!Array.isArray(valor)) {
    return ['documentos:emitir', 'documentos:ler', 'documentos:eventos', 'empresas:ler', 'empresas:escrever', 'webhooks:gerenciar', 'cobranca:ler'];
  }

  const escopos = valor.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  return escopos.length > 0 ? escopos : ['documentos:emitir', 'documentos:ler'];
}

export async function POST(request: NextRequest) {
  const requestId = obterRequestId(request);

  if (!process.env.ADMIN_API_TOKEN) {
    return responderErro(500, 'CONFIGURACAO_AUSENTE', 'ADMIN_API_TOKEN nao configurado.', requestId);
  }

  if (!validarTokenAdmin(request)) {
    return responderErro(401, 'NAO_AUTORIZADO', 'Token administrativo invalido.', requestId);
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

  const clientId = lerTexto(corpo, 'clientId');
  const nome = lerTexto(corpo, 'nome') || 'Chave API';
  const ambiente = lerAmbiente(lerTexto(corpo, 'ambiente'));
  const escopos = lerEscopos(corpo.escopos);

  if (!clientId) {
    return responderErro(400, 'CLIENTE_OBRIGATORIO', 'clientId e obrigatorio.', requestId);
  }

  if (!ambiente) {
    return responderErro(400, 'AMBIENTE_INVALIDO', 'ambiente deve ser HOMOLOGACAO ou PRODUCAO.', requestId);
  }

  const cliente = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, status: true },
  });

  if (!cliente) {
    return responderErro(404, 'CLIENTE_NAO_ENCONTRADO', 'Cliente contratante nao encontrado.', requestId);
  }

  const chaveGerada = gerarChaveApi(ambiente);
  const chave = await prisma.chaveApi.create({
    data: {
      clientId,
      nome,
      prefixo: chaveGerada.prefixo,
      hashSegredo: chaveGerada.hashSegredo,
      ambiente,
      escopos,
    },
    select: {
      id: true,
      nome: true,
      prefixo: true,
      ambiente: true,
      escopos: true,
      criadoEm: true,
    },
  });

  await prisma.auditoria.create({
    data: {
      clientId,
      tipo: 'SEGURANCA',
      acao: 'chave_api_criada',
      recurso: 'ChaveApi',
      recursoId: chave.id,
      metadata: { requestId, prefixo: chave.prefixo, ambiente },
    },
  });

  return NextResponse.json(
    {
      requestId,
      chave,
      token: chaveGerada.token,
      aviso: 'Guarde este token agora. Ele nao sera exibido novamente.',
    },
    { status: 201 }
  );
}

export async function GET(request: NextRequest) {
  const requestId = obterRequestId(request);

  if (!validarTokenAdmin(request)) {
    return responderErro(401, 'NAO_AUTORIZADO', 'Token administrativo invalido.', requestId);
  }

  const clientId = request.nextUrl.searchParams.get('clientId');
  if (!clientId) {
    return responderErro(400, 'CLIENTE_OBRIGATORIO', 'Informe clientId na query string.', requestId);
  }

  const chaves = await prisma.chaveApi.findMany({
    where: { clientId },
    orderBy: { criadoEm: 'desc' },
    select: {
      id: true,
      nome: true,
      prefixo: true,
      ambiente: true,
      escopos: true,
      ativa: true,
      ultimoUsoEm: true,
      expiraEm: true,
      criadoEm: true,
    },
  });

  return NextResponse.json({ requestId, chaves });
}
