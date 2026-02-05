'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { createPlan, updatePlan } from '@/app/actions/plans';
import { Loader2, Plus, Pencil } from 'lucide-react';

interface PlanDialogProps {
    trigger?: React.ReactNode;
    plan?: {
        id: string;
        name: string;
        price: number;
        stripeProductId: string | null;
        isDefault: boolean;
    };
}

export function PlanDialog({ trigger, plan }: PlanDialogProps) {
    const isEditing = !!plan;
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState(plan?.name || '');
    const [price, setPrice] = useState(plan ? (plan.price / 100).toString() : ''); // User enters in dollars
    const [stripeId, setStripeId] = useState(plan?.stripeProductId || '');
    const [isDefault, setIsDefault] = useState(plan?.isDefault || false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const priceInCents = Math.round(parseFloat(price) * 100);

            if (isNaN(priceInCents)) {
                toast.error('Invalid price');
                return;
            }

            const payload = {
                name,
                price: priceInCents,
                stripeProductId: stripeId || undefined,
                isDefault,
            };

            const result = isEditing
                ? await updatePlan(plan.id, payload)
                : await createPlan(payload);

            if (result.success) {
                toast.success(isEditing ? 'Plan updated successfully' : 'Plan created successfully');
                setOpen(false);
                if (!isEditing) {
                    // Reset form only if creating
                    setName('');
                    setPrice('');
                    setStripeId('');
                    setIsDefault(false);
                }
            } else {
                toast.error(result.error || `Failed to ${isEditing ? 'update' : 'create'} plan`);
            }
        } catch (error) {
            console.error(error);
            toast.error('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Plan
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Plan' : 'Create Plan'}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? 'Update subscription tier details.' : 'Add a new subscription tier.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Pro Monthly"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="price">Price (USD)</Label>
                        <Input
                            id="price"
                            type="number"
                            min="0"
                            step="0.01"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="9.99"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="stripeId">Stripe Product ID (Optional)</Label>
                        <Input
                            id="stripeId"
                            value={stripeId}
                            onChange={(e) => setStripeId(e.target.value)}
                            placeholder="prod_..."
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="default"
                            checked={isDefault}
                            onCheckedChange={(c) => setIsDefault(!!c)}
                        />
                        <Label htmlFor="default">Set as Default Plan</Label>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {isEditing ? 'Saving...' : 'Creating...'}
                                </>
                            ) : (
                                isEditing ? 'Save Changes' : 'Create Plan'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
