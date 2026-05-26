import { describe, expect, test } from 'bun:test';
import { calcularCobrancaNotas } from './cobranca';

describe('calcularCobrancaNotas', () => {
  test('calcula lote de 100 notas', () => {
    expect(calcularCobrancaNotas(100)).toMatchObject({
      precoUnitario: 0.90,
      valorNotas: 90,
      valorTotal: 90,
      faixa: 'LOTE_100',
    });
  });

  test('calcula lote de 500 notas', () => {
    expect(calcularCobrancaNotas(500)).toMatchObject({
      precoUnitario: 0.75,
      valorNotas: 375,
      valorTotal: 375,
      faixa: 'LOTE_500',
    });
  });

  test('calcula lote de 2000 notas', () => {
    expect(calcularCobrancaNotas(2000)).toMatchObject({
      precoUnitario: 0.60,
      valorNotas: 1200,
      valorTotal: 1200,
      faixa: 'LOTE_2000',
    });
  });
});
