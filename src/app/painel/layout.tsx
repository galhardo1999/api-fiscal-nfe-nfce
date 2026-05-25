import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-config';
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
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-title">API Fiscal</div>
        <NavLinksPainel />
      </aside>
      <main className="content">
        <div className="topbar">
          <div>
            <strong>{session.user.name || session.user.email || 'Usuario'}</strong>
            <div className="muted">{session.user.email || session.user.document}</div>
          </div>
          <SairButton />
        </div>
        {children}
      </main>
    </div>
  );
}
