'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const linksComuns = [
  { href: '/painel', label: 'Dashboard' },
  { href: '/painel/chaves', label: 'Chaves de API' },
  { href: '/painel/planos', label: 'Planos e Preços' },
  { href: '/docs/visao-geral', label: 'Documentacao' },
] as const;

const linksAdmin = [
  { href: '/painel/admin', label: 'Painel Geral' },
] as const;

interface NavLinksPainelProps {
  isAdmin?: boolean;
}

export function NavLinksPainel({ isAdmin }: NavLinksPainelProps) {
  const pathname = usePathname();
  
  const links = isAdmin ? linksAdmin : linksComuns;

  return (
    <nav className="sidebar-nav">
      {links.map((link) => {
        const ativo = pathname === link.href || (link.href !== '/painel' && pathname.startsWith(link.href));

        return (
          <Link
            key={link.href}
            className={`sidebar-link${ativo ? ' active' : ''}`}
            href={link.href}
            aria-current={ativo ? 'page' : undefined}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
