import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-config';
import { LoginForm } from './login-form';

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    redirect('/painel/chaves');
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="brand-mark">AF</div>
        <h1>API Fiscal</h1>
        <p>Entre para gerenciar suas chaves de homologacao e producao.</p>
        <LoginForm />
      </section>
    </main>
  );
}
