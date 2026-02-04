import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from 'date-fns';
import { UserActions } from '@/components/admin/user-actions';

export default async function AdminUsersPage() {
    const session = await auth();

    if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
        redirect('/dashboard');
    }

    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
            subscription: true,
        }
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Users</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage user accounts and permissions
                    </p>
                </div>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Joined</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={user.avatarUrl || undefined} />
                                        <AvatarFallback>{user.name?.[0] || 'U'}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{user.name || 'Unnamed User'}</p>
                                        <p className="text-xs text-muted-foreground">{user.email}</p>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                                        {user.role}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={user.subscription?.status === 'ACTIVE' ? 'outline' : 'secondary'}>
                                        {user.subscription?.status || 'FREE'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {formatDistanceToNow(user.createdAt, { addSuffix: true })}
                                </TableCell>
                                <TableCell>
                                    <UserActions
                                        userId={user.id}
                                        currentRole={user.role}
                                        userName={user.name || 'User'}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
