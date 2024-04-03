import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AI } from './action';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Personal Assistant',
  description: 'Personal Assistant',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body className={inter.className}>
        <AI>{children}</AI>
      </body>
    </html>
  );
}
