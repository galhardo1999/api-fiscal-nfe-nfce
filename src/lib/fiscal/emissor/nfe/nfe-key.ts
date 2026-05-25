/**
 * Utilitários para geração da Chave de Acesso da NF-e (44 caracteres)
 */

// Mapeamento de UF para Código do IBGE
export const UF_IBGE_CODES: Record<string, string> = {
  'AC': '12', 'AL': '27', 'AP': '16', 'AM': '13', 'BA': '29', 'CE': '23',
  'DF': '53', 'ES': '32', 'GO': '52', 'MA': '21', 'MT': '51', 'MS': '50',
  'MG': '31', 'PA': '15', 'PB': '25', 'PR': '41', 'PE': '26', 'PI': '22',
  'RJ': '33', 'RN': '24', 'RS': '43', 'RO': '11', 'RR': '14', 'SC': '42',
  'SP': '35', 'SE': '28', 'TO': '17'
};

/**
 * Calcula o Dígito Verificador (DV) de uma chave de 43 caracteres usando Módulo 11
 * Suporta caracteres alfanuméricos convertendo letras A-Z para valor ASCII - 48.
 */
export function calculateCheckDigit(key43: string): number {
  if (key43.length !== 43) {
    throw new Error(`A chave parcial deve ter exatamente 43 dígitos, possui ${key43.length}`);
  }

  let sum = 0;
  let weight = 2;

  // Percorrer da direita para a esquerda
  for (let i = key43.length - 1; i >= 0; i--) {
    const char = key43.charAt(i).toUpperCase();
    const code = char.charCodeAt(0);
    let digit = 0;

    if (code >= 48 && code <= 57) { // '0' a '9'
      digit = code - 48;
    } else if (code >= 65 && code <= 90) { // 'A' a 'Z'
      digit = code - 48;
    } else {
      throw new Error(`Caractere inválido encontrado na chave na posição ${i}: ${char}`);
    }

    sum += digit * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }

  const remainder = sum % 11;
  if (remainder === 0 || remainder === 1) {
    return 0;
  }
  return 11 - remainder;
}

interface GenerateKeyParams {
  uf: string;
  dataEmissao: Date;
  cnpj: string;
  modelo: string; // "55" para NFe, "65" para NFCe, "75" para NFAg, etc.
  serie: number;
  numero: number;
  tipoEmissao: string; // "1" para Normal
  codigoNumerico?: string; // Código numérico aleatório de 8 dígitos
}

/**
 * Gera a chave de acesso de 44 caracteres e o código numérico aleatório (suporta CNPJ alfanumérico)
 */
export function generateNFeKey(params: GenerateKeyParams): { chaveAcesso: string; codigoNumerico: string; dv: number } {
  const cUF = UF_IBGE_CODES[params.uf.toUpperCase()];
  if (!cUF) {
    throw new Error(`UF inválida ou não mapeada: ${params.uf}`);
  }

  const date = params.dataEmissao;
  const yy = String(date.getFullYear()).substring(2, 4);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const aamm = `${yy}${mm}`;

  const cleanCnpj = params.cnpj.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (cleanCnpj.length !== 14) {
    throw new Error(`CNPJ deve ter 14 caracteres, possui: ${cleanCnpj.length}`);
  }

  const mod = params.modelo.padStart(2, '0');
  const serieStr = String(params.serie).padStart(3, '0');
  const nNF = String(params.numero).padStart(9, '0');
  const tpEmis = params.tipoEmissao.substring(0, 1);

  // Se não foi fornecido um código numérico, gera um aleatório de 8 dígitos
  let cNF = params.codigoNumerico || '';
  if (!cNF) {
    // Gerar um código aleatório de 8 dígitos
    const random = Math.floor(10000000 + Math.random() * 90000000);
    cNF = String(random);
  } else {
    cNF = cNF.padStart(8, '0');
  }

  // Chave parcial com 43 caracteres (pode conter letras no campo do CNPJ)
  const partialKey = `${cUF}${aamm}${cleanCnpj}${mod}${serieStr}${nNF}${tpEmis}${cNF}`;
  const dv = calculateCheckDigit(partialKey);
  const chaveAcesso = `${partialKey}${dv}`;

  return {
    chaveAcesso,
    codigoNumerico: cNF,
    dv
  };
}
