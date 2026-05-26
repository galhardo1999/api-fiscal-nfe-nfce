import { PrismaClient, ModeloDocumentoFiscal, StatusDocumentoFiscal, TipoEventoDocumentoFiscal, AmbienteFiscalApi } from '@prisma/client';
import { decryptPassword } from '../src/lib/crypto';
import { generateNFeKey } from '../src/lib/fiscal/emissor/nfe/nfe-key';
import { generateNFeXml } from '../src/lib/fiscal/emissor/nfe/nfe-xml';
import { generateNfcXml, insertNfceSuplementar } from '../src/lib/fiscal/emissor/nfce/nfce-xml';
import { signNFeXml } from '../src/lib/fiscal/emissor/nfe/nfe-signature';
import { signNfceXml } from '../src/lib/fiscal/emissor/nfce/nfce-signature';
import { buildNFeProcXml, buildAutorizacaoSoapEnvelope, sendSefazSoapRequest, parseSefazResponse } from '../src/lib/fiscal/emissor/nfe/sefaz-soap';
import { generateDanfePdf } from '../src/lib/fiscal/emissor/nfe/danfe-generator';
import { StorageService } from '../src/lib/storage';
import { registrarEntregasWebhook } from '../src/lib/api-publica/documentos';

const prisma = new PrismaClient();

// Mapeamento simplificado de capitais/municípios mais comuns para códigos IBGE
const IBGE_MUNICIPIOS: Record<string, string> = {
  'SAO PAULO': '3550308',
  'RIO DE JANEIRO': '3304557',
  'BELO HORIZONTE': '3106200',
  'CURITIBA': '4106902',
  'PORTO ALEGRE': '4314902',
  'BRASILIA': '5300108',
  'SALVADOR': '2927408',
  'FORTALEZA': '2304400',
  'RECIFE': '2611606',
  'MANAUS': '1302603',
  'GOIANIA': '5208707',
  'BELEM': '1501402',
};

function obterCodigoMunicipio(nome: string): string {
  const norm = nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  return IBGE_MUNICIPIOS[norm] || '3550308'; // Default para São Paulo se não achar
}

async function processarDocumento(docId: string) {
  console.log(`[Worker Emissão] Processando documento ${docId}...`);

  // 1. Atualizar para ENVIANDO_SEFAZ na transação
  const documento = await prisma.documentoFiscal.update({
    where: { id: docId },
    data: { status: StatusDocumentoFiscal.ENVIANDO_SEFAZ },
    include: { client: true },
  });

  try {
    // Validar saldo pré-pago apenas em ambiente de Produção
    if (documento.ambiente === AmbienteFiscalApi.PRODUCAO && ((documento.client as any).saldoCreditos || 0) <= 0) {
      throw new Error('SALDO_INSUFICIENTE');
    }

    // 2. Obter Empresa e Certificado
    if (!documento.empresaId) {
      throw new Error('Documento fiscal sem empresa associada.');
    }

    const empresa = await prisma.empresa.findUnique({
      where: { id: documento.empresaId },
      include: { certificadoDigital: true, user: true },
    });

    if (!empresa) {
      throw new Error(`Empresa emitente ${documento.empresaId} não encontrada.`);
    }

    // 3. Determinar número da nota, série e ambiente
    const modelo = documento.modelo;
    const isNfe = modelo === ModeloDocumentoFiscal.NFE;
    const numero = isNfe ? empresa.proximoNumeroNfe : empresa.proximoNumeroNfce;
    const serie = isNfe ? empresa.serieNfe : empresa.serieNfce;
    const ambienteXml = documento.ambiente === AmbienteFiscalApi.PRODUCAO ? '1' : '2';

    // Incrementar número da nota na empresa
    await prisma.empresa.update({
      where: { id: empresa.id },
      data: {
        proximoNumeroNfe: isNfe ? { increment: 1 } : undefined,
        proximoNumeroNfce: !isNfe ? { increment: 1 } : undefined,
      },
    });

    // 4. Gerar chave de acesso
    const { chaveAcesso, codigoNumerico } = generateNFeKey({
      uf: empresa.uf,
      dataEmissao: new Date(),
      cnpj: empresa.cnpj,
      modelo: isNfe ? '55' : '65',
      serie,
      numero,
      tipoEmissao: '1',
    });

    console.log(`[Worker Emissão] Nota gerada: ${modelo} Nº ${numero} Série ${serie} - Chave: ${chaveAcesso}`);

    // Parse do payload original do cliente
    const payload = documento.payload as any;
    const payloadDest = payload.destinatario || {};

    const destConfig = {
      cnpjCpf: (payloadDest.cnpjCpf || payloadDest.cnpj || payloadDest.cpf || '00000000000000') as string,
      nome: (payloadDest.nome || 'CONSUMIDOR PADRAO') as string,
      ie: (payloadDest.ie || '') as string,
      isConsumidorFinal: true,
      logradouro: (payloadDest.logradouro || empresa.logradouro) as string,
      numero: (payloadDest.numero || empresa.numero) as string,
      complemento: (payloadDest.complemento || empresa.complemento || '') as string,
      bairro: (payloadDest.bairro || empresa.bairro) as string,
      codigoMunicipio: obterCodigoMunicipio(payloadDest.municipio || empresa.municipio),
      nomeMunicipio: (payloadDest.municipio || empresa.municipio) as string,
      uf: (payloadDest.uf || empresa.uf) as string,
      cep: (payloadDest.cep || empresa.cep) as string,
      telefone: (payloadDest.telefone || '') as string,
      email: (payloadDest.email || '') as string,
    };

    const configItens = (payload.itens || []).map((item: any, idx: number) => {
      const valorTotalItem = Number(item.valorTotal || (item.quantidade * item.valorUnitario));
      return {
        numeroItem: idx + 1,
        codigo: item.codigo || `ITEM${idx + 1}`,
        descricao: item.descricao,
        ncm: (item.ncm || '99999999').replace(/\D/g, ''),
        cfop: (item.cfop || (isNfe ? '5101' : '5102')).replace(/\D/g, ''),
        unidade: item.unidade || 'UN',
        quantidade: Number(item.quantidade),
        valorUnitario: Number(item.valorUnitario),
        valorTotal: valorTotalItem,
        icmsOrigem: item.icmsOrigem || '0',
        icmsCstCsosn: item.icmsCstCsosn || item.icmsCst || (empresa.crt === '1' ? '102' : '00'),
        icmsAliquota: Number(item.icmsAliquota || 18.00),
        icmsValor: Number(item.icmsValor || (valorTotalItem * 0.18)),
        pisCst: item.pisCst || '07',
        cofinsCst: item.cofinsCst || '07',
      };
    });

    const valorTotalDoc = Number(documento.valorTotal || configItens.reduce((sum: number, it: any) => sum + it.valorTotal, 0));

    // 5. Gerar XML Bruto
    let xmlBruto = '';
    if (isNfe) {
      xmlBruto = generateNFeXml({
        chaveAcesso,
        codigoNumerico,
        numero,
        serie,
        naturezaOperacao: 'Venda de mercadorias',
        tipoOperacao: '1',
        ambiente: ambienteXml,
        dataEmissao: new Date(),
        modelo: '55',
        emit: {
          cnpj: empresa.cnpj,
          razaoSocial: empresa.nome,
          nomeFantasia: empresa.nomeFantasia || empresa.nome,
          ie: empresa.ie,
          crt: empresa.crt,
          logradouro: empresa.logradouro,
          numero: empresa.numero,
          complemento: empresa.complemento || undefined,
          bairro: empresa.bairro,
          codigoMunicipio: obterCodigoMunicipio(empresa.municipio),
          nomeMunicipio: empresa.municipio,
          uf: empresa.uf,
          cep: empresa.cep,
          telefone: empresa.telefone || undefined,
        },
        dest: destConfig,
        itens: configItens,
        valorTotal: valorTotalDoc,
        valorProdutos: valorTotalDoc,
      });
    } else {
      xmlBruto = generateNfcXml({
        chaveAcesso,
        codigoNumerico,
        numero,
        serie,
        naturezaOperacao: 'Venda a Consumidor',
        ambiente: ambienteXml,
        dataEmissao: new Date(),
        tipoEmissao: '1',
        emit: {
          cnpj: empresa.cnpj,
          razaoSocial: empresa.nome,
          nomeFantasia: empresa.nomeFantasia || undefined,
          ie: empresa.ie,
          crt: empresa.crt,
          logradouro: empresa.logradouro,
          numero: empresa.numero,
          complemento: empresa.complemento || undefined,
          bairro: empresa.bairro,
          codigoMunicipio: obterCodigoMunicipio(empresa.municipio),
          nomeMunicipio: empresa.municipio,
          uf: empresa.uf,
          cep: empresa.cep,
          telefone: empresa.telefone || undefined,
        },
        dest: destConfig,
        itens: configItens,
        valorTotal: valorTotalDoc,
        valorProdutos: valorTotalDoc,
        pagamentos: (payload.pagamentos || [{ tPag: '01', vPag: valorTotalDoc }]).map((p: any) => ({
          tPag: p.tPag || '01',
          vPag: Number(p.vPag || valorTotalDoc),
        })),
      });
    }

    // 6. Assinar o XML se houver certificado
    let xmlAssinado = xmlBruto;
    let certificadoBuffer: any = Buffer.from('');
    let certificadoSenha = '';

    if (empresa.certificadoDigital) {
      certificadoBuffer = empresa.certificadoDigital.arquivo;
      certificadoSenha = decryptPassword(empresa.certificadoDigital.senha);
      
      const signParams = {
        xmlString: xmlBruto,
        p12Buffer: certificadoBuffer,
        password: certificadoSenha,
        chaveAcesso,
      };

      xmlAssinado = isNfe ? signNFeXml(signParams) : signNfceXml(signParams);
      
      // Inserir tags complementares da NFCe
      if (!isNfe) {
        const qrCodeUrl = `https://homologacao.sefaz.sp.gov.br/nfce/qrcode?chNFe=${chaveAcesso}&tpAmb=${ambienteXml}`;
        const urlChave = `https://homologacao.sefaz.sp.gov.br/nfce/consulta`;
        xmlAssinado = insertNfceSuplementar(xmlAssinado, qrCodeUrl, urlChave);
      }
    }

    // 7. Enviar para a SEFAZ ou usar o simulador/mock
    const isMock = process.env.MOCK_SEFAZ !== 'false' || !empresa.certificadoDigital || empresa.certificadoDigital.nome.toUpperCase().includes('SIMULADO');
    let sefazResponse;

    if (isMock) {
      console.log(`[Worker Emissão] Modo simulação ativo. Mocado para sucesso.`);
      sefazResponse = {
        success: true,
        cStat: '100',
        xMotivo: 'Autorizado o uso da NF-e',
        nProt: Math.floor(100000000000000 + Math.random() * 900000000000000).toString(),
        dhRecbto: new Date().toISOString(),
        chNFe: chaveAcesso,
        xmlRetorno: '<retEnviNFe versao="4.00"><cStat>100</cStat><xMotivo>Mock Autorizado</xMotivo></retEnviNFe>',
      };
    } else {
      console.log(`[Worker Emissão] Enviando para a SEFAZ real...`);
      const soapEnvelope = buildAutorizacaoSoapEnvelope(xmlAssinado, isNfe ? '55' : '65');
      const urlSefaz = isNfe 
        ? 'https://homologacao.nfe.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx' 
        : 'https://homologacao.nfce.fazenda.sp.gov.br/ws/nfceautorizacao4.asmx';
      
      const soapResponseText = await sendSefazSoapRequest(urlSefaz, soapEnvelope, certificadoBuffer, certificadoSenha);
      sefazResponse = await parseSefazResponse(soapResponseText);
    }

    // 8. Tratar retorno da SEFAZ
    if (sefazResponse.success) {
      console.log(`[Worker Emissão] Documento AUTORIZADO com sucesso! Protocolo: ${sefazResponse.nProt}`);
      
      const xmlProtocolado = buildNFeProcXml(
        xmlAssinado,
        sefazResponse.nProt || '12345678',
        sefazResponse.cStat,
        sefazResponse.xMotivo,
        sefazResponse.dhRecbto || new Date().toISOString(),
        chaveAcesso,
        ambienteXml as '1' | '2'
      );

      // Salvar no Object Storage local
      const xmlUrl = StorageService.salvarXml(documento.id, xmlProtocolado);
      
      // Gerar e Salvar DANFE PDF (NF-e)
      let pdfUrl = '';
      try {
        const pdfBuffer = generateDanfePdf({
          chaveAcesso,
          numero,
          serie,
          dataEmissao: new Date(),
          naturezaOperacao: 'Venda',
          ambiente: ambienteXml as '1' | '2',
          valores: {
            valorProdutos: valorTotalDoc,
            valorTotal: valorTotalDoc,
          },
          emitente: {
            razaoSocial: empresa.nome,
            cnpj: empresa.cnpj,
            ie: empresa.ie,
            logradouro: empresa.logradouro,
            numero: empresa.numero,
            bairro: empresa.bairro,
            municipio: empresa.municipio,
            uf: empresa.uf,
            cep: empresa.cep,
          },
          destinatario: {
            nome: destConfig.nome,
            cnpjCpf: destConfig.cnpjCpf,
            logradouro: destConfig.logradouro,
            numero: destConfig.numero,
            bairro: destConfig.bairro,
            municipio: destConfig.nomeMunicipio,
            uf: destConfig.uf,
            cep: destConfig.cep,
          },
          itens: configItens.map((it: any) => ({
            codigo: it.codigo,
            descricao: it.descricao,
            ncm: it.ncm,
            cstCsosn: it.cstCsosn || '102',
            cfop: it.cfop,
            unidade: it.unidade,
            quantidade: it.quantidade,
            valorUnitario: it.valorUnitario,
            valorTotal: it.valorTotal,
          })),
        });
        pdfUrl = StorageService.salvarPdf(documento.id, pdfBuffer);
      } catch (errPdf) {
        console.error('[Worker Emissão] Erro ao gerar DANFE PDF:', errPdf);
      }

      // Inserir registro na tabela Nfe principal
      const nfeCriada = await prisma.nfe.create({
        data: {
          userId: empresa.userId,
          empresaId: empresa.id,
          chaveAcesso,
          numero,
          serie,
          naturezaOperacao: isNfe ? 'Venda de mercadorias' : 'Venda a Consumidor',
          tipoOperacao: '1',
          ambiente: ambienteXml,
          modelo: isNfe ? '55' : '65',
          status: 'EMITIDA',
          protocolo: sefazResponse.nProt,
          xmlNfe: xmlAssinado,
          xmlProtocolo: xmlProtocolado,
          destinatarioNome: destConfig.nome,
          destinatarioCnpjCpf: destConfig.cnpjCpf,
          destinatarioIe: destConfig.ie,
          valorTotal: valorTotalDoc,
          valorProdutos: valorTotalDoc,
          dataEmissao: new Date(),
          itens: {
            create: configItens.map((it: any) => ({
              numeroItem: it.numeroItem,
              codigo: it.codigo,
              descricao: it.descricao,
              ncm: it.ncm,
              cfop: it.cfop,
              unidade: it.unidade,
              quantidade: it.quantidade,
              valorUnitario: it.valorUnitario,
              valorTotal: it.valorTotal,
              icmsOrigem: it.icmsOrigem,
              icmsCst: it.icmsCstCsosn,
              icmsAliquota: it.icmsAliquota,
              icmsValor: it.icmsValor,
            })),
          },
        },
      });

      // Se for Produção, decrementa o crédito do cliente
      if (documento.ambiente === AmbienteFiscalApi.PRODUCAO) {
        await prisma.client.update({
          where: { id: documento.clientId },
          data: {
            saldoCreditos: {
              decrement: 1,
            },
          } as any,
        });
        console.log(`[Worker Emissão] 1 crédito decrementado do cliente ${documento.clientId}.`);
      }

      // Atualizar o DocumentoFiscal para AUTORIZADA
      const docAtualizado = await prisma.documentoFiscal.update({
        where: { id: documento.id },
        data: {
          status: StatusDocumentoFiscal.AUTORIZADA,
          numero,
          serie,
          chaveAcesso,
          protocolo: sefazResponse.nProt,
          cStat: sefazResponse.cStat,
          motivoSefaz: sefazResponse.xMotivo,
          xmlNfe: xmlAssinado,
          xmlProtocolo: xmlProtocolado,
          nfeId: nfeCriada.id,
          processadoEm: new Date(),
        },
      });

      // Gravar Evento
      const eventoCriado = await prisma.documentoFiscalEvento.create({
        data: {
          documentoFiscalId: documento.id,
          tipo: TipoEventoDocumentoFiscal.AUTORIZACAO,
          statusAnterior: StatusDocumentoFiscal.ENFILEIRADA,
          statusNovo: StatusDocumentoFiscal.AUTORIZADA,
          cStat: sefazResponse.cStat,
          mensagem: 'Documento fiscal autorizado com sucesso pelo SEFAZ.',
          payload: {
            chaveAcesso,
            nProt: sefazResponse.nProt,
            xmlUrl,
            pdfUrl,
          },
        },
      });

      // Registrar webhook
      await registrarEntregasWebhook({
        clientId: documento.clientId,
        documentoFiscalId: documento.id,
        documentoFiscalEventoId: eventoCriado.id,
        evento: 'documento.autorizado',
        payload: {
          documentoId: documento.id,
          modelo: documento.modelo,
          ambiente: documento.ambiente,
          status: 'AUTORIZADA',
          chaveAcesso,
          numero,
          serie,
          nProt: sefazResponse.nProt,
          xmlUrl,
          pdfUrl,
        },
      });

    } else {
      console.warn(`[Worker Emissão] Lote/Documento Rejeitado pelo SEFAZ. cStat: ${sefazResponse.cStat}`);
      
      // Atualizar DocumentoFiscal para REJEITADA
      await prisma.documentoFiscal.update({
        where: { id: documento.id },
        data: {
          status: StatusDocumentoFiscal.REJEITADA,
          cStat: sefazResponse.cStat,
          motivoSefaz: sefazResponse.xMotivo,
          processadoEm: new Date(),
        },
      });

      // Gravar Evento
      const eventoCriado = await prisma.documentoFiscalEvento.create({
        data: {
          documentoFiscalId: documento.id,
          tipo: TipoEventoDocumentoFiscal.REJEICAO,
          statusAnterior: StatusDocumentoFiscal.ENFILEIRADA,
          statusNovo: StatusDocumentoFiscal.REJEITADA,
          cStat: sefazResponse.cStat,
          mensagem: `Rejeitado: ${sefazResponse.xMotivo}`,
        },
      });

      // Registrar webhook
      await registrarEntregasWebhook({
        clientId: documento.clientId,
        documentoFiscalId: documento.id,
        documentoFiscalEventoId: eventoCriado.id,
        evento: 'documento.rejeitado',
        payload: {
          documentoId: documento.id,
          modelo: documento.modelo,
          ambiente: documento.ambiente,
          status: 'REJEITADA',
          cStat: sefazResponse.cStat,
          motivoSefaz: sefazResponse.xMotivo,
        },
      });
    }

  } catch (error: any) {
    console.error(`[Worker Emissão] Erro técnico ao processar documento ${docId}:`, error);

    // Mudar para ERRO_TECNICO
    await prisma.documentoFiscal.update({
      where: { id: docId },
      data: {
        status: StatusDocumentoFiscal.ERRO_TECNICO,
        motivoSefaz: error.message || 'Erro tecnico desconhecido na emissao.',
      },
    });

    const eventoCriado = await prisma.documentoFiscalEvento.create({
      data: {
        documentoFiscalId: docId,
        tipo: TipoEventoDocumentoFiscal.ERRO_TECNICO,
        statusAnterior: StatusDocumentoFiscal.ENFILEIRADA,
        statusNovo: StatusDocumentoFiscal.ERRO_TECNICO,
        mensagem: error.message || 'Erro tecnico na orquestracao fiscal.',
      },
    });

    // Registrar webhook de erro
    await registrarEntregasWebhook({
      clientId: documento.clientId,
      documentoFiscalId: documento.id,
      documentoFiscalEventoId: eventoCriado.id,
      evento: 'documento.erro',
      payload: {
        documentoId: documento.id,
        modelo: documento.modelo,
        ambiente: documento.ambiente,
        status: 'ERRO_TECNICO',
        mensagem: error.message || 'Erro tecnico.',
      },
    });
  }
}

async function loop() {
  console.log('[Worker Emissão] Iniciado e monitorando banco...');
  while (true) {
    try {
      const documento = await prisma.documentoFiscal.findFirst({
        where: {
          status: StatusDocumentoFiscal.ENFILEIRADA,
        },
        orderBy: { criadoEm: 'asc' },
        select: { id: true },
      });

      if (documento) {
        await processarDocumento(documento.id);
      } else {
        // Sem notas na fila, aguardar 2 segundos
        await new Promise((res) => setTimeout(res, 2000));
      }
    } catch (err) {
      console.error('[Worker Emissão] Erro no loop do worker:', err);
      await new Promise((res) => setTimeout(res, 5000));
    }
  }
}

// Iniciar
loop().catch((err) => {
  console.error('[Worker Emissão] Falha critica no worker:', err);
  process.exit(1);
});
