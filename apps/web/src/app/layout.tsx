import type { Metadata } from 'next';

import '@/styles/globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Serp',
  description: 'Serp application',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
