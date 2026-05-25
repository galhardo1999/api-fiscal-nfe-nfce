# Empresas emitentes

Empresas sao os CNPJs que emitem NF-e e NFC-e dentro do cliente contratante.

## Listar empresas

```bash
curl "$BASE_URL/api/v1/empresas" \
  -H "authorization: Bearer $API_TOKEN"
```

## Criar empresa

```bash
curl -X POST "$BASE_URL/api/v1/empresas" \
  -H "authorization: Bearer $API_TOKEN" \
  -H "content-type: application/json" \
  -d '{
    "cnpj": "00000000000191",
    "nome": "Empresa Exemplo LTDA",
    "nomeFantasia": "Empresa Exemplo",
    "ie": "123456789",
    "crt": "3",
    "logradouro": "Rua Exemplo",
    "numero": "100",
    "bairro": "Centro",
    "municipio": "Sao Paulo",
    "uf": "SP",
    "cep": "01001000",
    "telefone": "1140000000",
    "email": "fiscal@empresa.com.br"
  }'
```

Campos obrigatorios: `cnpj`, `nome`, `ie`, `logradouro`, `numero`, `bairro`, `municipio`, `uf`, `cep`.

Para NFC-e, informe `csc` e `idCsc` quando aplicavel.

