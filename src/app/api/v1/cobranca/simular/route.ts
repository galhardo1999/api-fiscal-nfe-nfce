import { NextRequest, NextResponse } from 'next/server';
import { calcularCobrancaNotas } from '@/lib/cobranca/cobranca';
import { obterRequestId, responderErro } from '@/lib/api-publica/respostas';

export async function GET(request: NextRequest) {
  const requestId = obterRequestId(request);
  const notasParam = request.nextUrl.searchParams.get('notas') || '0';
  const quantidadeNotas = Number(notasParam);

  if (!Number.isFinite(quantidadeNotas) || quantidadeNotas < 0) {
    return responderErro(400, 'QUANTIDADE_INVALIDA', 'notas deve ser um numero maior ou igual a zero.', requestId);
  }

  return NextResponse.json({
    requestId,
    cobranca: calcularCobrancaNotas(quantidadeNotas),
    regra: {
      minimoMensal: 69.9,
      faixas: [
        { ate: 100, precoPorNota: 0.9 },
        { de: 101, ate: 350, precoPorNota: 0.79 },
        { de: 351, precoPorNota: 0.69 },
      ],
      tipo: 'FAIXA_UNICA_POR_VOLUME_MENSAL',
    },
  });
}
