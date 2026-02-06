'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { exportPaymentTransactions } from '@/app/actions/payments';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ExportButtonProps {
    search?: string;
}

export function ExportButton({ search }: ExportButtonProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleExport = async () => {
        try {
            setIsLoading(true);
            toast.info('Starting export...');

            const result = await exportPaymentTransactions({ search });

            if (!result || !result.success || !result.data) {
                toast.error('Failed to export data');
                return;
            }

            const transactions = result.data;

            if (transactions.length === 0) {
                toast.warning('No transactions found to export');
                return;
            }

            // Convert to CSV
            const headers = ['ID', 'User', 'Email', 'Amount', 'Currency', 'Status', 'Plan', 'Date', 'Provider ID'];
            const csvContent = [
                headers.join(','),
                ...transactions.map(tx => {
                    const amount = (tx.amount / 100).toFixed(2);
                    const date = format(new Date(tx.createdAt), 'yyyy-MM-dd HH:mm:ss');
                    // Escape fields that might contain commas
                    const user = `"${tx.user?.name || ''}"`;
                    const email = `"${tx.user?.email || ''}"`;
                    const plan = `"${tx.plan?.name || ''}"`;

                    return [
                        tx.id,
                        user,
                        email,
                        amount,
                        tx.currency,
                        tx.status,
                        plan,
                        date,
                        tx.providerPaymentId
                    ].join(',');
                })
            ].join('\n');

            // Download file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success(`Exported ${transactions.length} transactions`);
        } catch (error) {
            console.error('Export error:', error);
            toast.error('An error occurred during export');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button variant="outline" onClick={handleExport} disabled={isLoading}>
            <Download className="mr-2 h-4 w-4" />
            {isLoading ? 'Exporting...' : 'Export CSV'}
        </Button>
    );
}
