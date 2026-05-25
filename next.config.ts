import type { NextConfig } from 'next';

process.env.BASELINE_BROWSER_MAPPING_IGNORE_OLD_DATA ??= 'true';
process.env.BROWSERSLIST_IGNORE_OLD_DATA ??= 'true';

const nextConfig: NextConfig = {
  // Mantem o cache de desenvolvimento separado do build de producao.
  // Isso evita ENOENT em manifests quando `next dev` e `next build`
  // rodam perto um do outro ou quando o cache dev fica inconsistente.
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
  outputFileTracingExcludes: {
    '*': ['./Emissor/**/*'],
  },
  // Configuração vazia do Turbopack para Next.js 16
  turbopack: {},
};

export default nextConfig;
