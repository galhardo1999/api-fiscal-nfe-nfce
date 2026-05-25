import { create } from 'xmlbuilder2';
import { UF_IBGE_CODES } from './nfe-key';

export interface NFeXmlEmitConfig {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  ie: string;
  crt: string; // "1" = Simples Nacional, "3" = Regime Normal
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  codigoMunicipio: string;
  nomeMunicipio: string;
  uf: string;
  cep: string;
  telefone?: string;
}

export interface NFeXmlDestConfig {
  cnpjCpf: string;
  nome: string;
  ie?: string;
  isConsumidorFinal: boolean;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  codigoMunicipio: string;
  nomeMunicipio: string;
  uf: string;
  cep: string;
  telefone?: string;
  email?: string;
  cPais?: string;
  xPais?: string;
}

export interface NFeXmlItemDI {
  nDI: string;
  dDI: string; // AAAA-MM-DD
  xLocDesemb: string;
  UFDesemb: string;
  dDesemb: string; // AAAA-MM-DD
  tpViaTransp: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12';
  vAFRMM?: number;
  tpIntermedio: '1' | '2' | '3';
  cnpj?: string;
  ufTerceiro?: string;
  cExportador: string;
  nAdicao: number;
  nSeqAdic: number;
  cFabricante: string;
}

export interface NFeXmlItemConfig {
  numeroItem: number;
  codigo: string;
  descricao: string;
  ncm: string;
  cfop: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  
  // Custos e descontos do item
  valorFrete?: number;
  valorSeguro?: number;
  valorDesconto?: number;
  valorOutrasDespesas?: number;
  
  // Impostos convencionais
  icmsOrigem: string; // "0" = Nacional
  icmsCstCsosn: string; // ex: "102" ou "00"
  icmsAliquota?: number;
  icmsValor?: number;
  
  pisCst?: string; // ex: "07" ou "01"
  pisAliquota?: number;
  pisValor?: number;
  
  cofinsCst?: string;
  cofinsAliquota?: number;
  cofinsValor?: number;

  // IPI
  ipiCst?: string;
  ipiAliquota?: number;
  ipiValor?: number;
  ipiEnquadramento?: string;

  // Imposto de Importação (II)
  iiValor?: number;
  iiBc?: number;
  iiDespesasAduaneiras?: number;
  iiIof?: number;

  // Impostos IBS / CBS (Reforma Tributária)
  ibsAliquota?: number;
  ibsValor?: number;
  cbsAliquota?: number;
  cbsValor?: number;

  // Declaração de Importação (DI)
  di?: NFeXmlItemDI;
}

export interface NFeXmlConfig {
  chaveAcesso: string;
  codigoNumerico: string;
  numero: number;
  serie: number;
  naturezaOperacao: string;
  tipoOperacao: '0' | '1'; // 0 = Entrada, 1 = Saída
  ambiente: '1' | '2'; // 1 = Produção, 2 = Homologação
  dataEmissao: Date;
  modelo?: string; // "55" | "65" | "75" | "76" | "77"
  finalidade?: '1' | '2' | '3' | '4'; // 1=Normal, 2=Complementar, 3=Ajuste, 4=Devolução
  tipoEmissao?: string; // 1=Normal, 9=NFC-e Off-line, 5=SVC, etc.
  chavesReferenciadas?: string[];
  
  emit: NFeXmlEmitConfig;
  dest: NFeXmlDestConfig;
  itens: NFeXmlItemConfig[];
  
  valorTotal: number;
  valorProdutos: number;
  valorFrete?: number;
  valorSeguro?: number;
  valorOutrasDespesas?: number;
  valorDesconto?: number;
  valorIpi?: number;
  valorImportacaoII?: number;
  valorIofImportacao?: number;
  valorIbs?: number;
  valorCbs?: number;
  informacoesAdicionais?: string;
}

/**
 * Converte data para o formato de data-hora da NFe (AAAA-MM-DDThh:mm:ssTZD)
 */
export function formatNFeDateTime(date: Date): string {
  const tzo = -date.getTimezoneOffset();
  const dif = tzo >= 0 ? '+' : '-';
  const pad = (num: number, size = 2) => String(num).padStart(size, '0');
  
  return date.getFullYear() +
    '-' + pad(date.getMonth() + 1) +
    '-' + pad(date.getDate()) +
    'T' + pad(date.getHours()) +
    ':' + pad(date.getMinutes()) +
    ':' + pad(date.getSeconds()) +
    dif + pad(Math.floor(Math.abs(tzo) / 60)) +
    ':' + pad(Math.abs(tzo) % 60);
}

/**
 * Gera a estrutura XML bruta do documento fiscal (sem assinatura)
 */
export function generateNFeXml(config: NFeXmlConfig): string {
  const cUF = UF_IBGE_CODES[config.emit.uf.toUpperCase()];
  if (!cUF) {
    throw new Error(`UF do emitente inválida: ${config.emit.uf}`);
  }

  // Obter dígito verificador da chave
  const dv = config.chaveAcesso.substring(43, 44);
  const modelo = config.modelo || '55';

  // Destinatário CNPJ ou CPF (Para NFAg/NFCe finais de baixo valor pode não ser obrigatório, mas vamos manter validação básica)
  const cleanDestDoc = config.dest.cnpjCpf.replace(/\D/g, '');
  const isCnpj = cleanDestDoc.length === 14;
  const isCpf = cleanDestDoc.length === 11;
  const destDocType = isCnpj ? 'CNPJ' : isCpf ? 'CPF' : '';

  const dhEmi = formatNFeDateTime(config.dataEmissao);

  let xmlRoot: any;
  let infDoc: any;
  let xmlTagPrefix = 'NFe';
  let version = '4.00';
  let ns = 'http://www.portalfiscal.inf.br/nfe';

  if (modelo === '75') {
    xmlTagPrefix = 'NFAg';
    version = '1.00';
    ns = 'http://www.portalfiscal.inf.br/NFAg';
  } else if (modelo === '76') {
    xmlTagPrefix = 'NFGas';
    version = '1.00';
    ns = 'http://www.portalfiscal.inf.br/NFGas';
  }

  const doc = create({ version: '1.0', encoding: 'UTF-8' });

  if (xmlTagPrefix === 'NFe') {
    // Modelos 55, 65, 77 (Padrão NF-e com lote wrapper)
    xmlRoot = doc.ele('enviNFe', {
      xmlns: ns,
      versao: version
    })
      .ele('idLote').txt('1').up()
      .ele('indSinc').txt('1').up() // 1 = Processamento Síncrono
      .ele('NFe');
    
    infDoc = xmlRoot.ele('infNFe', {
      Id: `NFe${config.chaveAcesso}`,
      versao: version
    });
  } else {
    // Modelos 75 (NFAg) ou 76 (NFGas)
    xmlRoot = doc.ele(xmlTagPrefix, {
      xmlns: ns,
      versao: version
    });
    
    infDoc = xmlRoot.ele(`inf${xmlTagPrefix}`, {
      Id: `${xmlTagPrefix}${config.chaveAcesso}`,
      versao: version
    });
  }

  // Identificação
  const finalidadeNfe = config.finalidade || '1';
  const tipoEmisNfe = config.tipoEmissao || '1';
  const ideNode = infDoc.ele('ide')
    .ele('cUF').txt(cUF).up()
    .ele('cNF').txt(config.codigoNumerico).up()
    .ele('natOp').txt(config.naturezaOperacao.substring(0, 60)).up()
    .ele('mod').txt(modelo).up()
    .ele('serie').txt(String(config.serie)).up()
    .ele('nNF').txt(String(config.numero)).up()
    .ele('dhEmi').txt(dhEmi).up()
    .ele('tpNF').txt(config.tipoOperacao).up()
    .ele('idDest').txt(config.dest.uf.toUpperCase() === 'EX' ? '3' : (config.emit.uf.toUpperCase() === config.dest.uf.toUpperCase() ? '1' : '2')).up()
    .ele('cMunFG').txt(config.emit.codigoMunicipio).up()
    .ele('tpImp').txt('1').up()
    .ele('tpEmis').txt(tipoEmisNfe).up()
    .ele('cDV').txt(dv).up()
    .ele('tpAmb').txt(config.ambiente).up()
    .ele('finNFe').txt(finalidadeNfe).up()
    .ele('indFinal').txt(config.dest.isConsumidorFinal ? '1' : '0').up()
    .ele('indPres').txt('1').up()
    .ele('procEmi').txt('0').up()
    .ele('verProc').txt('NextNFe_1.0.0').up();

  // Injetar Notas Referenciadas (NFref) se houver
  if (config.chavesReferenciadas && config.chavesReferenciadas.length > 0) {
    config.chavesReferenciadas.forEach((chave) => {
      ideNode.ele('NFref')
        .ele('refNFe').txt(chave).up()
      .up();
    });
  }

  ideNode.up();

  // Emitente
  const emitNode = infDoc.ele('emit')
    .ele('CNPJ').txt(config.emit.cnpj.replace(/[^A-Za-z0-9]/g, '').toUpperCase()).up()
    .ele('xNome').txt(config.emit.razaoSocial.substring(0, 60)).up()
    .ele('xFant').txt((config.emit.nomeFantasia || config.emit.razaoSocial).substring(0, 60)).up()
    const enderEmit = emitNode.ele('enderEmit')
      .ele('xLgr').txt(config.emit.logradouro.substring(0, 60)).up()
      .ele('nro').txt(config.emit.numero.substring(0, 60)).up();
      
    if (config.emit.complemento) {
      enderEmit.ele('xCpl').txt(config.emit.complemento.substring(0, 60)).up();
    }
    
    enderEmit.ele('xBairro').txt(config.emit.bairro.substring(0, 60)).up()
      .ele('cMun').txt(config.emit.codigoMunicipio).up()
      .ele('xMun').txt(config.emit.nomeMunicipio.substring(0, 60)).up()
      .ele('UF').txt(config.emit.uf.toUpperCase()).up()
      .ele('CEP').txt(config.emit.cep.replace(/\D/g, '')).up()
      .ele('cPais').txt('1058').up()
      .ele('xPais').txt('BRASIL').up();
      
    const cleanEmitPhone = (config.emit.telefone || '').replace(/\D/g, '');
    if (cleanEmitPhone) {
      enderEmit.ele('fone').txt(cleanEmitPhone).up();
    }
    
    enderEmit.up(); // enderEmit
    
    if (config.emit.ie) {
      const cleanIe = config.emit.ie.replace(/[^A-Za-z0-9]/g, '');
      if (cleanIe) {
        emitNode.ele('IE').txt(cleanIe).up();
      }
    }
    
    emitNode.ele('CRT').txt(config.emit.crt).up();
  emitNode.up();

  // Destinatário
  const destNode = infDoc.ele('dest');
  const isForeign = config.dest.uf.toUpperCase() === 'EX';

  if (isForeign) {
    // Para estrangeiro, usar idEstrangeiro (mínimo de 5 e máximo de 20 caracteres) e OMITIR CNPJ/CPF
    const cleanDoc = config.dest.cnpjCpf.replace(/[^A-Za-z0-9]/g, '');
    const idEst = (cleanDoc.length >= 5 && cleanDoc.length <= 20 && !/^0+$/.test(cleanDoc)) 
      ? cleanDoc 
      : 'EXTERIOR';
    destNode.ele('idEstrangeiro').txt(idEst).up();
  } else if (destDocType) {
    destNode.ele(destDocType).txt(cleanDestDoc).up();
  } else {
    destNode.ele('CNPJ').txt('00000000000000').up(); // Fallback se ausente
  }
  destNode.ele('xNome').txt(config.dest.nome.substring(0, 60)).up();
  
  const enderDest = destNode.ele('enderDest')
    .ele('xLgr').txt(config.dest.logradouro.substring(0, 60)).up()
    .ele('nro').txt(config.dest.numero.substring(0, 60)).up();
    
  if (config.dest.complemento) {
    enderDest.ele('xCpl').txt(config.dest.complemento.substring(0, 60)).up();
  }
  
  enderDest.ele('xBairro').txt(config.dest.bairro.substring(0, 60)).up()
    .ele('cMun').txt(config.dest.codigoMunicipio).up()
    .ele('xMun').txt(config.dest.nomeMunicipio.substring(0, 60)).up()
    .ele('UF').txt(config.dest.uf.toUpperCase()).up();

  if (!isForeign && config.dest.cep) {
    enderDest.ele('CEP').txt(config.dest.cep.replace(/\D/g, '')).up();
  }

  const cPais = isForeign ? (config.dest.cPais || '2496') : '1058';
  const xPais = isForeign ? (config.dest.xPais || 'ESTADOS UNIDOS') : 'BRASIL';

  enderDest.ele('cPais').txt(cPais).up()
    .ele('xPais').txt(xPais).up();

  const cleanDestPhone = (config.dest.telefone || '').replace(/\D/g, '');
  if (cleanDestPhone) {
    enderDest.ele('fone').txt(cleanDestPhone).up();
  }
  
  enderDest.up(); // enderDest
  
  destNode.ele('indIEDest').txt(config.dest.ie ? '1' : '9').up();
  
  if (config.dest.ie) {
    const cleanDestIe = config.dest.ie.replace(/[^A-Za-z0-9]/g, '');
    if (cleanDestIe) {
      destNode.ele('IE').txt(cleanDestIe).up();
    }
  }
  
  if (config.dest.email) {
    destNode.ele('email').txt(config.dest.email.substring(0, 60)).up();
  }
  destNode.up();

  // Itens
  config.itens.forEach((item) => {
    const isSimples = config.emit.crt === '1';
    
    const det = infDoc.ele('det', { nItem: String(item.numeroItem) });
    
    const prod = det.ele('prod')
      .ele('cProd').txt(item.codigo).up()
      .ele('cEAN').txt('SEM GTIN').up()
      .ele('xProd').txt(item.descricao.substring(0, 120)).up()
      .ele('NCM').txt(item.ncm.replace(/\D/g, '')).up()
      .ele('CFOP').txt(item.cfop.replace(/\D/g, '')).up()
      .ele('uCom').txt(item.unidade.substring(0, 6)).up()
      .ele('qCom').txt(Number(item.quantidade).toFixed(4)).up()
      .ele('vUnCom').txt(Number(item.valorUnitario).toFixed(4)).up()
      .ele('vProd').txt(Number(item.valorTotal).toFixed(2)).up()
      .ele('cEANTrib').txt('SEM GTIN').up()
      .ele('uTrib').txt(item.unidade.substring(0, 6)).up()
      .ele('qTrib').txt(Number(item.quantidade).toFixed(4)).up()
      .ele('vUnTrib').txt(Number(item.valorUnitario).toFixed(4)).up();

    if (item.valorFrete !== undefined && item.valorFrete > 0) {
      prod.ele('vFrete').txt(Number(item.valorFrete).toFixed(2)).up();
    }
    if (item.valorSeguro !== undefined && item.valorSeguro > 0) {
      prod.ele('vSeg').txt(Number(item.valorSeguro).toFixed(2)).up();
    }
    if (item.valorDesconto !== undefined && item.valorDesconto > 0) {
      prod.ele('vDesc').txt(Number(item.valorDesconto).toFixed(2)).up();
    }
    if (item.valorOutrasDespesas !== undefined && item.valorOutrasDespesas > 0) {
      prod.ele('vOutro').txt(Number(item.valorOutrasDespesas).toFixed(2)).up();
    }

    prod.ele('indTot').txt('1').up();

    // Se for operação de importação (CFOP iniciado por 3) ou se dados da DI forem fornecidos
    if (item.cfop.startsWith('3') || item.di) {
      const di = item.di || {
        nDI: '2600000001',
        dDI: formatNFeDateTime(config.dataEmissao).substring(0, 10),
        xLocDesemb: 'SANTOS',
        UFDesemb: 'SP',
        dDesemb: formatNFeDateTime(config.dataEmissao).substring(0, 10),
        tpViaTransp: '1' as const,
        vAFRMM: 0.00,
        tpIntermedio: '1' as const,
        cExportador: 'EXP12345',
        nAdicao: 1,
        nSeqAdic: 1,
        cFabricante: 'FAB12345',
      };

      const diNode = prod.ele('DI')
        .ele('nDI').txt(di.nDI).up()
        .ele('dDI').txt(di.dDI).up()
        .ele('xLocDesemb').txt(di.xLocDesemb.substring(0, 60)).up()
        .ele('UFDesemb').txt(di.UFDesemb.toUpperCase()).up()
        .ele('dDesemb').txt(di.dDesemb).up()
        .ele('tpViaTransp').txt(di.tpViaTransp).up();

      if (di.tpViaTransp === '1' && di.vAFRMM !== undefined) {
        diNode.ele('vAFRMM').txt(Number(di.vAFRMM).toFixed(2)).up();
      }

      diNode.ele('tpIntermedio').txt(di.tpIntermedio).up();

      if (['2', '3'].includes(di.tpIntermedio)) {
        if (di.cnpj) diNode.ele('CNPJ').txt(di.cnpj.replace(/\D/g, '')).up();
        if (di.ufTerceiro) diNode.ele('UFTerceiro').txt(di.ufTerceiro.toUpperCase()).up();
      }

      diNode.ele('cExportador').txt(di.cExportador.substring(0, 60)).up()
        .ele('adi')
          .ele('nAdicao').txt(String(di.nAdicao)).up()
          .ele('nSeqAdic').txt(String(di.nSeqAdic)).up()
          .ele('cFabricante').txt(di.cFabricante.substring(0, 60)).up()
        .up()
      .up(); // DI
    }

    // Se for NFAg/NFGas, adicionar tags específicas
    if (modelo === '75') {
      prod.ele('volFat').txt(Number(item.quantidade).toFixed(2)).up();
    }

    const impostoNode = det.ele('imposto');

    const usesIbsCbs = modelo === '75' || modelo === '76' || item.ibsValor !== undefined || item.cbsValor !== undefined;

    if (!usesIbsCbs) {
      // Somar ICMS, PIS, COFINS, IPI e II para vTotTrib se aplicável
      const itemVTotTrib = (item.icmsValor || 0) + (item.pisValor || 0) + (item.cofinsValor || 0) + (item.ipiValor || 0) + (item.iiValor || 0);
      impostoNode.ele('vTotTrib').txt(itemVTotTrib.toFixed(2)).up();
    }

    if (usesIbsCbs) {
      // Grupo IBS / CBS (Reforma Tributária)
      const ibsCst = item.icmsCstCsosn || '00';
      const cClassTrib = '01'; // Classificação tributária padrão

      const ibsCbsNode = impostoNode.ele('IBSCBS')
        .ele('CST').txt(ibsCst).up()
        .ele('cClassTrib').txt(cClassTrib).up();

      // gIBSCBS só não é exigido para Simples Nacional/MEI dependendo do CST, mas por padrão geramos
      const gIbsCbs = ibsCbsNode.ele('gIBSCBS')
        .ele('vBC').txt(Number(item.valorTotal).toFixed(2)).up();

      // Split 50/50 IBS entre UF (Estado) e Mun (Município) se fornecido
      const totIbs = Number(item.ibsValor || 0);
      const aliqIbs = Number(item.ibsAliquota || 0);
      
      const ibsUfVal = totIbs / 2;
      const ibsUfAliq = aliqIbs / 2;
      const ibsMunVal = totIbs / 2;
      const ibsMunAliq = aliqIbs / 2;

      gIbsCbs.ele('gIBSUF')
        .ele('pIBSUF').txt(ibsUfAliq.toFixed(2)).up()
        .ele('vIBSUF').txt(ibsUfVal.toFixed(2)).up()
      .up();

      gIbsCbs.ele('gIBSMun')
        .ele('pIBSMun').txt(ibsMunAliq.toFixed(2)).up()
        .ele('vIBSMun').txt(ibsMunVal.toFixed(2)).up()
      .up();

      gIbsCbs.ele('gCBS')
        .ele('pCBS').txt(Number(item.cbsAliquota || 0).toFixed(2)).up()
        .ele('vCBS').txt(Number(item.cbsValor || 0).toFixed(2)).up()
      .up();

      gIbsCbs.up(); // gIBSCBS
      ibsCbsNode.up(); // IBSCBS
    } else {
      // ICMS Convencional
      const icms = impostoNode.ele('ICMS');
      if (isSimples) {
        const csosn = item.icmsCstCsosn;
        const tagIcms = `ICMSSN${csosn}`;
        const icmsSn = icms.ele(tagIcms)
          .ele('orig').txt(item.icmsOrigem).up()
          .ele('CSOSN').txt(csosn).up();
        
        if (['900'].includes(csosn)) {
          icmsSn.ele('pICMS').txt(Number(item.icmsAliquota || 0).toFixed(2)).up()
                .ele('vICMS').txt(Number(item.icmsValor || 0).toFixed(2)).up();
        }
        icmsSn.up();
      } else {
        const cst = item.icmsCstCsosn.padStart(2, '0');
        const tagIcms = ['40', '41', '50'].includes(cst) ? 'ICMS40' : `ICMS${cst}`;
        const icmsReg = icms.ele(tagIcms)
          .ele('orig').txt(item.icmsOrigem).up()
          .ele('CST').txt(cst).up();
        
        if (['00', '10', '20', '70', '90'].includes(cst)) {
          icmsReg.ele('modBC').txt('3').up()
                 .ele('vBC').txt(Number(item.valorTotal).toFixed(2)).up()
                 .ele('pICMS').txt(Number(item.icmsAliquota || 0).toFixed(2)).up()
                 .ele('vICMS').txt(Number(item.icmsValor || 0).toFixed(2)).up();
        }
        icmsReg.up();
      }
      icms.up();

      // IPI (Obrigatório para importação CFOP 3xxx ou se informado)
      if (item.ipiCst !== undefined || item.ipiValor !== undefined || item.cfop.startsWith('3')) {
        const ipiCst = item.ipiCst || (item.cfop.startsWith('3') ? '53' : '99');
        const cEnq = item.ipiEnquadramento || '999';
        const ipiNode = impostoNode.ele('IPI')
          .ele('cEnq').txt(cEnq).up();
          
        const isTributado = ['00', '49', '50', '99'].includes(ipiCst) || (item.ipiValor && item.ipiValor > 0);
        if (isTributado) {
          ipiNode.ele('IPITrib')
            .ele('CST').txt(ipiCst).up()
            .ele('vBC').txt(Number(item.valorTotal).toFixed(2)).up()
            .ele('pIPI').txt(Number(item.ipiAliquota || 0).toFixed(2)).up()
            .ele('vIPI').txt(Number(item.ipiValor || 0).toFixed(2)).up()
          .up();
        } else {
          ipiNode.ele('IPINT')
            .ele('CST').txt(ipiCst).up()
          .up();
        }
        ipiNode.up();
      }

      // II (Imposto de Importação)
      if (item.iiValor !== undefined || item.cfop.startsWith('3')) {
        const vBC = item.iiBc !== undefined ? item.iiBc : item.valorTotal;
        const vDespAdu = item.iiDespesasAduaneiras !== undefined ? item.iiDespesasAduaneiras : 0;
        const vII = item.iiValor !== undefined ? item.iiValor : 0;
        const vIOF = item.iiIof !== undefined ? item.iiIof : 0;
        
        impostoNode.ele('II')
          .ele('vBC').txt(vBC.toFixed(2)).up()
          .ele('vDespAdu').txt(vDespAdu.toFixed(2)).up()
          .ele('vII').txt(vII.toFixed(2)).up()
          .ele('vIOF').txt(vIOF.toFixed(2)).up()
        .up();
      }

      // PIS
      const pis = impostoNode.ele('PIS');
      const pisCst = item.pisCst || (isSimples ? '07' : '01');
      const isPisAliq = ['01', '02'].includes(pisCst);
      const isPisOutr = !isPisAliq;
      const pisTag = isPisAliq ? 'PISAliq' : 'PISOutr';
      
      const pisNode = pis.ele(pisTag)
        .ele('CST').txt(pisCst).up();
      
      if (isPisAliq || (isPisOutr && item.pisValor !== undefined)) {
        pisNode.ele('vBC').txt(Number(item.valorTotal).toFixed(2)).up()
               .ele('pPIS').txt(Number(item.pisAliquota || 0).toFixed(2)).up()
               .ele('vPIS').txt(Number(item.pisValor || 0).toFixed(2)).up();
      }
      pisNode.up();
      pis.up();

      // COFINS
      const cofins = impostoNode.ele('COFINS');
      const cofinsCst = item.cofinsCst || (isSimples ? '07' : '01');
      const isCofinsAliq = ['01', '02'].includes(cofinsCst);
      const isCofinsOutr = !isCofinsAliq;
      const cofinsTag = isCofinsAliq ? 'COFINSAliq' : 'COFINSOutr';
      
      const cofinsNode = cofins.ele(cofinsTag)
        .ele('CST').txt(cofinsCst).up();
      
      if (isCofinsAliq || (isCofinsOutr && item.cofinsValor !== undefined)) {
        cofinsNode.ele('vBC').txt(Number(item.valorTotal).toFixed(2)).up()
                  .ele('pCOFINS').txt(Number(item.cofinsAliquota || 0).toFixed(2)).up()
                  .ele('vCOFINS').txt(Number(item.cofinsValor || 0).toFixed(2)).up();
      }
      cofinsNode.up();
      cofins.up();
    }

    // DIFAL Interestadual Consumidor Final Não Contribuinte
    const isInterestadual = config.emit.uf.toUpperCase() !== config.dest.uf.toUpperCase() && config.dest.uf.toUpperCase() !== 'EX';
    const isDestNaoContribuinte = !config.dest.ie || config.dest.ie.trim() === '';
    const isDifalRequired = config.dest.isConsumidorFinal && isInterestadual && isDestNaoContribuinte;

    if (isDifalRequired && !usesIbsCbs) {
      // Alíquotas padrão para teste de homologação do DIFAL
      const pICMSUFDest = 18.00; // Alíquota interna padrão na UF de destino
      
      // Alíquota interestadual (Sul/Sudeste para Norte/Nordeste/Centro-Oeste = 7%, nos demais casos = 12%)
      const origemSulSudeste = ['SP', 'RJ', 'MG', 'ES', 'PR', 'SC', 'RS'].includes(config.emit.uf.toUpperCase());
      const destinoNorteNordesteCoES = ['AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'PA', 'PB', 'PE', 'PI', 'RN', 'RO', 'RR', 'SE', 'TO'].includes(config.dest.uf.toUpperCase());
      const pICMSInter = (origemSulSudeste && destinoNorteNordesteCoES) ? 7.00 : 12.00;
      
      const difalRate = Math.max(0, pICMSUFDest - pICMSInter);
      const vBCUFDest = Number(item.valorTotal);
      const vICMSUFDest = (vBCUFDest * difalRate) / 100;
      
      impostoNode.ele('ICMSUFDest')
        .ele('vBCUFDest').txt(vBCUFDest.toFixed(2)).up()
        .ele('vBCFCPUFDest').txt(vBCUFDest.toFixed(2)).up()
        .ele('pFCPUFDest').txt('0.00').up()
        .ele('pICMSUFDest').txt(pICMSUFDest.toFixed(2)).up()
        .ele('pICMSInter').txt(pICMSInter.toFixed(2)).up()
        .ele('pICMSInterPart').txt('100.00').up()
        .ele('vFCPUFDest').txt('0.00').up()
        .ele('vICMSUFDest').txt(vICMSUFDest.toFixed(2)).up()
        .ele('vICMSUFRemet').txt('0.00').up()
      .up();
    }

    impostoNode.up(); // imposto
    det.up(); // det
  });

  // Totais
  const usesIbsCbsTot = modelo === '75' || modelo === '76' || config.valorIbs !== undefined || config.valorCbs !== undefined;

  if (usesIbsCbsTot) {
    const totIbs = config.itens.reduce((acc, item) => acc + (item.ibsValor || 0), 0);
    const totCbs = config.itens.reduce((acc, item) => acc + (item.cbsValor || 0), 0);
    
    const totIbsUf = totIbs / 2;
    const totIbsMun = totIbs / 2;

    const ibsCbsTot = infDoc.ele('total').ele('IBSCBSTot')
      .ele('vBCIBSCBS').txt(Number(config.valorProdutos).toFixed(2)).up();

    ibsCbsTot.ele('gIBS')
      .ele('gIBSUF')
        .ele('vDif').txt('0.00').up()
        .ele('vDevTrib').txt('0.00').up()
        .ele('vIBSUF').txt(totIbsUf.toFixed(2)).up()
      .up()
      .ele('gIBSMun')
        .ele('vDif').txt('0.00').up()
        .ele('vDevTrib').txt('0.00').up()
        .ele('vIBSMun').txt(totIbsMun.toFixed(2)).up()
      .up()
      .ele('vIBS').txt(totIbs.toFixed(2)).up()
    .up();

    ibsCbsTot.ele('gCBS')
      .ele('vDif').txt('0.00').up()
      .ele('vDevTrib').txt('0.00').up()
      .ele('vCBS').txt(totCbs.toFixed(2)).up()
    .up();

    ibsCbsTot.ele('vTotDFe').txt(Number(config.valorTotal).toFixed(2)).up();
    ibsCbsTot.up().up(); // total
  } else {
    const totIcmsBc = config.itens.reduce((acc, item) => {
      const isSimples = config.emit.crt === '1';
      const cst = item.icmsCstCsosn.padStart(2, '0');
      if (!isSimples && ['00', '10', '20', '70', '90'].includes(cst)) {
        return acc + Number(item.valorTotal);
      }
      if (isSimples && cst === '900' && item.icmsValor !== undefined && item.icmsValor > 0) {
        return acc + Number(item.valorTotal);
      }
      return acc;
    }, 0);

    const totIcms = config.itens.reduce((acc, item) => acc + (item.icmsValor || 0), 0);
    const totPis = config.itens.reduce((acc, item) => acc + (item.pisValor || 0), 0);
    const totCofins = config.itens.reduce((acc, item) => acc + (item.cofinsValor || 0), 0);

    // Calcular somas adicionais para IPI, II e DIFAL
    const totIpi = config.itens.reduce((acc, item) => acc + (item.ipiValor || 0), 0);
    const totII = config.itens.reduce((acc, item) => acc + (item.iiValor || 0), 0);
    
    // Calcular DIFAL total
    let totDifal = 0;
    const isInterestadual = config.emit.uf.toUpperCase() !== config.dest.uf.toUpperCase() && config.dest.uf.toUpperCase() !== 'EX';
    const isDestNaoContribuinte = !config.dest.ie || config.dest.ie.trim() === '';
    const isDifalRequired = config.dest.isConsumidorFinal && isInterestadual && isDestNaoContribuinte;
    
    if (isDifalRequired) {
      config.itens.forEach((item) => {
        const pICMSUFDest = 18.00;
        const origemSulSudeste = ['SP', 'RJ', 'MG', 'ES', 'PR', 'SC', 'RS'].includes(config.emit.uf.toUpperCase());
        const destinoNorteNordesteCoES = ['AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'PA', 'PB', 'PE', 'PI', 'RN', 'RO', 'RR', 'SE', 'TO'].includes(config.dest.uf.toUpperCase());
        const pICMSInter = (origemSulSudeste && destinoNorteNordesteCoES) ? 7.00 : 12.00;
        const difalRate = Math.max(0, pICMSUFDest - pICMSInter);
        totDifal += (Number(item.valorTotal) * difalRate) / 100;
      });
    }

    const valorFrete = config.valorFrete || 0;
    const valorSeguro = config.valorSeguro || 0;
    const valorDesconto = config.valorDesconto || 0;
    const valorOutrasDespesas = config.valorOutrasDespesas || 0;

    const icmsTotNode = infDoc.ele('total').ele('ICMSTot')
      .ele('vBC').txt(totIcmsBc.toFixed(2)).up()
      .ele('vICMS').txt(totIcms.toFixed(2)).up()
      .ele('vICMSDeson').txt('0.00').up();

    // Se houver DIFAL, adicionar as tags na ordem exata de ICMSTot
    if (isDifalRequired) {
      icmsTotNode.ele('vFCPUFDest').txt('0.00').up()
                 .ele('vICMSUFDest').txt(totDifal.toFixed(2)).up()
                 .ele('vICMSUFRemet').txt('0.00').up();
    }

    icmsTotNode.ele('vFCP').txt('0.00').up()
      .ele('vBCST').txt('0.00').up()
      .ele('vST').txt('0.00').up()
      .ele('vFCPST').txt('0.00').up()
      .ele('vFCPSTRet').txt('0.00').up()
      .ele('vProd').txt(Number(config.valorProdutos).toFixed(2)).up()
      .ele('vFrete').txt(valorFrete.toFixed(2)).up()
      .ele('vSeg').txt(valorSeguro.toFixed(2)).up()
      .ele('vDesc').txt(valorDesconto.toFixed(2)).up()
      .ele('vII').txt(totII.toFixed(2)).up()
      .ele('vIPI').txt(totIpi.toFixed(2)).up()
      .ele('vIPIDevol').txt('0.00').up()
      .ele('vPIS').txt(totPis.toFixed(2)).up()
      .ele('vCOFINS').txt(totCofins.toFixed(2)).up()
      .ele('vOutro').txt(valorOutrasDespesas.toFixed(2)).up()
      .ele('vNF').txt(Number(config.valorTotal).toFixed(2)).up()
      .ele('vTotTrib').txt((totIcms + totPis + totCofins + totIpi + totII).toFixed(2)).up()
    .up().up();
  }

  // Transportador (opcional para concessionárias de água/gás)
  if (modelo !== '75' && modelo !== '76') {
    infDoc.ele('transp')
      .ele('modFrete').txt('9').up()
    .up();
  }

  // Pagamento
  const isSemPagamento = finalidadeNfe === '3' || finalidadeNfe === '4' || config.valorTotal === 0;
  const tPag = isSemPagamento ? '90' : '15';
  const vPag = isSemPagamento ? 0.00 : config.valorTotal;

  infDoc.ele('pag')
    .ele('detPag')
      .ele('tPag').txt(tPag).up()
      .ele('vPag').txt(Number(vPag).toFixed(2)).up()
    .up()
  .up();

  // Informações adicionais
  if (config.informacoesAdicionais) {
    infDoc.ele('infAdic')
      .ele('infCpl').txt(config.informacoesAdicionais.substring(0, 5000)).up()
    .up();
  }

  // NFC-e Supplement (QR Code) se modelo for 65
  if (modelo === '65') {
    const qrCodeUrl = `https://homologacao.sefaz.sp.gov.br/nfce/qrcode?chNFe=${config.chaveAcesso}&tpAmb=${config.ambiente}`;
    const urlChave = `https://homologacao.sefaz.sp.gov.br/nfce/consulta`;
    
    xmlRoot.ele('infNFeSupl')
      .ele('qrCode').txt(qrCodeUrl).up()
      .ele('urlChave').txt(urlChave).up()
    .up();
  }

  // Fechar infNFe/infNFAg/infNFGas e NFe/NFAg/NFGas
  if (xmlTagPrefix === 'NFe') {
    infDoc.up().up(); // infNFe, NFe (enviNFe permanece como root)
  } else {
    infDoc.up(); // infNFAg/infNFGas, NFAg/NFGas permanece como root
  }

  return doc.toString();
}
