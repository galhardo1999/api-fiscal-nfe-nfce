import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { ChavesApiClient, ChaveApiResumo } from './chaves-api-client';

export default async function ChavesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  if (!session.user.clientId || session.user.isAdmin) {
    return (
      <section className="panel">
        <div className="panel-header">
          <div className="page-title">
            <h1>Chaves de API</h1>
            <p>Este usuario nao esta vinculado a um cliente contratante.</p>
          </div>
        </div>
      </section>
    );
  }

  const chaves = await prisma.chaveApi.findMany({
    where: { clientId: session.user.clientId },
    orderBy: [{ ambiente: 'asc' }, { criadoEm: 'desc' }],
    select: {
      id: true,
      nome: true,
      prefixo: true,
      ambiente: true,
      escopos: true,
      ativa: true,
      ultimoUsoEm: true,
      expiraEm: true,
      criadoEm: true,
    },
  });

  const chavesResumo: ChaveApiResumo[] = chaves.map((chave) => ({
    ...chave,
    ultimoUsoEm: chave.ultimoUsoEm?.toISOString() || null,
    expiraEm: chave.expiraEm?.toISOString() || null,
    criadoEm: chave.criadoEm.toISOString(),
  }));

  return <ChavesApiClient chavesIniciais={chavesResumo} />;
}
