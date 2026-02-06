import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { InviteUserDialog } from './invite-user-dialog';
import { RevokeButton } from './revoke-button';

export default async function AdminUsersPage() {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') redirect('/dashboard');

    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, role: true, createdAt: true, emailVerified: true }
    });

    const invitations = await prisma.invitation.findMany({
        orderBy: { createdAt: 'desc' },
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Users & Invitations</h2>
                    <p className="text-muted-foreground">Manage system users and team invitations.</p>
                </div>
                <InviteUserDialog />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Pending Invitations</CardTitle>
                        <CardDescription>Invited users who haven't accepted yet.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {invitations.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No pending invitations.</p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Expires</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invitations.map((invite) => (
                                        <TableRow key={invite.id}>
                                            <TableCell>{invite.email}</TableCell>
                                            <TableCell><Badge variant="outline">{invite.role}</Badge></TableCell>
                                            <TableCell>{invite.expires.toLocaleDateString()}</TableCell>
                                            <TableCell className="text-right">
                                                <RevokeButton id={invite.id} />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>All Users</CardTitle>
                        <CardDescription>List of registered users.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Joined</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.name || 'N/A'}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell><Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>{user.role}</Badge></TableCell>
                                        <TableCell>
                                            {user.emailVerified ? (
                                                <Badge className="bg-green-500 hover:bg-green-600">Verified</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-yellow-600 border-yellow-600">Unverified</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>{user.createdAt.toLocaleDateString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
