import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV recomendado para GCM
const AUTH_TAG_LENGTH = 16; // 128-bit tag
const SEPARATOR = ':';

/**
 * Retorna a chave de 32 bytes derivada da variável de ambiente CERT_ENCRYPTION_KEY.
 * Em produção, CERT_ENCRYPTION_KEY DEVE estar definida como uma string hex de 64 chars.
 * Em desenvolvimento, usa uma chave fixa apenas para não travar o boot.
 */
function getEncryptionKey(): Buffer {
  const envKey = process.env.CERT_ENCRYPTION_KEY;

  if (envKey) {
    if (envKey.length !== 64) {
      throw new Error(
        'CERT_ENCRYPTION_KEY deve ser uma string hexadecimal de 64 caracteres (32 bytes).'
      );
    }
    return Buffer.from(envKey, 'hex');
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'CERT_ENCRYPTION_KEY não está definida. ' +
        'Defina esta variável de ambiente em produção antes de iniciar o servidor.\n' +
        'Gere uma chave com: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }

  // Desenvolvimento apenas: chave derivada de uma string fixa
  console.warn(
    '[AVISO DE SEGURANÇA] CERT_ENCRYPTION_KEY não está definida. ' +
      'Usando chave de desenvolvimento. NÃO use em produção.'
  );
  return createHash('sha256').update('dev-key-insegura-nao-use-em-producao').digest();
}

/**
 * Criptografa um texto usando AES-256-GCM.
 * Formato de saída: `<iv_hex>:<authTag_hex>:<ciphertext_hex>`
 *
 * @param plaintext - Texto a ser criptografado
 * @returns String criptografada no formato iv:authTag:ciphertext
 */
export function encryptPassword(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [iv.toString('hex'), authTag.toString('hex'), encrypted.toString('hex')].join(SEPARATOR);
}

/**
 * Descriptografa um texto criptografado por `encryptPassword`.
 * Suporta textos legados (plaintext sem separadores) para retrocompatibilidade.
 *
 * @param ciphertext - String no formato iv:authTag:encrypted (ou plaintext legado)
 * @returns Texto descriptografado
 */
export function decryptPassword(ciphertext: string): string {
  // Retrocompatibilidade: se não tem o formato esperado, retorna como está (legado)
  const parts = ciphertext.split(SEPARATOR);
  if (parts.length !== 3) {
    // Valor legado (plaintext ou hash): retornar como está
    return ciphertext;
  }

  const [ivHex, authTagHex, encryptedHex] = parts;

  // Validar comprimentos esperados
  if (ivHex.length !== IV_LENGTH * 2 || authTagHex.length !== AUTH_TAG_LENGTH * 2) {
    // Formato inválido: pode ser plaintext com ':' — retornar como está
    return ciphertext;
  }

  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');

  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

/**
 * Verifica se um valor já está criptografado com AES-256-GCM pelo nosso padrão.
 */
export function isEncrypted(value: string): boolean {
  const parts = value.split(SEPARATOR);
  return (
    parts.length === 3 &&
    parts[0].length === IV_LENGTH * 2 &&
    parts[1].length === AUTH_TAG_LENGTH * 2
  );
}
