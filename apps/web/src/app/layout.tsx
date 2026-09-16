import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'AlloTech — Dashboard Administrateur',
  description:
    'Plateforme de gestion des interventions techniques en mobilité pour Douala, Cameroun.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="min-h-screen bg-[#FAFAF8] text-[#2C2C2E] font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
