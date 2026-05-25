import { SefazCodeInfo, SEFAZ_CODES_SHARED } from '../sefaz-codes-shared';

export type { SefazCodeInfo };

const NFCE_CODES: Record<string, SefazCodeInfo> = {
  ...SEFAZ_CODES_SHARED,

  // ── Credenciamento NFC-e ───────────────────────────────────────────────────
  '587': { resumo: 'Emitente não credenciado para NFC-e nesta UF.', dica: 'A empresa não está credenciada para emitir NFC-e (Modelo 65) neste estado. Faça o credenciamento na SEFAZ estadual.' },

  // ── Data de emissão ────────────────────────────────────────────────────────
  '588': { resumo: 'Data de emissão da NFC-e muito atrasada.', dica: 'NFC-e deve ser transmitida em tempo real ou no prazo de contingência. Verifique a data de emissão.' },

  // ── Restrições do Modelo 65 ────────────────────────────────────────────────
  '360': { resumo: 'Tipo de emissão inválido para NFC-e (Modelo 65).', dica: 'Para NFC-e, os tipos de emissão válidos são: 1 (Normal) e 9 (Contingência off-line).' },
  '450': { resumo: 'NFC-e: CST do PIS deve ser 07, 08 ou 99.', dica: 'Para NFC-e (Modelo 65), o CST do PIS deve ser 07 (Operação Isenta), 08 (Sem Incidência) ou 99 (Outras).' },
  '451': { resumo: 'NFC-e: CST do COFINS deve ser 07, 08 ou 99.', dica: 'Para NFC-e (Modelo 65), o CST do COFINS deve ser 07, 08 ou 99.' },
  '452': { resumo: 'NFC-e não permite informações de transportador.', dica: 'Remova os dados de transporte — NFC-e não suporta informações de frete/transportador.' },
  '453': { resumo: 'NFC-e não permite informações de exportação.', dica: 'NFC-e é exclusiva para vendas a consumidor final no mercado interno.' },
  '455': { resumo: 'Forma de pagamento inválida para NFC-e.', dica: 'NFC-e suporta apenas pagamentos com meios eletrônicos (cartão) ou dinheiro. Verifique os meios de pagamento informados.' },
  '456': { resumo: 'Valor dos pagamentos diverge do valor total da NFC-e.', dica: 'A soma dos pagamentos informados deve ser igual ao valor total da NFC-e. Verifique os meios de pagamento.' },
  '459': { resumo: 'Valor de troco informado sem pagamento em dinheiro.', dica: 'O troco só é válido quando há pagamento em dinheiro. Remova o troco ou informe o valor em dinheiro.' },
  '460': { resumo: 'Valor do troco diverge do informado.', dica: 'Recalcule o troco: troco = pagamento em dinheiro - valor total da NFC-e.' },
  '465': { resumo: 'Indicador de presença inválido para NFC-e.', dica: 'Para NFC-e, o indicador de presença deve ser 1 (presencial) ou 4 (entrega domiciliar).' },
  '466': { resumo: 'CFOP de operação interestadual inválido para NFC-e.', dica: 'NFC-e aceita apenas operações internas (CFOP 5XXX). Operações interestaduais não são permitidas.' },
  '469': { resumo: 'Valor total de tributos (vTotTrib) não informado.', dica: 'Para NFC-e, o valor aproximado de tributos por item é obrigatório. Informe o campo valorTributoItem nos itens.' },
  '489': { resumo: 'Rejeição genérica de NFC-e.', dica: 'Verifique todos os dados da NFC-e e tente novamente. Se o problema persistir, entre em contato com o suporte.' },

  // ── QR Code ────────────────────────────────────────────────────────────────
  '461': { resumo: 'QR Code não encontrado na NFC-e.', dica: 'O QR Code é obrigatório para NFC-e. Verifique se o CSC está configurado e tente novamente.' },
  '462': { resumo: 'QR Code em formato inválido.', dica: 'O QR Code gerado está malformado. Verifique as configurações do CSC (Código de Segurança do Contribuinte).' },
  '463': { resumo: 'QR Code com dados divergentes da NFC-e.', dica: 'Os dados do QR Code não conferem com os da NFC-e. Tente emitir novamente.' },
  '464': { resumo: 'QR Code com hash inválido.', dica: 'O token CSC utilizado para gerar o QR Code está incorreto. Verifique o idCSC e o token CSC nas configurações da empresa.' },
  '595': { resumo: 'QR Code com versão inválida.', dica: 'Utilize a versão 2 do QR Code para NFC-e.' },
  '596': { resumo: 'URL do QR Code inválida.', dica: 'A URL do QR Code não corresponde ao ambiente/UF configurado. Verifique as URLs de homologação ou produção da SEFAZ estadual.' },

  // ── CSC (Código de Segurança do Contribuinte) ──────────────────────────────
  '589': { resumo: 'Informação do CSC inconsistente.', dica: 'O Código de Segurança do Contribuinte (CSC) não está correto. Verifique o idCSC e token CSC cadastrados na SEFAZ estadual e nas configurações da empresa.' },
  '590': { resumo: 'Identificador do CSC inválido.', dica: 'O idCSC não existe na base da SEFAZ. Verifique o identificador do CSC nas configurações da empresa — ele deve ser o mesmo cadastrado na SEFAZ estadual.' },
  '591': { resumo: 'Hash do QR Code não corresponde ao calculado.', dica: 'O token CSC está incorreto ou foi digitado errado. Recadastre o CSC nas configurações da empresa.' },
  '592': { resumo: 'Forma de pagamento inválida para NFC-e.', dica: 'Verifique os meios de pagamento informados. NFC-e aceita: dinheiro, cartão de crédito, cartão de débito, cheque, crédito loja, vale alimentação, vale refeição, vale presente, vale combustível e outros.' },
};

export function getSefazCodeInfo(cStat: string): SefazCodeInfo | undefined {
  return NFCE_CODES[String(cStat)];
}

export function buildSefazError(cStat: string, xMotivo: string): {
  error: string;
  sefaz: { cStat: string; xMotivo: string; dica?: string };
} {
  const info = getSefazCodeInfo(cStat);
  return {
    error: info?.resumo ?? xMotivo,
    sefaz: { cStat, xMotivo, dica: info?.dica },
  };
}
