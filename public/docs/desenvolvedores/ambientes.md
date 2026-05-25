# Ambientes

A chave define o ambiente de operacao:

- `HOMOLOGACAO`: testes sem valor fiscal real.
- `PRODUCAO`: emissao real.

O mesmo endpoint e usado nos dois ambientes. A API identifica o ambiente pela chave enviada.

## Base URL

Local:

```txt
http://localhost:3000/api/v1
```

Producao:

```txt
https://seu-dominio.com/api/v1
```

## Idempotencia

Envie `idempotency-key` em toda emissao. Se houver retry com a mesma chave, a API retorna o mesmo documento e evita duplicidade.

```http
idempotency-key: pedido-123-nfe
```

