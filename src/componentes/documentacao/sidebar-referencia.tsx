'use client';

import Link from 'next/link';
import { useState } from 'react';

export interface MenuItem {
  titulo: string;
  slug: string;
  href: string;
  metodo?: 'POST' | 'GET' | 'DEL' | 'INFO' | 'CODE';
}

export interface MenuGroup {
  tituloGrupo: string;
  itens: MenuItem[];
}

export const gruposMenu: MenuGroup[] = [
  {
    tituloGrupo: 'Começando',
    itens: [
      { titulo: 'Visão geral', slug: 'visao-geral', href: '/docs/visao-geral' },
      { titulo: 'Primeira emissão', slug: 'primeira-emissao', href: '/docs/primeira-emissao' },
      { titulo: 'Ambientes', slug: 'ambientes', href: '/docs/ambientes' },
      { titulo: 'Autenticação', slug: 'autenticacao', href: '/docs/autenticacao' },
      { titulo: 'Erros da API', slug: 'erros', href: '/docs/erros' },
      { titulo: 'Cobrança por nota', slug: 'cobranca', href: '/docs/cobranca' },
    ]
  },
  {
    tituloGrupo: 'Cadastros',
    itens: [
      { titulo: 'Empresas emitentes', slug: 'empresas', href: '/docs/empresas', metodo: 'POST' },
      { titulo: 'Certificado A1', slug: 'certificados', href: '/docs/certificados', metodo: 'POST' },
    ]
  },
  {
    tituloGrupo: 'Gerenciamento',
    itens: [
      { titulo: 'Webhooks', slug: 'webhooks', href: '/docs/webhooks', metodo: 'POST' },
      { titulo: 'Mapa de endpoints', slug: 'endpoints', href: '/docs/endpoints', metodo: 'INFO' },
      { titulo: 'SDKs e exemplos', slug: 'sdks', href: '/docs/sdks', metodo: 'CODE' },
    ]
  }
];

export const itensNfe: MenuItem[] = [
  { titulo: 'Emitir', slug: 'emitir-nfe', href: '/docs/emitir-nfe', metodo: 'POST' },
  { titulo: 'Consultar', slug: 'consultar-nfe', href: '/docs/consultar-nfe', metodo: 'GET' },
  { titulo: 'Cancelar', slug: 'cancelar-nfe', href: '/docs/cancelar-nfe', metodo: 'DEL' },
  { titulo: 'Emitir Carta de Correção', slug: 'carta-correcao-nfe', href: '/docs/carta-correcao-nfe', metodo: 'POST' },
  { titulo: 'Registrar Ator Interessado', slug: 'registrar-ator-interessado-nfe', href: '/docs/registrar-ator-interessado-nfe', metodo: 'POST' },
  { titulo: 'Registrar Insucesso na Entrega', slug: 'registrar-insucesso-entrega-nfe', href: '/docs/registrar-insucesso-entrega-nfe', metodo: 'POST' },
  { titulo: 'Cancelar Insucesso na Entrega', slug: 'cancelar-insucesso-entrega-nfe', href: '/docs/cancelar-insucesso-entrega-nfe', metodo: 'DEL' },
  { titulo: 'Enviar NFe por Email', slug: 'enviar-nfe-email', href: '/docs/enviar-nfe-email', metodo: 'POST' },
  { titulo: 'Inutilizar Numeração', slug: 'inutilizar-numeracao-nfe', href: '/docs/inutilizar-numeracao-nfe', metodo: 'POST' },
  { titulo: 'Consultar Inutilizações', slug: 'consultar-inutilizacoes-nfe', href: '/docs/consultar-inutilizacoes-nfe', metodo: 'GET' },
  { titulo: 'Importar NFe', slug: 'importar-nfe', href: '/docs/importar-nfe', metodo: 'POST' },
  { titulo: 'Pré-visualização de DANFe', slug: 'pre-visualizacao-danfe', href: '/docs/pre-visualizacao-danfe', metodo: 'POST' },
  { titulo: 'Registrar Conciliação Financeira (ECONF)', slug: 'registrar-econf-nfe', href: '/docs/registrar-econf-nfe', metodo: 'POST' },
  { titulo: 'Consultar Conciliação Financeira (ECONF)', slug: 'consultar-econf-nfe', href: '/docs/consultar-econf-nfe', metodo: 'GET' },
  { titulo: 'Cancelar Conciliação Financeira (ECONF)', slug: 'cancelar-econf-nfe', href: '/docs/cancelar-econf-nfe', metodo: 'DEL' },
  { titulo: 'Emitir Evento', slug: 'emitir-evento-nfe', href: '/docs/emitir-evento-nfe', metodo: 'POST' },
  { titulo: 'Cancelar evento', slug: 'cancelar-evento-nfe', href: '/docs/cancelar-evento-nfe', metodo: 'DEL' },
  { titulo: 'Solicitar reenvio de notificação de NFe', slug: 'solicitar-reenvio-notificacao-nfe', href: '/docs/solicitar-reenvio-notificacao-nfe', metodo: 'POST' }
];

export const itensNfce: MenuItem[] = [
  { titulo: 'Emitir', slug: 'emitir-nfce', href: '/docs/emitir-nfce', metodo: 'POST' },
  { titulo: 'Consultar', slug: 'consultar-nfce', href: '/docs/consultar-nfce', metodo: 'GET' },
  { titulo: 'Cancelar', slug: 'cancelar-nfce', href: '/docs/cancelar-nfce', metodo: 'DEL' },
  { titulo: 'Enviar NFCe por Email', slug: 'enviar-nfce-email', href: '/docs/enviar-nfce-email', metodo: 'POST' },
  { titulo: 'Inutilizar Numeração', slug: 'inutilizar-numeracao-nfce', href: '/docs/inutilizar-numeracao-nfce', metodo: 'POST' },
  { titulo: 'Consultar inutilizações', slug: 'consultar-inutilizacoes-nfce', href: '/docs/consultar-inutilizacoes-nfce', metodo: 'GET' },
  { titulo: 'Registrar Conciliação Financeira (ECONF)', slug: 'registrar-econf-nfce', href: '/docs/registrar-econf-nfce', metodo: 'POST' },
  { titulo: 'Consultar ECONF', slug: 'consultar-econf-nfce', href: '/docs/consultar-econf-nfce', metodo: 'GET' }
];

export function SidebarReferencia({ activeSlug }: { activeSlug: string }) {
  const [nfeExpandido, setNfeExpandido] = useState(
    activeSlug === 'nfe' || 
    activeSlug === 'eventos' || 
    activeSlug.endsWith('-nfe') || 
    activeSlug === 'pre-visualizacao-danfe'
  );
  const [nfceExpandido, setNfceExpandido] = useState(
    activeSlug === 'nfce' || 
    activeSlug.endsWith('-nfce')
  );

  return (
    <aside className="sumario-referencia" aria-label="Navegacao da referencia">
      {/* Começando e Cadastros */}
      {gruposMenu.slice(0, 2).map((grupo) => (
        <div key={grupo.tituloGrupo} className="grupo-menu-sidebar">
          <strong>{grupo.tituloGrupo}</strong>
          <div className="itens-grupo-menu" style={{ display: 'grid', gap: '3px' }}>
            {grupo.itens.map((item) => (
              <Link 
                className={item.slug === activeSlug ? 'ativo' : ''} 
                href={item.href} 
                key={item.slug}
              >
                <span>{item.titulo}</span>
                {item.metodo ? (
                  <span className={`badge-metodo-menu badge-${item.metodo.toLowerCase()}`}>
                    {item.metodo}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
        </div>
      ))}

      {/* Documentos Fiscais Section */}
      <div className="grupo-menu-sidebar">
        <strong>Documentos Fiscais</strong>
        
        {/* NFe Dropdown */}
        <div className="pasta-menu-sidebar">
          <button 
            type="button"
            className={`pasta-titulo ${nfeExpandido ? 'ativa' : ''}`}
            onClick={() => setNfeExpandido(!nfeExpandido)}
          >
            <span>NFe</span>
            <span className={`seta-pasta ${nfeExpandido ? 'rotacionada' : ''}`}>▼</span>
          </button>
          
          {nfeExpandido && (
            <div className="itens-pasta-menu animate-slide-down" style={{ display: 'grid', gap: '3px', paddingLeft: '8px', borderLeft: '1px solid var(--border)', marginLeft: '10px' }}>
              {itensNfe.map((item, idx) => (
                <Link 
                  className={item.slug === activeSlug ? 'ativo' : ''} 
                  href={item.href} 
                  key={`${item.titulo}-${idx}`}
                >
                  <span>{item.titulo}</span>
                  {item.metodo ? (
                    <span className={`badge-metodo-menu badge-${item.metodo.toLowerCase()}`}>
                      {item.metodo}
                    </span>
                  ) : null}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* NFCe Dropdown */}
        <div className="pasta-menu-sidebar" style={{ marginTop: '4px' }}>
          <button 
            type="button"
            className={`pasta-titulo ${nfceExpandido ? 'ativa' : ''}`}
            onClick={() => setNfceExpandido(!nfceExpandido)}
          >
            <span>NFCe</span>
            <span className={`seta-pasta ${nfceExpandido ? 'rotacionada' : ''}`}>▼</span>
          </button>
          
          {nfceExpandido && (
            <div className="itens-pasta-menu animate-slide-down" style={{ display: 'grid', gap: '3px', paddingLeft: '8px', borderLeft: '1px solid var(--border)', marginLeft: '10px' }}>
              {itensNfce.map((item, idx) => (
                <Link 
                  className={item.slug === activeSlug ? 'ativo' : ''} 
                  href={item.href} 
                  key={`${item.titulo}-${idx}`}
                >
                  <span>{item.titulo}</span>
                  {item.metodo ? (
                    <span className={`badge-metodo-menu badge-${item.metodo.toLowerCase()}`}>
                      {item.metodo}
                    </span>
                  ) : null}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Gerenciamento Section (Webhooks, etc.) */}
      {gruposMenu.slice(2).map((grupo) => (
        <div key={grupo.tituloGrupo} className="grupo-menu-sidebar">
          <strong>{grupo.tituloGrupo}</strong>
          <div className="itens-grupo-menu" style={{ display: 'grid', gap: '3px' }}>
            {grupo.itens.map((item) => (
              <Link 
                className={item.slug === activeSlug ? 'ativo' : ''} 
                href={item.href} 
                key={item.slug}
              >
                <span>{item.titulo}</span>
                {item.metodo ? (
                  <span className={`badge-metodo-menu badge-${item.metodo.toLowerCase()}`}>
                    {item.metodo}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </aside>
  );
}
