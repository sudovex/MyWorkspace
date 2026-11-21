import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { siteConfig } from '@/config/site';
import { Providers } from './providers';
import './globals.css';

const { developer, osName } = siteConfig;

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${developer.name} — ${developer.role}`,
    template: `%s · ${osName}`,
  },
  description: siteConfig.description,
  applicationName: osName,
  authors: [{ name: developer.name }],
  openGraph: {
    type: 'website',
    title: `${developer.name} — ${developer.role}`,
    description: siteConfig.description,
    siteName: osName,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${developer.name} — ${developer.role}`,
    description: siteConfig.description,
  },
};

export const viewport: Viewport = {
  themeColor: '#12151c',
  colorScheme: 'dark',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`dark ${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
