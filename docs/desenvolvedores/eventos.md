# Eventos fiscais

## Cancelamento

```bash
curl -X POST "$BASE_URL/api/v1/documentos/$DOCUMENTO_ID/cancelamento" \
  -H "authorization: Bearer $API_TOKEN" \
  -H "content-type: application/json" \
  -d '{
    "justificativa": "Cancelamento solicitado por erro operacional."
  }'
```

A justificativa deve ter pelo menos 15 caracteres.

## Carta de correcao

Disponivel apenas para NF-e.

```bash
curl -X POST "$BASE_URL/api/v1/documentos/$DOCUMENTO_ID/carta-correcao" \
  -H "authorization: Bearer $API_TOKEN" \
  -H "content-type: application/json" \
  -d '{
    "correcao": "Corrigir informacoes adicionais sem alterar valores fiscais."
  }'
```

`correcao` deve ter entre 15 e 1000 caracteres.

## Inutilizacao

```bash
curl -X POST "$BASE_URL/api/v1/documentos/inutilizacao" \
  -H "authorization: Bearer $API_TOKEN" \
  -H "content-type: application/json" \
  -d '{
    "empresaId": "empresa_id",
    "modelo": "NFE",
    "serie": 1,
    "numeroInicial": 10,
    "numeroFinal": 12,
    "justificativa": "Inutilizacao por quebra tecnica de sequencia."
  }'
```

Escopo dos eventos: `documentos:eventos`.

