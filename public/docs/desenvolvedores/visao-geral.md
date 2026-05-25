# Visao geral

A API Fiscal e uma API REST versionada para integrar sistemas externos com emissao de NF-e e NFC-e.

## Principios

- JSON de entrada simples.
- Processamento fiscal assincrono.
- Consulta por `documentoId`.
- Webhooks para notificacao de status.
- API keys separadas por ambiente.
- Isolamento multi-tenant por cliente contratante.

## Fluxo principal

1. Cliente gera uma API key no painel.
2. Integrador cadastra empresa emitente.
3. Integrador envia certificado A1.
4. Integrador envia NF-e/NFC-e.
5. API retorna `ENFILEIRADA`.
6. Worker fiscal processa, envia para SEFAZ e atualiza status.
7. Sistema cliente consulta status ou recebe webhook.

