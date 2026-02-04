import { prisma } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Mail } from 'lucide-react';

export default async function AdminUsersPage() {
    const users = await prisma.user.findMany({
        include: {
            subscription: {
                include: {
                    plan: true,
                },
            },
            _count: {
                select: {
                    commitJobs: true,
                    tasks: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
        take: 100, // Limit for performance
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Users</h2>
                    <p className="text-muted-foreground mt-1">
                        Manage all registered users ({users.length} total)
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Users</CardTitle>
                    <CardDescription>
                        View and manage user accounts
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {users.map((user) => (
                            <div
                                key={user.id}
                                className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold">
                                        {user.name?.[0] || 'U'}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium">{user.name}</p>
                                            {user.role === 'ADMIN' && (
                                                <Badge variant="default" className="gap-1">
                                                    <Shield className="h-3 w-3" />
                                                    Admin
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Mail className="h-3 w-3" />
                                            {user.email}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right text-sm">
                                        <p className="font-medium">{user.subscription?.plan.name || 'Free'}</p>
                                        <p className="text-muted-foreground">
                                            {user._count.commitJobs} jobs · {user._count.tasks} tasks
                                        </p>
                                    </div>
                                    <Button variant="outline" size="sm">
                                        View
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
