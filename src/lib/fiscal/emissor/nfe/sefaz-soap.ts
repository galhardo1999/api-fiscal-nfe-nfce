import https from 'https';
import { parseStringPromise } from 'xml2js';
import * as forge from 'node-forge';

interface SoapResponse {
  success: boolean;
  cStat: string;
  xMotivo: string;
  xmlRetorno: string;
  protocolo?: string;
  nProt?: string;
  chNFe?: string;
  dhRecbto?: string;
}

/**
 * Envia um envelope SOAP para a SEFAZ usando o certificado digital (Mutual TLS)
 */
export function sendSefazSoapRequest(
  url: string,
  soapEnvelope: string,
  p12Buffer: Buffer,
  password?: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const urlObj = new URL(url);
      
      // Converter PFX/P12 buffer em DER string binária
      const p12Der = p12Buffer.toString('binary');
      const p12Asn1 = forge.asn1.fromDer(p12Der);
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password || '');

      // Extrair Certificado em formato PEM
      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
      const certBag = certBags[forge.pki.oids.certBag]?.[0];
      if (!certBag || !certBag.cert) {
        throw new Error('Certificado não encontrado no arquivo PKCS#12');
      }
      const certPem = forge.pki.certificateToPem(certBag.cert);

      // Extrair Chave Privada em formato PEM
      const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
      const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];
      if (!keyBag || !keyBag.key) {
        throw new Error('Chave privada não encontrada no arquivo PKCS#12');
      }
      const keyPem = forge.pki.privateKeyToPem(keyBag.key);

      // Cria o agente HTTPS configurado com a chave e o certificado PEM decodificados.
      // SEFAZ usa certificados da cadeia ICP-Brasil, que não está na CA padrão do Node.js.
      // Para habilitar validação em produção, defina SEFAZ_VERIFY_SSL=true e forneça
      // o bundle ICP-Brasil via SEFAZ_CA_BUNDLE (caminho para arquivo PEM com as raízes).
      const sefazCaBundle = process.env.SEFAZ_CA_BUNDLE
        ? require('fs').readFileSync(process.env.SEFAZ_CA_BUNDLE)
        : undefined;
      const agent = new https.Agent({
        key: keyPem,
        cert: certPem,
        ca: sefazCaBundle,
        rejectUnauthorized: process.env.SEFAZ_VERIFY_SSL === 'true',
      });

      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || 443,
        path: urlObj.pathname + urlObj.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/soap+xml; charset=utf-8',
          'Content-Length': Buffer.byteLength(soapEnvelope),
        },
        agent: agent,
        timeout: 30000, // 30 segundos de timeout
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve(data);
        });
      });

      req.on('error', (err) => {
        console.error('Erro de conexão com SEFAZ:', err);
        reject(new Error(`Erro de rede/mTLS com SEFAZ: ${err.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Timeout de comunicação com os servidores da SEFAZ (30s)'));
      });

      req.write(soapEnvelope);
      req.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Cria o envelope SOAP para envio de Lote de NF-e/NFAg/NFGas (Síncrono)
 */
export function buildAutorizacaoSoapEnvelope(xmlNFe: string, modelo: string = '55'): string {
  let soapMsgTag = 'nfeDadosMsg';
  let namespace = 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4';

  if (modelo === '75') {
    soapMsgTag = 'nfagDadosMsg';
    namespace = 'http://www.portalfiscal.inf.br/NFAg/wsdl/NFAgRecepcao';
  } else if (modelo === '76') {
    soapMsgTag = 'nfgasDadosMsg';
    namespace = 'http://www.portalfiscal.inf.br/NFGas/wsdl/NFGasRecepcao';
  }

  // Remove qualquer declaração xml redundante (como <?xml version="1.0" encoding="UTF-8"?>)
  const cleanXml = xmlNFe.replace(/^<\?xml[\s\S]*?\?>/gi, '').trim();

  return `<?xml version="1.0" encoding="utf-8"?>` +
    `<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">` +
      `<soap12:Body>` +
        `<${soapMsgTag} xmlns="${namespace}">` +
          cleanXml +
        `</${soapMsgTag}>` +
      `</soap12:Body>` +
    `</soap12:Envelope>`;
}

/**
 * Auxiliar recursivo para extrair tags profundas de objetos criados pelo xml2js
 */
function findTag(obj: any, tagName: string): any {
  if (!obj || typeof obj !== 'object') return null;
  if (obj[tagName]) return obj[tagName];
  
  for (const key of Object.keys(obj)) {
    const result = findTag(obj[key], tagName);
    if (result) return result;
  }
  return null;
}

/**
 * Processa a resposta SOAP da SEFAZ
 */
export async function parseSefazResponse(xmlResponse: string): Promise<SoapResponse> {
  try {
    const parsed = await parseStringPromise(xmlResponse, { explicitArray: false, ignoreAttrs: true });
    
    // Buscar retEnviNFe, retNFAg ou retNFGas
    const retEnviNFe = findTag(parsed, 'retEnviNFe') || 
                       findTag(parsed, 'retNFAg') || 
                       findTag(parsed, 'retNFGas') || 
                       findTag(parsed, 'retNFe');

    if (!retEnviNFe) {
      // Se não achar retEnviNFe, tenta achar protNFe/protNFAg/protNFGas ou erro SOAP genérico
      const soapFault = findTag(parsed, 'Fault');
      if (soapFault) {
        const faultReason = findTag(soapFault, 'Text') || findTag(soapFault, 'faultstring');
        return {
          success: false,
          cStat: '999',
          xMotivo: `Falha no Servidor SOAP SEFAZ: ${typeof faultReason === 'string' ? faultReason : JSON.stringify(faultReason)}`,
          xmlRetorno: xmlResponse,
        };
      }
      
      return {
        success: false,
        cStat: '999',
        xMotivo: 'Resposta inválida recebida da SEFAZ (Elemento de retorno fiscal não encontrado)',
        xmlRetorno: xmlResponse,
      };
    }

    const cStat = String(findTag(retEnviNFe, 'cStat') || '');
    const xMotivo = String(findTag(retEnviNFe, 'xMotivo') || '');
    const protNFe = findTag(retEnviNFe, 'protNFe') || 
                    findTag(retEnviNFe, 'protNFAg') || 
                    findTag(retEnviNFe, 'protNFGas') ||
                    findTag(parsed, 'protNFe') ||
                    findTag(parsed, 'protNFAg') ||
                    findTag(parsed, 'protNFGas');

    // cStat = 104 significa "Lote processado" (no síncrono, a resposta real do processamento da nota vem no protNFe/protNFAg)
    if ((cStat === '104' || cStat === '100') && protNFe) {
      const infProt = findTag(protNFe, 'infProt');
      if (infProt) {
        const protCStat = String(findTag(infProt, 'cStat') || '');
        const protXMotivo = String(findTag(infProt, 'xMotivo') || '');
        const nProt = String(findTag(infProt, 'nProt') || '');
        const chNFe = String(findTag(infProt, 'chNFe') || findTag(infProt, 'chNFAg') || findTag(infProt, 'chNFGas') || '');
        const dhRecbto = String(findTag(infProt, 'dhRecbto') || '');

        if (protCStat === '100') {
          return {
            success: true,
            cStat: protCStat,
            xMotivo: protXMotivo,
            xmlRetorno: xmlResponse,
            protocolo: JSON.stringify(protNFe),
            nProt,
            chNFe,
            dhRecbto,
          };
        } else {
          return {
            success: false,
            cStat: protCStat,
            xMotivo: `Documento Rejeitado pela SEFAZ: ${protXMotivo} (cStat: ${protCStat})`,
            xmlRetorno: xmlResponse,
          };
        }
      }
    }

    // Se o cStat do lote for 100
    if (cStat === '100') {
      const nProt = String(findTag(retEnviNFe, 'nProt') || '');
      const chNFe = String(findTag(retEnviNFe, 'chNFe') || findTag(retEnviNFe, 'chNFAg') || findTag(retEnviNFe, 'chNFGas') || '');
      return {
        success: true,
        cStat,
        xMotivo,
        xmlRetorno: xmlResponse,
        nProt,
        chNFe,
      };
    }

    return {
      success: false,
      cStat,
      xMotivo: `Lote Rejeitado (cStat: ${cStat}): ${xMotivo}`,
      xmlRetorno: xmlResponse,
    };

  } catch (error) {
    console.error('Erro ao processar XML de resposta da SEFAZ:', error);
    return {
      success: false,
      cStat: '999',
      xMotivo: `Erro interno no parse da resposta: ${error instanceof Error ? error.message : String(error)}`,
      xmlRetorno: xmlResponse,
    };
  }
}

/**
 * Cria o XML final de distribuição do documento autorizado (nfeProc/nfagProc/nfgasProc) exigido por lei
 */
export function buildNFeProcXml(
  xmlSignedNFe: string,
  nProt: string,
  cStat: string,
  xMotivo: string,
  dhRecbto: string,
  chNFe: string,
  tpAmb: '1' | '2' = '2',
): string {
  const modelo = chNFe.substring(20, 22);
  let xmlTagPrefix = 'nfe';
  let version = '4.00';
  let ns = 'http://www.portalfiscal.inf.br/nfe';

  if (modelo === '75') {
    xmlTagPrefix = 'nfag';
    version = '1.00';
    ns = 'http://www.portalfiscal.inf.br/NFAg';
  } else if (modelo === '76') {
    xmlTagPrefix = 'nfgas';
    version = '1.00';
    ns = 'http://www.portalfiscal.inf.br/NFGas';
  }

  const rootTag = `${xmlTagPrefix}Proc`;
  const protTag = `prot${xmlTagPrefix === 'nfe' ? 'NFe' : (xmlTagPrefix === 'nfag' ? 'NFAg' : 'NFGas')}`;
  const chTag = xmlTagPrefix === 'nfe' ? 'chNFe' : (xmlTagPrefix === 'nfag' ? 'chNFAg' : 'chNFGas');

  const cleanXml = xmlSignedNFe.replace(/<\?xml[\s\S]*?\?>/g, '').trim();

  const protNFe = `<${protTag} versao="${version}">` +
    `<infProt>` +
      `<tpAmb>${tpAmb}</tpAmb>` +
      `<verAplic>NextNFe_1.0.0</verAplic>` +
      `<${chTag}>${chNFe}</${chTag}>` +
      `<dhRecbto>${dhRecbto}</dhRecbto>` +
      `<nProt>${nProt}</nProt>` +
      `<digVal>SEM_VAL_DIG</digVal>` +
      `<cStat>${cStat}</cStat>` +
      `<xMotivo>${xMotivo}</xMotivo>` +
    `</infProt>` +
  `</${protTag}>`;

  return `<?xml version="1.0" encoding="UTF-8"?>` +
    `<${rootTag} xmlns="${ns}" versao="${version}">` +
      cleanXml +
      protNFe +
    `</${rootTag}>`;
}
