/**
 * Utilitários para geração da Chave de Acesso da NFC-e (Modelo 65 - 44 caracteres)
 */

import { generateNFeKey, calculateCheckDigit, UF_IBGE_CODES } from '../nfe/nfe-key';

export { calculateCheckDigit, UF_IBGE_CODES };

interface GenerateNfcKeyParams {
  uf: string;
  dataEmissao: Date;
  cnpj: string;
  serie: number;
  numero: number;
  tipoEmissao: string; // "1" para Normal, "9" para Contingência
  codigoNumerico?: string;
}

/**
 * Gera a chave de acesso de 44 caracteres específica para NFC-e (Modelo 65)
 */
export function generateNfcKey(params: GenerateNfcKeyParams) {
  return generateNFeKey({
    ...params,
    modelo: '65',
  });
}
