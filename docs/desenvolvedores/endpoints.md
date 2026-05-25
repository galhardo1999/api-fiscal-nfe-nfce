# Endpoints

Base: `/api/v1`.

| Metodo | Endpoint | Escopo | Finalidade |
| --- | --- | --- | --- |
| `GET` | `/empresas` | `empresas:ler` | Lista empresas. |
| `POST` | `/empresas` | `empresas:escrever` | Cria empresa. |
| `POST` | `/empresas/{id}/certificado` | `empresas:escrever` | Envia certificado A1. |
| `POST` | `/nfe` | `documentos:emitir` | Recebe NF-e. |
| `POST` | `/nfce` | `documentos:emitir` | Recebe NFC-e. |
| `GET` | `/documentos` | `documentos:ler` | Lista documentos. |
| `GET` | `/documentos/{id}` | `documentos:ler` | Consulta documento. |
| `GET` | `/documentos/{id}/xml` | `documentos:ler` | Baixa XML. |
| `GET` | `/documentos/{id}/pdf` | `documentos:ler` | Baixa PDF. |
| `POST` | `/documentos/{id}/cancelamento` | `documentos:eventos` | Solicita cancelamento. |
| `POST` | `/documentos/{id}/carta-correcao` | `documentos:eventos` | Solicita CC-e. |
| `POST` | `/documentos/inutilizacao` | `documentos:eventos` | Solicita inutilizacao. |
| `GET` | `/webhooks` | `webhooks:gerenciar` | Lista endpoints. |
| `POST` | `/webhooks` | `webhooks:gerenciar` | Cria endpoint. |
| `GET` | `/webhooks/eventos` | publico | Lista eventos disponiveis. |
| `GET` | `/cobranca/uso` | `cobranca:ler` | Consulta uso mensal. |
| `GET` | `/cobranca/simular` | publico | Simula cobranca. |

