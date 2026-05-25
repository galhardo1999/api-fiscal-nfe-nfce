import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'API Fiscal',
  description: 'Painel da API Fiscal NF-e e NFC-e',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
