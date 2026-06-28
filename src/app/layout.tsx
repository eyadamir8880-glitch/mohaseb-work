import type { Metadata } from 'next';
import { Inter, Cairo, Tajawal } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const tajawal = Tajawal({ subsets: ['arabic'], weight: ['300', '400', '500', '700'], variable: '--font-tajawal', display: 'swap' });

export const metadata: Metadata = {
  title: 'Mohasebeyad - Accounting & ERP System',
  description: 'Bilingual Accounting and ERP Management System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning className={`${inter.variable} ${tajawal.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
