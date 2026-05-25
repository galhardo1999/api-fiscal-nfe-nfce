# Prompt de planejamento - API Fiscal NF-e/NFC-e SaaS

Use o prompt abaixo para pedir um planejamento tecnico e de produto para transformar este projeto em uma API fiscal comercial, vendida por cliente.

```text
Voce e um arquiteto de software senior especializado em SaaS B2B, APIs publicas, sistemas fiscais brasileiros, NF-e modelo 55, NFC-e modelo 65, SEFAZ, certificados A1, seguranca, observabilidade e operacao em producao.

Contexto do projeto atual:
- Repositorio: api-fiscal-nfe-nfce.
- Stack atual: Next.js App Router com Route Handlers, TypeScript, Prisma, PostgreSQL, Bun, NextAuth, node-forge, xmlbuilder2, xml2js e jsPDF.
- O projeto atual ja possui API publica versionada em `/api/v1`, painel de chaves, modelos fiscais SaaS, cobranca por nota e modulos fiscais reutilizaveis para XML, assinatura, SOAP, QR Code e DANFE.
- Arquivos fiscais principais:
  - src/lib/fiscal/emissor/nfe: chave de acesso, XML, assinatura digital, SOAP SEFAZ, endpoints, DANFE e codigos de rejeicao.
  - src/lib/fiscal/emissor/nfce: chave de acesso, XML, assinatura, QR Code, validacao XSD e codigos de rejeicao.
  - src/lib/fiscal/schemas: schemas XSD locais.
  - src/app/api/v1: endpoints publicos de empresas, certificados, NF-e, NFC-e, documentos, webhooks e cobranca.
  - src/app/painel e src/app/api/painel: interface autenticada para o cliente gerar chaves de homologacao/producao.
  - prisma/schema.prisma: modelos fiscais SaaS enxutos, sem ERP/PDV/financeiro legado.

Situacao atual observada:
- A base tecnica ja prova algumas capacidades de emissao: geracao de chave, XML, assinatura A1, envio SOAP, parse de retorno SEFAZ, QR Code NFC-e, contingencia offline NFC-e, cancelamento, CC-e e DANFE.
- O produto ainda nao esta pronto para ser vendido como API publica multi-cliente.
- A autenticacao do painel usa NextAuth, e a API publica ja usa API Keys/Bearer Tokens por cliente, ambiente e escopo.
- O modelo de dados ja foi reduzido para tenant, cliente contratante, usuario, empresa emissora, certificado, token, ambiente, documento, item, evento, webhook, plano, uso e auditoria.
- A API publica recebe documentos de forma assincrona como `ENFILEIRADA`. Para producao, ainda falta ligar filas, jobs, retentativas, worker SEFAZ e worker de webhooks.
- O codigo atual possui validacoes manuais e varios payloads tipados como any. Para API publica, todos os contratos devem ter schemas formais, versionamento e documentacao OpenAPI.
- Os endpoints SEFAZ, schemas XML, regras de validacao e notas tecnicas mudam com frequencia. O sistema precisa ter rotina de atualizacao fiscal, testes de regressao e fontes oficiais monitoradas.
- O sistema deve considerar as atualizacoes recentes da Reforma Tributaria do Consumo, CNPJ alfanumerico, schemas oficiais NF-e/NFC-e e notas tecnicas vigentes. Antes de propor regras fiscais finais, consulte fontes oficiais atualizadas do Portal Nacional da NF-e, ENCAT e SEFAZ estaduais.

Objetivo:
Criar um planejamento completo para transformar esta base em uma API Fiscal SaaS para venda por cliente, permitindo que cada cliente contratante gerencie uma ou mais empresas emissoras, envie JSON simples para emissao de NF-e/NFC-e, receba status por webhook, baixe XML/PDF, cancele documentos, emita CC-e quando permitido, opere homologacao/producao e acompanhe uso/cobranca.

Entregue um plano objetivo, pragmatico e implementavel, dividido nas secoes abaixo:

1. Diagnostico do projeto atual
- O que ja existe e pode ser reaproveitado.
- O que deve ser refatorado antes de vender como API.
- Riscos tecnicos, fiscais, juridicos e operacionais.
- Gaps criticos de seguranca, multi-tenancy, validacao, filas, observabilidade e compliance.

2. Arquitetura alvo
- Desenho dos modulos: autenticacao, tenants, empresas emissoras, certificados, emissao, eventos fiscais, DANFE, armazenamento, webhooks, billing, painel administrativo, suporte e auditoria.
- Decisao recomendada: monolito modular inicial, workers separados, filas e banco.
- Componentes sugeridos: API HTTP, worker de emissao, worker de webhooks, scheduler de contingencia, banco PostgreSQL, cache/filas Redis/BullMQ ou alternativa equivalente, storage seguro para XML/PDF/certificados se aplicavel.
- Separacao clara entre API publica, painel interno/admin e processamento fiscal.

3. Multi-tenant e modelo comercial
- Diferenca entre ClienteContratante, Usuario, EmpresaEmitente, CertificadoDigital, AmbienteFiscal, ApiKey, Plano, Consumo e Cobranca.
- Como isolar dados por tenant.
- Como permitir multiplos CNPJs por cliente.
- Como controlar ambiente homologacao/producao por empresa.
- Como aplicar limites por plano: quantidade de documentos, empresas, webhooks, retencao de XML, usuarios e suporte.

4. Autenticacao e seguranca
- Propor API Keys ou Bearer Tokens com hash no banco, prefixo publico, segredo privado, rotacao, revogacao, escopos e separacao sandbox/producao.
- Descrever autorizacao por tenant, empresa e ambiente.
- Propor criptografia de certificados A1 e senhas, gestao de chaves, rotacao de CERT_ENCRYPTION_KEY, KMS/secret manager em producao e auditoria de acesso.
- Propor rate limit, idempotency key, logs sem vazar XML sensivel, LGPD, mascaramento de CNPJ/CPF quando necessario e politica de retencao.

5. Contratos da API publica
- Propor endpoints REST versionados, por exemplo:
  - POST /v1/empresas
  - POST /v1/empresas/{empresaId}/certificado
  - POST /v1/nfe
  - POST /v1/nfce
  - GET /v1/documentos/{id}
  - GET /v1/documentos/{id}/xml
  - GET /v1/documentos/{id}/pdf
  - POST /v1/documentos/{id}/cancelamento
  - POST /v1/documentos/{id}/carta-correcao
  - POST /v1/documentos/inutilizacao
  - GET /v1/webhooks/eventos
- Definir payload JSON simplificado para NF-e e NFC-e.
- Definir resposta inicial assincrona com documentId, status, ambiente, modelo, numero, serie, chaveAcesso quando disponivel e links.
- Definir padrao de erros com codigo interno, cStat SEFAZ quando houver, mensagem, campos invalidos e requestId.
- Definir idempotencia para evitar nota duplicada em retry do cliente.

6. Fluxo de emissao
- Descrever maquina de estados recomendada: RASCUNHO, RECEBIDA, VALIDANDO, XML_GERADO, ASSINADA, ENFILEIRADA, ENVIANDO_SEFAZ, AUTORIZADA, REJEITADA, DENEGADA, CANCELADA, CONTINGENCIA, INUTILIZADA, ERRO_TECNICO.
- Separar fluxo NF-e e NFC-e.
- Explicar envio sincrono vs assincrono, consulta de recibo quando aplicavel, retry seguro, timeout, duplicidade e conciliacao com a SEFAZ.
- Explicar NFC-e offline: geracao local, DANFE com QR Code, prazo de transmissao posterior, fila de regularizacao e alertas.
- Explicar NF-e em contingencia SVC quando aplicavel.

7. Fiscal e validacoes
- Planejar validacao de schema XSD para NF-e e NFC-e.
- Planejar validacoes de negocio antes da SEFAZ: CRT, CFOP, NCM, CEST, CST/CSOSN, IE, municipio IBGE, GTIN, destinatario, pagamento NFC-e, totalizadores e regras por UF.
- Planejar atualizacao de tabelas fiscais e notas tecnicas.
- Indicar o que deve ser calculado pela API e o que deve ser informado pelo cliente no MVP.
- Diferenciar MVP sem motor tributario completo de produto premium com motor de regras fiscais.

8. Certificados digitais
- Fluxo de upload, validacao, extracao de dados, vinculo com CNPJ, vencimento, renovacao, alerta e revogacao.
- Como validar se certificado pertence ao CNPJ/raiz do emitente.
- Como armazenar arquivo e senha com seguranca.
- Como reduzir exposicao do certificado em memoria e logs.

9. Eventos fiscais
- Cancelamento NF-e/NFC-e com regras de prazo parametrizaveis por UF.
- CC-e somente para NF-e e somente para campos permitidos.
- Inutilizacao de numeracao.
- Manifestacao do destinatario, se entrar no escopo B2B.
- Registro de todos os eventos com XML assinado, XML de retorno, protocolo, status, sequencia e auditoria.

10. Output, XML, PDF e distribuicao
- Geracao e armazenamento de XML autorizado, XML protocolado e eventos.
- DANFE NF-e em A4.
- DANFE NFC-e em bobina 58mm/80mm com QR Code.
- Envio automatico por e-mail como opcional.
- Links temporarios assinados para download.
- Retencao legal, backup e exportacao em lote.

11. Webhooks
- Eventos de webhook: documento.autorizado, documento.rejeitado, documento.cancelado, documento.contingencia, documento.inutilizado, certificado.vencendo.
- Assinatura HMAC dos webhooks.
- Retry com backoff, dead-letter, painel de reenvio, logs de entrega e endpoint de teste.
- Contrato do payload de webhook.

12. Observabilidade e operacao
- Logs estruturados com requestId, tenantId, empresaId, documentId e chaveAcesso mascarada quando necessario.
- Metricas de tempo por etapa, taxa de autorizacao, rejeicoes por cStat, disponibilidade por UF, fila, retries e falhas de webhook.
- Alertas para SEFAZ fora, certificado vencendo, fila parada, taxa alta de rejeicao e contingencia acumulada.
- Painel operacional interno.

13. Banco de dados
- Propor schema Prisma alvo com modelos em portugues:
  - ClienteContratante
  - Usuario
  - EmpresaEmitente
  - CertificadoDigital
  - ApiKey
  - DocumentoFiscal
  - DocumentoFiscalItem
  - DocumentoFiscalEvento
  - DocumentoFiscalReferenciado
  - WebhookEndpoint
  - WebhookEntrega
  - Plano
  - UsoMensal
  - Auditoria
- Propor indices, constraints de unicidade, controle de numeracao por empresa/modelo/serie/ambiente e estrategia contra concorrencia.
- Propor migracao gradual do schema atual para o schema alvo.

14. Roadmap por fases
- Fase 0: auditoria tecnica/fiscal e homologacao controlada.
- Fase 1: API interna estabilizada com schemas, testes e logs.
- Fase 2: multi-tenant, API Keys, idempotencia e documentacao OpenAPI.
- Fase 3: workers, filas, webhooks e contingencia robusta.
- Fase 4: painel cliente/admin, billing, planos e suporte.
- Fase 5: hardening fiscal, motor tributario, atualizacoes automaticas de tabelas e escala.
- Para cada fase, listar entregas, criterios de aceite, riscos e dependencias.

15. Testes e homologacao
- Testes unitarios para chave, DV, QR Code, validacoes, schemas e parse de retorno.
- Testes de contrato da API.
- Testes de integracao com banco e filas.
- Testes em homologacao SEFAZ por UF priorizada.
- Massa de testes por regime tributario, UF, modelo, pagamento, cancelamento, CC-e e contingencia.
- Pipeline CI com lint, build, prisma generate e testes.

16. Decisoes pendentes
- Quais UFs atender primeiro.
- Se o MVP tera motor tributario ou exigira impostos informados pelo cliente.
- Se XML/PDF ficarao no banco ou object storage.
- Qual provedor de fila, storage, KMS, e-mail e billing.
- SLA, suporte, limites por plano e responsabilidade fiscal do cliente.

17. Cobranca por emissao e modelo de planos
- Propor modelo de cobranca por documento fiscal processado, diferenciando:
  - documento autorizado;
  - documento rejeitado por erro do cliente;
  - erro tecnico da plataforma;
  - cancelamento;
  - carta de correcao;
  - inutilizacao;
  - consulta de status;
  - download/armazenamento de XML/PDF;
  - webhook entregue.
- Definir se a cobranca deve ocorrer por tentativa, por autorizacao, ou por documento processado com regras claras para rejeicoes e erros tecnicos.
- Considerar como modelo comercial principal a cobranca por nota emitida/autorizada em producao, com tabela por volume mensal:
  - ate 100 notas/mes: R$ 0,90 por nota;
  - de 101 ate 350 notas/mes: R$ 0,79 por nota, aplicado sobre todas as notas do mes;
  - acima de 350 notas/mes: R$ 0,69 por nota, aplicado sobre todas as notas do mes.
- Usar faixa unica por volume total mensal, nao faixa progressiva por blocos. Exemplo: se o cliente emitir 150 notas, cobrar 150 x R$ 0,79; se emitir 351 notas, cobrar 351 x R$ 0,69.
- Aplicar faturamento minimo mensal de R$ 69,90 por cliente contratante: se o consumo calculado pelas notas emitidas no mes ficar abaixo de R$ 69,90, cobrar R$ 69,90; se ficar acima, cobrar o valor calculado pelo consumo.
- Explicar claramente no planejamento os pontos de virada da tabela, inclusive que clientes com 78 a 100 notas pagam pelo consumo a R$ 0,90, clientes com 101 a 350 notas pagam todas as notas a R$ 0,79, e clientes com 351 ou mais notas pagam todas as notas a R$ 0,69.
- Propor se deve existir mensalidade minima, saldo pre-pago, vencimento mensal, ou faturamento pos-pago.
- Propor regras para notas canceladas, rejeitadas, denegadas, inutilizadas, emitidas em contingencia e reprocessadas.
- Propor modelo pre-pago com creditos por emissao para clientes pequenos.
- Propor modelo enterprise com volume contratado, SLA, suporte prioritario, multiplos CNPJs e retencao ampliada.
- Explicar como contabilizar consumo mensal por tenant, empresa, modelo, ambiente e tipo de operacao.
- Indicar quais consumos de homologacao devem ser gratuitos, limitados ou separados de producao.
- Sugerir politica comercial para onboarding, certificado digital, suporte fiscal, armazenamento por anos, reprocessamento e emissao em contingencia.

Formato da resposta:
- Seja direto e tecnicamente rigoroso.
- Comece com um resumo executivo de no maximo 10 linhas.
- Depois entregue o plano completo por secoes.
- Inclua tabelas quando ajudar.
- Separe MVP, v1 comercial e recursos premium.
- Nao trate regras fiscais como definitivas sem validar fontes oficiais atuais.
- Aponte riscos bloqueantes antes de sugerir implementacao.
```

## Referencias oficiais para validar durante o planejamento

- Portal Nacional da NF-e: https://www.nfe.fazenda.gov.br/portal/
- Relacao de Web Services: https://www.nfe.fazenda.gov.br/portal/webServices.aspx
- Documentos e schemas XML: https://www.nfe.fazenda.gov.br/portal/listaConteudo.aspx
- Portal Nacional da NFC-e/ENCAT e portais estaduais de NFC-e conforme UF.
