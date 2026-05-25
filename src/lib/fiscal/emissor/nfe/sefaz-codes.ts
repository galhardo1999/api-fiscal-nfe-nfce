import { SefazCodeInfo, SEFAZ_CODES_SHARED } from '../sefaz-codes-shared';

export type { SefazCodeInfo };

const NFE_CODES: Record<string, SefazCodeInfo> = {
  ...SEFAZ_CODES_SHARED,

  // ── Cancelamento ──────────────────────────────────────────────────────────
  '304': { resumo: 'Cancelamento para NF-e não encontrada na SEFAZ.', dica: 'A chave de acesso desta NF-e não foi localizada na base da SEFAZ. Verifique se a nota foi realmente autorizada.' },
  '308': { resumo: 'NF-e já está cancelada.', dica: 'Esta nota já consta como cancelada na SEFAZ. Não é necessária nova solicitação de cancelamento.' },
  '309': { resumo: 'Cancelamento negado: circulação de mercadoria verificada.', dica: 'A SEFAZ detectou circulação da mercadoria (ex: CT-e vinculado). Não é possível cancelar esta NF-e.' },
  '311': { resumo: 'Cancelamento fora do prazo (mais de 30 dias).', dica: 'O prazo de cancelamento é de 30 dias corridos após a autorização. Emita uma NF-e de devolução.' },
  '329': { resumo: 'Número do protocolo de autorização inválido.', dica: 'O protocolo informado no cancelamento não é válido. Verifique o protocolo original da NF-e.' },
  '330': { resumo: 'Protocolo não corresponde à NF-e.', dica: 'O protocolo utilizado no cancelamento pertence a outra NF-e. Utilize o protocolo correto.' },
  '331': { resumo: 'Cancelamento fora do prazo.', dica: 'O prazo para cancelamento desta NF-e expirou. Emita uma NF-e de devolução para regularizar.' },
  '332': { resumo: 'Protocolo diverge do informado na NF-e.', dica: 'Verifique o número de protocolo de autorização da NF-e antes de cancelar.' },
  '342': { resumo: 'Evento não permitido para NF-e cancelada.', dica: 'A NF-e já está cancelada. Não é possível registrar novos eventos nela.' },
  '344': { resumo: 'NF-e já possui evento do mesmo tipo e sequência.', dica: 'Este evento já foi registrado para esta NF-e. Verifique o número de sequência do evento.' },

  // ── Carta de Correção ──────────────────────────────────────────────────────
  '573': { resumo: 'Carta de Correção não permitida para o campo indicado.', dica: 'Alguns campos não podem ser corrigidos por CC-e, como: valor, CFOP principal, impostos, destinatário e emitente. Para esses casos, cancele a NF-e (se ainda no prazo) e emita uma nova.' },
};

export function getSefazCodeInfo(cStat: string): SefazCodeInfo | undefined {
  return NFE_CODES[String(cStat)];
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
