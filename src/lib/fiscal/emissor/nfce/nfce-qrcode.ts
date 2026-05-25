import crypto from 'crypto';

interface NfceUrlMapping {
  qrCode: string;
  consulta: string;
}

// Mapeamento de URLs de Webservices por UF
const NFCE_URLS: Record<string, { homologacao: NfceUrlMapping; producao: NfceUrlMapping }> = {
  'SP': {
    producao: {
      qrCode: 'https://www.nfce.fazenda.sp.gov.br/qrcode',
      consulta: 'https://www.nfce.fazenda.sp.gov.br/consulta',
    },
    homologacao: {
      qrCode: 'https://www.homologacao.nfce.fazenda.sp.gov.br/qrcode',
      consulta: 'https://www.homologacao.nfce.fazenda.sp.gov.br/consulta',
    },
  },
  'RS': {
    producao: {
      qrCode: 'https://dfe-portal.svrs.rs.gov.br/nfce/qrCode',
      consulta: 'https://dfe-portal.svrs.rs.gov.br/nfce/consulta',
    },
    homologacao: {
      qrCode: 'https://dfe-portal.svrs.rs.gov.br/nfce/qrCode',
      consulta: 'https://dfe-portal.svrs.rs.gov.br/nfce/consulta',
    },
  },
  'PR': {
    producao: {
      qrCode: 'http://www.fazenda.pr.gov.br/nfce/qrcode',
      consulta: 'http://www.fazenda.pr.gov.br/nfce/consulta',
    },
    homologacao: {
      qrCode: 'http://www.fazenda.pr.gov.br/nfce/qrcode',
      consulta: 'http://www.fazenda.pr.gov.br/nfce/consulta',
    },
  },
  'MG': {
    producao: {
      qrCode: 'https://portalsped.fazenda.mg.gov.br/portalnfce/sistema/qrcode.xhtml',
      consulta: 'https://portalsped.fazenda.mg.gov.br/portalnfce/sistema/consulta',
    },
    homologacao: {
      qrCode: 'https://portalsped.fazenda.mg.gov.br/portalnfce/sistema/qrcode.xhtml',
      consulta: 'https://portalsped.fazenda.mg.gov.br/portalnfce/sistema/consulta',
    },
  },
};

// Fallback padrão SVRS
const SVRS_URLS: { homologacao: NfceUrlMapping; producao: NfceUrlMapping } = {
  producao: {
    qrCode: 'https://dfe-portal.svrs.rs.gov.br/nfce/qrCode',
    consulta: 'https://dfe-portal.svrs.rs.gov.br/nfce/consulta',
  },
  homologacao: {
    qrCode: 'https://dfe-portal.svrs.rs.gov.br/nfce/qrCode',
    consulta: 'https://dfe-portal.svrs.rs.gov.br/nfce/consulta',
  },
};

/**
 * Retorna as URLs de QR Code e Consulta para o estado e ambiente indicados
 */
export function getNfceUrls(uf: string, ambiente: '1' | '2'): NfceUrlMapping {
  const ufUpper = uf.toUpperCase();
  const mapping = NFCE_URLS[ufUpper] || SVRS_URLS;
  return ambiente === '1' ? mapping.producao : mapping.homologacao;
}

interface GenerateQrCodeParams {
  chaveAcesso: string;
  ambiente: '1' | '2';
  uf: string;
  cscId: string;
  cscToken: string;
  
  // Parâmetros de Contingência (obrigatórios se tpEmis = 9)
  tipoEmissao: '1' | '9';
  dataEmissao?: Date;
  valorTotal?: number;
  signedXml?: string;
}

/**
 * Gera a string do QR Code v2 para a NFC-e e calcula o código Hash SHA-1 correspondente
 */
export function generateNfceQrCode(params: GenerateQrCodeParams): { qrCodeUrl: string; urlChave: string } {
  const { chaveAcesso, ambiente, uf, cscId, cscToken, tipoEmissao, dataEmissao, valorTotal, signedXml } = params;

  const urls = getNfceUrls(uf, ambiente);
  const versaoQrCode = '2';

  let queryParamsStr = '';
  let contentToHash = '';

  if (tipoEmissao === '9') {
    // Contingência Off-line
    if (!dataEmissao) throw new Error('Data de emissão é obrigatória para QR Code em contingência.');
    if (valorTotal === undefined) throw new Error('Valor total é obrigatório para QR Code em contingência.');
    if (!signedXml) throw new Error('XML assinado é obrigatório para extrair digVal do QR Code em contingência.');

    // 1. Extrair o DigestValue do XML assinado
    const digestMatch = signedXml.match(/<DigestValue>(.*?)<\/DigestValue>/);
    if (!digestMatch) throw new Error('Não foi possível extrair <DigestValue> do XML da NFC-e.');
    const digestValueB64 = digestMatch[1].trim();

    // 2. Converter o DigestValue em hexadecimal e codificar para URL
    const digValHex = Buffer.from(digestValueB64, 'base64').toString('hex').toUpperCase();

    // 3. Formatadores específicos da contingência
    const diaEmissao = String(dataEmissao.getDate()).padStart(2, '0');
    const valorFormatado = Number(valorTotal).toFixed(2);

    // Concatenação de parâmetros
    queryParamsStr = `${chaveAcesso}|${versaoQrCode}|${ambiente}|${diaEmissao}|${valorFormatado}|${digValHex}|${String(parseInt(cscId, 10) || 1)}`;
  } else {
    // Emissão Normal On-line
    queryParamsStr = `${chaveAcesso}|${versaoQrCode}|${ambiente}|${String(parseInt(cscId, 10) || 1)}`;
  }

  // 4. Calcular o código_hash usando SHA-1 da concatenação + cscToken
  contentToHash = `${queryParamsStr}${cscToken}`;
  const codigoHash = crypto.createHash('sha1').update(contentToHash, 'utf8').digest('hex').toUpperCase();

  // 5. URL final montada
  const qrCodeUrl = `${urls.qrCode}?p=${queryParamsStr}|${codigoHash}`;

  return {
    qrCodeUrl,
    urlChave: urls.consulta
  };
}
