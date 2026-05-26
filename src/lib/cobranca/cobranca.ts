export const VALOR_MINIMO_MENSAL_CENTAVOS = 6990;

export const LOTES_PRE_PAGOS = [
  { quantidade: 100, valor: 90.00, precoUnitario: 0.90 },
  { quantidade: 500, valor: 375.00, precoUnitario: 0.75 },
  { quantidade: 2000, valor: 1200.00, precoUnitario: 0.60 },
] as const;

export interface ResultadoCobrancaNotas {
  quantidadeNotas: number;
  precoUnitario: number;
  valorNotas: number;
  valorTotal: number;
  faixa: 'LOTE_100' | 'LOTE_500' | 'LOTE_2000' | 'SOB_MEDIDA';
}

export function obterPrecoUnitario(quantidadeNotas: number): number {
  if (quantidadeNotas <= 100) return 0.90;
  if (quantidadeNotas <= 500) return 0.75;
  return 0.60;
}

export function obterFaixaLote(quantidadeNotas: number): ResultadoCobrancaNotas['faixa'] {
  if (quantidadeNotas <= 100) return 'LOTE_100';
  if (quantidadeNotas <= 500) return 'LOTE_500';
  return 'LOTE_2000';
}

export function calcularCobrancaNotas(quantidadeNotas: number): ResultadoCobrancaNotas {
  const precoUnitario = obterPrecoUnitario(quantidadeNotas);
  const valorNotas = quantidadeNotas * precoUnitario;
  
  return {
    quantidadeNotas,
    precoUnitario,
    valorNotas,
    valorTotal: valorNotas,
    faixa: obterFaixaLote(quantidadeNotas),
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
