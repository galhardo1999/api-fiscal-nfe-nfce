import { jsPDF } from 'jspdf';

interface DanfeItem {
  codigo: string;
  descricao: string;
  ncm: string;
  cstCsosn: string;
  cfop: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  icmsAliquota?: number;
  icmsValor?: number;
}

interface DanfeData {
  chaveAcesso: string;
  numero: number;
  serie: number;
  dataEmissao: Date;
  naturezaOperacao: string;
  protocolo?: string;
  dataProtocolo?: Date;
  ambiente: '1' | '2';
  
  emitente: {
    razaoSocial: string;
    cnpj: string;
    ie: string;
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    municipio: string;
    uf: string;
    cep: string;
    telefone?: string;
  };
  
  destinatario: {
    nome: string;
    cnpjCpf: string;
    ie?: string;
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    municipio: string;
    uf: string;
    cep: string;
    telefone?: string;
  };
  
  valores: {
    valorProdutos: number;
    valorTotal: number;
    valorIcms?: number;
    valorIpis?: number;
    valorPis?: number;
    valorCofins?: number;
  };
  
  itens: DanfeItem[];
  informacoesAdicionais?: string;
}

/**
 * Utilitário para formatar CNPJ / CPF
 */
function formatDocument(doc: string): string {
  const clean = doc.replace(/\D/g, '');
  if (clean.length === 14) {
    return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  }
  if (clean.length === 11) {
    return clean.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  }
  return doc;
}

/**
 * Utilitário para formatar CEP
 */
function formatCep(cep: string): string {
  const clean = cep.replace(/\D/g, '');
  if (clean.length === 8) {
    return clean.replace(/^(\d{5})(\d{3})$/, "$1-$2");
  }
  return cep;
}

/**
 * Formata chave de acesso com espaços de 4 em 4 caracteres
 */
function formatAccessKey(key: string): string {
  const clean = key.replace(/\D/g, '');
  const chunks = [];
  for (let i = 0; i < clean.length; i += 4) {
    chunks.push(clean.substring(i, i + 4));
  }
  return chunks.join(' ');
}

/**
 * Gera um buffer PDF de DANFE Retrato usando jsPDF
 */
export function generateDanfePdf(data: DanfeData): Buffer {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const width = 210;
  const height = 297;
  const margin = 10;
  const contentWidth = width - (2 * margin);

  // Auxiliares de desenho
  const drawText = (text: string, x: number, y: number, options?: { align?: 'left' | 'center' | 'right', font?: string, size?: number, style?: 'normal' | 'bold' }) => {
    doc.setFont(options?.font || 'Helvetica', options?.style || 'normal');
    doc.setFontSize(options?.size || 7);
    doc.text(String(text ?? ''), x, y, { align: options?.align || 'left' });
  };

  const drawRectWithLabel = (x: number, y: number, w: number, h: number, label: string, value: string = '', options?: { alignValue?: 'left' | 'center' | 'right', valueStyle?: 'normal' | 'bold', valSize?: number }) => {
    doc.setDrawColor(180, 180, 180);
    doc.rect(x, y, w, h);
    drawText(label.toUpperCase(), x + 1.5, y + 3, { size: 5, style: 'bold' });
    if (value) {
      let valX = x + 1.5;
      if (options?.alignValue === 'center') valX = x + (w / 2);
      if (options?.alignValue === 'right') valX = x + w - 1.5;
      drawText(value, valX, y + h - 2, {
        size: options?.valSize || 7.5,
        style: options?.valueStyle || 'normal',
        align: options?.alignValue || 'left'
      });
    }
  };

  // 1. Identificação do Emitente e Cabeçalho Geral
  const drawHeader = (_pageNumber: number, _totalPages: number) => {
    // Retângulo Principal do Emitente (Canto Superior Esquerdo)
    doc.setDrawColor(0, 0, 0);
    doc.rect(margin, margin, 80, 32);
    
    // Nome do Emitente
    drawText(data.emitente.razaoSocial, margin + 2, margin + 6, { size: 10, style: 'bold' });
    
    // Dados de Endereço do Emitente
    const emitAddr1 = `${data.emitente.logradouro}, ${data.emitente.numero}`;
    const emitAddr2 = `${data.emitente.bairro} - ${data.emitente.municipio} - ${data.emitente.uf}`;
    const emitAddr3 = `CEP: ${formatCep(data.emitente.cep)} - Fone: ${data.emitente.telefone || 'N/A'}`;
    drawText(emitAddr1, margin + 2, margin + 14, { size: 7.5 });
    drawText(emitAddr2, margin + 2, margin + 19, { size: 7.5 });
    drawText(emitAddr3, margin + 2, margin + 24, { size: 7.5 });

    // Retângulo Tipo do Documento (Canto Superior Meio)
    doc.rect(margin + 80, margin, 35, 32);
    drawText('DANFE', margin + 97.5, margin + 6, { align: 'center', size: 10, style: 'bold' });
    drawText('Documento Auxiliar da', margin + 97.5, margin + 12, { align: 'center', size: 6 });
    drawText('Nota Fiscal Eletrônica', margin + 97.5, margin + 15, { align: 'center', size: 6 });

    // Indicador Entrada / Saída
    doc.rect(margin + 94, margin + 18, 7, 7);
    drawText('1', margin + 97.5, margin + 23, { align: 'center', size: 8, style: 'bold' }); // 1 = Saída
    drawText('0 - Entrada\n1 - Saída', margin + 104, margin + 21, { size: 5.5 });

    // Número e Série
    const nfeNumStr = String(data.numero).padStart(9, '0').replace(/(\d{3})(\d{3})(\d{3})/, "$1.$2.$3");
    drawText(`Nº. ${nfeNumStr}`, margin + 97.5, margin + 28, { align: 'center', size: 8.5, style: 'bold' });
    drawText(`SÉRIE ${data.serie}`, margin + 97.5, margin + 31, { align: 'center', size: 7.5, style: 'bold' });

    // Retângulo Chave de Acesso e Protocolo (Canto Superior Direito)
    doc.rect(margin + 115, margin, 75, 32);
    drawText('CONTROLE DO FISCO', margin + 116.5, margin + 3, { size: 5, style: 'bold' });
    
    // Desenhar um código de barras simulado (linhas pretas com espaçamento dinâmico)
    let barX = margin + 118;
    doc.setFillColor(0, 0, 0);
    for (let i = 0; i < 35; i++) {
      const w = i % 3 === 0 ? 0.8 : 0.3;
      doc.rect(barX, margin + 5, w, 10, 'F');
      barX += w + (i % 2 === 0 ? 0.4 : 0.8);
    }

    // Chave de Acesso
    drawText('CHAVE DE ACESSO', margin + 116.5, margin + 18, { size: 5.5, style: 'bold' });
    drawText(formatAccessKey(data.chaveAcesso), margin + 116.5, margin + 21, { size: 7, font: 'Courier', style: 'bold' });

    // Consulta de autenticidade
    drawText('Consulta de autenticidade no portal nacional da NF-e', margin + 116.5, margin + 25, { size: 5.5 });
    drawText('www.nfe.fazenda.gov.br/portal ou no site da Sefaz Autorizadora', margin + 116.5, margin + 28, { size: 5.5 });

    if (data.ambiente === '2') {
      // Tarja Homologação
      doc.setTextColor(200, 200, 200);
      drawText('SEM VALOR FISCAL - HOMOLOGAÇÃO', margin + 115 + (75/2), margin + 12, { align: 'center', size: 12, style: 'bold' });
      doc.setTextColor(0, 0, 0);
    }

    // Linha inferior do cabeçalho
    drawRectWithLabel(margin, margin + 32, 115, 8, 'Natureza da Operação', data.naturezaOperacao);
    const protText = data.protocolo 
      ? `${data.protocolo} - ${data.dataProtocolo ? data.dataProtocolo.toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR')}`
      : 'Pendente de Autorização';
    drawRectWithLabel(margin + 115, margin + 32, 75, 8, 'Protocolo de Autorização de Uso', protText);
    
    // Inscrições Estaduais / CNPJ
    drawRectWithLabel(margin, margin + 40, 60, 8, 'Inscrição Estadual', data.emitente.ie);
    drawRectWithLabel(margin + 60, margin + 40, 70, 8, 'Inscrição Estadual do Subst. Trib.', '');
    drawRectWithLabel(margin + 130, margin + 40, 60, 8, 'CNPJ', formatDocument(data.emitente.cnpj), { valueStyle: 'bold' });
  };

  // 2. Destinatário / Remetente
  const drawDestinatario = (yStart: number) => {
    drawText('DESTINATÁRIO / REMETENTE', margin, yStart - 1, { size: 6.5, style: 'bold' });
    
    drawRectWithLabel(margin, yStart, 120, 8, 'Nome / Razão Social', data.destinatario.nome, { valueStyle: 'bold' });
    drawRectWithLabel(margin + 120, yStart, 40, 8, 'CNPJ / CPF', formatDocument(data.destinatario.cnpjCpf), { valueStyle: 'bold' });
    drawRectWithLabel(margin + 160, yStart, 30, 8, 'Data Emissão', data.dataEmissao.toLocaleDateString('pt-BR'));

    drawRectWithLabel(margin, yStart + 8, 100, 8, 'Endereço', `${data.destinatario.logradouro}, ${data.destinatario.numero}${data.destinatario.complemento ? ' - ' + data.destinatario.complemento : ''}`);
    drawRectWithLabel(margin + 100, yStart + 8, 40, 8, 'Bairro / Distrito', data.destinatario.bairro);
    drawRectWithLabel(margin + 140, yStart + 8, 25, 8, 'CEP', formatCep(data.destinatario.cep));
    drawRectWithLabel(margin + 165, yStart + 8, 25, 8, 'Data Saída/Entrada', data.dataEmissao.toLocaleDateString('pt-BR'));

    drawRectWithLabel(margin, yStart + 16, 85, 8, 'Município', data.destinatario.municipio);
    drawRectWithLabel(margin + 85, yStart + 16, 25, 8, 'Fone / Fax', data.destinatario.telefone || '');
    drawRectWithLabel(margin + 110, yStart + 16, 10, 8, 'UF', data.destinatario.uf.toUpperCase(), { alignValue: 'center' });
    drawRectWithLabel(margin + 120, yStart + 16, 40, 8, 'Inscrição Estadual', data.destinatario.ie || 'ISENTO');
    drawRectWithLabel(margin + 160, yStart + 16, 30, 8, 'Hora Saída', '12:00:00');
  };

  // 3. Cálculo de Imposto
  const drawCalculoImposto = (yStart: number) => {
    drawText('CÁLCULO DO IMPOSTO', margin, yStart - 1, { size: 6.5, style: 'bold' });

    const fmt = (v?: number) => v !== undefined ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(v) : '0,00';

    drawRectWithLabel(margin, yStart, 38, 8, 'Base de Cálculo do ICMS', fmt(data.valores.valorProdutos), { alignValue: 'right' });
    drawRectWithLabel(margin + 38, yStart, 38, 8, 'Valor do ICMS', fmt(data.valores.valorIcms || 0), { alignValue: 'right' });
    drawRectWithLabel(margin + 76, yStart, 38, 8, 'Base de Cálculo do ICMS ST', '0,00', { alignValue: 'right' });
    drawRectWithLabel(margin + 114, yStart, 38, 8, 'Valor do ICMS ST', '0,00', { alignValue: 'right' });
    drawRectWithLabel(margin + 152, yStart, 38, 8, 'Valor Total dos Produtos', fmt(data.valores.valorProdutos), { alignValue: 'right', valueStyle: 'bold' });

    drawRectWithLabel(margin, yStart + 8, 38, 8, 'Valor do Frete', '0,00', { alignValue: 'right' });
    drawRectWithLabel(margin + 38, yStart + 8, 38, 8, 'Valor do Seguro', '0,00', { alignValue: 'right' });
    drawRectWithLabel(margin + 76, yStart + 8, 38, 8, 'Desconto', '0,00', { alignValue: 'right' });
    drawRectWithLabel(margin + 114, yStart + 8, 38, 8, 'Outras Despesas', '0,00', { alignValue: 'right' });
    drawRectWithLabel(margin + 152, yStart + 8, 38, 8, 'Valor Total da Nota', fmt(data.valores.valorTotal), { alignValue: 'right', valueStyle: 'bold' });
  };

  // 4. Transportador / Volumes
  const drawTransportador = (yStart: number) => {
    drawText('TRANSPORTADOR / VOLUMES TRANSPORTADOS', margin, yStart - 1, { size: 6.5, style: 'bold' });

    drawRectWithLabel(margin, yStart, 60, 8, 'Razão Social', 'SEM FRETE');
    drawRectWithLabel(margin + 60, yStart, 25, 8, 'Frete por Conta', '9 - Sem Frete');
    drawRectWithLabel(margin + 85, yStart, 20, 8, 'Código ANTT', '');
    drawRectWithLabel(margin + 105, yStart, 25, 8, 'Placa do Veículo', '');
    drawRectWithLabel(margin + 130, yStart, 10, 8, 'UF', '');
    drawRectWithLabel(margin + 140, yStart, 50, 8, 'CNPJ / CPF', '');

    drawRectWithLabel(margin, yStart + 8, 85, 8, 'Endereço', '');
    drawRectWithLabel(margin + 85, yStart + 8, 45, 8, 'Município', '');
    drawRectWithLabel(margin + 130, yStart + 8, 10, 8, 'UF', '');
    drawRectWithLabel(margin + 140, yStart + 8, 50, 8, 'Inscrição Estadual', '');
  };

  // 5. Cabeçalho da Tabela de Itens
  const drawItemsTableHead = (yStart: number) => {
    doc.setDrawColor(180, 180, 180);
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, yStart, contentWidth, 5, 'DF');

    drawText('CÓD. PROD.', margin + 1, yStart + 3.5, { size: 5, style: 'bold' });
    drawText('DESCRIÇÃO DOS PRODUTOS / SERVIÇOS', margin + 21, yStart + 3.5, { size: 5, style: 'bold' });
    drawText('NCM', margin + 86, yStart + 3.5, { size: 5, style: 'bold' });
    drawText('CST', margin + 98, yStart + 3.5, { size: 5, style: 'bold' });
    drawText('CFOP', margin + 107, yStart + 3.5, { size: 5, style: 'bold' });
    drawText('UNID', margin + 117, yStart + 3.5, { size: 5, style: 'bold' });
    drawText('QTD', margin + 127, yStart + 3.5, { size: 5, style: 'bold', align: 'right' });
    drawText('V. UNIT', margin + 143, yStart + 3.5, { size: 5, style: 'bold', align: 'right' });
    drawText('V. TOTAL', margin + 160, yStart + 3.5, { size: 5, style: 'bold', align: 'right' });
    drawText('ALIQ ICMS', margin + 175, yStart + 3.5, { size: 5, style: 'bold', align: 'right' });
    drawText('VAL ICMS', margin + 189, yStart + 3.5, { size: 5, style: 'bold', align: 'right' });
  };

  // 6. Desenhar rodapé e dados adicionais
  const drawAdditionalInfo = () => {
    const yStart = height - margin - 22;
    drawText('DADOS ADICIONAIS', margin, yStart - 1, { size: 6.5, style: 'bold' });
    
    // Caixa de informações complementares
    doc.setDrawColor(180, 180, 180);
    doc.rect(margin, yStart, 120, 20);
    drawText('INFORMAÇÕES COMPLEMENTARES', margin + 2, yStart + 3, { size: 5, style: 'bold' });
    
    const infoText = data.informacoesAdicionais || 'Valores aproximados dos tributos federais, estaduais e municipais.';
    const splitInfo = doc.splitTextToSize(infoText, 116);
    doc.text(splitInfo, margin + 2, yStart + 7);

    // Reservado ao Fisco
    doc.rect(margin + 120, yStart, 70, 20);
    drawText('RESERVADO AO FISCO', margin + 122, yStart + 3, { size: 5, style: 'bold' });
  };

  // Paginação e controle de rendering
  const itemsPerPageFirst = 14;
  const itemsPerPageNext = 28;
  const totalPages = Math.ceil(data.itens.length / itemsPerPageFirst); // Simplificando paginação

  let currentItemIdx = 0;
  
  for (let page = 1; page <= totalPages || page === 1; page++) {
    if (page > 1) {
      doc.addPage();
    }

    // Cabeçalho e seções
    drawHeader(page, totalPages);
    drawDestinatario(margin + 48);
    drawCalculoImposto(margin + 74);
    drawTransportador(margin + 92);
    
    // Tabela de itens começa em Y = 118
    const tableYStart = margin + 108;
    drawItemsTableHead(tableYStart);

    let currentY = tableYStart + 5;
    const limit = page === 1 ? itemsPerPageFirst : itemsPerPageNext;
    
    for (let i = 0; i < limit && currentItemIdx < data.itens.length; i++) {
      const item = data.itens[currentItemIdx];
      
      // Cor de fundo alternada sutil
      if (i % 2 === 1) {
        doc.setFillColor(252, 252, 252);
        doc.rect(margin, currentY, contentWidth, 4.5, 'F');
      }

      // Linhas limites do retângulo da tabela
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, currentY + 4.5, margin + contentWidth, currentY + 4.5);

      // Dados do item
      drawText(item.codigo.substring(0, 10), margin + 1, currentY + 3.2, { size: 6.5 });
      drawText(item.descricao.substring(0, 48), margin + 21, currentY + 3.2, { size: 6.5 });
      drawText(item.ncm.replace(/\D/g, ''), margin + 86, currentY + 3.2, { size: 6.5 });
      drawText(item.cstCsosn, margin + 98, currentY + 3.2, { size: 6.5 });
      drawText(item.cfop, margin + 107, currentY + 3.2, { size: 6.5 });
      drawText(item.unidade, margin + 117, currentY + 3.2, { size: 6.5 });
      
      const fmtNum = (n: number, dec = 2) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: dec }).format(n);
      drawText(fmtNum(item.quantidade, 3), margin + 127, currentY + 3.2, { size: 6.5, align: 'right' });
      drawText(fmtNum(item.valorUnitario), margin + 143, currentY + 3.2, { size: 6.5, align: 'right' });
      drawText(fmtNum(item.valorTotal), margin + 160, currentY + 3.2, { size: 6.5, align: 'right' });
      drawText(fmtNum(item.icmsAliquota || 0) + '%', margin + 175, currentY + 3.2, { size: 6.5, align: 'right' });
      drawText(fmtNum(item.icmsValor || 0), margin + 189, currentY + 3.2, { size: 6.5, align: 'right' });

      currentY += 4.5;
      currentItemIdx++;
    }

    // Fechar bordas verticais da tabela
    doc.setDrawColor(180, 180, 180);
    doc.line(margin, tableYStart, margin, currentY);
    doc.line(margin + contentWidth, tableYStart, margin + contentWidth, currentY);

    // Rodapé de página (apenas dados complementares na última página ou se houver espaço)
    if (currentItemIdx >= data.itens.length) {
      drawAdditionalInfo();
    }

    // Número de página
    drawText(`Folha ${page} / ${totalPages}`, margin + contentWidth, height - margin + 3, { align: 'right', size: 6 });
  }

  // Converter para Buffer e retornar
  const pdfOutput = doc.output('arraybuffer');
  return Buffer.from(pdfOutput);
}
