import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { StatusDocumentoFiscal, TipoEventoDocumentoFiscal } from '@prisma/client';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { calcularCobrancaNotas, obterAnoMes, obterIntervaloAnoMes } from '@/lib/cobranca/cobranca';

async function verificarAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.isAdmin) {
    return { erro: NextResponse.json({ error: 'Nao autorizado. Apenas administradores do SaaS.' }, { status: 403 }) };
  }
  return { session };
}

export async function GET() {
  const auth = await verificarAdmin();
  if (auth.erro) return auth.erro;

  const anoMes = obterAnoMes();
  const intervalo = obterIntervaloAnoMes(anoMes);

  // 1. Contagens globais
  const [
    totalClientes,
    notasFila,
    notasErro,
    notasAutorizadasMes,
    todosClientes,
    documentosRecentes,
  ] = await Promise.all([
    prisma.client.count({ where: { status: 'ATIVO' } }),
    prisma.documentoFiscal.count({ where: { status: StatusDocumentoFiscal.ENFILEIRADA } }),
    prisma.documentoFiscal.count({ where: { status: StatusDocumentoFiscal.ERRO_TECNICO } }),
    prisma.documentoFiscal.count({
      where: {
        status: StatusDocumentoFiscal.AUTORIZADA,
        criadoEm: { gte: intervalo.inicio, lt: intervalo.fim },
      },
    }),
    prisma.client.findMany({
      include: {
        users: { select: { name: true, email: true } },
      },
    }),
    prisma.documentoFiscal.findMany({
      orderBy: { criadoEm: 'desc' },
      take: 15,
      select: {
        id: true,
        modelo: true,
        ambiente: true,
        status: true,
        numero: true,
        serie: true,
        cStat: true,
        motivoSefaz: true,
        valorTotal: true,
        criadoEm: true,
        client: { select: { companyName: true } },
        empresa: { select: { nome: true } },
      },
    }),
  ]);

  // 2. Faturamento previsto global (soma das recargas pagas no mês)
  const recargasMes = await (prisma as any).recargaCredito.findMany({
    where: {
      criadoEm: { gte: intervalo.inicio, lt: intervalo.fim },
    },
    select: { valor: true }
  });

  const faturamentoGlobalPrevisto = recargasMes.reduce((sum: number, r: any) => sum + Number(r.valor), 0);
  const listagemClientesFaturamento = [];

  for (const client of todosClientes) {
    const notasCliente = await prisma.documentoFiscal.count({
      where: {
        clientId: client.id,
        status: StatusDocumentoFiscal.AUTORIZADA,
        criadoEm: { gte: intervalo.inicio, lt: intervalo.fim },
      },
    });

    const recargasCliente = await (prisma as any).recargaCredito.findMany({
      where: {
        clientId: client.id,
        criadoEm: { gte: intervalo.inicio, lt: intervalo.fim },
      },
      select: { valor: true }
    });

    const totalPago = recargasCliente.reduce((sum: number, r: any) => sum + Number(r.valor), 0);

    listagemClientesFaturamento.push({
      id: client.id,
      companyName: client.companyName,
      document: client.document,
      status: client.status,
      notasMes: notasCliente,
      saldoCreditos: (client as any).saldoCreditos || 0,
      totalPago: totalPago,
    });
  }


  return NextResponse.json({
    stats: {
      totalClientes,
      notasFila,
      notasErro,
      notasAutorizadasMes,
      faturamentoGlobalPrevisto,
    },
    clientes: listagemClientesFaturamento,
    documentosRecentes,
  });
}

export async function POST(request: NextRequest) {
  const auth = await verificarAdmin();
  if (auth.erro) return auth.erro;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalido' }, { status: 400 });
  }

  const { id: docId, acao } = body;
  if (!docId) {
    return NextResponse.json({ error: 'ID do documento e obrigatorio' }, { status: 400 });
  }

  const doc = await prisma.documentoFiscal.findUnique({
    where: { id: docId },
  });

  if (!doc) {
    return NextResponse.json({ error: 'Documento nao encontrado' }, { status: 404 });
  }

  if (acao === 'reprocessar') {
    // Resetar status para ENFILEIRADA e apagar erros anteriores para que o worker tente novamente
    await prisma.documentoFiscal.update({
      where: { id: docId },
      data: {
        status: StatusDocumentoFiscal.ENFILEIRADA,
        motivoSefaz: null,
        cStat: null,
      },
    });

    // Registrar Evento Administrativo
    await prisma.documentoFiscalEvento.create({
      data: {
        documentoFiscalId: docId,
        tipo: TipoEventoDocumentoFiscal.RECEBIDO,
        statusAnterior: doc.status,
        statusNovo: StatusDocumentoFiscal.ENFILEIRADA,
        mensagem: `Reprocessamento manual disparado por administrador.`,
      },
    });

    await prisma.auditoria.create({
      data: {
        clientId: doc.clientId,
        usuarioId: auth.session?.user.id,
        tipo: 'SEGURANCA',
        acao: 'documento_fiscal_reprocessamento_manual',
        recurso: 'DocumentoFiscal',
        recursoId: docId,
        metadata: { statusAnterior: doc.status },
      },
    });

    console.log(`[Admin stats] Reprocessamento manual solicitado para o documento ${docId}`);
    return NextResponse.json({ success: true, message: 'Documento re-enfileirado com sucesso.' });
  }

  return NextResponse.json({ error: 'Acao desconhecida' }, { status: 400 });
}
