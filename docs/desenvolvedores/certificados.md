# Certificado A1

O certificado A1 deve ser enviado em `multipart/form-data`.

## Enviar certificado

```bash
curl -X POST "$BASE_URL/api/v1/empresas/$EMPRESA_ID/certificado" \
  -H "authorization: Bearer $API_TOKEN" \
  -F "certificate=@certificado.pfx" \
  -F "password=senha-do-certificado"
```

## Regras

- Extensoes aceitas: `.pfx` e `.p12`.
- Tamanho maximo: 2 MB.
- O CNPJ do certificado deve pertencer a empresa emitente.
- A senha e salva criptografada.

## Resposta

```json
{
  "requestId": "...",
  "certificado": {
    "id": "...",
    "nome": "certificado.pfx",
    "emissor": "...",
    "serie": "...",
    "validoAte": "2027-01-01T00:00:00.000Z",
    "active": true
  }
}
```

