# API Fiscal NF-e/NFC-e

Projeto base para API fiscal SaaS de NF-e modelo 55 e NFC-e modelo 65, com autenticacao por API key, painel para o cliente gerar chaves, cadastro de empresas emitentes, certificado A1, documentos fiscais, webhooks e cobranca por nota emitida.

## Estrutura atual

- `src/lib/fiscal`: geracao de chave, XML, assinatura digital, SOAP SEFAZ, QR Code NFC-e, DANFE e schemas XSD.
- `src/app/api/v1`: contratos publicos da API fiscal.
- `src/app/api/painel`: endpoints internos usados pelo painel autenticado.
- `src/app/login` e `src/app/painel`: interface para o cliente acessar e gerar chaves de homologacao/producao.
- `src/lib/api-publica`: autenticacao por API key, validacao, respostas e registro de documentos.
- `src/lib/cobranca`: regra de cobranca por nota e testes.
- `src/lib/certificados`: leitura e validacao de certificado A1.
- `prisma/schema.prisma`: schema enxuto, sem modelos de ERP/PDV/financeiro legado.
- `docs/desenvolvedores`: documentacao para integradores.
- `docs/openapi.yaml` e `docs/postman_collection.json`: contratos importaveis.

## Comandos base

```bash
bun install
bun run prisma:generate
bun run db:seed
bun run test
bun run dev
```

## API publica SaaS fiscal

### Autenticacao

- Crie chaves em `POST /api/v1/chaves-api` usando `x-admin-token: $ADMIN_API_TOKEN`.
- Use o token retornado uma unica vez como `Authorization: Bearer <token>` ou `x-api-key: <token>`.
- As chaves possuem ambiente (`HOMOLOGACAO` ou `PRODUCAO`) e escopos.

### Endpoints principais

- `GET /api/v1/cobranca/simular?notas=150`
- `GET /api/v1/cobranca/uso?anoMes=2026-05`
- `GET /api/v1/empresas`
- `POST /api/v1/empresas`
- `POST /api/v1/empresas/{id}/certificado`
- `POST /api/v1/nfe`
- `POST /api/v1/nfce`
- `GET /api/v1/documentos`
- `GET /api/v1/documentos/{id}`
- `GET /api/v1/documentos/{id}/xml`
- `GET /api/v1/documentos/{id}/pdf`
- `POST /api/v1/documentos/{id}/cancelamento`
- `POST /api/v1/documentos/{id}/carta-correcao`
- `POST /api/v1/documentos/inutilizacao`
- `GET /api/v1/webhooks`
- `POST /api/v1/webhooks`
- `GET /api/v1/webhooks/eventos`

### Cobranca por nota

A regra implementada em `src/lib/cobranca/cobranca.ts` usa faixa unica pelo volume mensal:

- ate 100 notas/mes: R$ 0,90 por nota;
- de 101 ate 350 notas/mes: R$ 0,79 por nota, aplicado sobre todas as notas do mes;
- acima de 350 notas/mes: R$ 0,69 por nota, aplicado sobre todas as notas do mes;
- minimo mensal por cliente: R$ 69,90.

Exemplo: 150 notas custam `150 x 0,79 = R$ 118,50`; 351 notas custam `351 x 0,69 = R$ 242,19`.

### Estado atual da implementacao

A API publica recebe e registra documentos como `ENFILEIRADA`, criando itens, eventos, auditoria e entregas de webhook pendentes. A transmissao assincrona real para a SEFAZ deve ser ligada em worker separado usando os modulos fiscais existentes em `src/lib/fiscal`.

Proximas etapas tecnicas:

- worker de emissao para consumir `documentos_fiscais` com status `ENFILEIRADA`;
- worker de webhooks com assinatura HMAC e retry;
- sincronizacao do worker com `Nfe`, `NfeItem`, `NfeEvento` e XML protocolado;
- tela/admin para clientes, chaves, consumo e suporte.
