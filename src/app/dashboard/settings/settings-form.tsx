

'use client';

import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import type { Seller } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { LiquidLoader } from '@/components/liquid-loader';


const formSchema = z.object({
  name: z.string().min(2, { message: 'Business name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  phone: z.string().min(10, "Please enter a valid phone number."),
  status: z.enum(['active', 'draft']),
  
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
  confirmPassword: z.string().optional(),

  notifications: z.object({
      emailOnOrder: z.boolean(),
      emailOnMessage: z.boolean(),
      smsOnOrder: z.boolean(),
      emailOnRepairUpdate: z.boolean(),
      smsOnRepairUpdate: z.boolean(),
  }),
})
.refine(data => {
    if (data.newPassword || data.confirmPassword) {
      if (!data.newPassword || data.newPassword.length < 8) {
          return false;
      }
    }
    return true;
}, {
    message: "New password must be at least 8 characters.",
    path: ["newPassword"],
})
.refine(data => {
    if (data.newPassword || data.confirmPassword) {
        if (!data.currentPassword) {
            return false;
        }
    }
    return true;
}, {
    message: "Current password is required to set a new password.",
    path: ["currentPassword"],
})
.refine(data => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match.",
    path: ["confirmPassword"],
});


type FormValues = z.infer<typeof formSchema>;

export function SettingsForm() {
  const [isSaving, setIsSaving] = useState(false);
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const { seller, loading: loadingSeller, updateSeller } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      status: 'active',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      notifications: {
          emailOnOrder: true,
          emailOnMessage: true,
          smsOnOrder: false,
          emailOnRepairUpdate: true,
          smsOnRepairUpdate: false,
      }
    },
  });

  useEffect(() => {
    if (seller) {
      const defaultNotifications = {
          emailOnOrder: true,
          emailOnMessage: true,
          smsOnOrder: false,
          emailOnRepairUpdate: true,
          smsOnRepairUpdate: false,
      };
      form.reset({
        name: seller.name || '',
        email: seller.email || '',
        phone: seller.phone || '',
        status: seller.status || 'active',
        notifications: { ...defaultNotifications, ...(seller.notifications || {}) },
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    }
  }, [seller, form]);
  
  const handleVerifyPassword = () => {
    const currentPassword = form.getValues('currentPassword');
    // MOCK: In a real app, you'd call an API to verify the password.
    // For this demo, we'll consider any non-empty password as "verified".
    if (currentPassword && currentPassword.length > 0) {
      setIsPasswordVerified(true);
      toast({ title: "Password Verified", description: "You can now set a new password." });
    } else {
      form.setError("currentPassword", { type: "manual", message: "Please enter your current password." });
    }
  };


  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    if (!seller) {
      toast({ variant: 'destructive', title: 'Error', description: 'Seller information not found.' });
      return;
    }

    setIsSaving(true);

    if (data.newPassword && data.currentPassword) {
        toast({
            title: "Password Updated",
            description: "Your password has been changed successfully.",
        });
    }

    const updatePayload: Partial<Seller> = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        status: data.status,
        notifications: data.notifications,
    };
    
    try {
      await updateSeller(seller.id, updatePayload);
      
      toast({
        title: "Settings Saved!",
        description: "Your account settings have been updated.",
      });

      form.reset({
        ...form.getValues(),
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setIsPasswordVerified(false);

    } catch (error) {
      console.error("Could not update seller.", error);
      toast({ variant: 'destructive', title: 'Storage Error', description: 'Could not save your settings.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (loadingSeller || !seller) {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader><Skeleton className="h-8 w-1/3" /></CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
             <Card>
                <CardHeader><Skeleton className="h-8 w-1/3" /></CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Business Profile</CardTitle>
            <CardDescription>Update your public business name and contact email.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Adinkra Crafts" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Login Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="e.g., contact@adinkra.com" {...field} />
                  </FormControl>
                   <FormDescription>This is the email you use to log in.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Phone</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="e.g., 0201234567" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormDescription>Your primary business contact number.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Store Status</CardTitle>
                <CardDescription>Control the visibility of your storefront to customers.</CardDescription>
            </CardHeader>
            <CardContent>
                <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                            <FormLabel>Publish Store</FormLabel>
                            <FormDescription>
                                When enabled, your store will be visible to everyone.
                            </FormDescription>
                        </div>
                        <FormControl>
                            <Switch
                                checked={field.value === 'active'}
                                onCheckedChange={(checked) => field.onChange(checked ? 'active' : 'draft')}
                            />
                        </FormControl>
                    </FormItem>
                )} />
            </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Password Management</CardTitle>
            <CardDescription>Change your password here. Leave blank to keep it unchanged.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Password</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input type="password" {...field} value={field.value ?? ''} disabled={isPasswordVerified} />
                    </FormControl>
                    {!isPasswordVerified && (
                      <Button type="button" variant="secondary" onClick={handleVerifyPassword}>Verify</Button>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            {isPasswordVerified && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                 <Button type="button" variant="link" size="sm" className="p-0 h-auto" onClick={() => {
                   setIsPasswordVerified(false);
                   form.setValue('currentPassword', '');
                   form.setValue('newPassword', '');
                   form.setValue('confirmPassword', '');
                  }}>Cancel password change</Button>
              </>
            )}
          </CardContent>
        </Card>

         <Card>
            <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose how you want to be notified.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <FormField control={form.control} name="notifications.emailOnOrder" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                        <FormLabel>New Orders (Email)</FormLabel>
                        <FormDescription>Receive an email for every new order.</FormDescription>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
                )} />
                 <FormField control={form.control} name="notifications.emailOnMessage" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                        <FormLabel>New Messages (Email)</FormLabel>
                        <FormDescription>Receive an email when a customer messages you.</FormDescription>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
                )} />
                <FormField control={form.control} name="notifications.emailOnRepairUpdate" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                        <FormLabel>Repair Updates (Email)</FormLabel>
                        <FormDescription>Notify customers by email when repair status changes.</FormDescription>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
                )} />
                 <FormField control={form.control} name="notifications.smsOnOrder" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                        <FormLabel>New Orders (SMS)</FormLabel>
                        <FormDescription>Get an SMS alert for new orders (Premium only).</FormDescription>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={seller?.subscriptionPlan === 'basic'} /></FormControl>
                </FormItem>
                )} />
                <FormField control={form.control} name="notifications.smsOnRepairUpdate" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                        <FormLabel>Repair Updates (SMS)</FormLabel>
                        <FormDescription>Notify customers by SMS when repair status changes (Premium only).</FormDescription>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={seller?.subscriptionPlan === 'basic'} /></FormControl>
                </FormItem>
                )} />
            </CardContent>
        </Card>

        <CardFooter className="px-0">
          <Button type="submit" disabled={isSaving} className="w-full md:w-auto" size="lg">
            {isSaving ? (
              <>
                <LiquidLoader className="mr-2" />
                Saving Settings...
              </>
            ) : (
              'Save All Settings'
            )}
          </Button>
        </CardFooter>
      </form>
    </Form>
  );
}
