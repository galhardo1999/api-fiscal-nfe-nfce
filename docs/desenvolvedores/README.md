# Documentacao para desenvolvedores

Esta documentacao orienta integradores que vao usar a API Fiscal para emitir NF-e modelo 55 e NFC-e modelo 65.

## Comece em 5 minutos

1. Acesse o painel do cliente.
2. Va em `Chaves de API` e crie uma chave de `HOMOLOGACAO`.
3. Copie o token exibido uma unica vez.
4. Cadastre a empresa emitente em `POST /api/v1/empresas`.
5. Envie o certificado A1 em `POST /api/v1/empresas/{empresaId}/certificado`.
6. Envie uma NF-e em `POST /api/v1/nfe` ou uma NFC-e em `POST /api/v1/nfce`.
7. Consulte o documento em `GET /api/v1/documentos/{id}`.

## Arquivos

- `autenticacao.md`: API keys, headers e escopos.
- `ambientes.md`: homologacao, producao e idempotencia.
- `primeira-emissao.md`: fluxo completo inicial.
- `endpoints.md`: tabela resumida de endpoints.
- `empresas.md`: cadastro de empresas emitentes.
- `certificados.md`: envio seguro de certificado A1.
- `emissao-nfe.md`: exemplo de NF-e.
- `emissao-nfce.md`: exemplo de NFC-e.
- `documentos.md`: consulta, XML e PDF.
- `eventos.md`: cancelamento, CC-e e inutilizacao.
- `webhooks.md`: cadastro, eventos e payloads.
- `cobranca.md`: regra de cobranca por nota.
- `erros.md`: padrao de erro da API.
- `sdks-e-exemplos.md`: exemplos em TypeScript, PHP e Python.
- `changelog.md`: versoes da API.

## Recursos importaveis

- OpenAPI: `docs/openapi.yaml`
- Postman: `docs/postman_collection.json`
