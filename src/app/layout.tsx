
import type { Metadata } from 'next';
import './globals.css';
import { ClientLayoutWrapper } from '@/components/client-layout-wrapper';

export const metadata: Metadata = {
  title: 'Agora Seller App',
  description: 'Your all-in-one platform for Ghanaian goods and services.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
      </body>
    </html>
  );
}
