import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { NextRequest } from 'next/server';
import { AmbienteFiscalApi, ChaveApi, Client } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export interface ChaveApiGerada {
  prefixo: string;
  token: string;
  hashSegredo: string;
}

export interface ContextoApiPublica {
  client: Client;
  chaveApi: ChaveApi;
  ambiente: AmbienteFiscalApi;
  escopos: string[];
}

export function gerarChaveApi(ambiente: AmbienteFiscalApi): ChaveApiGerada {
  const rotuloAmbiente = ambiente === 'PRODUCAO' ? 'live' : 'test';
  const identificador = randomBytes(6).toString('hex');
  const segredo = randomBytes(24).toString('base64url');
  const prefixo = `af_${rotuloAmbiente}_${identificador}`;
  const token = `${prefixo}.${segredo}`;

  return {
    prefixo,
    token,
    hashSegredo: calcularHashToken(token),
  };
}

export function calcularHashToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

function compararHashSeguro(hashRecebido: string, hashArmazenado: string): boolean {
  const recebido = Buffer.from(hashRecebido, 'hex');
  const armazenado = Buffer.from(hashArmazenado, 'hex');

  if (recebido.length !== armazenado.length) {
    return false;
  }

  return timingSafeEqual(recebido, armazenado);
}

export function extrairTokenApi(request: NextRequest): string | null {
  const authorization = request.headers.get('authorization');
  if (authorization?.toLowerCase().startsWith('bearer ')) {
    return authorization.slice('bearer '.length).trim();
  }

  return request.headers.get('x-api-key');
}

function extrairPrefixo(token: string): string | null {
  const [prefixo] = token.split('.');
  if (!prefixo || !/^af_(live|test)_[a-f0-9]{12}$/.test(prefixo)) {
    return null;
  }

  return prefixo;
}

export async function autenticarApiPublica(
  request: NextRequest,
  escopoNecessario?: string
): Promise<ContextoApiPublica | null> {
  const token = extrairTokenApi(request);
  if (!token) {
    return null;
  }

  const prefixo = extrairPrefixo(token);
  if (!prefixo) {
    return null;
  }

  const chaveApi = await prisma.chaveApi.findUnique({
    where: { prefixo },
    include: { client: true },
  });

  if (!chaveApi?.ativa) {
    return null;
  }

  if (chaveApi.expiraEm && chaveApi.expiraEm <= new Date()) {
    return null;
  }

  if (chaveApi.client.status === 'BLOQUEADO' || chaveApi.client.status === 'CANCELADO') {
    return null;
  }

  const hashRecebido = calcularHashToken(token);
  if (!compararHashSeguro(hashRecebido, chaveApi.hashSegredo)) {
    return null;
  }

  const escopos = chaveApi.escopos;
  if (escopoNecessario && !escopos.includes('*') && !escopos.includes(escopoNecessario)) {
    return null;
  }

  await prisma.chaveApi.update({
    where: { id: chaveApi.id },
    data: { ultimoUsoEm: new Date() },
  });

  return {
    client: chaveApi.client,
    chaveApi,
    ambiente: chaveApi.ambiente,
    escopos,
  };
}

export function validarTokenAdmin(request: NextRequest): boolean {
  const tokenConfigurado = process.env.ADMIN_API_TOKEN;
  if (!tokenConfigurado) {
    return false;
  }

  return request.headers.get('x-admin-token') === tokenConfigurado;
}
