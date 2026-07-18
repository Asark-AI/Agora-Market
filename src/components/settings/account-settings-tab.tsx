
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { SettingsForm } from "@/app/dashboard/settings/settings-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LiquidLoader } from '@/components/liquid-loader';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { ShieldAlert } from 'lucide-react';

function DeleteStoreZone() {
  const { seller, deleteSeller } = useAuth();
  const { toast } = useToast();
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!seller) return null;

  const handleDeleteStore = async () => {
      if (!seller) return;
      setIsDeleting(true);
      await deleteSeller(seller.id);
      toast({
          title: "Store Deleted",
          description: "Your store has been permanently deleted. You have been logged out.",
      });
      // Redirect is handled by logout() inside deleteSeller
      setIsDeleting(false);
  }

  return (
    <Card className="border-destructive mt-8">
      <CardHeader>
        <CardTitle className="text-destructive">Danger Zone</CardTitle>
        <CardDescription>
          This action is permanent and cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Delete My Store</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete your store, including all products and orders.
                Your buyer account will not be affected. To confirm, please
                type <span className="font-bold text-foreground">{seller?.name}</span> below.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Input
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="Type store name to confirm"
              autoComplete="off"
            />
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmationText('')}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteStore}
                disabled={isDeleting || confirmationText !== seller?.name}
                className={buttonVariants({ variant: "destructive" })}
              >
                {isDeleting ? <><LiquidLoader className="mr-2" /> Deleting...</> : 'I understand, delete my store'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

export function AccountSettingsTab() {
    const { user, loading } = useAuth();

    if (loading) {
        return <LiquidLoader />;
    }
    
    return (
        <div className="max-w-3xl">
          <SettingsForm />
          {user?.role === 'Owner' && <DeleteStoreZone />}
        </div>
    )
}
