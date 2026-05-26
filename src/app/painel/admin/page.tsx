import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-config';
import { AdminPanelClient } from './admin-panel-client';

export default async function AdminPanelPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  if (!session.user.isAdmin) {
    return (
      <section className="panel">
        <div className="panel-header">
          <div className="page-title">
            <h1>Acesso Negado</h1>
            <p>Este painel e restrito apenas para administradores da plataforma SaaS.</p>
          </div>
        </div>
      </section>
    );
  }

  return <AdminPanelClient />;
}
