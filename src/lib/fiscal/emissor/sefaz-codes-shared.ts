export interface SefazCodeInfo {
  resumo: string;
  dica?: string;
}

export const SEFAZ_CODES_SHARED: Record<string, SefazCodeInfo> = {
  // ── Sucesso / Informativo ──────────────────────────────────────────────────
  '100': { resumo: 'Autorizado o uso da NF-e.' },
  '101': { resumo: 'Cancelamento de NF-e homologado.' },
  '102': { resumo: 'Inutilização de número homologada.' },
  '103': { resumo: 'Lote recebido com sucesso.' },
  '104': { resumo: 'Lote processado.' },
  '105': { resumo: 'Lote em processamento.' },
  '107': { resumo: 'Serviço em operação.' },
  '108': { resumo: 'Serviço paralisado momentaneamente.', dica: 'A SEFAZ está temporariamente indisponível. Aguarde alguns minutos e tente novamente.' },
  '109': { resumo: 'Serviço paralisado sem previsão.', dica: 'A SEFAZ está fora do ar sem previsão de retorno. Utilize o modo de contingência.' },
  '110': { resumo: 'Uso Denegado.' },
  '124': { resumo: 'EPEC autorizado.' },
  '128': { resumo: 'Lote de eventos processado.' },
  '135': { resumo: 'Evento registrado e vinculado à NF-e.' },
  '136': { resumo: 'Evento registrado, mas não vinculado à NF-e.' },
  '150': { resumo: 'Autorizado o uso da NF-e fora de prazo.', dica: 'A NF-e foi autorizada, mas com atraso na transmissão. Guarde o protocolo.' },
  '155': { resumo: 'Cancelamento fora do prazo homologado.', dica: 'O prazo para cancelamento expirou (geralmente 24h após autorização). A NF-e permanece válida — emita uma carta de correção se necessário.' },

  // ── Situação na base SEFAZ ────────────────────────────────────────────────
  '204': { resumo: 'Duplicidade de NF-e detectada.', dica: 'Uma NF-e com esta chave de acesso já está autorizada na SEFAZ. O número sequencial foi incrementado — tente emitir novamente.' },
  '205': { resumo: 'NF-e denegada na base de dados da SEFAZ.', dica: 'Esta NF-e foi denegada. Verifique a situação fiscal da empresa emissora junto à SEFAZ estadual.' },
  '206': { resumo: 'Uso da NF-e já denegado.', dica: 'Esta NF-e está com uso denegado na SEFAZ. Emita uma nova nota com número diferente.' },
  '207': { resumo: 'NF-e não está autorizada nem denegada na SEFAZ.' },
  '208': { resumo: 'NF-e já inutilizada na base de dados da SEFAZ.', dica: 'Este número foi inutilizado. O sistema avançará automaticamente para o próximo número disponível.' },
  '209': { resumo: 'NF-e cancelada na base de dados da SEFAZ.', dica: 'Esta nota já consta como cancelada na SEFAZ.' },
  '210': { resumo: 'NF-e não existe na base de dados da SEFAZ.' },
  '213': { resumo: 'NF-e não autorizada. Cancelamento não efetuado.', dica: 'Somente notas com status Autorizado podem ser canceladas.' },
  '214': { resumo: 'NF-e não pode ser cancelada (prazo expirado).', dica: 'O prazo de cancelamento (24h) foi ultrapassado. Considere emitir uma NF-e de devolução.' },
  '215': { resumo: 'NF-e já cancelada.', dica: 'Esta nota já consta como cancelada na SEFAZ.' },
  '262': { resumo: 'NF-e já existia na base de dados da SEFAZ.', dica: 'Este número de NF-e já foi enviado anteriormente. Verifique se a nota já está autorizada antes de tentar novamente.' },

  // ── Certificado digital ────────────────────────────────────────────────────
  '250': { resumo: 'Certificado digital revogado.', dica: 'O certificado digital foi revogado. Adquira um novo certificado A1 junto a uma Autoridade Certificadora credenciada ICP-Brasil.' },
  '251': { resumo: 'Certificado digital vencido.', dica: 'O certificado digital está expirado. Renove ou adquira um novo certificado A1.' },
  '252': { resumo: 'Certificado em desacordo com o exigido.', dica: 'O tipo ou tamanho do certificado não atende às exigências da SEFAZ. Use um certificado A1 RSA 2048-bit.' },
  '253': { resumo: 'Certificado não é de Pessoa Jurídica.', dica: 'Use um certificado e-CNPJ (Pessoa Jurídica), não um certificado pessoal e-CPF.' },
  '254': { resumo: 'CNPJ do certificado inválido.', dica: 'O CNPJ embutido no certificado digital está inválido ou difere do CNPJ do emitente.' },
  '255': { resumo: 'Certificado não é do tipo A1 ou A3.', dica: 'A SEFAZ exige certificados ICP-Brasil tipo A1 ou A3. Verifique com a Autoridade Certificadora.' },
  '256': { resumo: 'Certificado sem LCR válida.', dica: 'Não foi possível verificar a Lista de Certificados Revogados (LCR). Verifique a conexão de rede.' },

  // ── Assinatura digital ─────────────────────────────────────────────────────
  '258': { resumo: 'Ausência de assinatura digital para o grupo infNFe.', dica: 'O XML não está devidamente assinado. Verifique o processo de assinatura com o certificado digital.' },
  '259': { resumo: 'Assinatura digital diverge do calculado.', dica: 'A assinatura digital do XML está incorreta. Isso pode indicar que o XML foi alterado após a assinatura. Tente emitir novamente.' },
  '260': { resumo: 'Assinatura digital inválida.', dica: 'Os dados de autenticação da assinatura estão incorretos. Verifique o certificado utilizado.' },
  '265': { resumo: 'Falha no reconhecimento da autoria ou integridade.', dica: 'O XML pode ter sido corrompido durante o envio. Tente novamente.' },
  '321': { resumo: 'Erro ao validar a assinatura digital.', dica: 'Reprocesse a NF-e para regenerar a assinatura digital.' },

  // ── Irregularidade fiscal ──────────────────────────────────────────────────
  '203': { resumo: 'Emissor não habilitado para emissão de NF-e.', dica: 'O CNPJ do emitente não está ativo para emissão de NF-e. Verifique o credenciamento na SEFAZ estadual.' },
  '301': { resumo: 'Irregularidade fiscal do emitente.', dica: 'Há pendências fiscais em aberto para o CNPJ emitente junto à SEFAZ estadual. Regularize a situação cadastral da empresa.' },
  '302': { resumo: 'Irregularidade fiscal do destinatário.', dica: 'O destinatário possui pendências fiscais. Verifique a situação cadastral do destinatário.' },
  '303': { resumo: 'Destinatário não habilitado a operar na UF.', dica: 'O destinatário não está cadastrado para operar neste estado. Verifique os dados de inscrição estadual.' },
  '325': { resumo: 'Contribuinte não habilitado.', dica: 'O emitente não está habilitado para emissão de NF-e. Verifique o credenciamento da empresa na SEFAZ estadual.' },
  '351': { resumo: 'Emitente não habilitado.', dica: 'O CNPJ do emitente não está credenciado para emissão de NF-e. Cadastre a empresa na SEFAZ estadual.' },

  // ── Dados do emitente ──────────────────────────────────────────────────────
  '223': { resumo: 'CNPJ base do emitente difere do certificado digital.', dica: 'O CNPJ da empresa e o CNPJ embutido no certificado digital não coincidem. Use o certificado correto para este CNPJ.' },
  '226': { resumo: 'Código da UF do emitente diverge da UF autorizadora.', dica: 'O estado configurado para a empresa não corresponde ao servidor SEFAZ utilizado. Corrija a UF nas configurações.' },
  '229': { resumo: 'IE do emitente não informada.', dica: 'A Inscrição Estadual do emitente é obrigatória. Informe a IE nas configurações da empresa.' },
  '230': { resumo: 'IE do emitente não cadastrada.', dica: 'A Inscrição Estadual informada não está cadastrada na SEFAZ. Verifique a IE da empresa.' },
  '231': { resumo: 'IE do emitente não vinculada ao CNPJ.', dica: 'A Inscrição Estadual não está vinculada ao CNPJ informado. Verifique junto à SEFAZ estadual.' },
  '232': { resumo: 'IE inválida para a UF do emitente.', dica: 'O formato da Inscrição Estadual não é válido para este estado. Corrija a IE nas configurações da empresa.' },
  '237': { resumo: 'CPF do emitente inválido.', dica: 'Verifique o CPF informado para o emitente.' },
  '239': { resumo: 'CNPJ do emitente não cadastrado.', dica: 'O CNPJ não está cadastrado na base da SEFAZ. Verifique o credenciamento da empresa.' },
  '349': { resumo: 'UF do emitente diverge da UF autorizadora.', dica: 'O estado do emitente não corresponde ao servidor SEFAZ utilizado. Verifique as configurações de UF da empresa.' },
  '354': { resumo: 'Limite de emissão excedido.', dica: 'O emitente atingiu o limite de NF-e permitido. Verifique junto à SEFAZ estadual.' },

  // ── Dados do destinatário ──────────────────────────────────────────────────
  '240': { resumo: 'CNPJ do destinatário não cadastrado.', dica: 'O CNPJ do destinatário não consta na base da Receita Federal. Confirme o CNPJ informado.' },
  '241': { resumo: 'CNPJ/CPF do destinatário duplicado no lote.', dica: 'Um mesmo CPF ou CNPJ de destinatário consta em mais de uma NF-e do mesmo lote.' },
  '278': { resumo: 'Consumidor final não identificado.', dica: 'Informe o CPF do consumidor ou marque como consumidor anônimo (permitido apenas em operações internas abaixo do limite estadual).' },

  // ── Data e prazo ───────────────────────────────────────────────────────────
  '212': { resumo: 'Data de emissão posterior ao horário de recebimento.', dica: 'A data/hora da NF-e está no futuro. Verifique o relógio do servidor e a data de emissão informada.' },
  '224': { resumo: 'NF-e com data de emissão muito antiga.', dica: 'Não é possível emitir NF-e com data retroativa além do prazo permitido (geralmente 30 dias). Corrija a data de emissão.' },
  '228': { resumo: 'Data de saída anterior à data de emissão.', dica: 'A data de saída/entrada não pode ser anterior à data de emissão da NF-e. Corrija as datas.' },
  '307': { resumo: 'Data de emissão posterior ao horário de recebimento.', dica: 'A data e hora da NF-e estão no futuro. Verifique a configuração de fuso horário do servidor.' },
  '355': { resumo: 'NF-e com data de emissão anterior a 3 meses.', dica: 'Não é possível transmitir NF-e com mais de 3 meses de atraso. Inutilize o número e emita uma nova NF-e com data atual.' },
  '361': { resumo: 'NF-e com data de emissão fora do prazo de transmissão.', dica: 'A NF-e foi emitida fora do prazo de transmissão. Verifique a data de emissão.' },

  // ── Schema e estrutura XML ─────────────────────────────────────────────────
  '216': { resumo: 'Chave de acesso difere da NF-e enviada.', dica: 'A chave de acesso no envelope SOAP não corresponde à chave dentro do XML da NF-e. Tente emitir novamente.' },
  '225': { resumo: 'Falha no schema XML.', dica: 'O XML possui campos inválidos ou ausentes conforme o schema XSD da SEFAZ. Verifique os dados informados.' },
  '238': { resumo: 'Versão do arquivo XML não suportada.', dica: 'A versão do XML não é suportada pela SEFAZ. A versão atual é 4.00.' },
  '242': { resumo: 'Falha no schema XML do cabeçalho.', dica: 'Há erro no cabeçalho do arquivo enviado. Verifique a versão do layout (versão 4.00).' },
  '245': { resumo: 'Falha no schema XML da área de dados.', dica: 'Os dados da NF-e não estão em conformidade com o leiaute. Verifique os campos NCM, CFOP, CST e valores.' },
  '322': { resumo: 'Falha na validação do schema XML do evento.', dica: 'O XML do evento (cancelamento/CC-e) está malformado. O campo de justificativa pode conter caracteres inválidos.' },

  // ── CFOP, CST e tributação ─────────────────────────────────────────────────
  '370': { resumo: 'CST incompatível com CSOSN Simples Nacional.', dica: 'Empresas do Simples Nacional devem usar CSOSN (ex: 102, 400, 500) ao invés de CST padrão no ICMS.' },
  '371': { resumo: 'CST incompatível com o regime tributário.', dica: 'Verifique se o CST/CSOSN informado corresponde ao CRT da empresa (Simples Nacional = CSOSN; Lucro Presumido/Real = CST).' },
  '372': { resumo: 'CFOP deve ser de Saída para NF-e de Saída.', dica: 'CFOPs iniciados em 5 ou 6 são de saída. Para NF-e de Saída (tpNF=1), use CFOPs 5XXX ou 6XXX.' },
  '373': { resumo: 'CFOP deve ser de Entrada para NF-e de Entrada.', dica: 'Para NF-e de Entrada (tpNF=0), use CFOPs iniciados em 1 ou 2 (ex: 1102, 2102).' },
  '375': { resumo: 'NCM inválido.', dica: 'O código NCM informado não existe na Nomenclatura Comum do Mercosul. Verifique o código de 8 dígitos do produto.' },
  '376': { resumo: 'CFOP de operação com mercadoria inválido.', dica: 'O CFOP informado não é válido para o tipo de operação. Consulte a tabela de CFOPs do SPED.' },

  // ── Valores totais ─────────────────────────────────────────────────────────
  '388': { resumo: 'Valor de desconto maior que o valor do produto.', dica: 'O desconto aplicado a um ou mais itens é maior que o valor do produto. Verifique os descontos por item.' },
  '400': { resumo: 'Valor total dos produtos diverge da somatória dos itens.', dica: 'O campo vProd do total não bate com a soma dos itens. Verifique o cálculo do total de produtos.' },
  '401': { resumo: 'Valor do ICMS diverge da somatória dos itens.', dica: 'O total de ICMS informado não corresponde à soma dos ICMSs dos itens. Verifique os valores de ICMS por item.' },
  '402': { resumo: 'Valor do IPI diverge da somatória dos itens.', dica: 'O total de IPI não confere com a soma dos itens. Corrija o valor total de IPI.' },
  '403': { resumo: 'Valor do PIS diverge da somatória dos itens.', dica: 'O total de PIS não confere. Corrija o valor total de PIS.' },
  '404': { resumo: 'Valor do COFINS diverge da somatória dos itens.', dica: 'O total de COFINS não confere. Corrija o valor total de COFINS.' },
  '405': { resumo: 'Valor total da NF-e diverge da somatória dos itens.', dica: 'O valor total da NF-e (vNF) não corresponde à soma correta de produtos, frete, seguro, despesas, descontos e impostos. Verifique os totais.' },
  '415': { resumo: 'Valor do ICMS-ST diverge da somatória dos itens.', dica: 'O total de ICMS ST informado não corresponde à soma dos valores de ICMS ST por item.' },
  '429': { resumo: 'Valor total do FCP retido diverge da somatória dos itens.', dica: 'O total do FCP retido não confere com a soma dos itens. Corrija o valor do FCP.' },
  '430': { resumo: 'Valor total do FCP diverge da somatória dos itens.', dica: 'O total do FCP não confere. Corrija o valor total de FCP.' },
  '431': { resumo: 'Valor do IBS diverge da somatória dos itens.', dica: 'O total de IBS (reforma tributária) não confere com a soma dos itens.' },
  '432': { resumo: 'Valor do CBS diverge da somatória dos itens.', dica: 'O total de CBS (reforma tributária) não confere com a soma dos itens.' },

  // ── Municípios e UF ────────────────────────────────────────────────────────
  '272': { resumo: 'Código do município do emitente/destinatário inválido.', dica: 'O código IBGE do município está incorreto. Verifique o código de 7 dígitos conforme a tabela IBGE.' },
  '350': { resumo: 'UF ou município não existente.', dica: 'O código de UF ou município informado não existe. Verifique os dados de endereço do emitente e destinatário.' },
  '359': { resumo: 'Código do município do local de entrega inválido.', dica: 'O código IBGE do local de entrega está incorreto. Verifique o endereço de entrega.' },

  // ── Chave de acesso ────────────────────────────────────────────────────────
  '201': { resumo: 'Dígito verificador da chave de acesso inválido.', dica: 'A chave de acesso gerada possui dígito verificador incorreto. Tente emitir novamente.' },
  '227': { resumo: 'Campo Id não corresponde à chave de acesso.', dica: 'Há divergência entre o Id do infNFe e a chave de acesso. Tente emitir novamente.' },
  '236': { resumo: 'Código numérico da chave de acesso inválido.', dica: 'O código numérico (cNF) da chave de acesso é inválido. Tente emitir novamente.' },

  // ── Série e número ─────────────────────────────────────────────────────────
  '234': { resumo: 'Número de série fora do intervalo permitido para NF-e Avulsa.', dica: 'Para NF-e de emissão própria, use séries entre 001 e 889.' },
  '235': { resumo: 'Série fora do intervalo permitido [001-889].', dica: 'A série informada está fora do intervalo permitido. Séries 890-899 são do Fisco, 900-999 são para NF-e Avulsa.' },
  '352': { resumo: 'Série 900-999 restrita a NF-e Avulsa.', dica: 'Use séries de 001 a 889 para emissão própria.' },
  '362': { resumo: 'Número de série e número de NF-e inválidos.', dica: 'Verifique a combinação de série e número da NF-e.' },

  // ── Genérico ───────────────────────────────────────────────────────────────
  '499': { resumo: 'Erro de negócio não especificado.', dica: 'A SEFAZ rejeitou a NF-e por um motivo não classificado. Verifique o xMotivo da SEFAZ para mais detalhes.' },
  '999': { resumo: 'Erro interno não definido.', dica: 'Ocorreu um erro inesperado. Verifique sua conexão e tente novamente. Se persistir, contate o suporte.' },
};
