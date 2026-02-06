'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { revokeInvitation } from '@/app/actions/invitations';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

export function RevokeButton({ id }: { id: string }) {
    const [loading, setLoading] = useState(false);

    async function handleRevoke() {
        if (!confirm('Are you sure you want to revoke this invitation?')) return;
        setLoading(true);
        const result = await revokeInvitation(id);
        if (result.success) {
            toast.success('Invitation revoked');
        } else {
            toast.error(result.error);
        }
        setLoading(false);
    }

    return (
        <Button variant="ghost" size="icon" onClick={handleRevoke} disabled={loading}>
            <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
    );
}
