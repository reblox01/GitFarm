import { verifyEmail } from '@/app/actions/email-verification';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function VerifyEmailPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    const result = await verifyEmail(token);

    if (result.success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="flex justify-center mb-4">
                            <CheckCircle2 className="h-16 w-16 text-green-600" />
                        </div>
                        <CardTitle className="text-2xl">Email Verified!</CardTitle>
                        <CardDescription>
                            {result.message}
                        </CardDescription>
                        <p className="text-sm text-muted-foreground mt-2">
                            Redirecting to dashboard in 3 seconds...
                        </p>
                        <meta http-equiv="refresh" content="3;url=/dashboard" />
                    </CardHeader>
                    <CardContent className="text-center">
                        <Link href="/dashboard">
                            <Button className="w-full">
                                Go to Dashboard
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <XCircle className="h-16 w-16 text-destructive" />
                    </div>
                    <CardTitle className="text-2xl">Verification Failed</CardTitle>
                    <CardDescription className="flex flex-col gap-2">
                        <span>{result.error}</span>
                        <span className="text-xs text-muted-foreground">
                            This link may have expired or already been used. Please log in and request a new one.
                        </span>
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-center">
                    <Link href="/login">
                        <Button variant="outline" className="w-full">
                            Back to Login
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}
