'use client';

import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProfileForm } from '@/components/forms/profile-form';
import { PasswordForm } from '@/components/forms/password-form';
import { GitHubIntegration } from '@/components/forms/github-integration';
import { Coins, ArrowUpCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SettingsTabsProps {
    user: {
        id: string;
        name: string;
        email: string;
        credits: number;
    };
    subscription?: {
        status: string;
        currentPeriodEnd: Date | null;
        plan: {
            name: string;
            price: number;
            type: string;
        };
    } | null;
}

import { cancelSubscription } from '@/app/actions/billing';
import { deleteAccount } from '@/app/actions/user';
import { getUserPayments } from '@/app/actions/payments';
import { signOut } from 'next-auth/react';
import { toast } from 'sonner';
import { format } from 'date-fns';
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
} from "@/components/ui/alert-dialog";

export function SettingsTabs({ user, subscription }: SettingsTabsProps) {
    const searchParams = useSearchParams();
    const tab = searchParams.get('tab');
    const [defaultTab, setDefaultTab] = useState('profile');
    const [isCancelling, setIsCancelling] = useState(false);
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);
    const [payments, setPayments] = useState<any[]>([]);
    const [isLoadingPayments, setIsLoadingPayments] = useState(false);

    useEffect(() => {
        if (tab === 'integrations' || tab === 'billing' || tab === 'profile' || tab === 'payment-history') {
            setDefaultTab(tab);
        }
    }, [tab]);

    useEffect(() => {
        if (defaultTab === 'payment-history') {
            loadPayments();
        }
    }, [defaultTab]);

    const loadPayments = async () => {
        setIsLoadingPayments(true);
        try {
            const res = await getUserPayments();
            if (res && res.success) {
                setPayments(res.data || []);
            }
        } catch (err) {
            console.error('Failed to load payments:', err);
        } finally {
            setIsLoadingPayments(false);
        }
    };

    const handleCancelSubscription = async () => {
        setIsCancelling(true);
        try {
            const res = await cancelSubscription();
            if (res && res.success) {
                toast.success(res.message);
            } else {
                toast.error(res?.error || 'Failed to cancel subscription');
            }
        } catch (err) {
            toast.error('An unexpected error occurred');
        } finally {
            setIsCancelling(false);
        }
    };

    const handleDeleteAccount = async () => {
        setIsDeletingAccount(true);
        try {
            const res = await deleteAccount();
            if (res && res.success) {
                toast.success('Account deleted successfully');
                await signOut({ callbackUrl: '/' });
            } else {
                toast.error(res?.error || 'Failed to delete account');
            }
        } catch (err) {
            toast.error('An unexpected error occurred');
        } finally {
            setIsDeletingAccount(false);
        }
    };

    return (
        <Tabs value={defaultTab} onValueChange={setDefaultTab} className="w-full">
            <TabsList>
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="integrations">Integrations</TabsTrigger>
                <TabsTrigger value="billing">Billing</TabsTrigger>
                <TabsTrigger value="payment-history">Payment History</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
                <ProfileForm user={{
                    name: user.name,
                    email: user.email,
                }} />
                <PasswordForm />

                <Card className="border-red-200 dark:border-red-900/50">
                    <CardHeader>
                        <CardTitle className="text-red-500">Danger Zone</CardTitle>
                        <CardDescription>
                            Permanently delete your account and all your data. This action cannot be undone.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" disabled={isDeletingAccount}>
                                    {isDeletingAccount ? 'Deleting...' : 'Delete My Account'}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently delete your account, remove all your credits, tasks, and history.
                                        This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700">
                                        Delete Account
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="integrations" className="space-y-4">
                <GitHubIntegration userId={user.id} />
            </TabsContent>

            <TabsContent value="billing" className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Current Plan</CardTitle>
                        <CardDescription>
                            Manage your subscription and billing
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-lg">{subscription ? subscription.plan.name : 'Free Plan'}</p>
                                <p className="text-sm text-muted-foreground">
                                    {subscription
                                        ? `${subscription.plan.type === 'MONTHLY' ? 'Billed monthly' : 'One-time purchase'} • Renews ${subscription.currentPeriodEnd ? format(new Date(subscription.currentPeriodEnd), 'PP') : 'Never'}`
                                        : 'Upgrade to unlock premium features'}
                                </p>
                            </div>
                            <Badge variant={subscription?.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                {subscription?.status || 'Free'}
                            </Badge>
                        </div>

                        {subscription?.status === 'ACTIVE' && subscription.plan.type === 'MONTHLY' && (
                            <div className="flex justify-end pt-4">
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                                            disabled={isCancelling}
                                        >
                                            {isCancelling ? 'Cancelling...' : 'Cancel Subscription'}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Cancel your subscription?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                You will lose access to your premium features at the end of the current billing period.
                                                You can always resubscribe later.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Keep My Plan</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleCancelSubscription} className="bg-red-600 hover:bg-red-700">
                                                Cancel Subscription
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        )}

                        {!subscription && (
                            <div className="flex justify-end pt-4">
                                <Button asChild>
                                    <a href="/dashboard/plans">Upgrade Plan</a>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Usage & Credits</CardTitle>
                        <CardDescription>
                            Your remaining balance and usage statistics
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-500 rounded-lg text-white">
                                    <Coins className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Available Balance</p>
                                    <p className="text-2xl font-bold text-green-600 dark:text-green-500">{user.credits?.toLocaleString() || 0} Credits</p>
                                </div>
                            </div>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700" asChild>
                                <a href="/dashboard/plans">
                                    <ArrowUpCircle className="mr-2 h-4 w-4" />
                                    Get More
                                </a>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="payment-history" className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Transaction History</CardTitle>
                        <CardDescription>
                            A detailed list of all your past payments and plan upgrades.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {isLoadingPayments ? (
                                <div className="text-center py-8 text-muted-foreground italic">Loading history...</div>
                            ) : !payments || payments.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground italic">No transactions found</div>
                            ) : (
                                <div className="rounded-md border overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b bg-muted/50">
                                                <th className="px-4 py-3 text-left font-medium">Plan</th>
                                                <th className="px-4 py-3 text-left font-medium">Amount</th>
                                                <th className="px-4 py-3 text-left font-medium">Status</th>
                                                <th className="px-4 py-3 text-left font-medium">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {payments.map((payment) => (
                                                <tr key={payment.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-4 py-3 font-medium">{payment.plan?.name || 'Top-up'}</td>
                                                    <td className="px-4 py-3">${(payment.amount / 100).toFixed(2)}</td>
                                                    <td className="px-4 py-3">
                                                        <Badge variant={payment.status === 'COMPLETED' ? 'default' : 'secondary'} className="text-[10px] h-4">
                                                            {payment.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-muted-foreground">
                                                        {format(new Date(payment.createdAt), 'MMM d, yyyy')}
                                                        <p className="text-[10px] opacity-70">
                                                            {format(new Date(payment.createdAt), 'HH:mm')}
                                                        </p>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
