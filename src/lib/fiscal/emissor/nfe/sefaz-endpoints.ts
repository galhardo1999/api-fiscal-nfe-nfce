/**
 * Mapeamento de Web Services da SEFAZ por UF e Ambiente
 */

export interface SefazEndpoints {
  nfeAutorizacao: string;
  nfeRetAutorizacao: string;
}

// Endpoints específicos para São Paulo
const SP_HOMOLOGACAO: SefazEndpoints = {
  nfeAutorizacao: 'https://homologacao.nfe.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx',
  nfeRetAutorizacao: 'https://homologacao.nfe.fazenda.sp.gov.br/ws/nferetautorizacao4.asmx',
};

const SP_PRODUCAO: SefazEndpoints = {
  nfeAutorizacao: 'https://nfe.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx',
  nfeRetAutorizacao: 'https://nfe.fazenda.sp.gov.br/ws/nferetautorizacao4.asmx',
};

// Endpoints específicos para São Paulo - NFC-e
const SP_NFC_HOMOLOGACAO: SefazEndpoints = {
  nfeAutorizacao: 'https://homologacao.nfce.fazenda.sp.gov.br/ws/NFeAutorizacao4.asmx',
  nfeRetAutorizacao: 'https://homologacao.nfce.fazenda.sp.gov.br/ws/NFeRetAutorizacao4.asmx',
};

const SP_NFC_PRODUCAO: SefazEndpoints = {
  nfeAutorizacao: 'https://nfce.fazenda.sp.gov.br/ws/NFeAutorizacao4.asmx',
  nfeRetAutorizacao: 'https://nfce.fazenda.sp.gov.br/ws/NFeRetAutorizacao4.asmx',
};

// Endpoints SVRS (Servidor Virtual RS - atende AM, BA, CE, GO, MA, MS, MT, PA, PB, PE, PI, PR, RJ, RN, RO, RR, RS, SC, SE, TO)
const SVRS_HOMOLOGACAO: SefazEndpoints = {
  nfeAutorizacao: 'https://nfe-homologacao.svrs.rs.gov.br/ws/NfeAutorizacao/NFeAutorizacao4.asmx',
  nfeRetAutorizacao: 'https://nfe-homologacao.svrs.rs.gov.br/ws/NfeRetAutorizacao/NFeRetAutorizacao4.asmx',
};

const SVRS_PRODUCAO: SefazEndpoints = {
  nfeAutorizacao: 'https://nfe.svrs.rs.gov.br/ws/NfeAutorizacao/NFeAutorizacao4.asmx',
  nfeRetAutorizacao: 'https://nfe.svrs.rs.gov.br/ws/NfeRetAutorizacao/NFeRetAutorizacao4.asmx',
};

// Endpoints SVAN (Servidor Virtual AN - atende AC, AL, AP, DF, ES, MG, PB, PI, RJ, RN, RO, RR, RS, SC, SE, TO se SVRS falhar)
const SVAN_HOMOLOGACAO: SefazEndpoints = {
  nfeAutorizacao: 'https://hom.sefazvirtual.fazenda.gov.br/NFeAutorizacao4/NFeAutorizacao4.asmx',
  nfeRetAutorizacao: 'https://hom.sefazvirtual.fazenda.gov.br/NFeRetAutorizacao4/NFeRetAutorizacao4.asmx',
};

const SVAN_PRODUCAO: SefazEndpoints = {
  nfeAutorizacao: 'https://www.sefazvirtual.fazenda.gov.br/NFeAutorizacao4/NFeAutorizacao4.asmx',
  nfeRetAutorizacao: 'https://www.sefazvirtual.fazenda.gov.br/NFeRetAutorizacao4/NFeRetAutorizacao4.asmx',
};

// Mapeamento das UFs para o servidor correto
const UF_TO_SERVER: Record<string, 'SP' | 'SVRS' | 'SVAN'> = {
  'SP': 'SP',
  // Rio Grande do Sul usa SVRS
  'RS': 'SVRS',
  // Paraná usa SVRS
  'PR': 'SVRS',
  // Santa Catarina usa SVRS
  'SC': 'SVRS',
  // Bahia usa SVRS
  'BA': 'SVRS',
  // Minas Gerais usa SVRS ou SVAN dependendo do caso, vamos mapear para SVRS
  'MG': 'SVRS',
  // Outros estados mapeados para SVRS por padrão
  'RJ': 'SVRS',
  'DF': 'SVRS',
  'GO': 'SVRS',
  'MT': 'SVRS',
  'MS': 'SVRS',
  'PE': 'SVRS',
  'CE': 'SVRS',
  'MA': 'SVRS',
  'PA': 'SVRS',
  'AL': 'SVRS',
  'PB': 'SVRS',
  'RN': 'SVRS',
  'SE': 'SVRS',
  'TO': 'SVRS',
  'AM': 'SVRS',
  'PI': 'SVRS',
  'RO': 'SVRS',
  'AC': 'SVRS',
  'AP': 'SVRS',
  'RR': 'SVRS',
};

/**
 * Retorna os endpoints SEFAZ corretos para a UF, o Ambiente e o Modelo informados
 */
export function getSefazEndpoints(uf: string, ambiente: '1' | '2', modelo: string = '55'): SefazEndpoints {
  const ufUpper = uf.toUpperCase();
  const server = UF_TO_SERVER[ufUpper] || 'SVRS'; // Fallback para SVRS se UF não constar
  
  if (ambiente === '1') {
    // Produção
    switch (server) {
      case 'SP':
        return modelo === '65' ? SP_NFC_PRODUCAO : SP_PRODUCAO;
      case 'SVAN':
        return SVAN_PRODUCAO;
      case 'SVRS':
      default:
        return SVRS_PRODUCAO;
    }
  } else {
    // Homologação
    switch (server) {
      case 'SP':
        return modelo === '65' ? SP_NFC_HOMOLOGACAO : SP_HOMOLOGACAO;
      case 'SVAN':
        return SVAN_HOMOLOGACAO;
      case 'SVRS':
      default:
        return SVRS_HOMOLOGACAO;
    }
  }
}

// Mapeamento das capitais para código IBGE correspondente
const CAPITAL_IBGE: Record<string, string> = {
  'AC': '1200401', 'AL': '2704302', 'AP': '1600303', 'AM': '1302603', 'BA': '2927408',
  'CE': '2304400', 'DF': '5300108', 'ES': '3205309', 'GO': '5208707', 'MA': '2111300',
  'MT': '5103403', 'MS': '5002704', 'MG': '3106200', 'PA': '1501402', 'PB': '2507507',
  'PR': '4106902', 'PE': '2611606', 'PI': '2211001', 'RJ': '3304557', 'RN': '2408102',
  'RS': '4314902', 'RO': '1100205', 'RR': '1400100', 'SC': '4205407', 'SP': '3550308',
  'SE': '2800308', 'TO': '1721000'
};

/**
 * Retorna o código IBGE do município. Se não puder identificar, retorna o código da capital do Estado.
 */
export function getIbgeMunicipalityCode(cityName: string, state: string): string {
  const ufUpper = state.toUpperCase();
  const normalizedCity = cityName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Mapeamentos específicos comuns se não forem capitais
  if (normalizedCity.includes('guarulhos') && ufUpper === 'SP') return '3518800';
  if (normalizedCity.includes('campinas') && ufUpper === 'SP') return '3509502';
  if (normalizedCity.includes('santo andre') && ufUpper === 'SP') return '3547809';
  if (normalizedCity.includes('sao bernardo') && ufUpper === 'SP') return '3548708';
  if (normalizedCity.includes('osasco') && ufUpper === 'SP') return '3534401';
  if (normalizedCity.includes('niterói') && ufUpper === 'RJ') return '3303302';
  if (normalizedCity.includes('duque de caxias') && ufUpper === 'RJ') return '3301702';
  if (normalizedCity.includes('londrina') && ufUpper === 'PR') return '4113700';
  if (normalizedCity.includes('joinville') && ufUpper === 'SC') return '4209102';

  // Fallback padrão para a capital do Estado
  return CAPITAL_IBGE[ufUpper] || '3550308'; // Padrão São Paulo se tudo falhar
}
