# Cobranca

A cobranca usa faixa unica por volume mensal de notas autorizadas.

| Volume mensal | Preco aplicado em todas as notas |
| --- | ---: |
| 0 a 100 | R$ 0,90 |
| 101 a 350 | R$ 0,79 |
| 351+ | R$ 0,69 |

Minimo mensal: R$ 69,90.

## Simular

```bash
curl "$BASE_URL/api/v1/cobranca/simular?notas=351"
```

## Consultar uso

```bash
curl "$BASE_URL/api/v1/cobranca/uso?anoMes=2026-05&modelo=NFE" \
  -H "authorization: Bearer $API_TOKEN"
```

Escopo: `cobranca:ler`.

