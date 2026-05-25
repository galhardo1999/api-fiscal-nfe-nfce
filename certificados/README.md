# Certificados

Coloque certificados A1 apenas em ambiente local ou seguro. Esta pasta ignora `.pfx`, `.p12`, `.pem`, `.key` e `.crt` no Git.

No fluxo principal, o certificado e salvo no banco pelo endpoint `POST /api/v1/empresas/{id}/certificado`, com a senha criptografada por `CERT_ENCRYPTION_KEY`.
