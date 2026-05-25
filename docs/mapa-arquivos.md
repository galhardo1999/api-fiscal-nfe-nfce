# Mapa dos arquivos fiscais

## Essenciais para emitir

- `src/lib/fiscal/emissor/nfe/nfe-key.ts`: chave de acesso NF-e.
- `src/lib/fiscal/emissor/nfe/nfe-xml.ts`: XML NF-e.
- `src/lib/fiscal/emissor/nfe/nfe-signature.ts`: assinatura digital com certificado A1.
- `src/lib/fiscal/emissor/nfe/sefaz-endpoints.ts`: URLs SEFAZ por UF/ambiente/modelo.
- `src/lib/fiscal/emissor/nfe/sefaz-soap.ts`: envelope SOAP, mTLS e parse de retorno.
- `src/lib/fiscal/emissor/nfe/sefaz-codes.ts`: tratamento de rejeicoes NF-e.
- `src/lib/fiscal/emissor/nfce/nfce-key.ts`: chave de acesso NFC-e.
- `src/lib/fiscal/emissor/nfce/nfce-xml.ts`: XML NFC-e e `infNFeSupl`.
- `src/lib/fiscal/emissor/nfce/nfce-signature.ts`: assinatura NFC-e.
- `src/lib/fiscal/emissor/nfce/nfce-qrcode.ts`: QR Code v2 NFC-e com CSC.
- `src/lib/fiscal/emissor/nfce/nfce-validator.ts`: validacao local contra XSD.
- `src/lib/fiscal/schemas`: schemas XSD oficiais usados na validacao.

## Camada publica SaaS

- `src/app/api/v1/chaves-api/route.ts`: criacao/listagem administrativa de API keys por cliente.
- `src/app/api/v1/empresas/route.ts`: cadastro e listagem de empresas emitentes por API key.
- `src/app/api/v1/empresas/[id]/certificado/route.ts`: upload e validacao de certificado A1 por empresa.
- `src/app/api/v1/nfe/route.ts` e `src/app/api/v1/nfce/route.ts`: recebimento assincrono de documentos fiscais.
- `src/app/api/v1/documentos`: consulta, XML/PDF e eventos fiscais recebidos.
- `src/app/api/v1/webhooks`: cadastro de endpoints e listagem de eventos.
- `src/app/api/v1/cobranca`: simulacao e consulta de uso mensal.
- `src/lib/api-publica`: autenticacao por API key, respostas, validacao e outbox fiscal.
- `src/lib/cobranca`: regra de cobranca por nota e testes.
- `src/lib/certificados`: helper compartilhado para certificado A1.

## Dependencias de infraestrutura

- `src/lib/prisma.ts`: cliente Prisma.
- `src/lib/crypto.ts`: criptografia da senha do certificado.
- `src/lib/auth-config.ts`, `src/lib/password.ts`, `src/lib/document-formatter.ts`, `types/next-auth.d.ts`: login do painel.
- `prisma/schema.prisma`: modelos de banco usados pelas rotas.
- `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`: base para rodar como projeto Next API.

## Segredos exigidos em ambiente

- `DATABASE_URL`: banco PostgreSQL.
- `NEXTAUTH_SECRET`: segredo do NextAuth para login do painel.
- `CERT_ENCRYPTION_KEY`: chave AES-256-GCM para senha do certificado.
- `NFCE_CSC_ID` e `NFCE_CSC_TOKEN`: CSC da NFC-e quando nao salvo na tabela `empresas`.
- Certificado A1 `.pfx/.p12`: deve ser enviado por `POST /api/v1/empresas/{id}/certificado`.
