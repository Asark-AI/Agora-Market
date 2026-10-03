import type { HTMLAttributes } from 'react';
import { AppLogo } from '@/components/app-logo';

export function Logo(props: HTMLAttributes<HTMLDivElement>) {
  return <AppLogo {...props} />;
}
