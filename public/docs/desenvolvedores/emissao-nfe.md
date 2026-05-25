# Emissao de NF-e

Endpoint:

```http
POST /api/v1/nfe
```

Escopo: `documentos:emitir`.

## Exemplo

```bash
curl -X POST "$BASE_URL/api/v1/nfe" \
  -H "authorization: Bearer $API_TOKEN" \
  -H "content-type: application/json" \
  -H "idempotency-key: pedido-123-nfe" \
  -d '{
    "empresaId": "empresa_id",
    "naturezaOperacao": "Venda de mercadoria",
    "valorTotal": 100,
    "destinatario": {
      "nome": "Cliente Exemplo",
      "documento": "00000000000"
    },
    "itens": [
      {
        "codigo": "PROD1",
        "descricao": "Produto de teste",
        "ncm": "00000000",
        "cfop": "5102",
        "unidade": "UN",
        "quantidade": 1,
        "valorUnitario": 100,
        "valorTotal": 100,
        "tributos": {
          "icms": { "origem": "0", "cst": "00" }
        }
      }
    ]
  }'
```

## Resposta

```json
{
  "requestId": "...",
  "documentoId": "...",
  "modelo": "NFE",
  "ambiente": "HOMOLOGACAO",
  "status": "ENFILEIRADA",
  "idempotente": false,
  "links": {
    "self": "/api/v1/documentos/...",
    "xml": "/api/v1/documentos/.../xml",
    "pdf": "/api/v1/documentos/.../pdf"
  }
}
```

