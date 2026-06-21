import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mohasebeyad - Accounting & ERP System',
  description: 'Bilingual Accounting and ERP Management System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
