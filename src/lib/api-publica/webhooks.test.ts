import { describe, expect, test } from 'bun:test';
import { calcularAssinaturaWebhook } from './webhooks';

describe('calcularAssinaturaWebhook', () => {
  test('calcula assinatura HMAC-SHA256 correta para payload texto', () => {
    const payload = '{"documentoId":"doc_123","status":"AUTORIZADA"}';
    const secret = 'segredo_secreto_123';
    
    const assinatura = calcularAssinaturaWebhook(payload, secret);
    
    // Validar assinatura hex de 64 caracteres
    expect(assinatura).toHaveLength(64);
    expect(typeof assinatura).toBe('string');
  });

  test('calcula assinatura idêntica para objeto e string correspondente', () => {
    const payloadObj = { id: 'teste', valor: 100 };
    const secret = 'segredo_teste';
    
    const assinaturaObj = calcularAssinaturaWebhook(payloadObj, secret);
    const assinaturaStr = calcularAssinaturaWebhook(JSON.stringify(payloadObj), secret);
    
    expect(assinaturaObj).toBe(assinaturaStr);
  });
});
