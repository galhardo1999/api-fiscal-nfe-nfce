'use client';

import { useState, useEffect } from 'react';

interface Stats {
  totalClientes: number;
  notasFila: number;
  notasErro: number;
  notasAutorizadasMes: number;
  faturamentoGlobalPrevisto: number;
}

interface Cliente {
  id: string;
  companyName: string;
  document: string;
  status: string;
  notasMes: number;
  saldoCreditos: number;
  totalPago: number;
}

interface Documento {
  id: string;
  modelo: string;
  ambiente: string;
  status: string;
  numero: number | null;
  serie: number | null;
  cStat: string | null;
  motivoSefaz: string | null;
  valorTotal: number | null;
  criadoEm: string;
  client: { companyName: string };
  empresa: { nome: string } | null;
}

export function AdminPanelClient() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [processandoId, setProcessandoId] = useState<string | null>(null);

  const carregarDados = async () => {
    try {
      setCarregando(true);
      const resposta = await fetch('/api/painel/admin/stats');
      if (!resposta.ok) {
        throw new Error('Falha ao carregar métricas administrativas.');
      }
      const dados = await resposta.json();
      setStats(dados.stats);
      setClientes(dados.clientes);
      setDocumentos(dados.documentosRecentes);
      setErro(null);
    } catch (err: any) {
      setErro(err.message || 'Erro ao carregar dados do painel.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados();
    // Auto-refresh a cada 10 segundos para monitorar as filas em tempo real!
    const interval = setInterval(carregarDados, 10000);
    return () => clearInterval(interval);
  }, []);

  const reprocessarNota = async (id: string) => {
    try {
      setProcessandoId(id);
      const resposta = await fetch('/api/painel/admin/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, acao: 'reprocessar' }),
      });

      if (!resposta.ok) {
        const errData = await resposta.json();
        throw new Error(errData.error || 'Erro ao solicitar reprocessamento.');
      }

      // Recarregar os dados imediatamente
      await carregarDados();
      alert('Nota fiscal re-enfileirada com sucesso para o worker processar!');
    } catch (err: any) {
      alert(`Falha: ${err.message}`);
    } finally {
      setProcessandoId(null);
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  if (carregando && !stats) {
    return <div className="loading-state">Carregando painel de administração...</div>;
  }

  if (erro) {
    return (
      <div className="error-panel">
        <h3>Erro ao inicializar painel</h3>
        <p>{erro}</p>
        <button className="button" onClick={carregarDados}>Tentar novamente</button>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="page-title">
          <h1>Painel de Administração do SaaS</h1>
          <p>Visão de negócios, monitoramento de filas operacionais e suporte técnico.</p>
        </div>
        <div className="toolbar">
          <button className="button" onClick={carregarDados} disabled={carregando}>
            {carregando ? 'Atualizando...' : 'Atualizar métricas'}
          </button>
        </div>
      </header>

      {/* Grid de Métricas Globais */}
      {stats && (
        <section className="metric-grid">
          <div className="metric-card accent-blue">
            <span>Clientes ativos</span>
            <strong>{stats.totalClientes}</strong>
            <small>SaaS Multi-tenant</small>
          </div>
          <div className="metric-card accent-primary">
            <span>Fila de Emissão (SEFAZ)</span>
            <strong>{stats.notasFila}</strong>
            <small className={stats.notasFila > 0 ? 'text-warning' : 'text-success'}>
              {stats.notasFila > 0 ? 'Worker processando...' : 'Nenhum documento na fila'}
            </small>
          </div>
          <div className="metric-card accent-danger">
            <span>Erros Técnicos</span>
            <strong>{stats.notasErro}</strong>
            <small className={stats.notasErro > 0 ? 'text-danger' : 'text-success'}>
              {stats.notasErro > 0 ? 'Requer intervenção de suporte' : 'Tudo operando normalmente'}
            </small>
          </div>
          <div className="metric-card accent-success">
            <span>Faturamento Previsto</span>
            <strong>{formatarMoeda(stats.faturamentoGlobalPrevisto)}</strong>
            <small>Ciclo de faturamento ativo</small>
          </div>
        </section>
      )}

      {/* Monitoramento de Clientes & Planos */}
      <section className="dashboard-grid">
        <div className="panel" style={{ gridColumn: 'span 2' }}>
          <div className="panel-header">
            <div className="page-title compact">
              <h2>Carteira de Clientes Contratantes</h2>
              <p>Gerenciamento financeiro e de consumo de inquilinos cadastrados.</p>
            </div>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Documento (CNPJ)</th>
                  <th>Status SaaS</th>
                  <th>Notas no Mês</th>
                  <th>Saldo de Créditos</th>
                  <th>Total Recebido (Mês)</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <strong>{c.companyName}</strong>
                    </td>
                    <td>{c.document}</td>
                    <td>
                      <span className={`badge ${c.status === 'ATIVO' ? 'live' : 'off'}`}>{c.status}</span>
                    </td>
                    <td>{c.notasMes} notas</td>
                    <td>
                      <strong style={{ color: c.saldoCreditos > 0 ? '#10b981' : '#ef4444' }}>
                        {c.saldoCreditos}
                      </strong>
                    </td>
                    <td>
                      <strong>{formatarMoeda(c.totalPago)}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Monitoramento em Tempo Real das Notas Fiscais */}
      <section className="panel">
        <div className="panel-header">
          <div className="page-title compact">
            <h2>Fila Operacional de Documentos Fiscais (Tempo Real)</h2>
            <p>Monitore a transmissão, rejeições da SEFAZ e realize reprocessamentos de erros.</p>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Cliente Contratante</th>
                <th>Emitente</th>
                <th>Modelo</th>
                <th>Nº / Série</th>
                <th>Status da Emissão</th>
                <th>Motivo / SEFAZ</th>
                <th>Data</th>
                <th>Ações de Suporte</th>
              </tr>
            </thead>
            <tbody>
              {documentos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="muted text-center">Nenhum documento processado recentemente.</td>
                </tr>
              ) : documentos.map((doc) => (
                <tr key={doc.id}>
                  <td>
                    <strong>{doc.client.companyName}</strong>
                  </td>
                  <td>{doc.empresa?.nome || '-'}</td>
                  <td>{doc.modelo} ({doc.ambiente === 'PRODUCAO' ? 'Prod' : 'Homol'})</td>
                  <td>{doc.numero ? `Nº ${doc.numero} S. ${doc.serie}` : doc.id.substring(0, 8)}</td>
                  <td>
                    <span className={`badge ${
                      doc.status === 'AUTORIZADA' ? 'live' :
                      doc.status === 'ERRO_TECNICO' ? 'danger' :
                      doc.status === 'ENFILEIRADA' ? 'warning' : 'test'
                    }`}>{doc.status}</span>
                  </td>
                  <td>
                    <span className="muted block" style={{ fontSize: '0.8rem', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.cStat ? `[cStat ${doc.cStat}] ` : ''}{doc.motivoSefaz || '-'}
                    </span>
                  </td>
                  <td>{new Date(doc.criadoEm).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
                  <td>
                    {(doc.status === 'ERRO_TECNICO' || doc.status === 'REJEITADA' || doc.status === 'ENFILEIRADA') && (
                      <button
                        className="button danger compact"
                        onClick={() => reprocessarNota(doc.id)}
                        disabled={processandoId === doc.id}
                      >
                        {processandoId === doc.id ? 'Aguarde...' : 'Reprocessar'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
