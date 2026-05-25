# Webhooks

Webhooks notificam mudancas no ciclo de vida dos documentos.

## Eventos disponiveis

- `documento.recebido`
- `documento.autorizado`
- `documento.rejeitado`
- `documento.cancelado`
- `documento.contingencia`
- `documento.inutilizado`
- `documento.cancelamento.recebido`
- `documento.carta_correcao.recebida`
- `certificado.vencendo`

## Listar eventos

```bash
curl "$BASE_URL/api/v1/webhooks/eventos"
```

## Cadastrar endpoint

```bash
curl -X POST "$BASE_URL/api/v1/webhooks" \
  -H "authorization: Bearer $API_TOKEN" \
  -H "content-type: application/json" \
  -d '{
    "url": "https://sistema-cliente.com/webhooks/api-fiscal",
    "eventos": ["documento.recebido", "documento.rejeitado", "documento.cancelado"]
  }'
```

A resposta retorna `segredo`. Guarde para validar assinatura HMAC quando o worker de entrega estiver habilitado.

## Payload esperado

```json
{
  "evento": "documento.recebido",
  "documentoId": "...",
  "modelo": "NFE",
  "ambiente": "HOMOLOGACAO",
  "status": "ENFILEIRADA",
  "requestId": "..."
}
```

O endpoint do cliente deve responder HTTP `2xx`.

