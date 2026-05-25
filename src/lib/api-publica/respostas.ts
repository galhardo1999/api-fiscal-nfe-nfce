import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export interface ErroApi {
  codigo: string;
  mensagem: string;
  requestId: string;
  detalhes?: unknown;
}

export function obterRequestId(request: NextRequest): string {
  return request.headers.get('x-request-id') || randomUUID();
}

export function responderErro(
  status: number,
  codigo: string,
  mensagem: string,
  requestId: string,
  detalhes?: unknown
): NextResponse<ErroApi> {
  return NextResponse.json(
    {
      codigo,
      mensagem,
      requestId,
      ...(detalhes === undefined ? {} : { detalhes }),
    },
    { status }
  );
}

export function responderAceito<T>(dados: T, requestId: string, status = 202): NextResponse<T & { requestId: string }> {
  return NextResponse.json({ ...dados, requestId }, { status });
}
