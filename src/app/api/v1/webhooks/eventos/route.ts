import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    eventos: [
      'documento.recebido',
      'documento.autorizado',
      'documento.rejeitado',
      'documento.cancelado',
      'documento.contingencia',
      'documento.inutilizado',
      'documento.cancelamento.recebido',
      'documento.carta_correcao.recebida',
      'certificado.vencendo',
    ],
  });
}
