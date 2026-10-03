'use client';

import { Button } from '@/app/super/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/super/components/ui/card';
import { Input } from '@/app/super/components/ui/input';
import { Label } from '@/app/super/components/ui/label';
import { Logo } from '@/app/super/components/icons';
import { appConfig } from '@/app/super/lib/config';
import { useToast } from '@/app/super/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import Link from 'next/link';
import { errorEmitter } from '@/app/super/firebase/error-emitter';
import { FirestorePermissionError } from '@/app/super/firebase/errors';

export default function SignupPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const auth = getAuth();
        const firestore = getFirestore();

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const staffData = {
                id: user.uid,
                name: name,
                email: email,
                status: 'Pending' as const,
                role: 'Pending' as const,
                department: 'Unassigned' as const,
                joinedDate: new Date().toISOString(),
                avatar: {
                    src: `https://picsum.photos/seed/${user.uid}/40/40`,
                    hint: 'user avatar'
                },
            };

            // Now, create a staff document in Firestore
            setDoc(doc(firestore, "staff", user.uid), staffData)
                .then(() => {
                    toast({
                        title: "Sign-up successful!",
                        description: "Your account has been created. An admin will approve it shortly.",
                    });
                     // Redirect to login or a pending page
                    router.push('/sign-in');
                })
                .catch((serverError) => {
                     // This is where we catch the permission error
                    const permissionError = new FirestorePermissionError({
                        path: `staff/${user.uid}`,
                        operation: 'create',
                        requestResourceData: staffData,
                    });
                    errorEmitter.emit('permission-error', permissionError);
                });

        } catch (error: any) {
            console.error('Sign-up failed:', error);
            if (error.code === 'auth/email-already-in-use') {
                 toast({
                    variant: "destructive",
                    title: "Sign-up Failed",
                    description: "This email address is already in use. Please sign in instead.",
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Sign-up Failed",
                    description: error.message || "An unexpected error occurred.",
                });
            }
        } finally {
            // We don't set loading to false here because the setDoc is async
            // and we redirect on success. If it fails, the error boundary will show.
            // setLoading(false) is only for auth errors.
            if (!getAuth().currentUser) {
              setLoading(false);
            }
        }
    };


    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md shadow-2xl">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex items-center justify-center">
                        <Logo className="h-12 w-12 text-primary" />
                    </div>
                    <CardTitle className="font-headline text-3xl">Create an Account</CardTitle>
                    <CardDescription>Join the {appConfig.siteName} team.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSignup}>
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                id="name"
                                type="text"
                                placeholder="Adwoa Mensah"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                id="email"
                                type="email"
                                placeholder="team@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <Input 
                                id="password" 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required 
                                minLength={6}
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Signing up..." : "Sign Up"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
                 <CardFooter className="flex flex-col text-sm">
                    <p>
                        Already have an account?{' '}
                        <Link href="/sign-in" className="underline">
                            Sign in
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
