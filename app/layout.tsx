import type { Metadata, Viewport } from 'next';
import { Inter_Tight, JetBrains_Mono, Unbounded } from 'next/font/google';
import { site } from '@/site.config';
import './globals.css';

const display = Unbounded({ subsets: ['latin'], weight: ['500', '700', '800'], variable: '--f-display', display: 'swap' });
const body = Inter_Tight({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--f-body', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '600'], variable: '--f-mono', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: site.title,
  description: site.description,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: '/',
    siteName: site.name,
    title: site.title,
    description: site.description,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Diorama do DeSol: ilha do cerrado com o dessalinizador solar ao centro' }],
  },
  twitter: { card: 'summary_large_image', title: site.title, description: site.description, images: ['/og-image.png'] },
  icons: { icon: '/icon.svg' },
};

export const viewport: Viewport = { themeColor: '#0E0F0C', width: 'device-width', initialScale: 1 };

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ResearchProject',
  name: 'DeSol — Dessalinizador Solar Inteligente com Monitoramento Hídrico',
  description: site.description,
  url: site.url,
  foundingLocation: { '@type': 'Place', name: 'Cuiabá, Mato Grosso, Brasil' },
  parentOrganization: { '@type': 'EducationalOrganization', name: 'Senac Quantum — Senac-MT' },
  member: ['Pedro Gomes', 'Lucas Pianesso', 'Matheus Santos', 'João Pedro Cunha'].map((name) => ({ '@type': 'Person', name })),
  award: ['3º lugar — 2º Festival Estadual High Tech, categoria Robótica (2026)', 'Melhor projeto — Águas Cuiabá (2026)'],
  sameAs: [site.github],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={site.locale} className={`${display.variable} ${body.variable} ${mono.variable}`} data-theme="ink" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){var d=document.documentElement;d.classList.add('js');try{var c=document.createElement('canvas');if(!/[?&]static/.test(location.search)&&(c.getContext('webgl2')||c.getContext('webgl')))d.classList.add('is-3d')}catch(e){}})()",
          }}
        />
      </head>
      <body>
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </body>
    </html>
  );
}
