import type { Metadata } from 'next';
import { GoogleAnalytics } from '@next/third-parties/google';
import { Sora, Space_Grotesk } from 'next/font/google';
import ScrollTracker from '@/components/analytics/ScrollTracker';
import './globals.css';

const display = Sora({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '600', '700'],
});

const body = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Wavechat - salas de musica social',
  description:
    'Plataforma de musica social con salas sincronizadas y chat en tiempo real.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="es" className={`${display.variable} ${body.variable}`}>
      <body className="font-body antialiased">
        {children}
        {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
        <ScrollTracker />
      </body>
    </html>
  );
}
