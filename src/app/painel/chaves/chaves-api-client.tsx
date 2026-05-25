'use client';

import { useMemo, useState } from 'react';

export interface ChaveApiResumo {
  id: string;
  nome: string;
  prefixo: string;
  ambiente: 'HOMOLOGACAO' | 'PRODUCAO';
  escopos: string[];
  ativa: boolean;
  ultimoUsoEm: string | null;
  expiraEm: string | null;
  criadoEm: string;
}

interface Props {
  chavesIniciais: ChaveApiResumo[];
}

function formatarData(valor: string | null) {
  if (!valor) {
    return 'Nunca';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(valor));
}

export function ChavesApiClient({ chavesIniciais }: Props) {
  const [chaves, setChaves] = useState(chavesIniciais);
  const [modalAberto, setModalAberto] = useState(false);
  const [ambiente, setAmbiente] = useState<'HOMOLOGACAO' | 'PRODUCAO'>('HOMOLOGACAO');
  const [nome, setNome] = useState('');
  const [token, setToken] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);

  const totais = useMemo(() => {
    return {
      homologacao: chaves.filter((chave) => chave.ambiente === 'HOMOLOGACAO' && chave.ativa).length,
      producao: chaves.filter((chave) => chave.ambiente === 'PRODUCAO' && chave.ativa).length,
    };
  }, [chaves]);

  function abrirModal() {
    setErro('');
    setNome('');
    setToken('');
    setAmbiente('HOMOLOGACAO');
    setModalAberto(true);
  }

  function fecharModal() {
    if (carregando) {
      return;
    }

    setModalAberto(false);
    setToken('');
    setErro('');
    setNome('');
  }

  async function gerarChave() {
    setErro('');
    setToken('');
    setCarregando(true);

    const resposta = await fetch('/api/painel/chaves', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ambiente,
        nome: nome || `Chave ${ambiente === 'PRODUCAO' ? 'producao' : 'homologacao'}`,
      }),
    });

    setCarregando(false);

    if (!resposta.ok) {
      const dados = await resposta.json().catch(() => null) as { error?: string } | null;
      setErro(dados?.error || 'Nao foi possivel gerar a chave.');
      return;
    }

    const dados = await resposta.json() as { token: string; chave: ChaveApiResumo };
    setToken(dados.token);
    setNome('');
    setChaves((atuais) => [dados.chave, ...atuais]);
  }

  async function excluirChave(chave: ChaveApiResumo) {
    const confirmar = window.confirm(`Excluir a chave "${chave.nome}"? Esta acao nao pode ser desfeita.`);
    if (!confirmar) {
      return;
    }

    setErro('');
    setExcluindoId(chave.id);

    const resposta = await fetch('/api/painel/chaves', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: chave.id }),
    });

    setExcluindoId(null);

    if (!resposta.ok) {
      const dados = await resposta.json().catch(() => null) as { error?: string } | null;
      setErro(dados?.error || 'Nao foi possivel excluir a chave.');
      return;
    }

    setChaves((atuais) => atuais.filter((item) => item.id !== chave.id));
  }

  async function copiarToken() {
    if (!token) {
      return;
    }
    await navigator.clipboard.writeText(token);
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div className="page-title">
          <h1>Chaves de API</h1>
          <p>Gere, visualize e exclua chaves de homologacao e producao.</p>
        </div>
        <div className="toolbar">
          <button className="button primary" type="button" onClick={abrirModal}>
            Criar Chave API
          </button>
        </div>
      </div>

      <div className="panel-body">
        <div className="grid-2">
          <div className="stat">
            Chaves ativas de homologacao
            <strong>{totais.homologacao}</strong>
          </div>
          <div className="stat">
            Chaves ativas de producao
            <strong>{totais.producao}</strong>
          </div>
        </div>

        {!modalAberto && erro ? <p className="alert error">{erro}</p> : null}

        <div className="table-wrap" style={{ marginTop: 18 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Criado em</th>
                <th>Status</th>
                <th>Nome</th>
                <th>Ambiente</th>
                <th>Prefixo</th>
                <th>Ultimo uso</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {chaves.length === 0 ? (
                <tr>
                  <td colSpan={7}>Nenhuma chave criada ainda.</td>
                </tr>
              ) : chaves.map((chave) => (
                <tr key={chave.id}>
                  <td>{formatarData(chave.criadoEm)}</td>
                  <td>
                    <span className={`badge ${chave.ativa ? 'live' : 'off'}`}>
                      {chave.ativa ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td>{chave.nome}</td>
                  <td>
                    <span className={`badge ${chave.ambiente === 'PRODUCAO' ? 'live' : 'test'}`}>
                      {chave.ambiente === 'PRODUCAO' ? 'Producao' : 'Homologacao'}
                    </span>
                  </td>
                  <td><code>{chave.prefixo}</code></td>
                  <td>{formatarData(chave.ultimoUsoEm)}</td>
                  <td>
                    <button
                      className="button danger"
                      type="button"
                      onClick={() => excluirChave(chave)}
                      disabled={excluindoId === chave.id}
                    >
                      {excluindoId === chave.id ? 'Excluindo...' : 'Excluir'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalAberto ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={fecharModal}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-modal-chave"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div className="page-title compact">
                <h2 id="titulo-modal-chave">{token ? 'Token gerado' : 'Criar Chave API'}</h2>
                <p>{token ? 'Ele sera exibido apenas agora.' : 'Escolha o ambiente e identifique a credencial.'}</p>
              </div>
              <button className="button icon-button" type="button" onClick={fecharModal} aria-label="Fechar modal">
                x
              </button>
            </div>

            <div className="modal-body">
              {token ? (
                <div className="secret-box">
                  <strong>Token gerado. Ele sera exibido apenas agora.</strong>
                  <code>{token}</code>
                </div>
              ) : (
                <>
                  {erro ? <p className="alert error">{erro}</p> : null}

                  <div className="field">
                    <label>Ambiente</label>
                    <div className="segmented-control" role="tablist" aria-label="Ambiente da chave">
                      <button
                        className={ambiente === 'HOMOLOGACAO' ? 'active' : ''}
                        type="button"
                        onClick={() => setAmbiente('HOMOLOGACAO')}
                      >
                        Homologacao
                      </button>
                      <button
                        className={ambiente === 'PRODUCAO' ? 'active' : ''}
                        type="button"
                        onClick={() => setAmbiente('PRODUCAO')}
                      >
                        Producao
                      </button>
                    </div>
                  </div>

                  <div className="field">
                    <label htmlFor="nome-chave">Nome da chave</label>
                    <input
                      id="nome-chave"
                      className="input"
                      value={nome}
                      onChange={(event) => setNome(event.target.value)}
                      placeholder={ambiente === 'PRODUCAO' ? 'Integracao producao' : 'Integracao homologacao'}
                      autoFocus
                    />
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
              {token ? (
                <>
                  <button className="button" type="button" onClick={copiarToken}>
                    Copiar token
                  </button>
                  <button className="button primary" type="button" onClick={fecharModal}>
                    Concluir
                  </button>
                </>
              ) : (
                <>
                  <button className="button" type="button" onClick={fecharModal} disabled={carregando}>
                    Cancelar
                  </button>
                  <button className="button primary" type="button" onClick={gerarChave} disabled={carregando}>
                    {carregando ? 'Criando...' : 'Criar chave'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
