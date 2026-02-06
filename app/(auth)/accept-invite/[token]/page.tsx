import { prisma } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AcceptInviteForm } from './accept-invite-form';

export default async function AcceptInvitePage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;

    const invite = await prisma.invitation.findUnique({
        where: { token },
    });

    if (!invite || invite.expires < new Date()) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle className="text-red-600">Invalid or Expired Invitation</CardTitle>
                        <CardDescription>
                            This invitation link is no longer valid.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <Link href="/login">
                            <Button variant="outline">Back to Login</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Accept Invitation</CardTitle>
                    <CardDescription>
                        You have been invited to join GitFarm.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-4 p-3 bg-muted rounded-md text-sm">
                        <p><strong>Email:</strong> {invite.email}</p>
                        <p><strong>Role:</strong> {invite.role}</p>
                    </div>
                    <AcceptInviteForm token={token} email={invite.email} />
                </CardContent>
            </Card>
        </div>
    );
}
