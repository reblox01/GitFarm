'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { revokeInvitation } from '@/app/actions/invitations';
import { toast } from 'sonner';
import { Trash2, Loader2 } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function RevokeButton({ id }: { id: string }) {
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    async function handleRevoke() {
        setLoading(true);
        const result = await revokeInvitation(id);
        if (result.success) {
            toast.success('Invitation revoked');
            setOpen(false);
        } else {
            toast.error(result.error);
        }
        setLoading(false);
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
                    <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Revoke Invitation?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently deactivate the invitation link. The recipient will no longer be able to use it to join the platform.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            handleRevoke();
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white"
                        disabled={loading}
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Revoke Invitation
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
