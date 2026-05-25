# Documentos fiscais

## Listar

```bash
curl "$BASE_URL/api/v1/documentos?modelo=NFE&status=AUTORIZADA&page=1&limit=20" \
  -H "authorization: Bearer $API_TOKEN"
```

Filtros:

- `modelo`: `NFE` ou `NFCE`.
- `status`: status da maquina de estados.
- `page`: pagina.
- `limit`: maximo 100.

## Consultar detalhe

```bash
curl "$BASE_URL/api/v1/documentos/$DOCUMENTO_ID" \
  -H "authorization: Bearer $API_TOKEN"
```

## Baixar XML

```bash
curl "$BASE_URL/api/v1/documentos/$DOCUMENTO_ID/xml" \
  -H "authorization: Bearer $API_TOKEN"
```

Se ainda nao houver XML disponivel, a API retorna `409 XML_AINDA_INDISPONIVEL`.

## Baixar PDF

```bash
curl "$BASE_URL/api/v1/documentos/$DOCUMENTO_ID/pdf" \
  -H "authorization: Bearer $API_TOKEN" \
  --output danfe.pdf
```

Se ainda nao houver PDF disponivel, a API retorna `409 PDF_AINDA_INDISPONIVEL`.

## Estados

- `RECEBIDA`
- `VALIDANDO`
- `XML_GERADO`
- `ASSINADA`
- `ENFILEIRADA`
- `ENVIANDO_SEFAZ`
- `AUTORIZADA`
- `REJEITADA`
- `DENEGADA`
- `CANCELADA`
- `CONTINGENCIA`
- `INUTILIZADA`
- `ERRO_TECNICO`

