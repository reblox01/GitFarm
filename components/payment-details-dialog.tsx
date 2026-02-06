'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { CreditCard, Calendar, User, Info, Database } from 'lucide-react';

interface PaymentDetailsDialogProps {
    payment: any;
}

export function PaymentDetailsDialog({ payment }: PaymentDetailsDialogProps) {
    const formatCurrency = (amount: number, currency: string = 'usd') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency.toUpperCase(),
        }).format(amount / 100);
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm">Details</Button>
            </DialogTrigger>
            <DialogContent className="max-w-full max-h-[90vh] overflow-y-auto w-[95vw]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-primary" />
                        Transaction Details
                    </DialogTitle>
                    <DialogDescription>
                        Internal payment record and provider metadata
                    </DialogDescription>
                </DialogHeader>

                <div className="grid border rounded-lg overflow-hidden">
                    {/* Status Header */}
                    <div className="bg-muted/50 mr-8 p-4 border-b flex items-center justify-between">
                        <div className="space-y-0.5">
                            <p className="text-xs font-medium text-muted-foreground uppercase">Transaction Status</p>
                            <Badge variant={payment.status === 'COMPLETED' ? 'default' : 'secondary'} className={payment.status === 'COMPLETED' ? 'bg-green-600' : ''}>
                                {payment.status}
                            </Badge>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-medium text-muted-foreground uppercase">Amount</p>
                            <p className="text-xl font-bold">{formatCurrency(payment.amount, payment.currency)}</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-px bg-border">
                        {/* User Info */}
                        <div className="bg-background p-4 space-y-3">
                            <h3 className="text-sm font-semibold flex items-center gap-2">
                                <User className="h-4 w-4" />
                                User Information
                            </h3>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Name</p>
                                <p className="text-sm font-medium">{payment.user?.name || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Email</p>
                                <p className="text-sm font-medium">{payment.user?.email}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">User ID</p>
                                <p className="text-[10px] font-mono select-all bg-muted p-1 rounded">{payment.userId}</p>
                            </div>
                        </div>

                        {/* Plan Info */}
                        <div className="bg-background p-4 space-y-3 mr-8">
                            <h3 className="text-sm font-semibold flex items-center gap-2">
                                <Info className="h-4 w-4" />
                                Plan Details
                            </h3>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Plan Name</p>
                                <p className="text-sm font-medium">{payment.plan?.name || 'Unknown'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Payment Date</p>
                                <div className="flex items-center gap-1.5 text-sm font-medium">
                                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                    {format(new Date(payment.createdAt), 'PPP HH:mm')}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Update Date</p>
                                <p className="text-sm">{format(new Date(payment.updatedAt), 'PPP HH:mm')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Provider Info */}
                    <div className="bg-background border-t p-4 space-y-3">
                        <h3 className="text-sm font-semibold flex items-center gap-2">
                            <Database className="h-4 w-4" />
                            Provider Details ({payment.provider})
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Payment ID</p>
                                <p className="text-xs font-mono select-all bg-muted p-1 rounded truncate">
                                    {payment.providerPaymentId}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Transaction ID (Internal)</p>
                                <p className="text-xs font-mono">{payment.id}</p>
                            </div>
                        </div>

                        {/* Metadata */}
                        {payment.metadata && Object.keys(payment.metadata).length > 0 && (
                            <div className="mt-4 space-y-2">
                                <p className="text-xs font-semibold text-muted-foreground uppercase">Metadata</p>
                                <div className="bg-muted/30 p-2 rounded text-[10px] font-mono whitespace-pre overflow-x-auto">
                                    {JSON.stringify(payment.metadata, null, 2)}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => window.open(`https://dashboard.stripe.com/payments/${payment.providerPaymentId}`, '_blank')}>
                        View in Stripe
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
