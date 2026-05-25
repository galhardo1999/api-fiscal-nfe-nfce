import { create } from 'xmlbuilder2';
import { UF_IBGE_CODES } from '../nfe/nfe-key';
import { formatNFeDateTime } from '../nfe/nfe-xml';

export { formatNFeDateTime };

export interface NfcXmlEmitConfig {
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

export interface NfcXmlDestConfig {
  cnpjCpf?: string;
  nome?: string;
  ie?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  codigoMunicipio?: string;
  nomeMunicipio?: string;
  uf?: string;
  cep?: string;
  telefone?: string;
  email?: string;
}

export interface NfcXmlItemConfig {
  numeroItem: number;
  codigo: string;
  descricao: string;
  ncm: string;
  cest?: string;
  cfop: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  valorDesconto?: number;
  valorOutrasDespesas?: number;
  
  // Tributação Simplificada
  icmsOrigem: string;
  icmsCstCsosn: string; // CST (00, 20, 40, 41, 60) ou CSOSN (102, 103, 300, 400, 500)
  icmsAliquota?: number;
  icmsValor?: number;
  
  pisCst?: string;
  pisAliquota?: number;
  pisValor?: number;
  
  cofinsCst?: string;
  cofinsAliquota?: number;
  cofinsValor?: number;

  valorTributoItem?: number; // Lei da Transparência (IBPT)
}

export interface NfcXmlConfig {
  chaveAcesso: string;
  codigoNumerico: string;
  numero: number;
  serie: number;
  naturezaOperacao: string;
  ambiente: '1' | '2'; // 1 = Produção, 2 = Homologação
  dataEmissao: Date;
  tipoEmissao: '1' | '9'; // 1 = Normal, 9 = Contingência Off-line
  
  // Contingência (tpEmis = 9)
  dhContingencia?: Date;
  justificativaContingencia?: string;

  emit: NfcXmlEmitConfig;
  dest?: NfcXmlDestConfig;
  itens: NfcXmlItemConfig[];
  
  valorTotal: number;
  valorProdutos: number;
  valorDesconto?: number;
  valorOutrasDespesas?: number;
  
  pagamentos: Array<{ tPag: string; vPag: number }>;
  informacoesAdicionais?: string;
  presencaComprador?: '1' | '4'; // 1 = Presencial, 4 = Entrega a Domicílio
}

/**
 * Gera o XML bruto da NFC-e (sem assinatura e sem a tag infNFeSupl, que é adicionada pós-assinatura)
 */
export function generateNfcXml(config: NfcXmlConfig): string {
  const cUF = UF_IBGE_CODES[config.emit.uf.toUpperCase()];
  if (!cUF) {
    throw new Error(`UF do emitente inválida: ${config.emit.uf}`);
  }

  const dv = config.chaveAcesso.substring(43, 44);
  const dhEmi = formatNFeDateTime(config.dataEmissao);
  const isSimples = config.emit.crt === '1';

  // 1. Validar presença do comprador e destinatário
  const presenca = config.presencaComprador || '1';
  if (presenca === '4' && (!config.dest || !config.dest.cnpjCpf || !config.dest.logradouro)) {
    throw new Error('Nas operações com entrega em domicílio (delivery - indPres = 4), a identificação e endereço do destinatário são obrigatórios.');
  }

  // 2. Validar pagamentos e troco
  const totalPagamentos = config.pagamentos.reduce((sum, p) => sum + p.vPag, 0);
  const valorNota = config.valorTotal;

  if (totalPagamentos < valorNota - 0.01) {
    throw new Error(`O total dos pagamentos (R$ ${totalPagamentos.toFixed(2)}) é menor que o total da NFC-e (R$ ${valorNota.toFixed(2)}).`);
  }

  const troco = Math.max(0, totalPagamentos - valorNota);

  // 3. Iniciar construção do XML
  const doc = create({ version: '1.0', encoding: 'UTF-8' });
  
  // Wrapper enviNFe (Lote unitário síncrono para NFC-e)
  const xmlRoot = doc.ele('enviNFe', {
    xmlns: 'http://www.portalfiscal.inf.br/nfe',
    versao: '4.00'
  })
    .ele('idLote').txt('1').up()
    .ele('indSinc').txt('1').up() // Sempre 1 (Síncrono)
    .ele('NFe');

  const infNFe = xmlRoot.ele('infNFe', {
    Id: `NFe${config.chaveAcesso}`,
    versao: '4.00'
  });

  // Grupo <ide>
  const ideNode = infNFe.ele('ide')
    .ele('cUF').txt(cUF).up()
    .ele('cNF').txt(config.codigoNumerico).up()
    .ele('natOp').txt(config.naturezaOperacao.substring(0, 60)).up()
    .ele('mod').txt('65').up() // Fixo 65 para NFC-e
    .ele('serie').txt(String(config.serie)).up()
    .ele('nNF').txt(String(config.numero)).up()
    .ele('dhEmi').txt(dhEmi).up()
    .ele('tpNF').txt('1').up() // Sempre 1 (Saída)
    .ele('idDest').txt('1').up() // Sempre 1 (Operação Interna)
    .ele('cMunFG').txt(config.emit.codigoMunicipio).up()
    .ele('tpImp').txt('4').up() // Fixo 4 (DANFE NFC-e)
    .ele('tpEmis').txt(config.tipoEmissao).up()
    .ele('cDV').txt(dv).up()
    .ele('tpAmb').txt(config.ambiente).up()
    .ele('finNFe').txt('1').up() // Sempre 1 (Normal)
    .ele('indFinal').txt('1').up() // Sempre 1 (Consumidor Final)
    .ele('indPres').txt(presenca).up()
    .ele('procEmi').txt('0').up()
    .ele('verProc').txt('AntigravityNFCe_v1.0').up();

  // Se contingência, inserir campos específicos
  if (config.tipoEmissao === '9') {
    const dhCont = formatNFeDateTime(config.dhContingencia || new Date());
    const xJust = (config.justificativaContingencia || 'Falha de comunicacao com a SEFAZ').trim();
    if (xJust.length < 15) {
      throw new Error('A justificativa de contingência (xJust) deve ter pelo menos 15 caracteres.');
    }
    ideNode.ele('dhCont').txt(dhCont).up();
    ideNode.ele('xJust').txt(xJust.substring(0, 255)).up();
  }

  ideNode.up(); // ide

  // Grupo <emit>
  const emitNode = infNFe.ele('emit')
    .ele('CNPJ').txt(config.emit.cnpj.replace(/\D/g, '')).up()
    .ele('xNome').txt(config.emit.razaoSocial.substring(0, 60)).up();

  if (config.emit.nomeFantasia) {
    emitNode.ele('xFant').txt(config.emit.nomeFantasia.substring(0, 60)).up();
  }

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
    .ele('xPais').txt('Brasil').up();

  const cleanEmitPhone = (config.emit.telefone || '').replace(/\D/g, '');
  if (cleanEmitPhone) {
    enderEmit.ele('fone').txt(cleanEmitPhone).up();
  }
  enderEmit.up(); // enderEmit

  emitNode.ele('IE').txt(config.emit.ie.replace(/\D/g, '')).up();
  emitNode.ele('CRT').txt(config.emit.crt).up();
  emitNode.up(); // emit

  // Grupo <dest> (Opcional na NFC-e)
  if (config.dest && (config.dest.cnpjCpf || config.dest.nome)) {
    const destNode = infNFe.ele('dest');
    const cleanDoc = (config.dest.cnpjCpf || '').replace(/\D/g, '');
    
    if (cleanDoc.length === 14) {
      destNode.ele('CNPJ').txt(cleanDoc).up();
    } else if (cleanDoc.length === 11) {
      destNode.ele('CPF').txt(cleanDoc).up();
    }
    
    const nomeDest = config.ambiente === '2' 
      ? 'NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL' 
      : (config.dest.nome || 'CONSUMIDOR PADRAO').substring(0, 60);

    destNode.ele('xNome').txt(nomeDest).up();

    if (config.dest.logradouro) {
      const enderDest = destNode.ele('enderDest')
        .ele('xLgr').txt(config.dest.logradouro.substring(0, 60)).up()
        .ele('nro').txt((config.dest.numero || 'S/N').substring(0, 60)).up();

      if (config.dest.complemento) {
        enderDest.ele('xCpl').txt(config.dest.complemento.substring(0, 60)).up();
      }

      enderDest.ele('xBairro').txt((config.dest.bairro || 'CENTRO').substring(0, 60)).up()
        .ele('cMun').txt(config.dest.codigoMunicipio || config.emit.codigoMunicipio).up()
        .ele('xMun').txt((config.dest.nomeMunicipio || config.emit.nomeMunicipio).substring(0, 60)).up()
        .ele('UF').txt((config.dest.uf || config.emit.uf).toUpperCase()).up();

      if (config.dest.cep) {
        enderDest.ele('CEP').txt(config.dest.cep.replace(/\D/g, '')).up();
      }

      enderDest.ele('cPais').txt('1058').up()
        .ele('xPais').txt('Brasil').up();

      const cleanDestPhone = (config.dest.telefone || '').replace(/\D/g, '');
      if (cleanDestPhone) {
        enderDest.ele('fone').txt(cleanDestPhone).up();
      }
      enderDest.up(); // enderDest
    }

    destNode.ele('indIEDest').txt('9').up(); // Sempre 9 (Não Contribuinte)
    
    if (config.dest.email) {
      destNode.ele('email').txt(config.dest.email.substring(0, 60)).up();
    }
    
    destNode.up(); // dest
  }

  // Grupo <det> (Itens da Nota)
  config.itens.forEach((item) => {
    const det = infNFe.ele('det', { nItem: String(item.numeroItem) });
    
    const prod = det.ele('prod')
      .ele('cProd').txt(item.codigo).up()
      .ele('cEAN').txt('SEM GTIN').up()
      .ele('xProd').txt(item.descricao.substring(0, 120)).up()
      .ele('NCM').txt(item.ncm.replace(/\D/g, '')).up();

    if (item.cest) {
      prod.ele('CEST').txt(item.cest.replace(/\D/g, '')).up();
    }

    prod.ele('CFOP').txt(item.cfop.replace(/\D/g, '')).up()
      .ele('uCom').txt(item.unidade.substring(0, 6)).up()
      .ele('qCom').txt(Number(item.quantidade).toFixed(4)).up()
      .ele('vUnCom').txt(Number(item.valorUnitario).toFixed(4)).up()
      .ele('vProd').txt(Number(item.valorTotal).toFixed(2)).up()
      .ele('cEANTrib').txt('SEM GTIN').up()
      .ele('uTrib').txt(item.unidade.substring(0, 6)).up()
      .ele('qTrib').txt(Number(item.quantidade).toFixed(4)).up()
      .ele('vUnTrib').txt(Number(item.valorUnitario).toFixed(4)).up();

    if (item.valorDesconto && item.valorDesconto > 0) {
      prod.ele('vDesc').txt(Number(item.valorDesconto).toFixed(2)).up();
    }

    if (item.valorOutrasDespesas && item.valorOutrasDespesas > 0) {
      prod.ele('vOutro').txt(Number(item.valorOutrasDespesas).toFixed(2)).up();
    }

    prod.ele('indTot').txt('1').up(); // Sempre 1 (Compõe o valor total)
    prod.up(); // prod

    const impostoNode = det.ele('imposto');
    
    // Valor aproximado de impostos (transparência fiscal)
    const vTotTrib = item.valorTributoItem || (item.icmsValor || 0);
    impostoNode.ele('vTotTrib').txt(vTotTrib.toFixed(2)).up();

    // ICMS da NFC-e (Restrito)
    const icms = impostoNode.ele('ICMS');
    if (isSimples) {
      const csosn = ['102', '103', '300', '400', '500'].includes(item.icmsCstCsosn) ? item.icmsCstCsosn : '102';
      const tagIcms = `ICMSSN${csosn}`;
      const icmsSn = icms.ele(tagIcms)
        .ele('orig').txt(item.icmsOrigem || '0').up()
        .ele('CSOSN').txt(csosn).up();
      icmsSn.up();
    } else {
      const cst = ['00', '20', '40', '41', '60'].includes(item.icmsCstCsosn) ? item.icmsCstCsosn : '00';
      const tagIcms = ['40', '41'].includes(cst) ? 'ICMS40' : `ICMS${cst}`;
      const icmsReg = icms.ele(tagIcms)
        .ele('orig').txt(item.icmsOrigem || '0').up()
        .ele('CST').txt(cst).up();
      
      if (['00', '20'].includes(cst)) {
        icmsReg.ele('modBC').txt('3').up()
               .ele('vBC').txt(Number(item.valorTotal).toFixed(2)).up()
               .ele('pICMS').txt(Number(item.icmsAliquota || 0).toFixed(2)).up()
               .ele('vICMS').txt(Number(item.icmsValor || 0).toFixed(2)).up();
      }
      icmsReg.up();
    }
    icms.up(); // ICMS

    // PIS da NFC-e
    const pis = impostoNode.ele('PIS');
    const pisCst = item.pisCst || (isSimples ? '07' : '01');
    const isPisAliq = ['01', '02'].includes(pisCst);
    const pisTag = isPisAliq ? 'PISAliq' : 'PISOutr';
    
    const pisNode = pis.ele(pisTag)
      .ele('CST').txt(pisCst).up();
    
    if (isPisAliq || (pisTag === 'PISOutr' && item.pisValor !== undefined)) {
      pisNode.ele('vBC').txt(Number(item.valorTotal).toFixed(2)).up()
             .ele('pPIS').txt(Number(item.pisAliquota || 0).toFixed(2)).up()
             .ele('vPIS').txt(Number(item.pisValor || 0).toFixed(2)).up();
    }
    pisNode.up();
    pis.up(); // PIS

    // COFINS da NFC-e
    const cofins = impostoNode.ele('COFINS');
    const cofinsCst = item.cofinsCst || (isSimples ? '07' : '01');
    const isCofinsAliq = ['01', '02'].includes(cofinsCst);
    const cofinsTag = isCofinsAliq ? 'COFINSAliq' : 'COFINSOutr';
    
    const cofinsNode = cofins.ele(cofinsTag)
      .ele('CST').txt(cofinsCst).up();
    
    if (isCofinsAliq || (cofinsTag === 'COFINSOutr' && item.cofinsValor !== undefined)) {
      cofinsNode.ele('vBC').txt(Number(item.valorTotal).toFixed(2)).up()
                .ele('pCOFINS').txt(Number(item.cofinsAliquota || 0).toFixed(2)).up()
                .ele('vCOFINS').txt(Number(item.cofinsValor || 0).toFixed(2)).up();
    }
    cofinsNode.up();
    cofins.up(); // COFINS

    impostoNode.up(); // imposto
    det.up(); // det
  });

  // Grupo <total>
  const totIcmsBc = config.itens.reduce((acc, item) => {
    if (!isSimples && ['00', '20'].includes(item.icmsCstCsosn)) {
      return acc + Number(item.valorTotal);
    }
    return acc;
  }, 0);

  const totIcms = config.itens.reduce((acc, item) => acc + (item.icmsValor || 0), 0);
  const totPis = config.itens.reduce((acc, item) => acc + (item.pisValor || 0), 0);
  const totCofins = config.itens.reduce((acc, item) => acc + (item.cofinsValor || 0), 0);
  const totDesconto = config.valorDesconto || config.itens.reduce((acc, item) => acc + (item.valorDesconto || 0), 0);
  const totOutrasDespesas = config.valorOutrasDespesas || config.itens.reduce((acc, item) => acc + (item.valorOutrasDespesas || 0), 0);
  const totTribTotal = config.itens.reduce((acc, item) => acc + (item.valorTributoItem || 0), 0);

  const icmsTotNode = infNFe.ele('total').ele('ICMSTot')
    .ele('vBC').txt(totIcmsBc.toFixed(2)).up()
    .ele('vICMS').txt(totIcms.toFixed(2)).up()
    .ele('vICMSDeson').txt('0.00').up()
    .ele('vFCP').txt('0.00').up()
    .ele('vBCST').txt('0.00').up()
    .ele('vST').txt('0.00').up()
    .ele('vFCPST').txt('0.00').up()
    .ele('vFCPSTRet').txt('0.00').up()
    .ele('vProd').txt(Number(config.valorProdutos).toFixed(2)).up()
    .ele('vFrete').txt('0.00').up() // NFC-e não possui frete destacado
    .ele('vSeg').txt('0.00').up()
    .ele('vDesc').txt(totDesconto.toFixed(2)).up()
    .ele('vII').txt('0.00').up()
    .ele('vIPI').txt('0.00').up()
    .ele('vIPIDevol').txt('0.00').up()
    .ele('vPIS').txt(totPis.toFixed(2)).up()
    .ele('vCOFINS').txt(totCofins.toFixed(2)).up()
    .ele('vOutro').txt(totOutrasDespesas.toFixed(2)).up()
    .ele('vNF').txt(Number(valorNota).toFixed(2)).up()
    .ele('vTotTrib').txt(totTribTotal.toFixed(2)).up()
  .up().up(); // ICMSTot, total

  // Grupo <transp>
  infNFe.ele('transp')
    .ele('modFrete').txt('9').up() // Sempre 9 (Sem frete)
  .up();

  // Grupo <pag>
  const pagNode = infNFe.ele('pag');
  
  config.pagamentos.forEach((pag) => {
    // Validações de meios de pagamento
    if (pag.tPag === '14') throw new Error('Meio de pagamento Duplicata Mercantil (14) é proibido na NFC-e.');
    if (pag.tPag === '90' && valorNota > 0) throw new Error('Meio de pagamento Sem Pagamento (90) só é aceito se o valor total da nota for zero.');

    pagNode.ele('detPag')
      .ele('tPag').txt(pag.tPag).up()
      .ele('vPag').txt(Number(pag.vPag).toFixed(2)).up()
    .up();
  });

  if (troco > 0) {
    pagNode.ele('vTroco').txt(Number(troco).toFixed(2)).up();
  }

  pagNode.up(); // pag

  // Grupo <infAdic>
  if (config.informacoesAdicionais) {
    infNFe.ele('infAdic')
      .ele('infCpl').txt(config.informacoesAdicionais.substring(0, 5000)).up()
    .up();
  }

  infNFe.up(); // infNFe
  xmlRoot.up(); // enviNFe

  return doc.toString();
}

/**
 * Pós-processa o XML assinado inserindo o bloco infNFeSupl contendo o QR Code v2 e urlChave
 */
export function insertNfceSuplementar(signedXml: string, qrCodeUrl: string, urlChave: string): string {
  // O bloco infNFeSupl deve ser inserido imediatamente após a tag de fechamento </infNFe>
  const infNFeCloseTag = '</infNFe>';
  
  const infNFeSuplXml = `<infNFeSupl>` +
    `<qrCode>${qrCodeUrl}</qrCode>` +
    `<urlChave>${urlChave}</urlChave>` +
    `</infNFeSupl>`;

  if (!signedXml.includes(infNFeCloseTag)) {
    throw new Error('Não foi possível encontrar a tag de fechamento </infNFe> no XML assinado.');
  }

  return signedXml.replace(infNFeCloseTag, `${infNFeCloseTag}${infNFeSuplXml}`);
}
