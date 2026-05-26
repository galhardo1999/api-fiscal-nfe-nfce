import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AmbienteFiscalApi, ModeloDocumentoFiscal, StatusDocumentoFiscal } from '@prisma/client';
import { authOptions } from '@/lib/auth-config';
import { calcularCobrancaNotas, obterAnoMes, obterIntervaloAnoMes } from '@/lib/cobranca/cobranca';
import { prisma } from '@/lib/prisma';

const statusProblematicos = [
  StatusDocumentoFiscal.REJEITADA,
  StatusDocumentoFiscal.DENEGADA,
  StatusDocumentoFiscal.ERRO_TECNICO,
] as const;

const statusOperacionais = [
  StatusDocumentoFiscal.RECEBIDA,
  StatusDocumentoFiscal.VALIDANDO,
  StatusDocumentoFiscal.XML_GERADO,
  StatusDocumentoFiscal.ASSINADA,
  StatusDocumentoFiscal.ENFILEIRADA,
  StatusDocumentoFiscal.ENVIANDO_SEFAZ,
  StatusDocumentoFiscal.AUTORIZADA,
  StatusDocumentoFiscal.REJEITADA,
  StatusDocumentoFiscal.DENEGADA,
  StatusDocumentoFiscal.CANCELADA,
  StatusDocumentoFiscal.CONTINGENCIA,
  StatusDocumentoFiscal.INUTILIZADA,
  StatusDocumentoFiscal.ERRO_TECNICO,
] as const;

const rotulosStatus: Record<StatusDocumentoFiscal, string> = {
  RECEBIDA: 'Recebida',
  VALIDANDO: 'Validando',
  XML_GERADO: 'XML gerado',
  ASSINADA: 'Assinada',
  ENFILEIRADA: 'Enfileirada',
  ENVIANDO_SEFAZ: 'Enviando SEFAZ',
  AUTORIZADA: 'Autorizada',
  REJEITADA: 'Rejeitada',
  DENEGADA: 'Denegada',
  CANCELADA: 'Cancelada',
  CONTINGENCIA: 'Contingencia',
  INUTILIZADA: 'Inutilizada',
  ERRO_TECNICO: 'Erro tecnico',
};

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

function formatarData(valor: Date | null) {
  if (!valor) {
    return '-';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(valor);
}

function formatarAmbiente(ambiente: AmbienteFiscalApi) {
  return ambiente === AmbienteFiscalApi.PRODUCAO ? 'Producao' : 'Homologacao';
}

function formatarModelo(modelo: ModeloDocumentoFiscal) {
  return modelo === ModeloDocumentoFiscal.NFE ? 'NF-e' : 'NFC-e';
}

function classeStatus(status: StatusDocumentoFiscal) {
  if (status === StatusDocumentoFiscal.AUTORIZADA) {
    return 'live';
  }

  if (statusProblematicos.includes(status as (typeof statusProblematicos)[number])) {
    return 'danger';
  }

  if (status === StatusDocumentoFiscal.CANCELADA || status === StatusDocumentoFiscal.INUTILIZADA) {
    return 'off';
  }

  if (status === StatusDocumentoFiscal.CONTINGENCIA) {
    return 'warning';
  }

  return 'test';
}

function obterPercentual(parte: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.round((parte / total) * 100);
}

export default async function PainelDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  if (session.user.isAdmin) {
    redirect('/painel/admin');
  }

  if (!session.user.isAdmin && !session.user.clientId) {
    return (
      <section className="panel">
        <div className="panel-header">
          <div className="page-title">
            <h1>Dashboard</h1>
            <p>Este usuario nao esta vinculado a um cliente contratante.</p>
          </div>
        </div>
      </section>
    );
  }

  const clientId = session.user.isAdmin ? undefined : session.user.clientId;
  const filtroCliente = clientId ? { clientId } : {};
  const anoMes = obterAnoMes();
  const intervaloMes = obterIntervaloAnoMes(anoMes);
  const filtroMes = {
    ...filtroCliente,
    criadoEm: {
      gte: intervaloMes.inicio,
      lt: intervaloMes.fim,
    },
  };

  const filtroEmpresas = clientId
    ? {
        user: {
          clientId,
        },
      }
    : {};

  const [
    cliente,
    documentosMes,
    notasEmitidasMes,
    notasRejeitadasMes,
    notasCanceladasMes,
    notasContingenciaMes,
    valorFiscalAutorizado,
    documentosPorStatus,
    documentosPorModelo,
    documentosPorAmbiente,
    documentosRecentes,
    totalEmpresas,
    certificadosAtivos,
    chavesAtivas,
    chavesProducao,
    chavesHomologacao,
    webhooksAtivos,
    webhooksPendentes,
    webhooksFalhos,
  ] = await Promise.all([
    clientId
      ? prisma.client.findUnique({
          where: { id: clientId },
          select: {
            companyName: true,
            status: true,
            saldoCreditos: true,
            plan: {
              select: {
                name: true,
                price: true,
              },
            },
          },
        })
      : null,
    prisma.documentoFiscal.count({ where: filtroMes }),
    prisma.documentoFiscal.count({
      where: {
        ...filtroMes,
        status: StatusDocumentoFiscal.AUTORIZADA,
      },
    }),
    prisma.documentoFiscal.count({
      where: {
        ...filtroMes,
        status: { in: [...statusProblematicos] },
      },
    }),
    prisma.documentoFiscal.count({
      where: {
        ...filtroMes,
        status: StatusDocumentoFiscal.CANCELADA,
      },
    }),
    prisma.documentoFiscal.count({
      where: {
        ...filtroMes,
        status: StatusDocumentoFiscal.CONTINGENCIA,
      },
    }),
    prisma.documentoFiscal.aggregate({
      where: {
        ...filtroMes,
        status: StatusDocumentoFiscal.AUTORIZADA,
      },
      _sum: {
        valorTotal: true,
      },
    }),
    prisma.documentoFiscal.groupBy({
      by: ['status'],
      where: filtroMes,
      _count: {
        _all: true,
      },
    }),
    prisma.documentoFiscal.groupBy({
      by: ['modelo'],
      where: filtroMes,
      _count: {
        _all: true,
      },
    }),
    prisma.documentoFiscal.groupBy({
      by: ['ambiente'],
      where: filtroMes,
      _count: {
        _all: true,
      },
    }),
    prisma.documentoFiscal.findMany({
      where: filtroCliente,
      orderBy: { criadoEm: 'desc' },
      take: 10,
      select: {
        id: true,
        modelo: true,
        ambiente: true,
        status: true,
        numero: true,
        serie: true,
        chaveAcesso: true,
        valorTotal: true,
        motivoSefaz: true,
        criadoEm: true,
        empresa: {
          select: {
            nome: true,
            cnpj: true,
          },
        },
      },
    }),
    prisma.empresa.count({
      where: {
        ...filtroEmpresas,
        active: true,
      },
    }),
    prisma.certificadoDigital.count({
      where: {
        active: true,
        empresa: {
          ...filtroEmpresas,
          active: true,
        },
      },
    }),
    prisma.chaveApi.count({
      where: {
        ...filtroCliente,
        ativa: true,
      },
    }),
    prisma.chaveApi.count({
      where: {
        ...filtroCliente,
        ativa: true,
        ambiente: AmbienteFiscalApi.PRODUCAO,
      },
    }),
    prisma.chaveApi.count({
      where: {
        ...filtroCliente,
        ativa: true,
        ambiente: AmbienteFiscalApi.HOMOLOGACAO,
      },
    }),
    prisma.endpointWebhook.count({
      where: {
        ...filtroCliente,
        ativo: true,
      },
    }),
    prisma.entregaWebhook.count({
      where: {
        ...filtroCliente,
        status: { in: ['PENDENTE', 'ENVIANDO'] },
      },
    }),
    prisma.entregaWebhook.count({
      where: {
        ...filtroCliente,
        status: { in: ['FALHOU', 'ESGOTADO'] },
      },
    }),
  ]);

  const cobranca = calcularCobrancaNotas(notasEmitidasMes);
  const valorAutorizado = Number(valorFiscalAutorizado._sum.valorTotal || 0);
  const valorMedioNota = notasEmitidasMes > 0 ? valorAutorizado / notasEmitidasMes : 0;
  const empresasSemCertificado = Math.max(0, totalEmpresas - certificadosAtivos);
  const taxaAutorizacao = obterPercentual(notasEmitidasMes, documentosMes);
  const mapaStatus = new Map(documentosPorStatus.map((item) => [item.status, item._count._all]));
  const mapaModelo = new Map(documentosPorModelo.map((item) => [item.modelo, item._count._all]));
  const mapaAmbiente = new Map(documentosPorAmbiente.map((item) => [item.ambiente, item._count._all]));

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="page-title">
          <h1>Dashboard</h1>
          <p>
            {session.user.isAdmin
              ? `Visao geral da plataforma em ${anoMes}.`
              : `${cliente?.companyName || 'Cliente'} em ${anoMes}.`}
          </p>
        </div>
        <div className="toolbar">
          <Link className="button" href="/painel/chaves">
            Gerenciar chaves
          </Link>
        </div>
      </header>

      <section className="metric-grid">
        <div className="metric-card accent-primary">
          <span>Notas emitidas no mes</span>
          <strong>{notasEmitidasMes}</strong>
          <small>{taxaAutorizacao}% de autorizacao sobre {documentosMes} documentos</small>
        </div>
        <div className="metric-card accent-success">
          <span>Saldo de créditos</span>
          <strong style={{ color: ((cliente as any)?.saldoCreditos || 0) > 0 ? '#10b981' : '#ef4444' }}>
            {((cliente as any)?.saldoCreditos || 0)}
          </strong>
          <small>{((cliente as any)?.saldoCreditos || 0) > 0 ? 'Créditos ativos em ambiente real' : '⚠️ Sem saldo! Emissões em produção bloqueadas.'}</small>
        </div>
        <div className="metric-card accent-blue">
          <span>Valor fiscal autorizado</span>
          <strong>{formatarMoeda(valorAutorizado)}</strong>
          <small>Ticket medio {formatarMoeda(valorMedioNota)}</small>
        </div>
        <div className="metric-card accent-warning">
          <span>Pendencias fiscais</span>
          <strong>{notasRejeitadasMes + notasContingenciaMes}</strong>
          <small>{notasRejeitadasMes} rejeitadas/erro, {notasContingenciaMes} em contingencia e {notasCanceladasMes} canceladas</small>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="panel">
          <div className="panel-header">
            <div className="page-title compact">
              <h2>Resumo de créditos</h2>
              <p>Controle do saldo pré-pago para emissão fiscal em Produção.</p>
            </div>
          </div>
          <div className="panel-body">
            <dl className="detail-list">
              <div>
                <dt>Saldo de créditos</dt>
                <dd><strong>{((cliente as any)?.saldoCreditos || 0)} notas</strong></dd>
              </div>
              <div>
                <dt>Notas autorizadas no mês</dt>
                <dd>{notasEmitidasMes}</dd>
              </div>
              <div>
                <dt>Modelo comercial</dt>
                <dd>Pré-pago recarregável</dd>
              </div>
              <div>
                <dt>Validade dos créditos</dt>
                <dd>12 meses após aquisição</dd>
              </div>
              <div>
                <dt>Ambiente de homologação</dt>
                <dd style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Grátis & Ilimitado</dd>
              </div>
              <div>
                <dt>Ações</dt>
                <dd>
                  <Link href="/painel/planos" style={{ color: 'var(--primary)', textDecoration: 'underline', fontWeight: 'bold' }}>
                    Recarregar saldo
                  </Link>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div className="page-title compact">
              <h2>Operacao</h2>
              <p>Saude da integracao e infraestrutura do cliente.</p>
            </div>
          </div>
          <div className="panel-body">
            <div className="ops-grid">
              <div>
                <span>Empresas</span>
                <strong>{totalEmpresas}</strong>
              </div>
              <div>
                <span>Sem certificado</span>
                <strong>{empresasSemCertificado}</strong>
              </div>
              <div>
                <span>Chaves ativas</span>
                <strong>{chavesAtivas}</strong>
              </div>
              <div>
                <span>Webhooks ativos</span>
                <strong>{webhooksAtivos}</strong>
              </div>
              <div>
                <span>Entregas pendentes</span>
                <strong>{webhooksPendentes}</strong>
              </div>
              <div>
                <span>Entregas com falha</span>
                <strong>{webhooksFalhos}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="panel">
          <div className="panel-header">
            <div className="page-title compact">
              <h2>Status das notas</h2>
              <p>Distribuicao dos documentos recebidos no mes.</p>
            </div>
          </div>
          <div className="panel-body">
            <div className="status-list">
              {statusOperacionais.map((status) => {
                const quantidade = mapaStatus.get(status) || 0;
                if (quantidade === 0) {
                  return null;
                }

                return (
                  <div key={status} className="status-row">
                    <span>
                      <span className={`status-dot ${classeStatus(status)}`} />
                      {rotulosStatus[status]}
                    </span>
                    <strong>{quantidade}</strong>
                  </div>
                );
              })}
              {documentosMes === 0 ? <div className="empty-state">Nenhum documento recebido neste mes.</div> : null}
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div className="page-title compact">
              <h2>Canais e modelos</h2>
              <p>Uso por documento, ambiente e credencial.</p>
            </div>
          </div>
          <div className="panel-body">
            <div className="split-metrics">
              <div>
                <span>NF-e</span>
                <strong>{mapaModelo.get(ModeloDocumentoFiscal.NFE) || 0}</strong>
              </div>
              <div>
                <span>NFC-e</span>
                <strong>{mapaModelo.get(ModeloDocumentoFiscal.NFCE) || 0}</strong>
              </div>
              <div>
                <span>Producao</span>
                <strong>{mapaAmbiente.get(AmbienteFiscalApi.PRODUCAO) || 0}</strong>
                <small>{chavesProducao} chaves ativas</small>
              </div>
              <div>
                <span>Homologacao</span>
                <strong>{mapaAmbiente.get(AmbienteFiscalApi.HOMOLOGACAO) || 0}</strong>
                <small>{chavesHomologacao} chaves ativas</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div className="page-title compact">
            <h2>Ultimas notas</h2>
            <p>Valores fiscais, status SEFAZ e custo unitario estimado pela faixa atual.</p>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Documento</th>
                <th>Emitente</th>
                <th>Ambiente</th>
                <th>Status</th>
                <th>Valor da nota</th>
                <th>Custo API</th>
                <th>SEFAZ</th>
                <th>Criado em</th>
              </tr>
            </thead>
            <tbody>
              {documentosRecentes.length === 0 ? (
                <tr>
                  <td colSpan={8}>Nenhuma nota recebida ainda.</td>
                </tr>
              ) : documentosRecentes.map((documento) => (
                <tr key={documento.id}>
                  <td>
                    <strong>{formatarModelo(documento.modelo)}</strong>
                    <div className="muted">
                      {documento.numero ? `No ${documento.numero} serie ${documento.serie || '-'}` : documento.id.slice(0, 10)}
                    </div>
                  </td>
                  <td>
                    {documento.empresa?.nome || '-'}
                    <div className="muted">{documento.empresa?.cnpj || ''}</div>
                  </td>
                  <td>{formatarAmbiente(documento.ambiente)}</td>
                  <td>
                    <span className={`badge ${classeStatus(documento.status)}`}>{rotulosStatus[documento.status]}</span>
                  </td>
                  <td>{formatarMoeda(Number(documento.valorTotal || 0))}</td>
                  <td>{documento.status === StatusDocumentoFiscal.AUTORIZADA && documento.ambiente === AmbienteFiscalApi.PRODUCAO ? '1 crédito' : 'Grátis'}</td>
                  <td>{documento.motivoSefaz || '-'}</td>
                  <td>{formatarData(documento.criadoEm)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
