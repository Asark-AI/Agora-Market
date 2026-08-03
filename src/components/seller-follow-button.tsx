'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { Seller } from '@/lib/types';

export function SellerFollowButton({ seller }: { seller: Seller }) {
  const router = useRouter();
  const { user, followSeller } = useAuth();
  const { toast } = useToast();
  const [count, setCount] = useState(seller.followerCount || 0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFollow = async () => {
    if (!user) {
      router.push('/sign-in');
      return;
    }

    if (isFollowing) {
      toast({
        title: 'Already following',
        description: `You are already following ${seller.name}.`,
      });
      return;
    }

    setLoading(true);

    try {
      const added = await followSeller(seller.id);
      if (added) {
        setCount((current) => current + 1);
      }
      setIsFollowing(true);
      toast({
        title: added ? 'Following seller' : 'Already following',
        description: added
          ? `You are now following ${seller.name}.`
          : `You are already following ${seller.name}.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Unable to follow',
        description: error?.message || 'Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">{count} follower{count === 1 ? '' : 's'}</span>
      <Button size="sm" onClick={handleFollow} disabled={loading}>
        {isFollowing ? 'Following' : 'Follow'}
      </Button>
    </div>
  );
}
