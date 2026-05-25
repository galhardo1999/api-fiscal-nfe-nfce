import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { obterReferencia, ReferenciaApiVisual, slugsReferencia } from '@/componentes/documentacao/referencias-api';

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return slugsReferencia.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const pagina = obterReferencia(slug);

  if (!pagina) {
    return {
      title: 'Documentacao nao encontrada | API Fiscal',
    };
  }

  return {
    title: `${pagina.titulo} | API Fiscal`,
    description: pagina.descricaoMeta,
  };
}

export default async function ReferenciaApiPage({ params }: Props) {
  const { slug } = await params;
  const pagina = obterReferencia(slug);

  if (!pagina) {
    notFound();
  }

  return <ReferenciaApiVisual pagina={pagina} />;
}
