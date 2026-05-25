# Emissao de NFC-e

Endpoint:

```http
POST /api/v1/nfce
```

Escopo: `documentos:emitir`.

## Exemplo

```bash
curl -X POST "$BASE_URL/api/v1/nfce" \
  -H "authorization: Bearer $API_TOKEN" \
  -H "content-type: application/json" \
  -H "idempotency-key: venda-123-nfce" \
  -d '{
    "empresaId": "empresa_id",
    "naturezaOperacao": "Venda ao consumidor",
    "valorTotal": 25.9,
    "consumidor": {
      "nome": "Consumidor Final"
    },
    "pagamentos": [
      { "tPag": "01", "vPag": 25.9 }
    ],
    "itens": [
      {
        "codigo": "ITEM1",
        "descricao": "Produto NFC-e",
        "ncm": "00000000",
        "cfop": "5102",
        "unidade": "UN",
        "quantidade": 1,
        "valorUnitario": 25.9,
        "valorTotal": 25.9
      }
    ]
  }'
```

Resposta igual ao fluxo da NF-e, com `modelo` igual a `NFCE`.

