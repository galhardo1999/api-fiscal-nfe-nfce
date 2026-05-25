# Autenticacao

A API publica usa API key por cliente, ambiente e escopos.

## Headers

Use um dos formatos:

```http
Authorization: Bearer af_test_xxxxxxxxxxxx.segredo
```

ou:

```http
x-api-key: af_test_xxxxxxxxxxxx.segredo
```

Headers recomendados em todas as requisicoes:

```http
content-type: application/json
x-request-id: req-opcional-do-cliente
```

Para emissao, use tambem:

```http
idempotency-key: pedido-123-nfe
```

## Prefixos

- `af_test_`: chave de homologacao.
- `af_live_`: chave de producao.

## Escopos

- `documentos:emitir`
- `documentos:ler`
- `documentos:eventos`
- `empresas:ler`
- `empresas:escrever`
- `webhooks:gerenciar`
- `cobranca:ler`

## Token exibido uma vez

O token completo aparece somente quando a chave e criada. Depois disso, a API armazena apenas o hash seguro.

