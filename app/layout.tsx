import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://game.cxweo.com'),
  title: {
    default: 'Mini Games Hub',
    template: '%s · Mini Games Hub',
  },
  description: '純前端小遊戲集合：踩地雷、五子棋、射箭、弓手獵怪等經典與原創小品。',
  openGraph: {
    type: 'website',
    siteName: 'Mini Games Hub',
    title: 'Mini Games Hub',
    description: '純前端小遊戲集合，每天新增一款遊戲。',
    url: 'https://game.cxweo.com',
    locale: 'zh_TW',
  },
  twitter: {
    card: 'summary',
    title: 'Mini Games Hub',
    description: '純前端小遊戲集合，每天新增一款遊戲。',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

// 早期主題腳本：在 React hydrate 前套用 .dark，避免首屏閃白
const themeBootScript = `
(function(){
  try {
    var raw = localStorage.getItem('cxweo-game-web:settings');
    var theme = 'system';
    if (raw) { var o = JSON.parse(raw); if (o && o.theme) theme = o.theme; }
    var resolved = theme;
    if (theme === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    if (resolved === 'dark') document.documentElement.classList.add('dark');
    document.documentElement.dataset.theme = resolved;
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="zh-Hant"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <Header />
        <main className="flex flex-1 flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
