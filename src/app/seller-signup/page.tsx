
'use client';

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { SellerSignupForm } from "./seller-signup-form";
import { DashboardSkeleton } from '@/components/loading-skeletons';

export default function SellerSignupPage() {
  const router = useRouter();
  const { user, seller, loading } = useAuth();
  
  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/sign-in');
      return;
    }

    if (seller) {
      router.replace(['approved', 'active'].includes(seller.status) ? '/dashboard' : '/seller/application-status');
    }
  }, [user, seller, loading, router]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!user || seller) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-3xl py-12">
        <SellerSignupForm user={user} />
    </div>
  );
}
