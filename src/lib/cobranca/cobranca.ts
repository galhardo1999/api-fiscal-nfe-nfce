export const VALOR_MINIMO_MENSAL_CENTAVOS = 6990;

export interface ResultadoCobrancaNotas {
  quantidadeNotas: number;
  precoUnitarioCentavos: number;
  precoUnitario: number;
  valorNotasCentavos: number;
  valorNotas: number;
  valorTotalCentavos: number;
  valorTotal: number;
  minimoAplicado: boolean;
  faixa: 'ATE_100' | 'ATE_350' | 'ACIMA_350';
}

export function obterPrecoUnitarioCentavos(quantidadeNotas: number): number {
  if (quantidadeNotas <= 100) {
    return 90;
  }

  if (quantidadeNotas <= 350) {
    return 79;
  }

  return 69;
}

export function obterFaixaCobranca(quantidadeNotas: number): ResultadoCobrancaNotas['faixa'] {
  if (quantidadeNotas <= 100) {
    return 'ATE_100';
  }

  if (quantidadeNotas <= 350) {
    return 'ATE_350';
  }

  return 'ACIMA_350';
}

export function calcularCobrancaNotas(quantidadeNotasEntrada: number): ResultadoCobrancaNotas {
  const quantidadeNotas = Math.max(0, Math.trunc(quantidadeNotasEntrada));
  const precoUnitarioCentavos = obterPrecoUnitarioCentavos(quantidadeNotas);
  const valorNotasCentavos = quantidadeNotas * precoUnitarioCentavos;
  const valorTotalCentavos = Math.max(VALOR_MINIMO_MENSAL_CENTAVOS, valorNotasCentavos);

  return {
    quantidadeNotas,
    precoUnitarioCentavos,
    precoUnitario: precoUnitarioCentavos / 100,
    valorNotasCentavos,
    valorNotas: valorNotasCentavos / 100,
    valorTotalCentavos,
    valorTotal: valorTotalCentavos / 100,
    minimoAplicado: valorTotalCentavos === VALOR_MINIMO_MENSAL_CENTAVOS && valorNotasCentavos < VALOR_MINIMO_MENSAL_CENTAVOS,
    faixa: obterFaixaCobranca(quantidadeNotas),
  };
}

export function obterAnoMes(data = new Date()): string {
  const ano = data.getUTCFullYear();
  const mes = String(data.getUTCMonth() + 1).padStart(2, '0');
  return `${ano}-${mes}`;
}

export function obterIntervaloAnoMes(anoMes: string): { inicio: Date; fim: Date } {
  const match = /^(\d{4})-(\d{2})$/.exec(anoMes);
  if (!match) {
    throw new Error('anoMes deve estar no formato YYYY-MM');
  }

  const ano = Number(match[1]);
  const mes = Number(match[2]);
  if (mes < 1 || mes > 12) {
    throw new Error('Mes invalido em anoMes');
  }

  const inicio = new Date(Date.UTC(ano, mes - 1, 1, 0, 0, 0, 0));
  const fim = new Date(Date.UTC(ano, mes, 1, 0, 0, 0, 0));

  return { inicio, fim };
}
