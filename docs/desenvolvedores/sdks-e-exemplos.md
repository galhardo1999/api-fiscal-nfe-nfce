# SDKs e exemplos

## TypeScript

```ts
async function emitirNfe(apiToken: string, empresaId: string) {
  const resposta = await fetch('https://seu-dominio.com/api/v1/nfe', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiToken}`,
      'content-type': 'application/json',
      'idempotency-key': 'pedido-123-nfe',
    },
    body: JSON.stringify({
      empresaId,
      itens: [
        {
          descricao: 'Produto teste',
          quantidade: 1,
          valorUnitario: 100,
          valorTotal: 100,
        },
      ],
    }),
  });

  if (!resposta.ok) {
    throw new Error(await resposta.text());
  }

  return resposta.json();
}
```

## PHP

```php
$ch = curl_init('https://seu-dominio.com/api/v1/documentos');
curl_setopt_array($ch, [
  CURLOPT_HTTPHEADER => ['authorization: Bearer ' . $apiToken],
  CURLOPT_RETURNTRANSFER => true,
]);
$resposta = curl_exec($ch);
curl_close($ch);
```

## Python

```py
import requests

resposta = requests.get(
    "https://seu-dominio.com/api/v1/documentos",
    headers={"authorization": f"Bearer {api_token}"},
)
resposta.raise_for_status()
print(resposta.json())
```

