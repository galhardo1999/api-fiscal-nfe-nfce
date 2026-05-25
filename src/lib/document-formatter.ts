/**
 * Utilitários para formatação e validação de CPF e CNPJ
 */

/**
 * Remove todos os caracteres não numéricos de uma string
 */
export function removeNonNumeric(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Formata um CPF (11 dígitos) no padrão XXX.XXX.XXX-XX
 */
export function formatCPF(cpf: string): string {
  const numbers = removeNonNumeric(cpf);
  
  if (numbers.length === 0) return '';
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
}

/**
 * Formata um CNPJ (14 dígitos) no padrão XX.XXX.XXX/XXXX-XX
 */
export function formatCNPJ(cnpj: string): string {
  const numbers = removeNonNumeric(cnpj);
  
  if (numbers.length === 0) return '';
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
  if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
  if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
  
  return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
}

/**
 * Detecta automaticamente se é CPF ou CNPJ e aplica a formatação correspondente
 */
export function formatDocument(document: string): string {
  const numbers = removeNonNumeric(document);
  
  if (numbers.length <= 11) {
    return formatCPF(numbers);
  } else {
    return formatCNPJ(numbers);
  }
}

/**
 * Valida se um CPF está no formato correto XXX.XXX.XXX-XX
 */
export function isValidCPFFormat(cpf: string): boolean {
  return /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cpf);
}

/**
 * Valida se um CNPJ está no formato correto XX.XXX.XXX/XXXX-XX
 */
export function isValidCNPJFormat(cnpj: string): boolean {
  return /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(cnpj);
}

/**
 * Valida se um telefone está no formato correto (XX) X XXXX-XXXX
 */
export function isValidPhoneFormat(phone: string): boolean {
  return /^\(\d{2}\) \d \d{4}-\d{4}$/.test(phone);
}

/**
 * Formata um telefone no padrão (XX) X XXXX-XXXX
 */
export function formatPhone(phone: string): string {
  const numbers = phone.replace(/\D/g, '').slice(0, 11);
  if (numbers.length === 0) return '';
  if (numbers.length <= 2) return `(${numbers}`;
  if (numbers.length <= 3) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(3)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
}

/**
 * Valida se um CPF é válido (formato e dígitos verificadores)
 */
export function isValidCPF(cpf: string): boolean {
  if (!isValidCPFFormat(cpf)) return false;
  
  const numbers = removeNonNumeric(cpf);
  
  // CPF deve ter exatamente 11 dígitos
  if (numbers.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais (CPF inválido)
  if (/^(\d)\1{10}$/.test(numbers)) return false;
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers[i]) * (10 - i);
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  
  if (parseInt(numbers[9]) !== digit1) return false;
  
  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers[i]) * (11 - i);
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  
  return parseInt(numbers[10]) === digit2;
}

/**
 * Valida se um CNPJ é válido (formato e dígitos verificadores)
 */
export function isValidCNPJ(cnpj: string): boolean {
  if (!isValidCNPJFormat(cnpj)) return false;
  
  const numbers = removeNonNumeric(cnpj);
  
  // CNPJ deve ter exatamente 14 dígitos
  if (numbers.length !== 14) return false;
  
  // Verifica se todos os dígitos são iguais (CNPJ inválido)
  if (/^(\d)\1{13}$/.test(numbers)) return false;
  
  // Validação do primeiro dígito verificador
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(numbers[i]) * weights1[i];
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  
  if (parseInt(numbers[12]) !== digit1) return false;
  
  // Validação do segundo dígito verificador
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(numbers[i]) * weights2[i];
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  
  return parseInt(numbers[13]) === digit2;
}

/**
 * Valida automaticamente se é um CPF ou CNPJ válido
 */
export function isValidDocument(document: string): boolean {
  if (isValidCPFFormat(document)) {
    return isValidCPF(document);
  } else if (isValidCNPJFormat(document)) {
    return isValidCNPJ(document);
  }
  return false;
}

/**
 * Retorna o tipo do documento (CPF ou CNPJ)
 */
export function getDocumentType(document: string): 'CPF' | 'CNPJ' | 'INVALID' {
  const numbers = removeNonNumeric(document);
  
  if (numbers.length === 11) {
    return 'CPF';
  } else if (numbers.length === 14) {
    return 'CNPJ';
  }
  
  return 'INVALID';
}

/**
 * Máscara para input de CPF
 */
export const CPF_MASK = '999.999.999-99';

/**
 * Máscara para input de CNPJ
 */
export const CNPJ_MASK = '99.999.999/9999-99';

/**
 * Retorna a máscara apropriada baseada no comprimento do documento
 */
export function getDocumentMask(document: string): string {
  const numbers = removeNonNumeric(document);
  
  if (numbers.length <= 11) {
    return CPF_MASK;
  } else {
    return CNPJ_MASK;
  }
}

/**
 * Limita o input para o tamanho máximo do documento (14 dígitos para CNPJ)
 */
export function limitDocumentInput(value: string): string {
  const numbers = removeNonNumeric(value);
  return numbers.slice(0, 14);
}