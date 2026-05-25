import { NextRequest, NextResponse } from 'next/server';
import { autenticarApiPublica } from '@/lib/api-publica/chaves-api';
import { obterRequestId, responderErro } from '@/lib/api-publica/respostas';
import { extrairInformacoesCertificadoA1 } from '@/lib/certificados/certificado-a1';
import { encryptPassword } from '@/lib/crypto';
import { prisma } from '@/lib/prisma';

interface ContextoRota {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, contextoRota: ContextoRota) {
  const requestId = obterRequestId(request);
  const contexto = await autenticarApiPublica(request, 'empresas:escrever');

  if (!contexto) {
    return responderErro(401, 'NAO_AUTORIZADO', 'API key invalida ou sem escopo empresas:escrever.', requestId);
  }

  const { id } = await contextoRota.params;
  const empresa = await prisma.empresa.findFirst({
    where: {
      id,
      user: { clientId: contexto.client.id },
    },
    select: {
      id: true,
      cnpj: true,
    },
  });

  if (!empresa) {
    return responderErro(404, 'EMPRESA_NAO_ENCONTRADA', 'Empresa emitente nao encontrada para este cliente.', requestId);
  }

  const formData = await request.formData();
  const arquivo = formData.get('certificate');
  const senha = formData.get('password');

  if (!(arquivo instanceof File) || typeof senha !== 'string' || !senha) {
    return responderErro(400, 'CERTIFICADO_OBRIGATORIO', 'Envie certificate e password no form-data.', requestId);
  }

  const nomeArquivo = arquivo.name.toLowerCase();
  if (!nomeArquivo.endsWith('.pfx') && !nomeArquivo.endsWith('.p12')) {
    return responderErro(400, 'EXTENSAO_INVALIDA', 'Apenas arquivos .pfx ou .p12 sao aceitos.', requestId);
  }

  if (arquivo.size > 2 * 1024 * 1024) {
    return responderErro(413, 'CERTIFICADO_MUITO_GRANDE', 'Certificado deve ter no maximo 2 MB.', requestId);
  }

  const buffer = Buffer.from(await arquivo.arrayBuffer());
  let informacoes;
  try {
    informacoes = extrairInformacoesCertificadoA1(buffer, senha);
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : 'Erro ao processar certificado.';
    return responderErro(422, 'CERTIFICADO_INVALIDO', mensagem, requestId);
  }

  const documentoCertificado = informacoes.document?.replace(/\D/g, '');
  const cnpjEmpresa = empresa.cnpj.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (documentoCertificado && documentoCertificado !== cnpjEmpresa) {
    return responderErro(422, 'CERTIFICADO_NAO_PERTENCE_EMPRESA', 'Certificado nao pertence ao CNPJ da empresa emitente.', requestId, {
      documentoCertificado,
      cnpjEmpresa,
    });
  }

  const certificado = await prisma.certificadoDigital.upsert({
    where: { empresaId: empresa.id },
    update: {
      nome: arquivo.name,
      arquivo: buffer,
      senha: encryptPassword(senha),
      validoAte: new Date(informacoes.validTo),
      serie: informacoes.serialNumber,
      emissor: informacoes.issuer,
      active: true,
    },
    create: {
      empresaId: empresa.id,
      nome: arquivo.name,
      arquivo: buffer,
      senha: encryptPassword(senha),
      validoAte: new Date(informacoes.validTo),
      serie: informacoes.serialNumber,
      emissor: informacoes.issuer,
      active: true,
    },
    select: {
      id: true,
      nome: true,
      emissor: true,
      serie: true,
      validoAte: true,
      active: true,
      updatedAt: true,
    },
  });

  await prisma.auditoria.create({
    data: {
      clientId: contexto.client.id,
      chaveApiId: contexto.chaveApi.id,
      tipo: 'SEGURANCA',
      acao: 'certificado_a1_salvo',
      recurso: 'CertificadoDigital',
      recursoId: certificado.id,
      metadata: { requestId, empresaId: empresa.id, validoAte: certificado.validoAte.toISOString() },
    },
  });

  return NextResponse.json({
    requestId,
    certificado,
    informacoes: {
      validoAte: informacoes.validTo,
      documento: informacoes.document,
      commonName: informacoes.commonName,
      fingerprint: informacoes.fingerprint,
    },
  });
}
