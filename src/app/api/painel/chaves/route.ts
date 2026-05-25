import { AmbienteFiscalApi } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { gerarChaveApi } from '@/lib/api-publica/chaves-api';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

const escoposPadrao = [
  'documentos:emitir',
  'documentos:ler',
  'documentos:eventos',
  'empresas:ler',
  'empresas:escrever',
  'webhooks:gerenciar',
  'cobranca:ler',
];

function lerAmbiente(valor: unknown): AmbienteFiscalApi | null {
  if (valor === AmbienteFiscalApi.HOMOLOGACAO || valor === AmbienteFiscalApi.PRODUCAO) {
    return valor;
  }

  return null;
}

async function obterClienteSessao() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { erro: NextResponse.json({ error: 'Nao autorizado' }, { status: 401 }) };
  }

  const clientId = session.user.clientId;
  if (!clientId || session.user.isAdmin) {
    return { erro: NextResponse.json({ error: 'Usuario sem cliente contratante vinculado' }, { status: 403 }) };
  }

  const cliente = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, status: true },
  });

  if (!cliente || cliente.status === 'BLOQUEADO' || cliente.status === 'CANCELADO') {
    return { erro: NextResponse.json({ error: 'Cliente indisponivel para gerar chaves' }, { status: 403 }) };
  }

  return { session, clientId };
}

export async function GET() {
  const contexto = await obterClienteSessao();
  if (contexto.erro) {
    return contexto.erro;
  }

  const chaves = await prisma.chaveApi.findMany({
    where: { clientId: contexto.clientId },
    orderBy: [{ ambiente: 'asc' }, { criadoEm: 'desc' }],
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

  return NextResponse.json({ chaves });
}

export async function POST(request: NextRequest) {
  const contexto = await obterClienteSessao();
  if (contexto.erro) {
    return contexto.erro;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalido' }, { status: 400 });
  }

  const payload = typeof body === 'object' && body !== null ? body as Record<string, unknown> : {};
  const ambiente = lerAmbiente(payload.ambiente);
  const nome = typeof payload.nome === 'string' && payload.nome.trim() ? payload.nome.trim() : 'Chave API';

  if (!ambiente) {
    return NextResponse.json({ error: 'Ambiente invalido' }, { status: 400 });
  }

  const chaveGerada = gerarChaveApi(ambiente);
  const chave = await prisma.chaveApi.create({
    data: {
      clientId: contexto.clientId,
      nome,
      prefixo: chaveGerada.prefixo,
      hashSegredo: chaveGerada.hashSegredo,
      ambiente,
      escopos: escoposPadrao,
    },
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

  await prisma.auditoria.create({
    data: {
      clientId: contexto.clientId,
      usuarioId: contexto.session?.user.id,
      tipo: 'SEGURANCA',
      acao: 'chave_api_criada_pelo_painel',
      recurso: 'ChaveApi',
      recursoId: chave.id,
      metadata: {
        ambiente,
        prefixo: chave.prefixo,
      },
    },
  });

  return NextResponse.json({
    chave,
    token: chaveGerada.token,
  }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const contexto = await obterClienteSessao();
  if (contexto.erro) {
    return contexto.erro;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalido' }, { status: 400 });
  }

  const payload = typeof body === 'object' && body !== null ? body as Record<string, unknown> : {};
  const id = typeof payload.id === 'string' ? payload.id : '';

  if (!id) {
    return NextResponse.json({ error: 'id e obrigatorio' }, { status: 400 });
  }

  const chave = await prisma.chaveApi.findFirst({
    where: {
      id,
      clientId: contexto.clientId,
    },
    select: {
      id: true,
      prefixo: true,
      ambiente: true,
    },
  });

  if (!chave) {
    return NextResponse.json({ error: 'Chave nao encontrada' }, { status: 404 });
  }

  await prisma.$transaction(async (transacao) => {
    await transacao.chaveApi.delete({
      where: { id: chave.id },
    });

    await transacao.auditoria.create({
      data: {
        clientId: contexto.clientId,
        usuarioId: contexto.session?.user.id,
        tipo: 'SEGURANCA',
        acao: 'chave_api_excluida_pelo_painel',
        recurso: 'ChaveApi',
        recursoId: chave.id,
        metadata: {
          prefixo: chave.prefixo,
          ambiente: chave.ambiente,
        },
      },
    });
  });

  return NextResponse.json({ success: true });
}
