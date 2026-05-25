import Link from 'next/link';
import { paginasReferencia } from '@/componentes/documentacao/referencias-api';

const guiasMarkdown = [
  ['Visao geral', '/docs/desenvolvedores/README.md'],
  ['Arquitetura da API', '/docs/desenvolvedores/visao-geral.md'],
  ['Autenticacao', '/docs/desenvolvedores/autenticacao.md'],
  ['Primeira emissao', '/docs/desenvolvedores/primeira-emissao.md'],
  ['Endpoints', '/docs/desenvolvedores/endpoints.md'],
  ['Primeira NF-e', '/docs/desenvolvedores/emissao-nfe.md'],
  ['Primeira NFC-e', '/docs/desenvolvedores/emissao-nfce.md'],
  ['Empresas', '/docs/desenvolvedores/empresas.md'],
  ['Certificados', '/docs/desenvolvedores/certificados.md'],
  ['Documentos', '/docs/desenvolvedores/documentos.md'],
  ['Eventos', '/docs/desenvolvedores/eventos.md'],
  ['Webhooks', '/docs/desenvolvedores/webhooks.md'],
  ['Cobranca', '/docs/desenvolvedores/cobranca.md'],
  ['Erros', '/docs/desenvolvedores/erros.md'],
  ['SDKs e exemplos', '/docs/desenvolvedores/sdks-e-exemplos.md'],
] as const;

export default function PainelDocumentacaoPage() {
  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="page-title">
          <h1>Documentacao da API</h1>
          <p>Guias para integrar sistemas externos com emissao de NF-e e NFC-e.</p>
        </div>
        <div className="toolbar">
          <Link className="button" href="/docs">
            Referencias visuais
          </Link>
          <a className="button" href="/docs/openapi.yaml" download>
            OpenAPI
          </a>
          <a className="button primary" href="/docs/postman_collection.json" download>
            Postman
          </a>
        </div>
      </header>

      <section className="panel">
        <div className="panel-header">
          <div className="page-title compact">
            <h2>Comece em 5 minutos</h2>
            <p>Fluxo minimo para emitir em homologacao.</p>
          </div>
        </div>
        <div className="panel-body">
          <ol className="steps-list">
            <li>Crie uma chave API de homologacao em `Chaves de API`.</li>
            <li>Copie o token exibido uma unica vez.</li>
            <li>Cadastre a empresa emitente em `POST /api/v1/empresas`.</li>
            <li>Envie o certificado A1 em `POST /api/v1/empresas/{'{id}'}/certificado`.</li>
            <li>Envie a nota em `POST /api/v1/nfe` ou `POST /api/v1/nfce`.</li>
            <li>Consulte o processamento em `GET /api/v1/documentos/{'{id}'}`.</li>
          </ol>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="panel">
          <div className="panel-header">
            <div className="page-title compact">
              <h2>Autenticacao</h2>
              <p>Use Bearer Token ou x-api-key.</p>
            </div>
          </div>
          <div className="panel-body">
            <pre className="code-block">{`Authorization: Bearer af_test_xxxxxxxxxxxx.segredo
content-type: application/json
idempotency-key: pedido-123-nfe`}</pre>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div className="page-title compact">
              <h2>Resposta assincrona</h2>
              <p>A emissao retorna documento enfileirado.</p>
            </div>
          </div>
          <div className="panel-body">
            <pre className="code-block">{`{
  "documentoId": "...",
  "modelo": "NFE",
  "ambiente": "HOMOLOGACAO",
  "status": "ENFILEIRADA"
}`}</pre>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div className="page-title compact">
            <h2>Guias por assunto</h2>
            <p>Arquivos Markdown versionados junto com o projeto.</p>
          </div>
        </div>
        <div className="panel-body">
          <div className="docs-grid">
            {paginasReferencia.map((pagina) => (
              <a className="doc-card" href={pagina.href} target="_blank" rel="noreferrer" key={pagina.slug}>
                <strong>{pagina.titulo}</strong>
                <code>{pagina.href}</code>
              </a>
            ))}
            {guiasMarkdown.map(([titulo, caminho]) => (
              <a className="doc-card" href={caminho} target="_blank" rel="noreferrer" key={caminho}>
                <strong>{titulo}</strong>
                <code>{caminho}</code>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div className="page-title compact">
            <h2>Exemplo curl</h2>
            <p>Primeira emissao de NF-e.</p>
          </div>
        </div>
        <div className="panel-body">
          <pre className="code-block">{`curl -X POST "$BASE_URL/api/v1/nfe" \\
  -H "authorization: Bearer $API_TOKEN" \\
  -H "content-type: application/json" \\
  -H "idempotency-key: pedido-123-nfe" \\
  -d '{
    "empresaId": "empresa_id",
    "valorTotal": 100,
    "itens": [
      {
        "descricao": "Produto de teste",
        "quantidade": 1,
        "valorUnitario": 100,
        "valorTotal": 100
      }
    ]
  }'`}</pre>
        </div>
      </section>
    </div>
  );
}
