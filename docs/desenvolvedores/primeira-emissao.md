# Primeira emissao

Este fluxo usa homologacao.

## 1. Criar chave

No painel, acesse `Chaves de API`, clique em `Criar Chave API`, selecione `Homologacao` e copie o token.

## 2. Cadastrar empresa

```bash
curl -X POST "$BASE_URL/api/v1/empresas" \
  -H "authorization: Bearer $API_TOKEN" \
  -H "content-type: application/json" \
  -d '{
    "cnpj": "00000000000191",
    "nome": "Empresa Exemplo LTDA",
    "ie": "123456789",
    "logradouro": "Rua Exemplo",
    "numero": "100",
    "bairro": "Centro",
    "municipio": "Sao Paulo",
    "uf": "SP",
    "cep": "01001000"
  }'
```

Guarde o `empresa.id` retornado.

## 3. Enviar certificado

```bash
curl -X POST "$BASE_URL/api/v1/empresas/$EMPRESA_ID/certificado" \
  -H "authorization: Bearer $API_TOKEN" \
  -F "certificate=@certificado.pfx" \
  -F "password=senha-do-certificado"
```

## 4. Emitir nota

```bash
curl -X POST "$BASE_URL/api/v1/nfe" \
  -H "authorization: Bearer $API_TOKEN" \
  -H "content-type: application/json" \
  -H "idempotency-key: primeira-nfe" \
  -d '{
    "empresaId": "'$EMPRESA_ID'",
    "valorTotal": 100,
    "itens": [
      {
        "descricao": "Produto de teste",
        "quantidade": 1,
        "valorUnitario": 100,
        "valorTotal": 100
      }
    ]
  }'
```

## 5. Consultar status

```bash
curl "$BASE_URL/api/v1/documentos/$DOCUMENTO_ID" \
  -H "authorization: Bearer $API_TOKEN"
```

