# API publica v1

Para a documentacao completa de integracao, consulte `docs/desenvolvedores/README.md`.

## Status

Esta fase implementa a fundacao SaaS para venda por cliente:

- chaves de API por cliente, ambiente e escopos;
- cadastro/listagem de empresas emitentes;
- upload de certificado A1 por empresa;
- recebimento assincrono de NF-e e NFC-e;
- outbox de documentos fiscais, eventos e webhooks;
- simulacao e consulta de cobranca mensal;
- contratos REST versionados em `/api/v1`.

A transmissao real para a SEFAZ deve ser feita por um worker que consuma `documentos_fiscais` com status `ENFILEIRADA` e use `src/lib/fiscal`.

## Criar chave de API

```bash
curl -X POST http://localhost:3000/api/v1/chaves-api \
  -H "content-type: application/json" \
  -H "x-admin-token: $ADMIN_API_TOKEN" \
  -d '{
    "clientId": "cliente_id",
    "nome": "Integracao principal",
    "ambiente": "HOMOLOGACAO"
  }'
```

O campo `token` da resposta aparece uma unica vez.

## Emitir documento

```bash
curl -X POST http://localhost:3000/api/v1/nfe \
  -H "authorization: Bearer $API_TOKEN" \
  -H "content-type: application/json" \
  -H "idempotency-key: pedido-123-nfe" \
  -d '{
    "empresaId": "empresa_id",
    "naturezaOperacao": "Venda",
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
        "valorTotal": 100
      }
    ]
  }'
```

Resposta esperada na fase atual:

```json
{
  "documentoId": "...",
  "modelo": "NFE",
  "ambiente": "HOMOLOGACAO",
  "status": "ENFILEIRADA"
}
```

## Cobranca

A cobranca usa faixa unica por volume mensal:

| Volume mensal | Preco aplicado em todas as notas |
| --- | ---: |
| 0 a 100 | R$ 0,90 |
| 101 a 350 | R$ 0,79 |
| 351+ | R$ 0,69 |

Minimo mensal: R$ 69,90.

Simulacao:

```bash
curl "http://localhost:3000/api/v1/cobranca/simular?notas=351"
```
