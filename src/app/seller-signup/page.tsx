
'use client';

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { SellerSignupForm } from "./seller-signup-form";
import { PageLoader } from "@/components/page-loader";

export default function SellerSignupPage() {
  const router = useRouter();
  const { user, seller, loading } = useAuth();
  
  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not logged in, send to sign in
        router.push('/sign-in');
      } else if (seller) {
        // Already a seller, go to dashboard
        router.push('/dashboard');
      }
    }
  }, [user, seller, loading, router]);

  if (loading || !user || seller) {
    return <PageLoader />;
  }

  return (
    <div className="container mx-auto max-w-3xl py-12">
        <SellerSignupForm user={user} />
    </div>
  );
}
