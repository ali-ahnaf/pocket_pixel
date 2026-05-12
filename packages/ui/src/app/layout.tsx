import type { Metadata } from 'next';
import { Anybody, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import AuthGuard from '@/components/AuthGuard';

const anybody = Anybody({
  subsets: ['latin'],
  variable: '--font-anybody',
  weight: ['700', '800'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  weight: ['700'],
});

export const metadata: Metadata = {
  title: 'Block & Pixel — Expense Tracker',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${anybody.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <AuthGuard>{children}</AuthGuard>
      </body>
    </html>
  );
}
