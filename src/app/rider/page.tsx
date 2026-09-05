'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bike, CheckCircle2, Clock3, LogIn, MapPin, ShieldAlert, UserRound } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import type { CapabilityStatus, RiderProfile } from '@/lib/types';

type RiderApiProfile = Pick<RiderProfile, 'userId' | 'status' | 'riderType' | 'storeId' | 'isOnline' | 'vehicleType' | 'vehicleRegistration' | 'ratingAverage' | 'completedDeliveries'> & {
  phone?: string;
};

const statusCopy: Record<CapabilityStatus, { title: string; description: string }> = {
  pending: { title: 'Application submitted', description: 'Agora is reviewing your rider application. Delivery controls will appear after approval.' },
  under_review: { title: 'Application under review', description: 'Your rider details are being checked. We will update this space when a decision is made.' },
  approved: { title: 'Rider account approved', description: 'You can accept deliveries when you are online.' },
  rejected: { title: 'Application needs attention', description: 'Your previous application was not approved. You can submit updated details below.' },
  suspended: { title: 'Rider account suspended', description: 'Availability is disabled while your account is suspended. Contact Agora support for help.' },
  deactivated: { title: 'Rider account deactivated', description: 'This rider account is no longer active.' },
};

export default function RiderPage() {
  const { user, firebaseUser, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [profile, setProfile] = useState<RiderApiProfile | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phone, setPhone] = useState(user?.phone || '');
  const [vehicleType, setVehicleType] = useState('motorcycle');
  const [vehicleRegistration, setVehicleRegistration] = useState('');

  const getToken = async () => {
    if (!firebaseUser) throw new Error('Please sign in again.');
    return firebaseUser.getIdToken();
  };

  const loadProfile = async () => {
    if (!firebaseUser) return;
    setPageLoading(true);
    try {
      const token = await getToken();
      const response = await fetch('/api/rider/profile', { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json() as { profile?: RiderApiProfile; error?: string };
      if (!response.ok) throw new Error(data.error || 'Unable to load rider access.');
      setProfile(data.profile || null);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Unable to load Rider Center', description: error instanceof Error ? error.message : 'Please try again.' });
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) router.replace('/sign-in');
  }, [loading, router, user]);

  useEffect(() => {
    if (firebaseUser) void loadProfile();
  }, [firebaseUser]);

  const submitApplication = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const token = await getToken();
      const response = await fetch('/api/rider/profile', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, vehicleType, vehicleRegistration }),
      });
      const data = await response.json() as { profile?: RiderApiProfile; error?: string };
      if (!response.ok) throw new Error(data.error || 'Unable to submit application.');
      setProfile(data.profile || null);
      toast({ title: 'Application submitted', description: 'Agora will review your rider details.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Application not submitted', description: error instanceof Error ? error.message : 'Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAvailability = async () => {
    if (!profile || profile.status !== 'approved') return;
    setIsSubmitting(true);
    try {
      const token = await getToken();
      const response = await fetch('/api/rider/profile', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOnline: !profile.isOnline }),
      });
      const data = await response.json() as { profile?: RiderApiProfile; error?: string };
      if (!response.ok) throw new Error(data.error || 'Unable to update availability.');
      setProfile(data.profile || null);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Availability not updated', description: error instanceof Error ? error.message : 'Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || pageLoading) {
    return <div className="mx-auto max-w-2xl space-y-4 p-4 sm:p-8"><Skeleton className="h-8 w-48" /><Skeleton className="h-40 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }
  if (!user) return null;

  const status = profile?.status;
  const copy = status ? statusCopy[status] : null;

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-2xl space-y-5">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Agora</p>
            <h1 className="text-2xl font-semibold tracking-tight">Rider Center</h1>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full border bg-background"><UserRound className="size-5 text-muted-foreground" /></div>
        </header>

        {!profile && (
          <section className="rounded-xl border bg-background p-5 shadow-sm sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Bike className="size-5" /></div>
              <div><h2 className="font-semibold">Apply to deliver with Agora</h2><p className="mt-1 text-sm text-muted-foreground">Use your existing Agora account. We&apos;ll review your details before enabling delivery work.</p></div>
            </div>
            <form onSubmit={submitApplication} className="mt-6 space-y-4">
              <div className="space-y-2"><Label htmlFor="rider-phone">Phone number</Label><Input id="rider-phone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="024 000 0000" required /></div>
              <div className="space-y-2"><Label>Vehicle type</Label><Select value={vehicleType} onValueChange={setVehicleType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="motorcycle">Motorcycle</SelectItem><SelectItem value="car">Car</SelectItem><SelectItem value="van">Van</SelectItem><SelectItem value="bicycle">Bicycle</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label htmlFor="vehicle-registration">Vehicle registration</Label><Input id="vehicle-registration" value={vehicleRegistration} onChange={(event) => setVehicleRegistration(event.target.value)} placeholder="AS 1234-24" required /></div>
              <Button type="submit" disabled={isSubmitting} className="w-full">{isSubmitting ? 'Submitting...' : 'Submit rider application'}</Button>
            </form>
          </section>
        )}

        {profile && copy && (
          <>
            <section className="rounded-xl border bg-background p-5 shadow-sm sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">{status === 'approved' ? <CheckCircle2 className="size-5" /> : status === 'pending' || status === 'under_review' ? <Clock3 className="size-5" /> : <ShieldAlert className="size-5" />}</div>
                <div><h2 className="font-semibold">{copy.title}</h2><p className="mt-1 text-sm text-muted-foreground">{copy.description}</p></div>
              </div>
            </section>

            {status === 'approved' && (
              <section className="rounded-xl border bg-background p-5 shadow-sm sm:p-6">
                <div className="flex items-center justify-between gap-4"><div><p className="text-sm text-muted-foreground">Availability</p><p className="mt-1 text-xl font-semibold">{profile.isOnline ? "You're online" : "You're offline"}</p></div><span className={`size-3 rounded-full ${profile.isOnline ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`} /></div>
                <Button onClick={toggleAvailability} disabled={isSubmitting} variant={profile.isOnline ? 'outline' : 'default'} className="mt-5 h-12 w-full">{isSubmitting ? 'Updating...' : profile.isOnline ? 'Go offline' : 'Go online'}</Button>
                <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><MapPin className="size-3.5" /> Location and delivery requests activate only while you are online.</p>
              </section>
            )}

            {status === 'rejected' && (
              <section className="rounded-xl border bg-background p-5 shadow-sm sm:p-6"><h2 className="font-semibold">Update your application</h2><p className="mt-1 text-sm text-muted-foreground">Submit your current vehicle details for another review.</p><form onSubmit={submitApplication} className="mt-5 space-y-4"><div className="space-y-2"><Label htmlFor="retry-phone">Phone number</Label><Input id="retry-phone" value={phone} onChange={(event) => setPhone(event.target.value)} required /></div><div className="space-y-2"><Label>Vehicle type</Label><Select value={vehicleType} onValueChange={setVehicleType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="motorcycle">Motorcycle</SelectItem><SelectItem value="car">Car</SelectItem><SelectItem value="van">Van</SelectItem><SelectItem value="bicycle">Bicycle</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label htmlFor="retry-registration">Vehicle registration</Label><Input id="retry-registration" value={vehicleRegistration} onChange={(event) => setVehicleRegistration(event.target.value)} required /></div><Button type="submit" disabled={isSubmitting} className="w-full">Submit updated application</Button></form></section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
