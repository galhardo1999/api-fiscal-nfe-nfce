import { NextRequest, NextResponse } from 'next/server';
import { autenticarApiPublica } from '@/lib/api-publica/chaves-api';
import { obterRequestId, responderErro } from '@/lib/api-publica/respostas';
import { ehRegistro, lerTexto } from '@/lib/api-publica/validacao';
import { prisma } from '@/lib/prisma';

const camposObrigatorios = [
  'cnpj',
  'nome',
  'ie',
  'logradouro',
  'numero',
  'bairro',
  'municipio',
  'uf',
  'cep',
] as const;

export async function GET(request: NextRequest) {
  const requestId = obterRequestId(request);
  const contexto = await autenticarApiPublica(request, 'empresas:ler');

  if (!contexto) {
    return responderErro(401, 'NAO_AUTORIZADO', 'API key invalida ou sem escopo empresas:ler.', requestId);
  }

  const empresas = await prisma.empresa.findMany({
    where: {
      user: {
        clientId: contexto.client.id,
      },
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      cnpj: true,
      nome: true,
      nomeFantasia: true,
      ie: true,
      crt: true,
      municipio: true,
      uf: true,
      ambiente: true,
      serieNfe: true,
      serieNfce: true,
      active: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ requestId, empresas });
}

export async function POST(request: NextRequest) {
  const requestId = obterRequestId(request);
  const contexto = await autenticarApiPublica(request, 'empresas:escrever');

  if (!contexto) {
    return responderErro(401, 'NAO_AUTORIZADO', 'API key invalida ou sem escopo empresas:escrever.', requestId);
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

  const erros = camposObrigatorios
    .filter((campo) => !lerTexto(corpo, campo))
    .map((campo) => `${campo} e obrigatorio.`);

  if (erros.length > 0) {
    return responderErro(400, 'VALIDACAO_FALHOU', 'Dados da empresa invalidos.', requestId, erros);
  }

  const usuarioPrincipal = await prisma.user.findFirst({
    where: {
      clientId: contexto.client.id,
      active: true,
    },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  });

  if (!usuarioPrincipal) {
    return responderErro(422, 'USUARIO_TENANT_AUSENTE', 'Cliente contratante nao possui usuario ativo para vincular empresas.', requestId);
  }

  const ambiente = contexto.ambiente === 'PRODUCAO' ? '1' : '2';
  const cnpj = lerTexto(corpo, 'cnpj')?.replace(/[^A-Za-z0-9]/g, '').toUpperCase() || '';

  const empresaExistente = await prisma.empresa.findFirst({
    where: {
      cnpj,
      user: { clientId: contexto.client.id },
    },
    select: { id: true },
  });

  if (empresaExistente) {
    return responderErro(409, 'EMPRESA_DUPLICADA', 'Ja existe empresa com este CNPJ para o cliente contratante.', requestId);
  }

  const empresa = await prisma.empresa.create({
    data: {
      userId: usuarioPrincipal.id,
      cnpj,
      nome: lerTexto(corpo, 'nome') || '',
      nomeFantasia: lerTexto(corpo, 'nomeFantasia'),
      ie: lerTexto(corpo, 'ie') || '',
      iest: lerTexto(corpo, 'iest'),
      im: lerTexto(corpo, 'im'),
      cnae: lerTexto(corpo, 'cnae'),
      crt: lerTexto(corpo, 'crt') || '3',
      logradouro: lerTexto(corpo, 'logradouro') || '',
      numero: lerTexto(corpo, 'numero') || '',
      complemento: lerTexto(corpo, 'complemento'),
      bairro: lerTexto(corpo, 'bairro') || '',
      municipio: lerTexto(corpo, 'municipio') || '',
      uf: (lerTexto(corpo, 'uf') || '').toUpperCase(),
      cep: lerTexto(corpo, 'cep') || '',
      telefone: lerTexto(corpo, 'telefone'),
      email: lerTexto(corpo, 'email'),
      ambiente,
      csc: lerTexto(corpo, 'csc'),
      idCsc: lerTexto(corpo, 'idCsc'),
    },
    select: {
      id: true,
      cnpj: true,
      nome: true,
      nomeFantasia: true,
      ie: true,
      crt: true,
      municipio: true,
      uf: true,
      ambiente: true,
      createdAt: true,
    },
  });

  await prisma.auditoria.create({
    data: {
      clientId: contexto.client.id,
      chaveApiId: contexto.chaveApi.id,
      tipo: 'CRIACAO',
      acao: 'empresa_emitente_criada',
      recurso: 'Empresa',
      recursoId: empresa.id,
      metadata: { requestId, cnpj: empresa.cnpj },
    },
  });

  return NextResponse.json({ requestId, empresa }, { status: 201 });
}
