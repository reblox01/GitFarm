import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { getPaymentTransactions, getPaymentStats } from '@/app/actions/payments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { DollarSign, TrendingUp, CreditCard, Activity, Search, Download } from 'lucide-react';
import { PaymentDetailsDialog } from '@/components/payment-details-dialog';
import { ExportButton } from './export-button';

export default async function PaymentsPage({
    searchParams,
}: {
    searchParams: { page?: string; search?: string }
}) {
    const session = await auth();
    if (!session?.user || session.user.role?.toUpperCase() !== 'ADMIN') {
        redirect('/');
    }

    const page = Number(searchParams.page) || 1;
    const search = searchParams.search || '';
    const limit = 20;

    const [transactionsResult, statsResult] = await Promise.all([
        getPaymentTransactions({
            limit,
            offset: (page - 1) * limit,
            search,
        }),
        getPaymentStats()
    ]);

    const transactions = transactionsResult.success ? transactionsResult.data : [];
    const stats = statsResult.success ? statsResult.data : null;
    const pagination = transactionsResult.success ? transactionsResult.pagination : null;

    // Diagnostic information
    const diagnostic = {
        success: transactionsResult.success,
        count: transactions.length,
        total: pagination?.total,
        error: (transactionsResult as any).error || (statsResult as any).error,
        userRole: session.user.role
    };

    const formatCurrency = (amount: number, currency: string = 'usd') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency.toUpperCase(),
        }).format(amount / 100);
    };

    return (
        <div className="space-y-6 min-w-0 w-full">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
                    <p className="text-muted-foreground">
                        Monitor revenue and transaction history
                    </p>
                </div>
                <ExportButton search={search} />
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats ? formatCurrency(stats.totalRevenue) : '$0.00'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Lifetime earnings
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats ? formatCurrency(stats.thisMonthRevenue) : '$0.00'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stats && stats.lastMonthRevenue > 0
                                ? `${((stats.thisMonthRevenue - stats.lastMonthRevenue) / stats.lastMonthRevenue * 100).toFixed(1)}% from last month`
                                : 'No data from last month'}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats?.totalTransactions || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Success rate: {stats?.successRate.toFixed(1)}%
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Transactions Table */}
            <Card className="overflow-hidden">
                <CardHeader>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle>Recent Transactions</CardTitle>
                        </div>
                        <div className="flex items-center space-x-2">
                            <form className="flex items-center space-x-2">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search user..."
                                        name="search"
                                        defaultValue={search}
                                        className="pl-8 w-full sm:w-[250px]"
                                    />
                                </div>
                                <Button type="submit" variant="secondary">Filter</Button>
                            </form>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table className="min-w-[800px]">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Plan</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            No transactions found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    transactions?.map((tx) => (
                                        <TableRow key={tx.id}>
                                            <TableCell>
                                                <div className="flex items-center space-x-3 min-w-[180px]">
                                                    <Avatar className="h-8 w-8 shrink-0">
                                                        <AvatarImage src={tx.user.avatarUrl || ''} />
                                                        <AvatarFallback>{tx.user.name?.[0] || 'U'}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-medium truncate">{tx.user.name || 'Unknown'}</span>
                                                        <span className="text-xs text-muted-foreground truncate">{tx.user.email}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium whitespace-nowrap">
                                                {formatCurrency(tx.amount, tx.currency)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={
                                                    tx.status === 'COMPLETED' ? 'default' :
                                                        tx.status === 'PENDING' ? 'outline' :
                                                            'destructive'
                                                } className={
                                                    tx.status === 'COMPLETED' ? 'bg-green-600 hover:bg-green-700' : ''
                                                }>
                                                    {tx.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                {tx.plan?.name || 'Unknown Plan'}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                {format(new Date(tx.createdAt), 'MMM d, yyyy')}
                                                <p className="text-xs text-muted-foreground">
                                                    {format(new Date(tx.createdAt), 'HH:mm')}
                                                </p>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <PaymentDetailsDialog payment={tx} />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
