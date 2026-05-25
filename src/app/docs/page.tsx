import type { Metadata } from 'next';
import { IndiceReferenciasApi } from '@/componentes/documentacao/referencias-api';

export const metadata: Metadata = {
  title: 'Documentacao da API | API Fiscal',
  description: 'Referencias visuais da API Fiscal para integradores.',
};

export default function DocsPage() {
  return <IndiceReferenciasApi />;
}
