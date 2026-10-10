import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from '@/app/super/components/ui/toaster';
import { ThemeProvider } from '@/app/super/components/theme-provider';
import { FirebaseClientProvider } from '@/app/super/firebase/client-provider';

export const metadata: Metadata = {
  title: 'Agora',
  description: 'The official Agora dashboard.',
  icons: {
    icon: '/agora-logo.svg',
    shortcut: '/agora-logo.svg',
    apple: '/agora-logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <FirebaseClientProvider>{children}</FirebaseClientProvider>
      <Toaster />
    </ThemeProvider>
  );
}
