import { Prisma } from '@prisma/client';

export type Registro = Record<string, unknown>;

export function ehRegistro(valor: unknown): valor is Registro {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

export function lerTexto(registro: Registro, campo: string): string | null {
  const valor = registro[campo];
  if (typeof valor !== 'string') {
    return null;
  }

  const texto = valor.trim();
  return texto.length > 0 ? texto : null;
}

export function lerNumero(registro: Registro, campo: string): number | null {
  const valor = registro[campo];
  if (typeof valor === 'number' && Number.isFinite(valor)) {
    return valor;
  }

  if (typeof valor === 'string' && valor.trim()) {
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : null;
  }

  return null;
}

export function paraJsonPrisma(valor: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(valor)) as Prisma.InputJsonValue;
}

export interface ItemDocumentoNormalizado {
  numeroItem: number;
  codigo: string;
  descricao: string;
  ncm: string | null;
  cfop: string | null;
  unidade: string | null;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  payloadTributos: Prisma.InputJsonValue | null;
}

export interface PayloadDocumentoNormalizado {
  empresaId: string;
  valorTotal: number | null;
  itens: ItemDocumentoNormalizado[];
  payload: Prisma.InputJsonValue;
}

export function validarPayloadDocumento(corpo: unknown): { dados?: PayloadDocumentoNormalizado; erros?: string[] } {
  const erros: string[] = [];

  if (!ehRegistro(corpo)) {
    return { erros: ['Corpo JSON deve ser um objeto.'] };
  }

  const empresaId = lerTexto(corpo, 'empresaId');
  if (!empresaId) {
    erros.push('empresaId e obrigatorio.');
  }

  const itensEntrada = corpo.itens;
  if (!Array.isArray(itensEntrada) || itensEntrada.length === 0) {
    erros.push('itens deve ser uma lista com pelo menos um item.');
  }

  const itens: ItemDocumentoNormalizado[] = [];
  if (Array.isArray(itensEntrada)) {
    itensEntrada.forEach((itemEntrada, indice) => {
      if (!ehRegistro(itemEntrada)) {
        erros.push(`itens[${indice}] deve ser um objeto.`);
        return;
      }

      const codigo = lerTexto(itemEntrada, 'codigo') || `ITEM${indice + 1}`;
      const descricao = lerTexto(itemEntrada, 'descricao');
      const quantidade = lerNumero(itemEntrada, 'quantidade');
      const valorUnitario = lerNumero(itemEntrada, 'valorUnitario');
      const valorTotal = lerNumero(itemEntrada, 'valorTotal');

      if (!descricao) {
        erros.push(`itens[${indice}].descricao e obrigatorio.`);
      }
      if (quantidade === null || quantidade <= 0) {
        erros.push(`itens[${indice}].quantidade deve ser maior que zero.`);
      }
      if (valorUnitario === null || valorUnitario < 0) {
        erros.push(`itens[${indice}].valorUnitario deve ser maior ou igual a zero.`);
      }
      if (valorTotal === null || valorTotal < 0) {
        erros.push(`itens[${indice}].valorTotal deve ser maior ou igual a zero.`);
      }

      if (descricao && quantidade !== null && valorUnitario !== null && valorTotal !== null) {
        const tributos = ehRegistro(itemEntrada.tributos) ? paraJsonPrisma(itemEntrada.tributos) : null;
        itens.push({
          numeroItem: indice + 1,
          codigo,
          descricao,
          ncm: lerTexto(itemEntrada, 'ncm'),
          cfop: lerTexto(itemEntrada, 'cfop'),
          unidade: lerTexto(itemEntrada, 'unidade'),
          quantidade,
          valorUnitario,
          valorTotal,
          payloadTributos: tributos,
        });
      }
    });
  }

  if (erros.length > 0 || !empresaId) {
    return { erros };
  }

  const valorTotalInformado = lerNumero(corpo, 'valorTotal');
  const valorTotal = valorTotalInformado ?? itens.reduce((total, item) => total + item.valorTotal, 0);

  return {
    dados: {
      empresaId,
      valorTotal,
      itens,
      payload: paraJsonPrisma(corpo),
    },
  };
}
