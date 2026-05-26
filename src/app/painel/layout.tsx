import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-config';
import Link from 'next/link';
import { NavLinksPainel } from './nav-links';
import { SairButton } from './sair-button';

export default async function PainelLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  return (
    <div className="pagina-referencia-api" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Cabeçalho superior igual à documentação */}
      <header className="cabecalho-doc-publica" style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid var(--border)', background: 'white' }}>
        <Link className="marca-doc" href="/painel" aria-label="API Fiscal">
          <span>AF</span>
          <strong>API Fiscal</strong>
          <span style={{ fontSize: '11px', fontWeight: '800', background: 'var(--surface-muted)', color: 'var(--primary)', padding: '3px 8px', borderRadius: '6px', marginLeft: '6px' }}>Painel</span>
        </Link>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ textAlign: 'right', fontSize: '13.5px' }}>
            <span style={{ fontWeight: '800', color: 'var(--text)' }}>{session.user.name || session.user.email || 'Usuario'}</span>
            <span style={{ display: 'block', fontSize: '11px', color: 'var(--muted)' }}>{session.user.email}</span>
          </div>
          <SairButton />
        </div>
      </header>

      {/* Grid inferior com Sidebar à esquerda e Conteúdo à direita */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px minmax(0, 1fr)', flex: 1 }}>
        <aside className="sidebar">
          <NavLinksPainel isAdmin={session?.user?.isAdmin || false} />
        </aside>
        <main className="content">
          {children}
        </main>
      </div>
    </div>
  );
}
