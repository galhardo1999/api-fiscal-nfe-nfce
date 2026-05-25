import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-config';

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  redirect(session?.user?.id ? '/painel' : '/login');
}
