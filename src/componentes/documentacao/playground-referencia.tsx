'use client';

import { useState } from 'react';

interface Props {
  metodo: 'POST' | 'GET' | 'DEL' | 'INFO' | 'CODE';
  rota: string;
  exemploJson?: string;
  retornoJson?: string;
  tituloRetorno?: string;
}

export function PlaygroundReferencia({
  metodo,
  rota,
  exemploJson,
  retornoJson,
  tituloRetorno
}: Props) {
  const [langAtiva, setLangAtiva] = useState<'Shell' | 'Node' | 'Ruby' | 'PHP' | 'Python'>('Shell');
  const [username, setUsername] = useState('token_sua_chave_api_aqui');
  const [password, setPassword] = useState('');
  const [respostaExpandida, setRespostaExpandida] = useState(true);

  // Generate code snippet based on selected language
  function getCodeSnippet(): string {
    const baseUrl = 'https://api.focusnfe.com.br';
    
    switch (langAtiva) {
      case 'Node':
        return `const fetch = require('node-fetch');\n\nconst url = '${baseUrl}${rota}';\nconst options = {\n  method: '${metodo}',\n  headers: {\n    'Accept': 'application/json',\n    'Content-Type': 'application/json',\n    'Authorization': 'Basic ' + Buffer.from('${username}:' + '${password}').toString('base64')\n  }${metodo !== 'GET' && exemploJson ? `,\n  body: JSON.stringify(${exemploJson.trim()})` : ''}\n};\n\nfetch(url, options)\n  .then(res => res.json())\n  .then(json => console.log(json))\n  .catch(err => console.error(err));`;
      
      case 'Ruby':
        return `require 'uri'\nrequire 'net/http'\n\nurl = URI('${baseUrl}${rota}')\nhttp = Net::HTTP.new(url.host, url.port)\nhttp.use_ssl = true\n\nrequest = Net::HTTP::${metodo.charAt(0) + metodo.slice(1).toLowerCase()}.new(url)\nrequest.basic_auth '${username}', '${password}'\nrequest["accept"] = 'application/json'\nrequest["content-type"] = 'application/json'\n${metodo !== 'GET' && exemploJson ? `request.body = '${exemploJson.replace(/'/g, "\\'").trim()}'` : ''}\n\nresponse = http.request(request)\nputs response.read_body`;

      case 'PHP':
        return `<?php\n\n$curl = curl_init();\n\ncurl_setopt_array($curl, [\n  CURLOPT_URL => "${baseUrl}${rota}",\n  CURLOPT_RETURNTRANSFER => true,\n  CURLOPT_CUSTOMREQUEST => "${metodo}",\n  CURLOPT_USERPWD => "${username}:${password}",\n  CURLOPT_HTTPHEADER => [\n    "accept: application/json",\n    "content-type: application/json"\n  ],\n]);\n\n$response = curl_exec($curl);\ncurl_close($curl);\necho $response;`;

      case 'Python':
        return `import requests\n\nurl = "${baseUrl}${rota}"\nheaders = {\n    "accept": "application/json",\n    "content-type": "application/json"\n}\nresponse = requests.request(\n    "${metodo}",\n    url,\n    headers=headers,\n    auth=("${username}", "${password}")${metodo !== 'GET' && exemploJson ? `,\n    json=${exemploJson.trim()}` : ''}\n)\nprint(response.text)`;

      case 'Shell':
      default:
        return `curl --request ${metodo} \\\n     --url ${baseUrl}${rota} \\\n     --header 'accept: application/json' \\\n     --header 'content-type: application/json' \\\n     --user '${username}:${password}'${metodo !== 'GET' && exemploJson ? ` \\\n     --data '\n${exemploJson.trim()}\n'` : ''}`;
    }
  }

  // Copy code utility
  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    alert('Código copiado para a área de transferência!');
  }

  const codeSnippet = getCodeSnippet();

  return (
    <aside className="playground-referencia" aria-label="Playground e exemplos de código">
      
      {/* 1. Language selector */}
      <div className="playground-secao">
        <label>Language</label>
        <div className="tabs-linguagem">
          {(['Shell', 'Node', 'Ruby', 'PHP', 'Python'] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              className={`tab-lang ${langAtiva === lang ? 'ativa' : ''}`}
              onClick={() => setLangAtiva(lang)}
            >
              {lang === 'Shell' && <span style={{ fontSize: '11px', opacity: 0.8 }}>🐚</span>}
              {lang === 'Node' && <span style={{ fontSize: '11px', opacity: 0.8 }}>🟢</span>}
              {lang === 'Ruby' && <span style={{ fontSize: '11px', opacity: 0.8 }}>💎</span>}
              {lang === 'PHP' && <span style={{ fontSize: '11px', opacity: 0.8 }}>🐘</span>}
              {lang === 'Python' && <span style={{ fontSize: '11px', opacity: 0.8 }}>🐍</span>}
              {lang}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Credentials */}
      <div className="playground-secao">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label>Credentials</label>
          <div style={{ fontSize: '10px', color: '#475569', fontWeight: 'bold' }}>
            BASIC ℹ️ &nbsp; BASE64 ℹ️
          </div>
        </div>
        <div className="credenciais-container">
          <span style={{ color: '#64748b', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.02em', flexShrink: 0 }}>Basic</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username"
            aria-label="API Key Username"
            style={{ width: '40%' }}
          />
          <span style={{ color: '#334155', fontWeight: 'bold' }}>:</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
            aria-label="API Key Password"
            style={{ width: '40%' }}
          />
          <span style={{ color: '#64748b', cursor: 'pointer', transition: 'color 0.2s', flexShrink: 0 }} title="Credenciais seguras">🔒</span>
        </div>
      </div>

      {/* 3. URL Info */}
      <div className="playground-secao">
        <label>URL</label>
        <div className="url-explorer-container">
          <div className="url-prefixo">Base URL</div>
          <div className="url-endereco" title={`https://api.focusnfe.com.br${rota}`}>
            https://api.focusnfe.com.br{rota}
          </div>
        </div>
      </div>

      {/* 4. Request Code Block */}
      <div className="playground-secao">
        <div className="code-playground-box">
          <div className="code-header-playground">
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              {langAtiva === 'Shell' ? 'cURL Request' : `${langAtiva} Request`} <span style={{ fontSize: '8px', color: '#475569' }}>▼</span>
            </span>
            <span style={{ cursor: 'pointer', fontSize: '10px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Examples <span style={{ fontSize: '8px', color: '#475569' }}>▼</span>
            </span>
          </div>
          
          <pre style={{
            margin: 0,
            padding: '14px',
            background: '#060913',
            color: '#f8fafc',
            fontSize: '12px',
            fontFamily: '"Fira Code", Consolas, "Courier New", Courier, monospace',
            overflowX: 'auto',
            lineHeight: '1.6',
            maxHeight: '300px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {codeSnippet.split('\n').map((line, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '16px' }}>
                <span style={{ color: '#334155', width: '20px', textAlign: 'right', userSelect: 'none', flexShrink: 0 }}>
                  {idx + 1}
                </span>
                <span style={{
                  color: line.trim().startsWith('curl') || line.trim().startsWith('--') 
                    ? '#38bdf8' 
                    : line.trim().startsWith('Authorization') || line.includes('headers:')
                    ? '#a855f7'
                    : '#e2e8f0'
                }}>
                  {line}
                </span>
              </div>
            ))}
          </pre>

          <div className="code-footer-playground">
            <button
              type="button"
              onClick={() => copyToClipboard(codeSnippet)}
              style={{ background: 'transparent', border: 0, color: '#64748b', cursor: 'pointer', fontSize: '15px', padding: '4px' }}
              title="Copiar código"
            >
              📋
            </button>
            <button 
              type="button" 
              className="btn-try-it" 
              onClick={() => alert('Modo Sandbox: Transmissão simulada com sucesso!')}
            >
              Try It!
            </button>
          </div>
        </div>
      </div>

      {/* 5. Response Panel (201 - NFe Autorizada) */}
      {retornoJson && (
        <div className="playground-secao">
          <div className="resposta-playground-box">
            <button
              type="button"
              className="resposta-header-collapsible"
              onClick={() => setRespostaExpandida(!respostaExpandida)}
            >
              <span style={{ display: 'flex', alignItems: 'center' }}>
                <span className={`status-dot-play ${metodo === 'DEL' ? 'del' : ''}`} />
                {tituloRetorno || '200 - OK'}
              </span>
              <span style={{ fontSize: '8px', color: '#64748b' }}>{respostaExpandida ? '▲' : '▼'}</span>
            </button>
            
            {respostaExpandida && (
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => copyToClipboard(retornoJson)}
                  style={{ position: 'absolute', top: '10px', right: '12px', background: 'transparent', border: 0, color: '#64748b', cursor: 'pointer', fontSize: '13px', zIndex: 10 }}
                  title="Copiar resposta"
                >
                  📋
                </button>
                <pre style={{
                  margin: 0,
                  padding: '14px',
                  background: '#060913',
                  color: '#34d399',
                  fontSize: '12px',
                  fontFamily: '"Fira Code", Consolas, "Courier New", Courier, monospace',
                  overflowX: 'auto',
                  lineHeight: '1.6',
                  maxHeight: '260px',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  {retornoJson.trim().split('\n').map((line, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '16px' }}>
                      <span style={{ color: '#334155', width: '20px', textAlign: 'right', userSelect: 'none', flexShrink: 0 }}>
                        {idx + 1}
                      </span>
                      <span>
                        {line}
                      </span>
                    </div>
                  ))}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

    </aside>
  );
}
