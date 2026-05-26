'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Recarga {
  id: string;
  quantidade: number;
  valor: string;
  criadoEm: string;
  expiraEm: string;
}

export default function PlanosPrecosPage() {
  const [saldoCreditos, setSaldoCreditos] = useState<number | null>(null);
  const [recargas, setRecargas] = useState<Recarga[]>([]);
  const [quantidadeNotas, setQuantidadeNotas] = useState<number>(300);
  const [adquirindoId, setAdquirindoId] = useState<number | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // Carregar dados de créditos
  const carregarCreditos = async () => {
    try {
      const res = await fetch('/api/painel/creditos');
      if (res.ok) {
        const data = await res.json();
        setSaldoCreditos(data.saldoCreditos);
        setRecargas(data.recargas || []);
      }
    } catch (err) {
      console.error('Erro ao carregar saldo de créditos:', err);
    }
  };

  useEffect(() => {
    carregarCreditos();
  }, []);

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  const formatarData = (dataStr: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(dataStr));
  };

  // Simular aquisição de lote
  const adquirirLote = async (quantidade: number) => {
    setAdquirindoId(quantidade);
    setMensagemSucesso(null);
    setErro(null);

    try {
      const res = await fetch('/api/painel/creditos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantidade }),
      });

      const data = await res.json();

      if (res.ok) {
        setSaldoCreditos(data.saldoAtualizado);
        setMensagemSucesso(data.mensagem);
        // Recarregar histórico
        carregarCreditos();
        
        // Auto-dismiss alert
        setTimeout(() => {
          setMensagemSucesso(null);
        }, 6000);
      } else {
        setErro(data.error || 'Erro ao processar recarga simulada.');
      }
    } catch (err) {
      setErro('Erro de conexão ao processar recarga.');
    } finally {
      setAdquirindoId(null);
    }
  };

  // Lotes e preços
  const lotes = [
    {
      id: 100,
      nome: 'Lote Lite',
      quantidade: 100,
      valor: 90.00,
      precoUnitario: 0.90,
      descricao: 'Excelente para testadores, microempresas e iniciantes na API fiscal.',
      beneficios: [
        '100 Notas autorizadas (NF-e/NFC-e)',
        'Validade de 12 meses',
        'Homologação 100% grátis e ilimitada',
        'Suporte técnico padrão'
      ],
      corDestaque: 'var(--blue)',
      badge: 'Básico'
    },
    {
      id: 500,
      nome: 'Lote Growth',
      quantidade: 500,
      valor: 375.00,
      precoUnitario: 0.75,
      descricao: 'Perfeito para e-commerces e pequenos negócios com fluxo contínuo.',
      beneficios: [
        '500 Notas autorizadas (NF-e/NFC-e)',
        'Validade de 12 meses',
        'Homologação 100% grátis e ilimitada',
        'Prioridade de suporte por e-mail',
        'Economia de 16% por nota'
      ],
      corDestaque: 'var(--primary)',
      badge: 'Popular',
      destacado: true
    },
    {
      id: 2000,
      nome: 'Lote Scale',
      quantidade: 2000,
      valor: 1200.00,
      precoUnitario: 0.60,
      descricao: 'Ideal para ERPs, hubs de integração e alto volume mensal.',
      beneficios: [
        '2000 Notas autorizadas (NF-e/NFC-e)',
        'Validade de 12 meses',
        'Homologação 100% grátis e ilimitada',
        'Suporte premium prioritário',
        'Economia de 33% por nota'
      ],
      corDestaque: 'var(--success)',
      badge: 'Melhor Preço'
    }
  ];

  // Regra de preço dinâmica do slider do Simulador
  const obterPrecoUnitarioSlider = (q: number) => {
    if (q <= 100) return 0.90;
    if (q <= 500) return 0.75;
    return 0.60;
  };

  const precoUnitarioSlider = obterPrecoUnitarioSlider(quantidadeNotas);
  const valorTotalSlider = quantidadeNotas * precoUnitarioSlider;

  return (
    <div className="dashboard-page" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      <header className="dashboard-header" style={{ marginBottom: '24px' }}>
        <div className="page-title">
          <h1>Créditos e Pacotes Pré-pagos</h1>
          <p>Adquira créditos flexíveis e pague somente por notas emitidas com sucesso em Produção.</p>
        </div>
        
        {/* Widget de Saldo no Topo */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '12px 24px',
          boxShadow: 'var(--shadow)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Seu Saldo Atual
            </span>
            <strong style={{ fontSize: '22px', color: saldoCreditos !== null && saldoCreditos > 0 ? '#10b981' : '#ef4444', lineHeight: '1.2' }}>
              {saldoCreditos !== null ? `${saldoCreditos} notas` : 'Carregando...'}
            </strong>
          </div>
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: saldoCreditos !== null && saldoCreditos > 0 ? '#10b981' : '#ef4444',
            boxShadow: saldoCreditos !== null && saldoCreditos > 0 ? '0 0 8px rgba(16, 185, 129, 0.5)' : '0 0 8px rgba(239, 68, 68, 0.5)'
          }} />
        </div>
      </header>

      {/* Alertas de Retorno da Simulação */}
      {mensagemSucesso && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#065f46',
          padding: '16px 20px',
          borderRadius: '8px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '14.5px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          animation: 'fadeIn 0.3s ease'
        }}>
          <svg style={{ width: '20px', height: '20px', flexShrink: 0, fill: '#10b981' }} viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <div>
            <strong>Sucesso!</strong> {mensagemSucesso} O saldo foi atualizado imediatamente para homologação comercial do MVP.
          </div>
        </div>
      )}

      {erro && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#991b1b',
          padding: '16px 20px',
          borderRadius: '8px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '14.5px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
        }}>
          <svg style={{ width: '20px', height: '20px', flexShrink: 0, fill: '#ef4444' }} viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div>
            <strong>Erro:</strong> {erro}
          </div>
        </div>
      )}

      {/* Grid com Lotes Pré-pagos */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px',
        marginBottom: '40px'
      }}>
        {lotes.map((lote) => (
          <div
            key={lote.id}
            style={{
              background: 'var(--surface)',
              border: lote.destacado ? '2px solid var(--primary)' : '1px solid var(--border)',
              borderRadius: '12px',
              padding: '30px 24px',
              boxShadow: 'var(--shadow)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              cursor: 'default'
            }}
          >
            {/* Tag/Badge de Destaque */}
            <span style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: lote.destacado ? 'var(--primary)' : 'var(--border)',
              color: lote.destacado ? 'white' : 'var(--text)',
              fontSize: '11px',
              fontWeight: 'bold',
              padding: '4px 10px',
              borderRadius: '20px',
              textTransform: 'uppercase'
            }}>
              {lote.badge}
            </span>

            {/* Parte Superior do Card */}
            <div>
              <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>
                {lote.nome}
              </span>
              <h2 style={{ fontSize: '28px', margin: '8px 0 4px 0', fontWeight: '800' }}>
                {lote.quantidade} Notas
              </h2>
              <p style={{ color: 'var(--muted)', fontSize: '13.5px', lineHeight: '1.5', minHeight: '40px', marginBottom: '20px' }}>
                {lote.descricao}
              </p>

              {/* Bloco de Preço */}
              <div style={{ margin: '24px 0', borderBottom: '1px solid var(--border)', paddingBottom: '20px' }}>
                <span style={{ fontSize: '14px', color: 'var(--muted)' }}>Valor único do lote:</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '4px 0' }}>
                  <strong style={{ fontSize: '36px', fontWeight: '900', color: 'var(--text)' }}>
                    {formatarMoeda(lote.valor)}
                  </strong>
                </div>
                <div style={{ display: 'inline-block', background: 'rgba(15, 118, 110, 0.06)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(15, 118, 110, 0.12)' }}>
                  <strong style={{ fontSize: '13.5px', color: 'var(--primary)' }}>
                    {formatarMoeda(lote.precoUnitario)} por nota
                  </strong>
                </div>
              </div>

              {/* Benefícios */}
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 30px 0', display: 'grid', gap: '12px' }}>
                {lote.beneficios.map((beneficio, index) => (
                  <li key={index} style={{ display: 'flex', gap: '10px', fontSize: '13.5px', alignItems: 'center' }}>
                    <svg style={{ width: '16px', height: '16px', fill: '#0f766e', flexShrink: 0 }} viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{beneficio}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Ação */}
            <button
              className="button"
              disabled={adquirindoId !== null}
              onClick={() => adquirirLote(lote.quantidade)}
              style={{
                width: '100%',
                padding: '12px',
                fontWeight: 'bold',
                textAlign: 'center',
                backgroundColor: lote.destacado ? 'var(--primary)' : 'transparent',
                color: lote.destacado ? 'white' : 'var(--primary)',
                border: '2px solid var(--primary)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {adquirindoId === lote.id ? (
                <>
                  <span className="spinner" style={{
                    width: '16px',
                    height: '16px',
                    border: lote.destacado ? '2px solid white' : '2px solid var(--primary)',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'spin 0.6s linear infinite'
                  }} />
                  Processando...
                </>
              ) : (
                `Adquirir ${lote.quantidade} Créditos`
              )}
            </button>
          </div>
        ))}
      </section>

      {/* Regras Comerciais */}
      <section className="panel" style={{ marginBottom: '32px' }}>
        <div className="panel-header">
          <div className="page-title compact">
            <h2>Como funciona o faturamento por créditos?</h2>
            <p>Um modelo focado em custo-benefício, segurança comercial e risco zero de inadimplência.</p>
          </div>
        </div>
        <div className="panel-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
          
          <div style={{ display: 'flex', gap: '14px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'rgba(15, 118, 110, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg style={{ width: '20px', height: '20px', fill: 'var(--primary)' }} viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.9L10 1.154l7.834 3.746A1 1 0 0118.5 5.79v7.42a1 1 0 01-.666.953l-7.834 3.747a1 1 0 01-.666 0L1.5 14.163a1 1 0 01-.666-.954V5.79a1 1 0 01.666-.953zM10 3.56L3.5 6.66v.12L10 9.88l6.5-3.1v-.12L10 3.56z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: '15px', marginBottom: '6px' }}>Consumo 100% Justo</strong>
              <p style={{ color: 'var(--muted)', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
                Créditos são deduzidos do seu saldo **apenas se a nota for de fato AUTORIZADA pela SEFAZ**. Erros de esquema, timeouts e notas rejeitadas não consomem saldo.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'rgba(15, 118, 110, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg style={{ width: '20px', height: '20px', fill: 'var(--primary)' }} viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: '15px', marginBottom: '6px' }}>12 Meses de Validade</strong>
              <p style={{ color: 'var(--muted)', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
                Os lotes expiram apenas após 12 meses. Compre com tranquilidade e consuma no ritmo ideal da sua empresa ou de acordo com a sazonalidade do seu mercado.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'rgba(15, 118, 110, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg style={{ width: '20px', height: '20px', fill: 'var(--primary)' }} viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a.75.75 0 00-.708-.523H4.5a.75.75 0 00-.75.75v8.25a.75.75 0 00.75.75h1.059a.75.75 0 00.708-.523l1.833-5.5a.75.75 0 00-.708-.977H6.267zm8.974.523a.75.75 0 00-.708-.523H13.48a.75.75 0 00-.708.977l1.833 5.5a.75.75 0 00.708.523H16.29a.75.75 0 00.75-.75v-8.25a.75.75 0 00-.75-.75h-1.05z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: '15px', marginBottom: '6px' }}>Homologação Livre</strong>
              <p style={{ color: 'var(--muted)', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
                Qualquer chamada enviada para o ambiente de testes (`HOMOLOGACAO`) é 100% gratuita. Integre, desenvolva, simule e valide à vontade sem preocupações.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Simulador Interativo */}
      <section className="panel" style={{ marginBottom: '32px' }}>
        <div className="panel-header">
          <div className="page-title compact">
            <h2>Simulador de Custos e Economia</h2>
            <p>Estime seu gasto escolhendo a quantidade de notas fiscais desejadas.</p>
          </div>
        </div>
        <div className="panel-body" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', justifyContent: 'center' }}>
            <div className="field">
              <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold' }}>
                <span>Quantidade estimada de notas em Produção:</span>
                <span style={{ fontSize: '18px', color: 'var(--primary)' }}>{quantidadeNotas} notas</span>
              </label>
              <input
                type="range"
                min="10"
                max="3000"
                step="10"
                value={quantidadeNotas}
                onChange={(e) => setQuantidadeNotas(Number(e.target.value))}
                style={{
                  width: '100%',
                  height: '6px',
                  borderRadius: '3px',
                  background: 'var(--border)',
                  outline: 'none',
                  accentColor: 'var(--primary)',
                  cursor: 'pointer',
                  marginTop: '12px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button className="button" onClick={() => setQuantidadeNotas(100)}>LoteLite (100)</button>
              <button className="button" onClick={() => setQuantidadeNotas(500)}>LoteGrowth (500)</button>
              <button className="button" onClick={() => setQuantidadeNotas(1000)}>1.000 notas</button>
              <button className="button" onClick={() => setQuantidadeNotas(2000)}>LoteScale (2000)</button>
            </div>

            <div style={{ background: 'rgba(15, 118, 110, 0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(15, 118, 110, 0.15)', fontSize: '13px', lineHeight: '1.6' }}>
              <strong style={{ display: 'block', color: 'var(--primary)', marginBottom: '4px' }}>💡 Como economizar:</strong>
              Comprando lotes maiores, o preço por nota reduz drasticamente de <strong>R$ 0,90</strong> (para 100 notas) para <strong>R$ 0,60</strong> (para 2.000 notas). Se seu negócio emite mais de 100 notas a cada 3 meses, o lote de 500 notas já compensa imensamente!
            </div>
          </div>

          <div style={{ background: 'var(--surface-muted)', padding: '24px', borderRadius: '8px', border: '1px solid var(--border)', display: 'grid', gap: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              Estimativa do Consumo
            </h3>
            
            <dl className="detail-list" style={{ fontSize: '13.5px' }}>
              <div style={{ padding: '8px 0' }}>
                <dt>Volume estimado</dt>
                <dd>{quantidadeNotas} notas</dd>
              </div>
              <div style={{ padding: '8px 0' }}>
                <dt>Preço por nota estimado</dt>
                <dd style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{formatarMoeda(precoUnitarioSlider)}</dd>
              </div>
              <div style={{ padding: '8px 0' }}>
                <dt>Ambiente de Testes</dt>
                <dd style={{ color: '#10b981' }}>Grátis & Ilimitado</dd>
              </div>
              <div style={{ padding: '8px 0' }}>
                <dt>Suporte e SLA</dt>
                <dd>Incluso</dd>
              </div>
            </dl>

            <div style={{ background: 'white', padding: '12px', borderRadius: '6px', border: '1px solid var(--border)', textAlign: 'center', marginTop: '8px' }}>
              <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', fontWeight: 'bold' }}>
                CUSTO TOTAL ESTIMADO
              </span>
              <strong style={{ fontSize: '24px', color: 'var(--text)', display: 'block', marginTop: '4px' }}>
                {formatarMoeda(valorTotalSlider)}
              </strong>
            </div>
          </div>

        </div>
      </section>

      {/* Histórico de Recargas */}
      <section className="panel">
        <div className="panel-header">
          <div className="page-title compact">
            <h2>Histórico de Recargas (Últimas 10)</h2>
            <p>Lista dos lotes recarregados e controlados por este cliente contratante.</p>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID da Transação</th>
                <th>Quantidade</th>
                <th>Valor Pago</th>
                <th>Adquirido em</th>
                <th>Válido até</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recargas.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px' }}>
                    Nenhuma recarga efetuada ainda neste cliente.
                  </td>
                </tr>
              ) : recargas.map((recarga) => {
                const expirada = new Date(recarga.expiraEm) < new Date();
                return (
                  <tr key={recarga.id}>
                    <td>
                      <code style={{ fontSize: '12px' }}>{recarga.id}</code>
                    </td>
                    <td>
                      <strong>{recarga.quantidade} notas</strong>
                    </td>
                    <td>
                      {formatarMoeda(Number(recarga.valor))}
                    </td>
                    <td>
                      {formatarData(recarga.criadoEm)}
                    </td>
                    <td>
                      {formatarData(recarga.expiraEm)}
                    </td>
                    <td>
                      <span className={`badge ${expirada ? 'danger' : 'live'}`}>
                        {expirada ? 'Expirada' : 'Ativa'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Animação Spin no CSS Local */}
      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
