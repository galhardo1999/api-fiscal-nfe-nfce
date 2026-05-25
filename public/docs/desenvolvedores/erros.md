# Erros

Todas as respostas de erro seguem o formato:

```json
{
  "codigo": "VALIDACAO_FALHOU",
  "mensagem": "Payload invalido.",
  "requestId": "...",
  "detalhes": ["campo obrigatorio"]
}
```

## Codigos comuns

| Codigo | HTTP | Significado |
| --- | ---: | --- |
| `NAO_AUTORIZADO` | 401 | Token ausente, invalido ou sem escopo. |
| `JSON_INVALIDO` | 400 | Corpo nao e JSON valido. |
| `PAYLOAD_INVALIDO` | 400 | Corpo nao segue o formato esperado. |
| `VALIDACAO_FALHOU` | 400 | Campos obrigatorios ausentes ou invalidos. |
| `EMPRESA_NAO_ENCONTRADA` | 404 | Empresa nao existe para o cliente. |
| `EMPRESA_DUPLICADA` | 409 | CNPJ ja cadastrado no cliente. |
| `CERTIFICADO_INVALIDO` | 422 | Certificado ou senha invalidos. |
| `DOCUMENTO_NAO_ENCONTRADO` | 404 | Documento nao encontrado no ambiente da chave. |
| `XML_AINDA_INDISPONIVEL` | 409 | XML ainda nao foi gerado/processado. |
| `PDF_AINDA_INDISPONIVEL` | 409 | DANFE ainda nao esta disponivel. |
| `ERRO_INTERNO` | 500 | Falha inesperada. |

