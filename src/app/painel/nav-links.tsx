'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/painel', label: 'Dashboard' },
  { href: '/painel/chaves', label: 'Chaves de API' },
  { href: '/painel/documentacao', label: 'Documentacao' },
] as const;

export function NavLinksPainel() {
  const pathname = usePathname();

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
