'use client';

import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { resendVerificationEmail } from '@/app/actions/email-verification';
import { toast } from 'sonner';

export function VerificationBanner({ userEmail }: { userEmail: string }) {
    const [loading, setLoading] = useState(false);

    const handleResend = async () => {
        setLoading(true);
        try {
            const result = await resendVerificationEmail(userEmail);

            if (result.success) {
                toast.success(result.message);
            } else {
                toast.error(result.error || 'Failed to resend email');
            }
        } catch (error) {
            toast.error('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Alert variant="destructive" className="bg-yellow-50 border-yellow-500 text-yellow-900 dark:bg-yellow-950/50 dark:border-yellow-800 dark:text-yellow-200">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="font-semibold">Verify your email to unlock free credits</AlertTitle>
            <AlertDescription className="mt-2 flex items-center justify-between">
                <span>Please check your inbox and verify your email address to start using GitFarm.</span>
                <Button
                    onClick={handleResend}
                    disabled={loading}
                    variant="outline"
                    size="sm"
                    className="ml-4 border-yellow-600 hover:bg-yellow-100 dark:border-yellow-700 dark:hover:bg-yellow-900"
                >
                    {loading ? 'Sending...' : 'Resend Email'}
                </Button>
            </AlertDescription>
        </Alert>
    );
}
