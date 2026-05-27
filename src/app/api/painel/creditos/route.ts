import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { LOTES_PRE_PAGOS } from '@/lib/cobranca/cobranca';

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
    return { erro: NextResponse.json({ error: 'Cliente indisponivel' }, { status: 403 }) };
  }

  return { session, clientId };
}

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'A recarga simulada de creditos nao esta disponivel no ambiente de producao.' },
      { status: 403 }
    );
  }

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
  const quantidade = Number(payload.quantidade);

  const lote = LOTES_PRE_PAGOS.find(l => l.quantidade === quantidade);
  if (!lote) {
    return NextResponse.json({ error: 'Quantidade de creditos invalida' }, { status: 400 });
  }

  const valor = lote.valor;
  const expiraEm = new Date();
  expiraEm.setFullYear(expiraEm.getFullYear() + 1); // 12 meses de validade

  try {
    // Usamos type-casting para evitar falhas do compilador caso o Prisma não esteja 100% regenerado
    await (prisma as any).$transaction([
      (prisma as any).recargaCredito.create({
        data: {
          clientId: contexto.clientId,
          quantidade,
          valor,
          expiraEm,
        },
      }),
      (prisma as any).client.update({
        where: { id: contexto.clientId },
        data: {
          saldoCreditos: {
            increment: quantidade,
          },
        },
      }),
      (prisma as any).auditoria.create({
        data: {
          clientId: contexto.clientId,
          usuarioId: contexto.session?.user.id,
          tipo: 'COBRANCA',
          acao: 'recarga_creditos_simulada',
          recurso: 'Client',
          recursoId: contexto.clientId,
          metadata: {
            quantidade,
            valor,
            expiraEm,
          },
        },
      })
    ]);

    // Buscar o novo saldo
    const clienteAtualizado = await prisma.client.findUnique({
      where: { id: contexto.clientId },
      select: { saldoCreditos: true }
    });

    return NextResponse.json({
      success: true,
      quantidade,
      valor,
      saldoAtualizado: (clienteAtualizado as any)?.saldoCreditos || 0,
      mensagem: `Lote de ${quantidade} creditos recarregado com sucesso!`,
    }, { status: 201 });
  } catch (error: any) {
    console.error('[API Creditos] Erro ao realizar recarga:', error);
    return NextResponse.json({ error: 'Erro ao processar recarga' }, { status: 500 });
  }
}

export async function GET() {
  const contexto = await obterClienteSessao();
  if (contexto.erro) {
    return contexto.erro;
  }

  try {
    const cliente = await prisma.client.findUnique({
      where: { id: contexto.clientId },
      select: {
        saldoCreditos: true,
        recargas: {
          orderBy: { criadoEm: 'desc' },
          take: 10,
          select: {
            id: true,
            quantidade: true,
            valor: true,
            criadoEm: true,
            expiraEm: true,
          }
        }
      } as any
    });

    return NextResponse.json({
      saldoCreditos: (cliente as any)?.saldoCreditos || 0,
      recargas: (cliente as any)?.recargas || []
    });
  } catch (error: any) {
    console.error('[API Creditos GET] Erro ao obter saldo:', error);
    return NextResponse.json({ error: 'Erro ao obter saldo' }, { status: 500 });
  }
}

