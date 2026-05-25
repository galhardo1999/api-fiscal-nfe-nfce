import Link from 'next/link';
import { SidebarReferencia } from './sidebar-referencia';
import { PlaygroundReferencia } from './playground-referencia';

export interface CampoReferencia {
  nome: string;
  tipo: string;
  obrigatorio: string;
  descricao: string;
}

export interface EndpointReferencia {
  metodo: string;
  rota: string;
  descricao: string;
}

export interface CodigoReferencia {
  titulo: string;
  codigo: string;
}

export interface RespostaReferencia {
  codigo: string;
  titulo: string;
  descricao: string;
}

export interface CartaoReferencia {
  titulo: string;
  descricao: string;
}

export interface ReferenciaApi {
  slug: string;
  titulo: string;
  subtitulo: string;
  descricaoMeta: string;
  metodoPrincipal: string;
  rotaPrincipal: string;
  destaques: string[];
  fluxo: CartaoReferencia[];
  checklist: string[];
  endpoints: EndpointReferencia[];
  campos: CampoReferencia[];
  codigos: CodigoReferencia[];
  respostas: RespostaReferencia[];
  estados: string[];
  boasPraticas: CartaoReferencia[];
  exemploJson?: string;
  retornoJson?: string;
  tituloRetorno?: string;
}

const camposAutenticacaoJson = [
  {
    nome: 'authorization',
    tipo: 'string',
    obrigatorio: 'Sim',
    descricao: 'Bearer Token gerado no painel ou pelo endpoint administrativo.',
  },
  {
    nome: 'content-type',
    tipo: 'application/json',
    obrigatorio: 'Sim',
    descricao: 'Obrigatorio para endpoints que recebem corpo JSON.',
  },
  {
    nome: 'idempotency-key',
    tipo: 'string',
    obrigatorio: 'Recomendado',
    descricao: 'Evita duplicidade em emissoes e eventos enviados mais de uma vez.',
  },
] as const satisfies readonly CampoReferencia[];

const camposDocumentoFiscal = [
  {
    nome: 'empresaId',
    tipo: 'string',
    obrigatorio: 'Sim',
    descricao: 'ID da empresa emitente cadastrada na API.',
  },
  {
    nome: 'valorTotal',
    tipo: 'number',
    obrigatorio: 'Nao',
    descricao: 'Valor total da nota. Se omitido, a API soma os itens.',
  },
  {
    nome: 'itens',
    tipo: 'array',
    obrigatorio: 'Sim',
    descricao: 'Lista com pelo menos um item.',
  },
  {
    nome: 'itens[].descricao',
    tipo: 'string',
    obrigatorio: 'Sim',
    descricao: 'Descricao fiscal do produto ou servico.',
  },
  {
    nome: 'itens[].quantidade',
    tipo: 'number',
    obrigatorio: 'Sim',
    descricao: 'Quantidade maior que zero.',
  },
  {
    nome: 'itens[].valorUnitario',
    tipo: 'number',
    obrigatorio: 'Sim',
    descricao: 'Valor unitario maior ou igual a zero.',
  },
  {
    nome: 'itens[].valorTotal',
    tipo: 'number',
    obrigatorio: 'Sim',
    descricao: 'Total do item maior ou igual a zero.',
  },
  {
    nome: 'itens[].ncm / cfop / unidade',
    tipo: 'string',
    obrigatorio: 'Recomendado',
    descricao: 'Campos fiscais usados para reduzir rejeicoes.',
  },
] as const satisfies readonly CampoReferencia[];

const respostasRecebimentoDocumento = [
  {
    codigo: '202',
    titulo: 'Recebido para processamento',
    descricao: 'Documento aceito e gravado para processamento assincrono.',
  },
  {
    codigo: '200',
    titulo: 'Requisicao idempotente',
    descricao: 'A mesma idempotency-key ja tinha sido processada.',
  },
  {
    codigo: '400',
    titulo: 'Payload invalido',
    descricao: 'JSON invalido ou campos obrigatorios ausentes.',
  },
  {
    codigo: '401',
    titulo: 'Nao autorizado',
    descricao: 'Token invalido, ausente ou sem escopo.',
  },
  {
    codigo: '404',
    titulo: 'Empresa nao encontrada',
    descricao: 'empresaId nao pertence ao cliente autenticado.',
  },
] as const satisfies readonly RespostaReferencia[];

const estadosDocumento = [
  'RECEBIDA',
  'ENFILEIRADA',
  'PROCESSANDO',
  'AUTORIZADA',
  'REJEITADA',
  'DENEGADA',
  'CANCELADA',
] as const;

const boasPraticasDocumento = [
  {
    titulo: 'Idempotencia',
    descricao: 'Use uma chave unica por pedido, venda ou tentativa fiscal.',
  },
  {
    titulo: 'Homologacao primeiro',
    descricao: 'Valide empresa, certificado, payload e webhooks antes de usar producao.',
  },
  {
    titulo: 'Webhooks',
    descricao: 'Receba mudancas de status sem depender apenas de polling.',
  },
  {
    titulo: 'Dados fiscais',
    descricao: 'Informe NCM, CFOP, unidade e tributos conforme a operacao real.',
  },
] as const satisfies readonly CartaoReferencia[];

const endpointsDocumento = [
  {
    metodo: 'GET',
    rota: '/api/v1/documentos/{id}',
    descricao: 'Consulta status, dados gravados, itens e eventos.',
  },
  {
    metodo: 'GET',
    rota: '/api/v1/documentos/{id}/xml',
    descricao: 'Baixa o XML quando estiver disponivel.',
  },
  {
    metodo: 'GET',
    rota: '/api/v1/documentos/{id}/pdf',
    descricao: 'Baixa o DANFE em PDF quando estiver disponivel.',
  },
] as const satisfies readonly EndpointReferencia[];

const referencias: Record<string, ReferenciaApi> = {
  'visao-geral': {
    slug: 'visao-geral',
    titulo: 'Visao geral da API',
    subtitulo: 'Entenda o fluxo principal da API Fiscal para NF-e e NFC-e.',
    descricaoMeta: 'Visao geral da API Fiscal, com fluxo de integracao, ambientes e ciclo de vida dos documentos.',
    metodoPrincipal: 'INFO',
    rotaPrincipal: '/api/v1',
    destaques: ['REST JSON', 'Multi-tenant', 'Processamento assincrono'],
    fluxo: [
      { titulo: '1. Criar chave', descricao: 'O cliente gera uma chave de homologacao ou producao.' },
      { titulo: '2. Cadastrar empresa', descricao: 'A empresa emitente fica vinculada ao cliente contratante.' },
      { titulo: '3. Enviar certificado', descricao: 'O certificado A1 valida a identidade fiscal do emitente.' },
      { titulo: '4. Emitir e acompanhar', descricao: 'A nota entra na fila e muda de status conforme a SEFAZ responde.' },
    ],
    checklist: [
      'Defina o ambiente da chave antes de integrar.',
      'Use sempre HTTPS em producao.',
      'Configure webhooks para receber autorizacao e rejeicao.',
      'Guarde o requestId retornado pela API para suporte e auditoria.',
    ],
    endpoints: [
      { metodo: 'POST', rota: '/api/v1/nfe', descricao: 'Recebe NF-e modelo 55.' },
      { metodo: 'POST', rota: '/api/v1/nfce', descricao: 'Recebe NFC-e modelo 65.' },
      { metodo: 'GET', rota: '/api/v1/documentos/{id}', descricao: 'Consulta documento fiscal.' },
    ],
    campos: [
      { nome: 'clientId', tipo: 'string', obrigatorio: 'Interno', descricao: 'Isola dados por cliente contratante.' },
      { nome: 'ambiente', tipo: 'HOMOLOGACAO | PRODUCAO', obrigatorio: 'Sim', descricao: 'Definido pela chave API usada na chamada.' },
      { nome: 'requestId', tipo: 'string', obrigatorio: 'Retorno', descricao: 'Identificador de rastreio de cada requisicao.' },
    ],
    codigos: [
      {
        titulo: 'Base URL local',
        codigo: 'http://localhost:3000/api/v1',
      },
      {
        titulo: 'Autenticacao',
        codigo: 'Authorization: Bearer af_test_xxxxxxxxxxxx.segredo',
      },
    ],
    respostas: [
      { codigo: '2xx', titulo: 'Sucesso', descricao: 'Requisicao aceita, processada ou consultada.' },
      { codigo: '4xx', titulo: 'Erro do cliente', descricao: 'Payload, autenticacao, escopo ou recurso invalido.' },
      { codigo: '5xx', titulo: 'Erro interno', descricao: 'Falha inesperada no servidor ou dependencia.' },
    ],
    estados: [...estadosDocumento],
    boasPraticas: [
      { titulo: 'Versionamento', descricao: 'Use sempre endpoints versionados em /api/v1.' },
      { titulo: 'Auditoria', descricao: 'Registre requestId, documentoId e idempotency-key no seu sistema.' },
      { titulo: 'Retentativas', descricao: 'Reenvie com a mesma idempotency-key para evitar duplicidade.' },
      { titulo: 'Ambiente correto', descricao: 'Separe tokens de homologacao e producao no seu sistema.' },
    ],
  },
  ambientes: {
    slug: 'ambientes',
    titulo: 'Ambientes',
    subtitulo: 'A mesma API opera em homologacao e producao conforme a chave enviada.',
    descricaoMeta: 'Como funcionam os ambientes de homologacao e producao da API Fiscal.',
    metodoPrincipal: 'INFO',
    rotaPrincipal: 'HOMOLOGACAO / PRODUCAO',
    destaques: ['af_test para testes', 'af_live para producao', 'Mesmo endpoint'],
    fluxo: [
      { titulo: '1. Criar chave', descricao: 'Escolha Homologacao ou Producao no painel.' },
      { titulo: '2. Enviar token', descricao: 'A API identifica o ambiente pela chave.' },
      { titulo: '3. Gravar documento', descricao: 'O ambiente fica registrado no documento fiscal.' },
      { titulo: '4. Consultar no mesmo ambiente', descricao: 'Use a mesma chave para consultar o que foi emitido.' },
    ],
    checklist: [
      'Use homologacao para testes sem valor fiscal real.',
      'Use producao apenas depois de validar cadastro, certificado e payload.',
      'Nunca misture token de homologacao com operacao real.',
      'Mantenha variaveis de ambiente separadas no sistema integrador.',
    ],
    endpoints: [
      { metodo: 'POST', rota: '/api/v1/nfe', descricao: 'Endpoint unico para homologacao e producao.' },
      { metodo: 'POST', rota: '/api/v1/nfce', descricao: 'Endpoint unico para NFC-e em ambos os ambientes.' },
      { metodo: 'GET', rota: '/api/v1/documentos', descricao: 'Lista documentos do ambiente da chave.' },
    ],
    campos: [
      { nome: 'af_test_*', tipo: 'prefixo', obrigatorio: 'Homologacao', descricao: 'Chaves de teste.' },
      { nome: 'af_live_*', tipo: 'prefixo', obrigatorio: 'Producao', descricao: 'Chaves de emissao real.' },
      { nome: 'idempotency-key', tipo: 'header', obrigatorio: 'Recomendado', descricao: 'Obrigatoria na pratica para retentativas seguras.' },
    ],
    codigos: [
      {
        titulo: 'Homologacao',
        codigo: 'Authorization: Bearer af_test_xxxxxxxxxxxx.segredo',
      },
      {
        titulo: 'Producao',
        codigo: 'Authorization: Bearer af_live_xxxxxxxxxxxx.segredo',
      },
    ],
    respostas: [
      { codigo: '401', titulo: 'Token invalido', descricao: 'Prefixo ou segredo da chave nao foi aceito.' },
      { codigo: '403', titulo: 'Cliente bloqueado', descricao: 'Cliente sem permissao operacional.' },
      { codigo: '404', titulo: 'Recurso ausente', descricao: 'Recurso existe em outro ambiente ou cliente.' },
    ],
    estados: ['HOMOLOGACAO', 'PRODUCAO'],
    boasPraticas: [
      { titulo: 'Segregacao', descricao: 'Use variaveis diferentes para token de teste e real.' },
      { titulo: 'Promocao controlada', descricao: 'Valide todos os fluxos antes de trocar para producao.' },
      { titulo: 'Logs', descricao: 'Inclua ambiente em logs e telas do integrador.' },
      { titulo: 'Revisao fiscal', descricao: 'Confira CSC, certificado e series antes da primeira nota real.' },
    ],
  },
  autenticacao: {
    slug: 'autenticacao',
    titulo: 'Autenticacao',
    subtitulo: 'Use Bearer Token ou x-api-key para autenticar chamadas publicas.',
    descricaoMeta: 'Referencia de autenticacao, headers, escopos e chaves API.',
    metodoPrincipal: 'AUTH',
    rotaPrincipal: 'Authorization / x-api-key',
    destaques: ['Bearer Token', 'x-api-key', 'Escopos por chave'],
    fluxo: [
      { titulo: '1. Gerar chave', descricao: 'O token e exibido apenas no momento da criacao.' },
      { titulo: '2. Armazenar segredo', descricao: 'Guarde em cofre de segredos ou variavel protegida.' },
      { titulo: '3. Enviar header', descricao: 'Use Authorization: Bearer ou x-api-key.' },
      { titulo: '4. Validar escopo', descricao: 'Cada endpoint exige um escopo especifico.' },
    ],
    checklist: [
      'Nao exponha token no frontend publico.',
      'Crie chaves separadas para homologacao e producao.',
      'Rotacione a chave se houver suspeita de vazamento.',
      'Use o painel para criar ou excluir chaves de cliente.',
    ],
    endpoints: [
      { metodo: 'POST', rota: '/api/v1/chaves-api', descricao: 'Cria chave por token administrativo.' },
      { metodo: 'GET', rota: '/api/v1/chaves-api?clientId=...', descricao: 'Lista chaves por token administrativo.' },
      { metodo: 'POST', rota: '/api/painel/chaves', descricao: 'Cria chave pelo painel autenticado.' },
    ],
    campos: [
      { nome: 'Authorization', tipo: 'Bearer token', obrigatorio: 'Sim', descricao: 'Formato recomendado para integracoes.' },
      { nome: 'x-api-key', tipo: 'token', obrigatorio: 'Alternativo', descricao: 'Aceito como alternativa ao Bearer Token.' },
      { nome: 'x-admin-token', tipo: 'token admin', obrigatorio: 'Admin', descricao: 'Usado apenas para endpoints administrativos.' },
      { nome: 'escopos', tipo: 'string[]', obrigatorio: 'Sim', descricao: 'Define permissoes como documentos:emitir e empresas:ler.' },
    ],
    codigos: [
      {
        titulo: 'Bearer Token',
        codigo: 'Authorization: Bearer af_test_xxxxxxxxxxxx.segredo',
      },
      {
        titulo: 'x-api-key',
        codigo: 'x-api-key: af_test_xxxxxxxxxxxx.segredo',
      },
    ],
    respostas: [
      { codigo: '201', titulo: 'Chave criada', descricao: 'Token retorna uma unica vez.' },
      { codigo: '401', titulo: 'Nao autorizado', descricao: 'Token ausente, invalido ou sem escopo.' },
      { codigo: '403', titulo: 'Cliente indisponivel', descricao: 'Cliente bloqueado ou cancelado.' },
    ],
    estados: ['ATIVA', 'INATIVA', 'EXPIRADA'],
    boasPraticas: [
      { titulo: 'Segredo protegido', descricao: 'Nunca salve token em repositorio.' },
      { titulo: 'Menor privilegio', descricao: 'Use apenas os escopos necessarios.' },
      { titulo: 'Separacao', descricao: 'Use uma chave por sistema integrador.' },
      { titulo: 'Revogacao', descricao: 'Exclua chaves antigas no painel.' },
    ],
  },
  empresas: {
    slug: 'empresas',
    titulo: 'Empresas emitentes',
    subtitulo: 'Cadastre e liste CNPJs que poderao emitir NF-e e NFC-e.',
    descricaoMeta: 'Referencia para cadastro e listagem de empresas emitentes.',
    metodoPrincipal: 'POST',
    rotaPrincipal: '/api/v1/empresas',
    destaques: ['CNPJ por cliente', 'Ambiente da chave', 'Dados fiscais'],
    fluxo: [
      { titulo: '1. Enviar dados', descricao: 'Informe CNPJ, IE, endereco e regime tributario.' },
      { titulo: '2. Validar duplicidade', descricao: 'O mesmo CNPJ nao pode duplicar no cliente.' },
      { titulo: '3. Vincular tenant', descricao: 'A empresa fica isolada por cliente contratante.' },
      { titulo: '4. Usar empresaId', descricao: 'O ID retornado sera usado na emissao.' },
    ],
    checklist: [
      'Cadastre a empresa antes de enviar certificado.',
      'Confirme UF, municipio, CEP e IE com o cadastro fiscal.',
      'Informe CSC e idCsc quando for emitir NFC-e.',
      'Guarde o empresa.id retornado.',
    ],
    endpoints: [
      { metodo: 'GET', rota: '/api/v1/empresas', descricao: 'Lista empresas do cliente.' },
      { metodo: 'POST', rota: '/api/v1/empresas', descricao: 'Cria empresa emitente.' },
      { metodo: 'POST', rota: '/api/v1/empresas/{id}/certificado', descricao: 'Vincula certificado A1.' },
    ],
    campos: [
      { nome: 'cnpj', tipo: 'string', obrigatorio: 'Sim', descricao: 'CNPJ do emitente, somente numeros ou formatado.' },
      { nome: 'nome', tipo: 'string', obrigatorio: 'Sim', descricao: 'Razao social.' },
      { nome: 'ie', tipo: 'string', obrigatorio: 'Sim', descricao: 'Inscricao estadual.' },
      { nome: 'crt', tipo: 'string', obrigatorio: 'Nao', descricao: 'Regime tributario. Padrao 3.' },
      { nome: 'logradouro / numero / bairro', tipo: 'string', obrigatorio: 'Sim', descricao: 'Endereco fiscal.' },
      { nome: 'municipio / uf / cep', tipo: 'string', obrigatorio: 'Sim', descricao: 'Localizacao fiscal do emitente.' },
      { nome: 'csc / idCsc', tipo: 'string', obrigatorio: 'NFC-e', descricao: 'Codigo de seguranca do contribuinte para QR Code NFC-e.' },
    ],
    codigos: [
      {
        titulo: 'Criar empresa',
        codigo: `curl -X POST "$BASE_URL/api/v1/empresas" \\
  -H "authorization: Bearer $API_TOKEN" \\
  -H "content-type: application/json" \\
  -d '{
    "cnpj": "00000000000191",
    "nome": "Empresa Exemplo LTDA",
    "ie": "123456789",
    "logradouro": "Rua Exemplo",
    "numero": "100",
    "bairro": "Centro",
    "municipio": "Sao Paulo",
    "uf": "SP",
    "cep": "01001000"
  }'`,
      },
    ],
    respostas: [
      { codigo: '201', titulo: 'Empresa criada', descricao: 'Retorna empresa.id para as proximas chamadas.' },
      { codigo: '400', titulo: 'Validacao falhou', descricao: 'Campos obrigatorios ausentes.' },
      { codigo: '409', titulo: 'Empresa duplicada', descricao: 'CNPJ ja existe para o cliente.' },
    ],
    estados: ['ATIVA', 'INATIVA'],
    boasPraticas: [
      { titulo: 'Dados oficiais', descricao: 'Use dados iguais aos registrados na SEFAZ.' },
      { titulo: 'NFC-e', descricao: 'Configure CSC e idCsc para estados que exigem QR Code.' },
      { titulo: 'Tenant', descricao: 'Nunca reutilize empresaId de outro cliente.' },
      { titulo: 'Certificado', descricao: 'Vincule o A1 antes da primeira emissao.' },
    ],
  },
  certificados: {
    slug: 'certificados',
    titulo: 'Certificado A1',
    subtitulo: 'Envie o certificado digital do emitente em form-data.',
    descricaoMeta: 'Referencia para upload e validacao de certificados digitais A1.',
    metodoPrincipal: 'POST',
    rotaPrincipal: '/api/v1/empresas/{id}/certificado',
    destaques: ['.pfx ou .p12', 'Maximo 2 MB', 'Senha criptografada'],
    fluxo: [
      { titulo: '1. Selecionar empresa', descricao: 'Use o ID de uma empresa do cliente.' },
      { titulo: '2. Enviar form-data', descricao: 'Campos certificate e password sao obrigatorios.' },
      { titulo: '3. Validar CNPJ', descricao: 'O certificado precisa pertencer ao CNPJ emitente.' },
      { titulo: '4. Salvar seguro', descricao: 'Arquivo e senha sao armazenados para assinatura fiscal.' },
    ],
    checklist: [
      'Aceita apenas arquivos .pfx ou .p12.',
      'O arquivo deve ter no maximo 2 MB.',
      'A senha precisa estar correta para extrair as informacoes.',
      'O documento do certificado deve bater com o CNPJ da empresa.',
    ],
    endpoints: [
      { metodo: 'POST', rota: '/api/v1/empresas/{id}/certificado', descricao: 'Salva ou substitui certificado da empresa.' },
    ],
    campos: [
      { nome: 'certificate', tipo: 'File', obrigatorio: 'Sim', descricao: 'Arquivo .pfx ou .p12 no form-data.' },
      { nome: 'password', tipo: 'string', obrigatorio: 'Sim', descricao: 'Senha do certificado A1.' },
      { nome: 'id', tipo: 'path param', obrigatorio: 'Sim', descricao: 'ID da empresa emitente.' },
    ],
    codigos: [
      {
        titulo: 'Enviar certificado',
        codigo: `curl -X POST "$BASE_URL/api/v1/empresas/$EMPRESA_ID/certificado" \\
  -H "authorization: Bearer $API_TOKEN" \\
  -F "certificate=@certificado.pfx" \\
  -F "password=senha-do-certificado"`,
      },
    ],
    respostas: [
      { codigo: '200', titulo: 'Certificado salvo', descricao: 'Retorna dados publicos do certificado.' },
      { codigo: '400', titulo: 'Certificado obrigatorio', descricao: 'certificate ou password nao foi enviado.' },
      { codigo: '413', titulo: 'Arquivo grande', descricao: 'Certificado ultrapassou 2 MB.' },
      { codigo: '422', titulo: 'Certificado invalido', descricao: 'Senha errada, arquivo invalido ou CNPJ divergente.' },
    ],
    estados: ['ATIVO', 'VENCENDO', 'VENCIDO'],
    boasPraticas: [
      { titulo: 'Validade', descricao: 'Monitore vencimento antes de bloquear emissao.' },
      { titulo: 'Troca segura', descricao: 'Substitua o certificado fora do horario de pico.' },
      { titulo: 'Arquivo correto', descricao: 'Use A1, nao A3.' },
      { titulo: 'Responsabilidade', descricao: 'Restrinja quem pode enviar certificado no sistema cliente.' },
    ],
  },
  nfe: {
    slug: 'nfe',
    titulo: 'NF-e modelo 55',
    subtitulo: 'Emita, consulte e acompanhe uma Nota Fiscal Eletronica pela API.',
    descricaoMeta: 'Referencia para emissao de NF-e modelo 55 pela API Fiscal.',
    metodoPrincipal: 'POST',
    rotaPrincipal: '/api/v1/nfe',
    destaques: ['Emissao assincrona', 'Modelo fiscal 55', 'XML e DANFE'],
    fluxo: [
      { titulo: '1. Receber JSON', descricao: 'Seu sistema envia empresa, totais e itens.' },
      { titulo: '2. Validar e gravar', descricao: 'A API valida o minimo necessario e salva o documento.' },
      { titulo: '3. Processar SEFAZ', descricao: 'Assinatura, XML, lote e consulta seguem em background.' },
      { titulo: '4. Avisar resultado', descricao: 'Consulte o documento ou receba webhook de autorizacao/rejeicao.' },
    ],
    checklist: [
      'Crie uma chave API de homologacao.',
      'Cadastre a empresa emitente.',
      'Envie o certificado A1.',
      'Use idempotency-key unica por pedido.',
    ],
    endpoints: [
      { metodo: 'POST', rota: '/api/v1/nfe', descricao: 'Recebe NF-e modelo 55.' },
      ...endpointsDocumento,
      { metodo: 'POST', rota: '/api/v1/documentos/{id}/carta-correcao', descricao: 'Solicita CC-e para NF-e.' },
    ],
    campos: [...camposAutenticacaoJson, ...camposDocumentoFiscal],
    codigos: [
      {
        titulo: 'Emitir NF-e',
        codigo: `curl -X POST "$BASE_URL/api/v1/nfe" \\
  -H "authorization: Bearer $API_TOKEN" \\
  -H "content-type: application/json" \\
  -H "idempotency-key: pedido-1001-nfe" \\
  -d '{
    "empresaId": "empresa_123",
    "valorTotal": 100,
    "itens": [{
      "codigo": "PROD-001",
      "descricao": "Produto de teste",
      "ncm": "00000000",
      "cfop": "5102",
      "unidade": "UN",
      "quantidade": 1,
      "valorUnitario": 100,
      "valorTotal": 100
    }]
  }'`,
      },
      {
        titulo: 'Resposta 202',
        codigo: `{
  "documentoId": "doc_...",
  "modelo": "NFE",
  "ambiente": "HOMOLOGACAO",
  "status": "RECEBIDA"
}`,
      },
    ],
    respostas: [...respostasRecebimentoDocumento],
    estados: [...estadosDocumento],
    boasPraticas: [...boasPraticasDocumento],
  },
  nfce: {
    slug: 'nfce',
    titulo: 'NFC-e modelo 65',
    subtitulo: 'Emita cupom fiscal eletronico com QR Code e DANFE NFC-e.',
    descricaoMeta: 'Referencia para emissao de NFC-e modelo 65 pela API Fiscal.',
    metodoPrincipal: 'POST',
    rotaPrincipal: '/api/v1/nfce',
    destaques: ['Modelo fiscal 65', 'Consumidor final', 'Contingencia offline'],
    fluxo: [
      { titulo: '1. Receber venda', descricao: 'A API recebe itens, pagamentos e empresa.' },
      { titulo: '2. Validar dados', descricao: 'O payload minimo e gravado para processamento.' },
      { titulo: '3. Gerar documento', descricao: 'XML, assinatura e comunicacao SEFAZ sao feitos em background.' },
      { titulo: '4. Retornar comprovante', descricao: 'XML e PDF ficam disponiveis depois do processamento.' },
    ],
    checklist: [
      'Cadastre empresa com CSC e idCsc quando aplicavel.',
      'Use uma chave do ambiente correto.',
      'Informe pagamentos no payload quando seu fluxo exigir.',
      'Prepare contingencia offline para indisponibilidade da SEFAZ.',
    ],
    endpoints: [
      { metodo: 'POST', rota: '/api/v1/nfce', descricao: 'Recebe NFC-e modelo 65.' },
      ...endpointsDocumento,
      { metodo: 'POST', rota: '/api/v1/documentos/{id}/cancelamento', descricao: 'Solicita cancelamento dentro do prazo legal.' },
    ],
    campos: [
      ...camposAutenticacaoJson,
      ...camposDocumentoFiscal,
      { nome: 'pagamentos', tipo: 'array', obrigatorio: 'Recomendado', descricao: 'Formas de pagamento da venda ao consumidor.' },
      { nome: 'pagamentos[].tPag', tipo: 'string', obrigatorio: 'Recomendado', descricao: 'Codigo da forma de pagamento.' },
      { nome: 'pagamentos[].vPag', tipo: 'number', obrigatorio: 'Recomendado', descricao: 'Valor pago.' },
    ],
    codigos: [
      {
        titulo: 'Emitir NFC-e',
        codigo: `curl -X POST "$BASE_URL/api/v1/nfce" \\
  -H "authorization: Bearer $API_TOKEN" \\
  -H "content-type: application/json" \\
  -H "idempotency-key: venda-1001-nfce" \\
  -d '{
    "empresaId": "empresa_123",
    "valorTotal": 25.9,
    "pagamentos": [{ "tPag": "01", "vPag": 25.9 }],
    "itens": [{
      "descricao": "Produto NFC-e",
      "quantidade": 1,
      "valorUnitario": 25.9,
      "valorTotal": 25.9
    }]
  }'`,
      },
    ],
    respostas: [...respostasRecebimentoDocumento],
    estados: [...estadosDocumento],
    boasPraticas: [
      { titulo: 'CSC correto', descricao: 'Sem CSC/idCsc valido, o QR Code pode falhar.' },
      { titulo: 'Contingencia', descricao: 'Tenha regra operacional para transmissao posterior.' },
      { titulo: 'Prazos', descricao: 'Cancelamento de NFC-e costuma ter prazo curto por UF.' },
      { titulo: 'Bobina', descricao: 'Valide o PDF em impressoras de 58mm e 80mm se usar impressao termica.' },
    ],
  },
  documentos: {
    slug: 'documentos',
    titulo: 'Documentos fiscais',
    subtitulo: 'Liste, consulte, baixe XML e gere PDF de documentos emitidos.',
    descricaoMeta: 'Referencia para consulta de documentos fiscais, XML e PDF.',
    metodoPrincipal: 'GET',
    rotaPrincipal: '/api/v1/documentos',
    destaques: ['Paginacao', 'Filtros', 'XML e PDF'],
    fluxo: [
      { titulo: '1. Filtrar lista', descricao: 'Use modelo, status, page e limit.' },
      { titulo: '2. Consultar detalhe', descricao: 'Busque um documento por ID.' },
      { titulo: '3. Baixar XML', descricao: 'XML fica disponivel apos processamento.' },
      { titulo: '4. Baixar PDF', descricao: 'DANFE depende de documento processado/autorizado.' },
    ],
    checklist: [
      'Use o mesmo ambiente da emissao para consultar.',
      'Ajuste limit ate o maximo 100.',
      'Trate XML_AINDA_INDISPONIVEL e PDF_AINDA_INDISPONIVEL.',
      'Armazene chaveAcesso e protocolo quando retornarem.',
    ],
    endpoints: [
      { metodo: 'GET', rota: '/api/v1/documentos?page=1&limit=20', descricao: 'Lista documentos paginados.' },
      ...endpointsDocumento,
    ],
    campos: [
      { nome: 'page', tipo: 'number', obrigatorio: 'Nao', descricao: 'Pagina. Padrao 1.' },
      { nome: 'limit', tipo: 'number', obrigatorio: 'Nao', descricao: 'Limite por pagina. Maximo 100.' },
      { nome: 'status', tipo: 'StatusDocumentoFiscal', obrigatorio: 'Nao', descricao: 'Filtra por status fiscal.' },
      { nome: 'modelo', tipo: 'NFE | NFCE', obrigatorio: 'Nao', descricao: 'Filtra por modelo.' },
    ],
    codigos: [
      {
        titulo: 'Listar documentos',
        codigo: `curl "$BASE_URL/api/v1/documentos?modelo=NFE&status=AUTORIZADA" \\
  -H "authorization: Bearer $API_TOKEN"`,
      },
      {
        titulo: 'Baixar XML',
        codigo: `curl "$BASE_URL/api/v1/documentos/$DOCUMENTO_ID/xml" \\
  -H "authorization: Bearer $API_TOKEN"`,
      },
    ],
    respostas: [
      { codigo: '200', titulo: 'Consulta realizada', descricao: 'Retorna lista, documento, XML ou PDF.' },
      { codigo: '404', titulo: 'Documento nao encontrado', descricao: 'ID nao existe no cliente/ambiente.' },
      { codigo: '409', titulo: 'Ainda indisponivel', descricao: 'XML ou PDF ainda nao foi gerado.' },
    ],
    estados: [...estadosDocumento],
    boasPraticas: [
      { titulo: 'Polling moderado', descricao: 'Use intervalos progressivos se nao usar webhook.' },
      { titulo: 'Ambiente', descricao: 'Tokens de ambientes diferentes nao veem os mesmos documentos.' },
      { titulo: 'Arquivamento', descricao: 'Baixe e armazene XML autorizado conforme obrigacoes fiscais.' },
      { titulo: 'Auditoria', descricao: 'Relacione documentoId com pedido interno.' },
    ],
  },
  eventos: {
    slug: 'eventos',
    titulo: 'Eventos fiscais',
    subtitulo: 'Solicite cancelamento, carta de correcao e inutilizacao.',
    descricaoMeta: 'Referencia de eventos fiscais de NF-e e NFC-e.',
    metodoPrincipal: 'POST',
    rotaPrincipal: '/api/v1/documentos/{id}/cancelamento',
    destaques: ['Cancelamento', 'CC-e', 'Inutilizacao'],
    fluxo: [
      { titulo: '1. Identificar documento', descricao: 'Use documentoId retornado na emissao.' },
      { titulo: '2. Enviar justificativa', descricao: 'Cancelamento e inutilizacao exigem motivo.' },
      { titulo: '3. Registrar evento', descricao: 'A API grava o evento para processamento fiscal.' },
      { titulo: '4. Acompanhar status', descricao: 'Consulte documento ou receba webhook.' },
    ],
    checklist: [
      'Cancelamento precisa de justificativa com pelo menos 15 caracteres.',
      'Carta de correcao e permitida apenas para NF-e modelo 55.',
      'Inutilizacao exige empresa, modelo, serie, numero inicial e final.',
      'Prazos legais variam por documento e UF.',
    ],
    endpoints: [
      { metodo: 'POST', rota: '/api/v1/documentos/{id}/cancelamento', descricao: 'Solicita cancelamento.' },
      { metodo: 'POST', rota: '/api/v1/documentos/{id}/carta-correcao', descricao: 'Solicita CC-e para NF-e.' },
      { metodo: 'POST', rota: '/api/v1/documentos/inutilizacao', descricao: 'Solicita inutilizacao de numeracao.' },
    ],
    campos: [
      { nome: 'justificativa', tipo: 'string', obrigatorio: 'Cancelamento', descricao: 'Minimo de 15 caracteres.' },
      { nome: 'correcao', tipo: 'string', obrigatorio: 'CC-e', descricao: 'Entre 15 e 1000 caracteres.' },
      { nome: 'empresaId', tipo: 'string', obrigatorio: 'Inutilizacao', descricao: 'Empresa emitente.' },
      { nome: 'modelo', tipo: 'NFE | NFCE | 55 | 65', obrigatorio: 'Inutilizacao', descricao: 'Modelo fiscal.' },
      { nome: 'serie / numeroInicial / numeroFinal', tipo: 'number', obrigatorio: 'Inutilizacao', descricao: 'Faixa numerica a inutilizar.' },
    ],
    codigos: [
      {
        titulo: 'Cancelamento',
        codigo: `curl -X POST "$BASE_URL/api/v1/documentos/$DOCUMENTO_ID/cancelamento" \\
  -H "authorization: Bearer $API_TOKEN" \\
  -H "content-type: application/json" \\
  -d '{ "justificativa": "Erro operacional na emissao da nota" }'`,
      },
      {
        titulo: 'Carta de correcao',
        codigo: `curl -X POST "$BASE_URL/api/v1/documentos/$DOCUMENTO_ID/carta-correcao" \\
  -H "authorization: Bearer $API_TOKEN" \\
  -H "content-type: application/json" \\
  -d '{ "correcao": "Correcao permitida conforme legislacao vigente" }'`,
      },
    ],
    respostas: [
      { codigo: '202', titulo: 'Evento recebido', descricao: 'Evento gravado para processamento fiscal.' },
      { codigo: '400', titulo: 'Payload invalido', descricao: 'Campo obrigatorio ausente ou curto demais.' },
      { codigo: '422', titulo: 'Evento nao permitido', descricao: 'Exemplo: CC-e em NFC-e.' },
    ],
    estados: ['EVENTO_RECEBIDO', 'ENFILEIRADA', 'AUTORIZADA', 'REJEITADA'],
    boasPraticas: [
      { titulo: 'Prazos', descricao: 'Controle prazos legais no integrador.' },
      { titulo: 'Texto claro', descricao: 'Justificativas genericas podem ser rejeitadas.' },
      { titulo: 'CC-e limitada', descricao: 'Nao use CC-e para corrigir valores, impostos ou destinatario.' },
      { titulo: 'Numeracao', descricao: 'Inutilize somente quebras reais de sequencia.' },
    ],
  },
  webhooks: {
    slug: 'webhooks',
    titulo: 'Webhooks',
    subtitulo: 'Receba notificacoes de status sem ficar consultando a API em loop.',
    descricaoMeta: 'Referencia para cadastro, eventos e payloads de webhooks.',
    metodoPrincipal: 'POST',
    rotaPrincipal: '/api/v1/webhooks',
    destaques: ['Eventos em tempo real', 'Segredo HMAC', 'Retorno 201'],
    fluxo: [
      { titulo: '1. Cadastrar URL', descricao: 'Informe endpoint publico do seu sistema.' },
      { titulo: '2. Guardar segredo', descricao: 'O segredo retorna na criacao para validar assinatura.' },
      { titulo: '3. Receber eventos', descricao: 'A API agenda entregas quando status muda.' },
      { titulo: '4. Confirmar recebimento', descricao: 'Seu endpoint deve responder 2xx rapidamente.' },
    ],
    checklist: [
      'Use HTTPS em producao.',
      'Guarde o segredo retornado na criacao.',
      'Responda rapidamente e processe em fila interna.',
      'Trate eventos repetidos de forma idempotente.',
    ],
    endpoints: [
      { metodo: 'GET', rota: '/api/v1/webhooks', descricao: 'Lista endpoints cadastrados.' },
      { metodo: 'POST', rota: '/api/v1/webhooks', descricao: 'Cria ou reativa endpoint.' },
      { metodo: 'GET', rota: '/api/v1/webhooks/eventos', descricao: 'Lista eventos disponiveis.' },
    ],
    campos: [
      { nome: 'url', tipo: 'string', obrigatorio: 'Sim', descricao: 'URL absoluta http ou https.' },
      { nome: 'eventos', tipo: 'string[]', obrigatorio: 'Nao', descricao: 'Lista de eventos desejados. Se vazio, usa padrao.' },
      { nome: 'segredo', tipo: 'string', obrigatorio: 'Retorno', descricao: 'Usado para validar assinatura HMAC.' },
    ],
    codigos: [
      {
        titulo: 'Criar webhook',
        codigo: `curl -X POST "$BASE_URL/api/v1/webhooks" \\
  -H "authorization: Bearer $API_TOKEN" \\
  -H "content-type: application/json" \\
  -d '{
    "url": "https://cliente.com/webhooks/api-fiscal",
    "eventos": ["documento.autorizado", "documento.rejeitado"]
  }'`,
      },
    ],
    respostas: [
      { codigo: '201', titulo: 'Webhook criado', descricao: 'Retorna endpoint e segredo uma unica vez.' },
      { codigo: '400', titulo: 'URL invalida', descricao: 'URL ausente ou sem protocolo http/https.' },
      { codigo: '401', titulo: 'Sem escopo', descricao: 'Chave precisa de webhooks:gerenciar.' },
    ],
    estados: [
      'documento.recebido',
      'documento.autorizado',
      'documento.rejeitado',
      'documento.cancelado',
      'certificado.vencendo',
    ],
    boasPraticas: [
      { titulo: 'Idempotencia', descricao: 'Considere eventoId/documentoId para ignorar duplicados.' },
      { titulo: 'Seguranca', descricao: 'Valide assinatura antes de processar payload.' },
      { titulo: 'Timeout curto', descricao: 'Responda 2xx e processe pesado em background.' },
      { titulo: 'Observabilidade', descricao: 'Registre entregas falhas e tentativas.' },
    ],
  },
  cobranca: {
    slug: 'cobranca',
    titulo: 'Cobranca por nota',
    subtitulo: 'Consulte uso mensal e simule o valor conforme a faixa de volume.',
    descricaoMeta: 'Referencia da cobranca por nota emitida com minimo mensal.',
    metodoPrincipal: 'GET',
    rotaPrincipal: '/api/v1/cobranca/uso',
    destaques: ['Minimo R$ 69,90', 'Faixa unica', 'Por ambiente'],
    fluxo: [
      { titulo: '1. Contar autorizadas', descricao: 'Notas autorizadas no mes entram na cobranca.' },
      { titulo: '2. Identificar faixa', descricao: 'A faixa e aplicada em todas as notas do mes.' },
      { titulo: '3. Aplicar minimo', descricao: 'Se o total ficar abaixo de R$ 69,90, cobra o minimo.' },
      { titulo: '4. Exibir saldo', descricao: 'Painel e API mostram uso e valor estimado.' },
    ],
    checklist: [
      'Ate 100 notas: R$ 0,90 por nota.',
      'De 101 a 350 notas: R$ 0,79 em todas as notas.',
      'Acima de 350 notas: R$ 0,69 em todas as notas.',
      'Minimo mensal: R$ 69,90.',
    ],
    endpoints: [
      { metodo: 'GET', rota: '/api/v1/cobranca/uso?anoMes=2026-05', descricao: 'Consulta uso autenticado.' },
      { metodo: 'GET', rota: '/api/v1/cobranca/simular?notas=351', descricao: 'Simula cobranca sem autenticacao.' },
    ],
    campos: [
      { nome: 'anoMes', tipo: 'YYYY-MM', obrigatorio: 'Nao', descricao: 'Mes de competencia. Padrao mes atual.' },
      { nome: 'modelo', tipo: 'NFE | NFCE', obrigatorio: 'Nao', descricao: 'Filtra por modelo fiscal.' },
      { nome: 'notas', tipo: 'number', obrigatorio: 'Simular', descricao: 'Quantidade usada na simulacao.' },
    ],
    codigos: [
      {
        titulo: 'Consultar uso',
        codigo: `curl "$BASE_URL/api/v1/cobranca/uso?anoMes=2026-05" \\
  -H "authorization: Bearer $API_TOKEN"`,
      },
      {
        titulo: 'Simular',
        codigo: 'curl "$BASE_URL/api/v1/cobranca/simular?notas=351"',
      },
    ],
    respostas: [
      { codigo: '200', titulo: 'Cobranca calculada', descricao: 'Retorna faixa, preco unitario, valor notas e valor total.' },
      { codigo: '400', titulo: 'Parametro invalido', descricao: 'anoMes ou notas fora do formato esperado.' },
      { codigo: '401', titulo: 'Nao autorizado', descricao: 'Uso mensal exige escopo cobranca:ler.' },
    ],
    estados: ['ATE_100', 'ATE_350', 'ACIMA_350', 'MINIMO_APLICADO'],
    boasPraticas: [
      { titulo: 'Transparencia', descricao: 'Mostre faixa atual no dashboard do cliente.' },
      { titulo: 'Fechamento', descricao: 'Congele a competencia antes de faturar oficialmente.' },
      { titulo: 'Ambiente', descricao: 'Defina se homologacao entra ou nao no faturamento comercial.' },
      { titulo: 'Simulador', descricao: 'Use o endpoint publico em telas comerciais.' },
    ],
  },
  erros: {
    slug: 'erros',
    titulo: 'Erros da API',
    subtitulo: 'Padrao unico para validar, rastrear e corrigir falhas de integracao.',
    descricaoMeta: 'Referencia dos codigos de erro da API Fiscal.',
    metodoPrincipal: 'INFO',
    rotaPrincipal: 'Formato de erro',
    destaques: ['codigo', 'mensagem', 'requestId'],
    fluxo: [
      { titulo: '1. Ler HTTP', descricao: 'Identifique a classe do erro pelo status.' },
      { titulo: '2. Ler codigo', descricao: 'Use codigo para regra automatizada.' },
      { titulo: '3. Ler detalhes', descricao: 'Campos invalidos aparecem em detalhes quando houver.' },
      { titulo: '4. Registrar requestId', descricao: 'Use requestId para suporte e auditoria.' },
    ],
    checklist: [
      'Nunca dependa apenas da mensagem textual.',
      'Trate 409 de XML/PDF como estado temporario.',
      'Mostre detalhes de validacao para o usuario final corrigir payload.',
      'Inclua requestId em logs do integrador.',
    ],
    endpoints: [],
    campos: [
      { nome: 'codigo', tipo: 'string', obrigatorio: 'Sim', descricao: 'Codigo estavel para tratamento.' },
      { nome: 'mensagem', tipo: 'string', obrigatorio: 'Sim', descricao: 'Mensagem legivel.' },
      { nome: 'requestId', tipo: 'string', obrigatorio: 'Sim', descricao: 'Rastreio da requisicao.' },
      { nome: 'detalhes', tipo: 'unknown', obrigatorio: 'Nao', descricao: 'Lista ou objeto com informacoes extras.' },
    ],
    codigos: [
      {
        titulo: 'Erro padrao',
        codigo: `{
  "codigo": "VALIDACAO_FALHOU",
  "mensagem": "Payload invalido.",
  "requestId": "req_...",
  "detalhes": ["empresaId e obrigatorio."]
}`,
      },
    ],
    respostas: [
      { codigo: '400', titulo: 'JSON_INVALIDO / VALIDACAO_FALHOU', descricao: 'Corrija corpo ou parametros.' },
      { codigo: '401', titulo: 'NAO_AUTORIZADO', descricao: 'Corrija token ou escopo.' },
      { codigo: '404', titulo: 'NAO_ENCONTRADO', descricao: 'Recurso nao existe no cliente/ambiente.' },
      { codigo: '409', titulo: 'CONFLITO', descricao: 'Duplicidade ou arquivo ainda indisponivel.' },
      { codigo: '422', titulo: 'REGRA_INVALIDA', descricao: 'Certificado ou regra de negocio invalida.' },
    ],
    estados: ['JSON_INVALIDO', 'VALIDACAO_FALHOU', 'NAO_AUTORIZADO', 'DOCUMENTO_NAO_ENCONTRADO', 'ERRO_INTERNO'],
    boasPraticas: [
      { titulo: 'Mapeamento', descricao: 'Converta codigo em mensagem amigavel no seu produto.' },
      { titulo: 'Retentativa', descricao: 'Retente apenas erros temporarios ou 5xx.' },
      { titulo: 'Suporte', descricao: 'Envie requestId junto com relato de problema.' },
      { titulo: 'Validacao local', descricao: 'Valide payload antes de chamar a API.' },
    ],
  },
  'primeira-emissao': {
    slug: 'primeira-emissao',
    titulo: 'Primeira emissao',
    subtitulo: 'Fluxo completo para sair de zero ate a primeira NF-e em homologacao.',
    descricaoMeta: 'Passo a passo da primeira emissao usando a API Fiscal.',
    metodoPrincipal: 'FLOW',
    rotaPrincipal: 'Chave -> Empresa -> Certificado -> NF-e',
    destaques: ['5 passos', 'Homologacao', 'curl completo'],
    fluxo: [
      { titulo: '1. Criar chave', descricao: 'Crie uma chave de homologacao no painel.' },
      { titulo: '2. Criar empresa', descricao: 'Cadastre dados fiscais do emitente.' },
      { titulo: '3. Enviar certificado', descricao: 'Vincule o A1 ao CNPJ.' },
      { titulo: '4. Emitir nota', descricao: 'Envie NF-e ou NFC-e.' },
    ],
    checklist: [
      'Tenha acesso ao painel do cliente.',
      'Tenha certificado A1 e senha.',
      'Use homologacao para validar o primeiro fluxo.',
      'Guarde empresaId e documentoId retornados.',
    ],
    endpoints: [
      { metodo: 'POST', rota: '/api/v1/empresas', descricao: 'Cria empresa.' },
      { metodo: 'POST', rota: '/api/v1/empresas/{id}/certificado', descricao: 'Envia certificado.' },
      { metodo: 'POST', rota: '/api/v1/nfe', descricao: 'Emite NF-e.' },
      { metodo: 'GET', rota: '/api/v1/documentos/{id}', descricao: 'Consulta status.' },
    ],
    campos: [...camposAutenticacaoJson],
    codigos: [
      {
        titulo: 'Sequencia minima',
        codigo: `# 1) Empresa
curl -X POST "$BASE_URL/api/v1/empresas" -H "authorization: Bearer $API_TOKEN" -H "content-type: application/json" -d '{...}'

# 2) Certificado
curl -X POST "$BASE_URL/api/v1/empresas/$EMPRESA_ID/certificado" -H "authorization: Bearer $API_TOKEN" -F "certificate=@certificado.pfx" -F "password=senha"

# 3) NF-e
curl -X POST "$BASE_URL/api/v1/nfe" -H "authorization: Bearer $API_TOKEN" -H "content-type: application/json" -H "idempotency-key: primeira-nfe" -d '{...}'`,
      },
    ],
    respostas: [...respostasRecebimentoDocumento],
    estados: [...estadosDocumento],
    boasPraticas: [...boasPraticasDocumento],
  },
  endpoints: {
    slug: 'endpoints',
    titulo: 'Mapa de endpoints',
    subtitulo: 'Lista operacional dos endpoints publicos da API v1.',
    descricaoMeta: 'Mapa dos endpoints publicos da API Fiscal.',
    metodoPrincipal: 'INFO',
    rotaPrincipal: '/api/v1/*',
    destaques: ['Escopos', 'Modelos fiscais', 'Eventos'],
    fluxo: [
      { titulo: 'Empresas', descricao: 'Cadastro e certificado.' },
      { titulo: 'Documentos', descricao: 'Emissao, consulta, XML e PDF.' },
      { titulo: 'Eventos', descricao: 'Cancelamento, CC-e e inutilizacao.' },
      { titulo: 'Operacao', descricao: 'Webhooks e cobranca.' },
    ],
    checklist: [
      'Todos os endpoints publicos ficam em /api/v1.',
      'A maioria exige Authorization Bearer.',
      'Cada grupo exige um escopo.',
      'GET /webhooks/eventos e GET /cobranca/simular sao publicos.',
    ],
    endpoints: [
      { metodo: 'GET', rota: '/api/v1/empresas', descricao: 'empresas:ler' },
      { metodo: 'POST', rota: '/api/v1/empresas', descricao: 'empresas:escrever' },
      { metodo: 'POST', rota: '/api/v1/nfe', descricao: 'documentos:emitir' },
      { metodo: 'POST', rota: '/api/v1/nfce', descricao: 'documentos:emitir' },
      { metodo: 'GET', rota: '/api/v1/documentos', descricao: 'documentos:ler' },
      { metodo: 'POST', rota: '/api/v1/documentos/inutilizacao', descricao: 'documentos:eventos' },
      { metodo: 'GET', rota: '/api/v1/webhooks/eventos', descricao: 'publico' },
      { metodo: 'GET', rota: '/api/v1/cobranca/simular', descricao: 'publico' },
    ],
    campos: [
      { nome: 'documentos:emitir', tipo: 'escopo', obrigatorio: 'NF-e/NFC-e', descricao: 'Permite emitir documentos.' },
      { nome: 'documentos:ler', tipo: 'escopo', obrigatorio: 'Consulta', descricao: 'Permite listar, consultar, baixar XML e PDF.' },
      { nome: 'documentos:eventos', tipo: 'escopo', obrigatorio: 'Eventos', descricao: 'Permite cancelamento, CC-e e inutilizacao.' },
      { nome: 'webhooks:gerenciar', tipo: 'escopo', obrigatorio: 'Webhooks', descricao: 'Permite criar e listar webhooks.' },
    ],
    codigos: [
      {
        titulo: 'Base',
        codigo: 'BASE_URL=https://seu-dominio.com/api/v1',
      },
    ],
    respostas: [
      { codigo: '2xx', titulo: 'Sucesso', descricao: 'Operacao aceita ou concluida.' },
      { codigo: '401', titulo: 'Sem autenticacao', descricao: 'Token ausente ou sem escopo.' },
      { codigo: '4xx', titulo: 'Erro de entrada', descricao: 'Payload, parametros ou recurso invalido.' },
    ],
    estados: [],
    boasPraticas: [
      { titulo: 'Escopos', descricao: 'Crie chaves com permissoes coerentes.' },
      { titulo: 'OpenAPI', descricao: 'Use /docs/openapi.yaml para gerar clients.' },
      { titulo: 'Postman', descricao: 'Importe /docs/postman_collection.json para testar.' },
      { titulo: 'Versionamento', descricao: 'Integre sempre usando /api/v1.' },
    ],
  },
  sdks: {
    slug: 'sdks',
    titulo: 'SDKs e exemplos',
    subtitulo: 'Exemplos rapidos em TypeScript, PHP e Python.',
    descricaoMeta: 'Exemplos de integracao com a API Fiscal em diferentes linguagens.',
    metodoPrincipal: 'CODE',
    rotaPrincipal: 'Exemplos de integracao',
    destaques: ['TypeScript', 'PHP', 'Python'],
    fluxo: [
      { titulo: '1. Configure base URL', descricao: 'Use ambiente correto.' },
      { titulo: '2. Injete token', descricao: 'Leia o token de variavel segura.' },
      { titulo: '3. Envie JSON', descricao: 'Monte o payload conforme o endpoint.' },
      { titulo: '4. Trate erros', descricao: 'Use codigo e requestId.' },
    ],
    checklist: [
      'Nao coloque token fixo no codigo fonte.',
      'Implemente timeout e retentativa com idempotency-key.',
      'Logue requestId em erros.',
      'Valide resposta antes de assumir autorizacao fiscal.',
    ],
    endpoints: [
      { metodo: 'POST', rota: '/api/v1/nfe', descricao: 'Exemplo de emissao.' },
      { metodo: 'GET', rota: '/api/v1/documentos', descricao: 'Exemplo de consulta.' },
    ],
    campos: [...camposAutenticacaoJson],
    codigos: [
      {
        titulo: 'TypeScript',
        codigo: `const resposta = await fetch(BASE_URL + "/nfe", {
  method: "POST",
  headers: {
    authorization: \`Bearer \${apiToken}\`,
    "content-type": "application/json",
    "idempotency-key": "pedido-123-nfe"
  },
  body: JSON.stringify({ empresaId, itens })
});`,
      },
      {
        titulo: 'Python',
        codigo: `import requests

resposta = requests.get(
    f"{BASE_URL}/documentos",
    headers={"authorization": f"Bearer {api_token}"}
)
resposta.raise_for_status()`,
      },
    ],
    respostas: [
      { codigo: 'ok', titulo: 'Cliente simples', descricao: 'fetch, requests e curl ja sao suficientes para iniciar.' },
      { codigo: 'erro', titulo: 'Tratamento necessario', descricao: 'Sempre trate status HTTP diferente de 2xx.' },
    ],
    estados: [],
    boasPraticas: [
      { titulo: 'Client unico', descricao: 'Centralize headers e base URL.' },
      { titulo: 'Timeout', descricao: 'Defina timeout em todas as chamadas.' },
      { titulo: 'Tipos', descricao: 'Modele respostas principais no seu SDK.' },
      { titulo: 'Testes', descricao: 'Teste com homologacao antes de producao.' },
    ],
  },
};

export type SlugReferencia = string;

export const detalhesEndpoints: Record<string, {
  titulo: string;
  subtitulo: string;
  metodo: 'POST' | 'GET' | 'DEL';
  rota: string;
  descricaoMeta: string;
  campos?: CampoReferencia[];
  codigos?: CodigoReferencia[];
  respostas?: RespostaReferencia[];
  checklist?: string[];
  fluxo?: CartaoReferencia[];
  boasPraticas?: CartaoReferencia[];
  exemploJson?: string;
  retornoJson?: string;
  tituloRetorno?: string;
}> = {
  // NFCe Endpoints
  'emitir-nfce': {
    titulo: 'Emitir NFC-e modelo 65',
    subtitulo: 'Envia dados do cupom fiscal para homologação ou emissão em produção.',
    metodo: 'POST',
    rota: '/api/v1/nfce',
    descricaoMeta: 'Documentação do endpoint de emissão assíncrona de NFC-e modelo 65.'
  },
  'consultar-nfce': {
    titulo: 'Consultar NFC-e',
    subtitulo: 'Consulte o status operacional, chave de acesso e protocolo de uma NFC-e emitida.',
    metodo: 'GET',
    rota: '/api/v1/documentos/{id}',
    descricaoMeta: 'Como consultar o status e os dados de uma NFC-e autorizada ou rejeitada.'
  },
  'cancelar-nfce': {
    titulo: 'Cancelar NFC-e',
    subtitulo: 'Solicita o cancelamento de uma NFC-e autorizada dentro do prazo legal por UF.',
    metodo: 'DEL',
    rota: '/api/v1/documentos/{id}/cancelamento',
    descricaoMeta: 'Instruções para realizar o cancelamento de cupons fiscais NFC-e.'
  },
  'enviar-nfce-email': {
    titulo: 'Enviar NFC-e por E-mail',
    subtitulo: 'Envia o XML assinado e o PDF do DANFE para o e-mail do consumidor final.',
    metodo: 'POST',
    rota: '/api/v1/documentos/{id}/enviar-email',
    descricaoMeta: 'Envio automático de cupom fiscal NFC-e por e-mail.'
  },
  'inutilizar-numeracao-nfce': {
    titulo: 'Inutilizar Numeração NFC-e',
    subtitulo: 'Inutiliza faixas de numeração que foram puladas na sequência da NFC-e.',
    metodo: 'POST',
    rota: '/api/v1/documentos/inutilizacao',
    descricaoMeta: 'Como inutilizar numeração de cupons fiscais modelo 65.'
  },
  'consultar-inutilizacoes-nfce': {
    titulo: 'Consultar Inutilizações NFC-e',
    subtitulo: 'Consulta o status de homologação de faixas de numeração de NFC-e inutilizadas.',
    metodo: 'GET',
    rota: '/api/v1/documentos/inutilizacao/{id}',
    descricaoMeta: 'Listagem e consulta de numerações NFC-e inutilizadas.'
  },
  'registrar-econf-nfce': {
    titulo: 'Registrar Conciliação Financeira (ECONF) NFC-e',
    subtitulo: 'Vincula transações financeiras (cartão/PIX) a uma NFC-e autorizada.',
    metodo: 'POST',
    rota: '/api/v1/documentos/{id}/econf',
    descricaoMeta: 'Registro de conciliação de meio eletrônico de pagamento ECONF para NFC-e.'
  },
  'consultar-econf-nfce': {
    titulo: 'Consultar ECONF NFC-e',
    subtitulo: 'Consulta eventos de conciliação financeira vinculados a cupons fiscais NFC-e.',
    metodo: 'GET',
    rota: '/api/v1/documentos/{id}/econf',
    descricaoMeta: 'Verificar conciliações de pagamento vinculadas a cupons fiscais.'
  },

  // NFe Endpoints
  'emitir-nfe': {
    titulo: 'Emitir NF-e modelo 55',
    subtitulo: 'Recebe o payload da NF-e e inicia o envio para autorização na SEFAZ.',
    metodo: 'POST',
    rota: '/api/v1/nfe',
    descricaoMeta: 'Tudo sobre como emitir NF-e via API. Guia para desenvolvedores com exemplos de requisição, autorização e protocolos.',
    campos: [
      { nome: 'ref', tipo: 'string', obrigatorio: 'Sim (Query)', descricao: 'Referência única da NFe no seu sistema (ex: ID da venda ou pedido).' },
      { nome: 'natureza_operacao', tipo: 'string', obrigatorio: 'Sim (Body)', descricao: 'Descrição da natureza da operação (ex: Venda de mercadorias, Remessa de bens).' },
      { nome: 'data_emissao', tipo: 'date-time', obrigatorio: 'Sim (Body)', descricao: 'Data de emissão da NF-e em formato ISO 8601 com fuso horário.' },
      { nome: 'data_entrada_saida', tipo: 'date-time', obrigatorio: 'Não (Body)', descricao: 'Data de entrada ou saída real da mercadoria.' },
      { nome: 'tipo_documento', tipo: 'integer (0 ou 1)', obrigatorio: 'Sim (Body)', descricao: '0: Nota Fiscal de Entrada; 1: Nota Fiscal de Saída.' },
      { nome: 'local_destino', tipo: 'integer (1 a 3)', obrigatorio: 'Não (Body)', descricao: '1: Operação interna (dentro da UF); 2: Operação interestadual; 3: Operação com exterior.' },
      { nome: 'finalidade_emissao', tipo: 'integer (1 a 4)', obrigatorio: 'Sim (Body)', descricao: '1: Normal; 2: Complementar; 3: Nota de ajuste; 4: Devolução.' },
      { nome: 'consumidor_final', tipo: 'integer (0 ou 1)', obrigatorio: 'Não (Body)', descricao: '0: Não; 1: Consumidor final.' },
      { nome: 'presenca_comprador', tipo: 'integer (0 a 9)', obrigatorio: 'Não (Body)', descricao: 'Indicador de presença do comprador no estabelecimento comercial.' },
      { nome: 'cnpj_emitente', tipo: 'string', obrigatorio: 'Sim (Body)', descricao: 'CNPJ da empresa emitente responsável cadastrada.' }
    ],
    codigos: [
      {
        titulo: 'Exemplo de Emissão (JSON)',
        codigo: `{
  "cnpj_emitente": "12345678000123",
  "natureza_operacao": "Venda de mercadoria",
  "data_emissao": "2024-01-15T12:00:00-03:00",
  "tipo_documento": 1,
  "finalidade_emissao": 1,
  "itens": [
    {
      "codigo": "PROD001",
      "descricao": "Mouse Óptico Sem Fio USB",
      "ncm": "84716053",
      "cfop": "5102",
      "unidade": "UN",
      "quantidade": 2,
      "valor_unitario": 45.90,
      "valor_total": 91.80
    }
  ]
}`
      },
      {
        titulo: 'Retorno Assíncrono (202 Accepted)',
        codigo: `{
  "documentoId": "doc_nfe_20260525_xyz",
  "modelo": "NFE",
  "ambiente": "HOMOLOGACAO",
  "status": "RECEBIDA",
  "requestId": "req_nfe_987654321",
  "mensagem": "Documento fiscal recebido e enfileirado com sucesso para processamento."
}`
      }
    ],
    respostas: [
      { codigo: '202', titulo: 'Processamento Aceito', descricao: 'A nota foi gravada e enfileirada para transmissão em segundo plano para a SEFAZ.' },
      { codigo: '400', titulo: 'Payload Inválido', descricao: 'Erros de schema JSON, campos obrigatórios ausentes ou tipos de dados incorretos.' },
      { codigo: '401', titulo: 'Não Autorizado', descricao: 'Bearer Token ou chave de API inválida, ausente ou expirada.' },
      { codigo: '409', titulo: 'Conflito / Duplicidade', descricao: 'A chave de idempotência (idempotency-key) já foi utilizada para outra emissão.' }
    ],
    checklist: [
      'Gere e passe o parâmetro "ref" como query param para rastreabilidade única no seu ERP.',
      'Sempre utilize uma idempotency-key exclusiva no header para prevenir notas duplicadas.',
      'Utilize o ambiente de HOMOLOGAÇÃO com dados de teste antes de enviar notas operacionais reais.',
      'Os dados do destinatário e dos itens devem possuir NCM e CFOP válidos cadastrados no portal SEFAZ.'
    ],
    fluxo: [
      { titulo: '1. Enviar Payload', descricao: 'Seu sistema faz o POST enviando o JSON dos produtos e destinatário.' },
      { titulo: '2. Receber Protocolo', descricao: 'A API retorna um status 202 com o ID único da nota.' },
      { titulo: '3. Enfileiramento', descricao: 'A nota fiscal é assinada digitalmente com o certificado A1 da empresa.' },
      { titulo: '4. Resposta SEFAZ', descricao: 'A SEFAZ analisa e devolve o status, que é enviado ao seu webhook.' }
    ],
    boasPraticas: [
      { titulo: 'Fila & Webhook', descricao: 'Evite fazer polling excessivo. Confie no webhook de retorno para atualizar o status em tempo real.' },
      { titulo: 'CFOP e Tributação', descricao: 'Certifique-se de preencher a tributação correta (ICMS, PIS, COFINS) nos itens da nota para evitar rejeições.' }
    ],
    exemploJson: `{
  "cnpj_emitente": "12345678000123",
  "natureza_operacao": "Venda de mercadoria",
  "data_emissao": "2024-01-15T12:00:00-03:00",
  "tipo_documento": 1,
  "finalidade_emissao": 1,
  "itens": [
    {
      "codigo": "PROD001",
      "descricao": "Mouse Óptico Sem Fio USB",
      "ncm": "84716053",
      "cfop": "5102",
      "unidade": "UN",
      "quantidade": 2,
      "valor_unitario": 45.90,
      "valor_total": 91.80
    }
  ]
}`,
    retornoJson: `{
  "cnpj_emitente": "12345678000123",
  "ref": "referencia_000899_nfe",
  "status": "autorizado",
  "status_sefaz": "100",
  "mensagem_sefaz": "Autorizado o uso da NF-e",
  "chave_nfe": "NFe4119061234567800012355001000000022192309",
  "numero": "22",
  "serie": "1",
  "caminho_xml_nota_fiscal": "/arquivos/12345678000123/201906/NFe41190612345678000123550010000000221923094.xml",
  "caminho_danfe": "/arquivos/12345678000123/201906/DANFEs/NFe41190612345678000123550010000000221923094.pdf"
}`,
    tituloRetorno: '201 - NFe Autorizada'
  },
  'consultar-nfe': {
    titulo: 'Consultar NF-e',
    subtitulo: 'Consulte detalhes, XML, DANFE e eventos associados a uma NF-e por ID.',
    metodo: 'GET',
    rota: '/api/v1/documentos/{id}',
    descricaoMeta: 'Como consultar o status de autorização, rejeições ou eventos de uma NF-e.'
  },
  'cancelar-nfe': {
    titulo: 'Cancelar NF-e',
    subtitulo: 'Solicita o cancelamento de uma NF-e autorizada fornecendo justificativa legal.',
    metodo: 'DEL',
    rota: '/api/v1/documentos/{id}/cancelamento',
    descricaoMeta: 'Processo e prazo de cancelamento de notas fiscais eletrônicas.'
  },
  'carta-correcao-nfe': {
    titulo: 'Emitir Carta de Correção (CC-e) NF-e',
    subtitulo: 'Gera uma carta de correção para corrigir erros permitidos de uma NF-e.',
    metodo: 'POST',
    rota: '/api/v1/documentos/{id}/carta-correcao',
    descricaoMeta: 'Como emitir uma Carta de Correção Eletrônica (CC-e) para NF-e modelo 55.'
  },
  'registrar-ator-interessado-nfe': {
    titulo: 'Registrar Ator Interessado na NF-e',
    subtitulo: 'Autoriza CNPJ ou CPF de terceiros (ex: transportadora) a baixar o XML da NF-e.',
    metodo: 'POST',
    rota: '/api/v1/documentos/{id}/atores',
    descricaoMeta: 'Vincular transportadoras ou contabilidades para download do XML fiscal.'
  },
  'registrar-insucesso-entrega-nfe': {
    titulo: 'Registrar Insucesso na Entrega da NF-e',
    subtitulo: 'Registra o insucesso na tentativa de entrega de mercadorias associadas à NF-e.',
    metodo: 'POST',
    rota: '/api/v1/documentos/{id}/insucesso-entrega',
    descricaoMeta: 'Registro de evento de insucesso de entrega física de notas fiscais.'
  },
  'cancelar-insucesso-entrega-nfe': {
    titulo: 'Cancelar Insucesso na Entrega da NF-e',
    subtitulo: 'Cancela um evento de insucesso na entrega registrado anteriormente.',
    metodo: 'DEL',
    rota: '/api/v1/documentos/{id}/insucesso-entrega',
    descricaoMeta: 'Desfazimento de eventos de insucesso na entrega de mercadoria.'
  },
  'enviar-nfe-email': {
    titulo: 'Enviar NF-e por E-mail',
    subtitulo: 'Garante o envio legal do XML protocolado e DANFE para o cliente destinatário.',
    metodo: 'POST',
    rota: '/api/v1/documentos/{id}/enviar-email',
    descricaoMeta: 'Envio automático de XML e PDF de nota fiscal eletrônica por e-mail.'
  },
  'inutilizar-numeracao-nfe': {
    titulo: 'Inutilizar Numeração NF-e',
    subtitulo: 'Inutiliza intervalos de numeração de NF-e não utilizados devido a falhas operacionais.',
    metodo: 'POST',
    rota: '/api/v1/documentos/inutilizacao',
    descricaoMeta: 'Como inutilizar numeração de Notas Fiscais Eletrônicas modelo 55.'
  },
  'consultar-inutilizacoes-nfe': {
    titulo: 'Consultar Inutilizações NF-e',
    subtitulo: 'Consulta homologações de inutilizações de numeração solicitadas.',
    metodo: 'GET',
    rota: '/api/v1/documentos/inutilizacao/{id}',
    descricaoMeta: 'Verificação do status de homologação de inutilizações na SEFAZ.'
  },
  'importar-nfe': {
    titulo: 'Importar NF-e de Terceiros',
    subtitulo: 'Importa um XML de NF-e emitido por terceiros para registro na base de dados.',
    metodo: 'POST',
    rota: '/api/v1/documentos/importar',
    descricaoMeta: 'Importação de notas de entrada ou notas de terceiros via XML.'
  },
  'pre-visualizacao-danfe': {
    titulo: 'Pré-visualização de DANFe',
    subtitulo: 'Gera um PDF temporário para pré-visualizar o DANFE antes da transmissão oficial.',
    metodo: 'POST',
    rota: '/api/v1/nfe/pre-visualizar',
    descricaoMeta: 'Geração de PDF do DANFE em formato sandbox para conferência tributária.'
  },
  'registrar-econf-nfe': {
    titulo: 'Registrar Conciliação Financeira (ECONF) NF-e',
    subtitulo: 'Vincula pagamentos em meio eletrônico (cartões, Pix) a uma NF-e.',
    metodo: 'POST',
    rota: '/api/v1/documentos/{id}/econf',
    descricaoMeta: 'Evento ECONF para conciliação financeira de notas modelo 55.'
  },
  'consultar-econf-nfe': {
    titulo: 'Consultar ECONF NF-e',
    subtitulo: 'Consulta eventos de conciliação financeira vinculados à NF-e.',
    metodo: 'GET',
    rota: '/api/v1/documentos/{id}/econf',
    descricaoMeta: 'Consulta de conciliações eletrônicas homologadas na NF-e.'
  },
  'cancelar-econf-nfe': {
    titulo: 'Cancelar ECONF NF-e',
    subtitulo: 'Solicita o cancelamento de um evento de conciliação financeira ativo.',
    metodo: 'DEL',
    rota: '/api/v1/documentos/{id}/econf/cancelamento',
    descricaoMeta: 'Desfazimento de conciliação de pagamento eletrônico na NF-e.'
  },
  'emitir-evento-nfe': {
    titulo: 'Emitir Evento Genérico na NF-e',
    subtitulo: 'Gera e transmite eventos diversos autorizados pela SEFAZ.',
    metodo: 'POST',
    rota: '/api/v1/documentos/{id}/eventos',
    descricaoMeta: 'Registro de eventos fiscais gerais sob o CNPJ emitente.'
  },
  'cancelar-evento-nfe': {
    titulo: 'Cancelar Evento na NF-e',
    subtitulo: 'Solicita o cancelamento de um evento genérico registrado.',
    metodo: 'DEL',
    rota: '/api/v1/documentos/{id}/eventos/{eventoId}',
    descricaoMeta: 'Procedimento para revogação de eventos fiscais.'
  },
  'solicitar-reenvio-notificacao-nfe': {
    titulo: 'Solicitar Reenvio de Notificação de NF-e',
    subtitulo: 'Dispara novamente as notificações de webhooks agendadas para o documento.',
    metodo: 'POST',
    rota: '/api/v1/documentos/{id}/notificar',
    descricaoMeta: 'Reenvio de webhooks e alertas de processamento de notas.'
  }
};

export const slugsReferencia = [
  ...Object.keys(referencias),
  ...Object.keys(detalhesEndpoints)
] as string[];

export const paginasReferencia = Object.keys(referencias).map((slug) => ({
  slug,
  titulo: referencias[slug as keyof typeof referencias].titulo,
  href: `/docs/${slug}`,
}));

// (Removido e movido para sidebar-referencia.tsx)

export function gerarReferenciaDinamica(slug: string): ReferenciaApi | null {
  const detalhes = detalhesEndpoints[slug];
  if (!detalhes) return null;

  const ehNfce = slug.endsWith('-nfce');
  const modelo = ehNfce ? '65' : '55';

  const defaultExemplo = detalhes.metodo === 'POST' ? JSON.stringify({
    empresaId: "empresa_123",
    justificativa: "Motivo fiscal da solicitação ou evento"
  }, null, 2) : undefined;

  const defaultRetorno = JSON.stringify({
    status: "processado",
    mensagem: "Operação processada ou recebida com sucesso.",
    requestId: "req_fiscal_987654321"
  }, null, 2);

  return {
    slug,
    titulo: detalhes.titulo,
    subtitulo: detalhes.subtitulo,
    descricaoMeta: detalhes.descricaoMeta,
    metodoPrincipal: detalhes.metodo,
    rotaPrincipal: detalhes.rota,
    destaques: [
      detalhes.metodo,
      `Modelo ${modelo}`,
      'Retorno JSON'
    ],
    fluxo: detalhes.fluxo || [
      { titulo: '1. Enviar Request', descricao: `Seu sistema dispara o request ${detalhes.metodo} para a rota.` },
      { titulo: '2. Validar Token', descricao: 'A API valida o Bearer Token e identifica a empresa.' },
      { titulo: '3. Processar SEFAZ', descricao: 'As ações são transmitidas e assinadas em background.' },
      { titulo: '4. Receber Callback', descricao: 'O status final é disparado via Webhook cadastrado.' }
    ],
    checklist: detalhes.checklist || [
      `Garanta que a empresa emitente correspondente está ativa no ambiente.`,
      `Confira se o certificado digital A1 está no prazo de validade.`,
      `Trate retornos 202 (Aceito) de processamento assíncrono.`,
      `Guarde o requestId retornado para suporte e auditoria.`
    ],
    endpoints: [
      { metodo: detalhes.metodo, rota: detalhes.rota, descricao: detalhes.subtitulo }
    ],
    campos: detalhes.campos || [
      { nome: 'empresaId', tipo: 'string', obrigatorio: 'Sim', descricao: 'ID da empresa emitente cadastrada na plataforma.' },
      { nome: 'justificativa', tipo: 'string', obrigatorio: detalhes.metodo === 'DEL' ? 'Sim' : 'Não', descricao: 'Texto descritivo explicando a motivação do evento.' }
    ],
    codigos: detalhes.codigos || [
      {
        titulo: 'Exemplo de cURL',
        codigo: `curl -X ${detalhes.metodo} "$BASE_URL${detalhes.rota}" \\
  -H "authorization: Bearer $API_TOKEN" \\
  -H "content-type: application/json"`
      }
    ],
    respostas: detalhes.respostas || [
      { codigo: '200 | 202', titulo: 'Sucesso', descricao: 'Ação registrada ou processada com sucesso.' },
      { codigo: '400', titulo: 'Erro de validação', descricao: 'Parâmetros inválidos ou campos obrigatórios ausentes.' },
      { codigo: '401', titulo: 'Não autorizado', descricao: 'Token inválido ou sem escopo adequado.' }
    ],
    estados: ['RECEBIDA', 'EM_PROCESSAMENTO', 'AUTORIZADO', 'FALHA_NA_SEFAZ'],
    boasPraticas: detalhes.boasPraticas || [
      { titulo: 'Idempotência', descricao: 'Sempre fornece uma idempotency-key para evitar envios duplicados.' },
      { titulo: 'Processamento', descricao: 'Aguarde o webhook de retorno e evite fazer polling excessivo.' }
    ],
    exemploJson: detalhes.exemploJson || defaultExemplo,
    retornoJson: detalhes.retornoJson || defaultRetorno,
    tituloRetorno: detalhes.tituloRetorno || (detalhes.metodo === 'POST' ? '202 - Accepted' : '200 - OK')
  };
}

export function obterReferencia(slug: string): ReferenciaApi | null {
  if (Object.prototype.hasOwnProperty.call(referencias, slug)) {
    const ref = referencias[slug as keyof typeof referencias];
    if (!ref.retornoJson) {
      ref.retornoJson = JSON.stringify({
        status: "sucesso",
        mensagem: "Operação executada com sucesso.",
        requestId: "req_static_docs_999"
      }, null, 2);
    }
    if (!ref.tituloRetorno) {
      ref.tituloRetorno = "200 - OK";
    }
    return ref;
  }

  const refDinamica = gerarReferenciaDinamica(slug);
  if (refDinamica) {
    return refDinamica;
  }

  return null;
}

function DistintivoMetodo({ metodo }: { metodo: string }) {
  return <span className={`metodo-distintivo metodo-${metodo.toLowerCase()}`}>{metodo}</span>;
}

function TabelaCampos({ campos }: { campos: readonly CampoReferencia[] }) {
  if (campos.length === 0) {
    return <p className="empty-state">Esta pagina nao exige campos especificos.</p>;
  }

  return (
    <div className="tabela-referencia">
      <table>
        <thead>
          <tr>
            <th>Campo</th>
            <th>Tipo</th>
            <th>Obrigatorio</th>
            <th>Descricao</th>
          </tr>
        </thead>
        <tbody>
          {campos.map((campo) => (
            <tr key={`${campo.nome}-${campo.tipo}`}>
              <td>
                <code>{campo.nome}</code>
              </td>
              <td>{campo.tipo}</td>
              <td>{campo.obrigatorio}</td>
              <td>{campo.descricao}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ListaEndpoints({ endpoints }: { endpoints: readonly EndpointReferencia[] }) {
  if (endpoints.length === 0) {
    return <p className="empty-state">Nao ha endpoints especificos nesta pagina.</p>;
  }

  return (
    <div className="lista-endpoints-relacionados">
      {endpoints.map((endpoint) => (
        <div key={`${endpoint.metodo}-${endpoint.rota}`}>
          <DistintivoMetodo metodo={endpoint.metodo} />
          <code>{endpoint.rota}</code>
          <p>{endpoint.descricao}</p>
        </div>
      ))}
    </div>
  );
}

export function IndiceReferenciasApi() {
  return (
    <div className="pagina-referencia-api">
      <CabecalhoDocs />
      <section className="hero-referencia">
        <div>
          <span className="eyebrow-doc">Documentacao visual</span>
          <h1>API Fiscal</h1>
          <p>
            Referencias praticas para integrar emissao, consulta, eventos, webhooks, cobranca e
            autenticacao da API de NF-e e NFC-e.
          </p>
        </div>
        <div className="cartao-endpoint">
          <div className="linha-endpoint">
            <DistintivoMetodo metodo="INFO" />
            <code>/docs</code>
          </div>
          <span>Guias por assunto</span>
          <span>Exemplos de request</span>
          <span>Links para OpenAPI e Postman</span>
        </div>
      </section>
      <main className="indice-doc-publica">
        {paginasReferencia.map((pagina) => (
          <Link className="cartao-doc-publica" href={pagina.href} key={pagina.slug}>
            <strong>{pagina.titulo}</strong>
            <code>{pagina.href}</code>
          </Link>
        ))}
      </main>
    </div>
  );
}

function CabecalhoDocs() {
  return (
    <header className="cabecalho-doc-publica">
      <Link className="marca-doc" href="/docs" aria-label="API Fiscal">
        <span>AF</span>
        <strong>API Fiscal</strong>
      </Link>
      <nav className="acoes-doc">
        <Link href="/docs">Referencias</Link>
        <a href="/docs/openapi.yaml">OpenAPI</a>
        <a href="/docs/postman_collection.json">Postman</a>
        <Link className="botao-doc" href="/login">Entrar</Link>
      </nav>
    </header>
  );
}

export function ReferenciaApiVisual({ pagina }: { pagina: ReferenciaApi }) {
  return (
    <div className="pagina-referencia-api">
      <CabecalhoDocs />

      <div className="layout-referencia">
        <SidebarReferencia activeSlug={pagina.slug} />

        <main className="conteudo-referencia">
          <div className="topo-conteudo-referencia" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '8px' }}>
            <span className="eyebrow-doc" style={{ fontSize: '11px', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Referência da API</span>
            <h1 style={{ fontSize: '32px', fontWeight: '800', margin: '8px 0 12px', color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: '1.1' }}>{pagina.titulo}</h1>
            <p style={{ fontSize: '15px', color: 'var(--muted)', lineHeight: '1.6', margin: '0 0 16px', maxWidth: '720px' }}>{pagina.subtitulo}</p>
          </div>
          <section id="visao-geral" className="secao-referencia">
            <div className="titulo-secao-referencia">
              <span>01</span>
              <div>
                <h2>Visao geral</h2>
                <p>{pagina.subtitulo}</p>
              </div>
            </div>
            <div className="grade-fluxo">
              {pagina.fluxo.map((item) => (
                <div key={item.titulo}>
                  <strong>{item.titulo}</strong>
                  <p>{item.descricao}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="antes-de-usar" className="secao-referencia">
            <div className="titulo-secao-referencia">
              <span>02</span>
              <div>
                <h2>Antes de usar</h2>
                <p>Checklist rapido para evitar bloqueios comuns de integracao.</p>
              </div>
            </div>
            <ul className="lista-check-doc">
              {pagina.checklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section id="endpoints" className="secao-referencia">
            <div className="titulo-secao-referencia">
              <span>03</span>
              <div>
                <h2>Endpoints</h2>
                <p>Rotas usadas neste assunto.</p>
              </div>
            </div>
            <ListaEndpoints endpoints={pagina.endpoints} />
          </section>

          <section id="campos" className="secao-referencia">
            <div className="titulo-secao-referencia">
              <span>04</span>
              <div>
                <h2>Campos</h2>
                <p>Campos, headers ou parametros principais.</p>
              </div>
            </div>
            <TabelaCampos campos={pagina.campos} />
          </section>

          <section id="exemplos" className="secao-referencia">
            <div className="titulo-secao-referencia">
              <span>05</span>
              <div>
                <h2>Exemplos</h2>
                <p>Requests e respostas para acelerar a integracao.</p>
              </div>
            </div>
            <div className="grade-codigos">
              {pagina.codigos.map((codigo) => (
                <div key={codigo.titulo}>
                  <h3>{codigo.titulo}</h3>
                  <pre className="code-block">{codigo.codigo}</pre>
                </div>
              ))}
            </div>
          </section>

          <section id="respostas" className="secao-referencia">
            <div className="titulo-secao-referencia">
              <span>06</span>
              <div>
                <h2>Respostas e status</h2>
                <p>Separe status HTTP do estado operacional ou fiscal.</p>
              </div>
            </div>
            <div className="grade-respostas">
              {pagina.respostas.map((resposta) => (
                <div key={`${resposta.codigo}-${resposta.titulo}`}>
                  <span>{resposta.codigo}</span>
                  <strong>{resposta.titulo}</strong>
                  <p>{resposta.descricao}</p>
                </div>
              ))}
            </div>
            {pagina.estados.length > 0 ? (
              <div className="linha-estados">
                {pagina.estados.map((estado) => (
                  <code key={estado}>{estado}</code>
                ))}
              </div>
            ) : null}
          </section>

          <section id="boas-praticas" className="secao-referencia">
            <div className="titulo-secao-referencia">
              <span>07</span>
              <div>
                <h2>Boas praticas</h2>
                <p>Regras simples para reduzir rejeicoes e problemas de suporte.</p>
              </div>
            </div>
            <div className="grade-praticas">
              {pagina.boasPraticas.map((item) => (
                <div key={item.titulo}>
                  <strong>{item.titulo}</strong>
                  <p>{item.descricao}</p>
                </div>
              ))}
            </div>
          </section>
        </main>

        <PlaygroundReferencia
          metodo={pagina.metodoPrincipal as any}
          rota={pagina.rotaPrincipal}
          exemploJson={pagina.exemploJson}
          retornoJson={pagina.retornoJson}
          tituloRetorno={pagina.tituloRetorno}
        />
      </div>
    </div>
  );
}
