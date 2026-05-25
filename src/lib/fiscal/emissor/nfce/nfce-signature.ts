/**
 * Assinatura Digital do XML de NFC-e com o certificado A1
 */

import { signNFeXml } from '../nfe/nfe-signature';

interface SignXmlParams {
  xmlString: string;
  p12Buffer: Buffer;
  password?: string;
  chaveAcesso: string;
}

/**
 * Assina digitalmente o XML da NFC-e com o certificado A1 fornecido
 */
export function signNfceXml(params: SignXmlParams): string {
  return signNFeXml(params);
}
