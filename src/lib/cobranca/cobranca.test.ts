import { describe, expect, test } from 'bun:test';
import { calcularCobrancaNotas } from './cobranca';

describe('calcularCobrancaNotas', () => {
  test('aplica minimo mensal abaixo do ponto de virada', () => {
    expect(calcularCobrancaNotas(50)).toMatchObject({
      precoUnitario: 0.9,
      valorNotas: 45,
      valorTotal: 69.9,
      minimoAplicado: true,
    });
  });

  test('cobra todas as notas pela faixa ate 100', () => {
    expect(calcularCobrancaNotas(100)).toMatchObject({
      precoUnitario: 0.9,
      valorNotas: 90,
      valorTotal: 90,
      faixa: 'ATE_100',
    });
  });

  test('cobra todas as notas pela faixa de 101 a 350', () => {
    expect(calcularCobrancaNotas(101)).toMatchObject({
      precoUnitario: 0.79,
      valorNotas: 79.79,
      valorTotal: 79.79,
      faixa: 'ATE_350',
    });
  });

  test('cobra todas as notas pela faixa acima de 350', () => {
    expect(calcularCobrancaNotas(351)).toMatchObject({
      precoUnitario: 0.69,
      valorNotas: 242.19,
      valorTotal: 242.19,
      faixa: 'ACIMA_350',
    });
  });
});
