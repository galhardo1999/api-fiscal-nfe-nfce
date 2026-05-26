import { createHmac } from 'crypto';

/**
 * Calcula a assinatura HMAC-SHA256 de um payload de webhook
 * @param payload - O payload JSON a ser assinado (string ou objeto)
 * @param secret - A chave secreta do endpoint do cliente
 * @returns Assinatura em formato hexadecimal
 */
export function calcularAssinaturaWebhook(payload: unknown, secret: string): string {
  const bodyString = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return createHmac('sha256', secret)
    .update(bodyString, 'utf-8')
    .digest('hex');
}
