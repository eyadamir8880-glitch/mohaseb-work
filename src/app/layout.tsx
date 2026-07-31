import type { Metadata } from 'next';
import { Inter, Cairo } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const cairo = Cairo({ subsets: ['arabic'], weight: ['300', '400', '500', '700'], variable: '--font-cairo', display: 'swap' });

export const metadata: Metadata = {
  title: 'Mohasebeyad - Accounting & ERP System',
  description: 'Bilingual Accounting and ERP Management System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning className={`${inter.variable} ${cairo.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
