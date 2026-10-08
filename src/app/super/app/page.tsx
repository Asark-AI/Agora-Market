
'use client';

import { useUser } from '@/app/super/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/admin/sign-in');
        return;
      }
      void user.getIdTokenResult(true).then(({ claims }) => {
        router.replace(claims.role === 'super_admin' ? '/super/app/dashboard' : '/admin/sign-in');
      }).catch(() => router.replace('/admin/sign-in'));
    }
  }, [user, loading, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <p>Loading...</p>
    </div>
  );
}
