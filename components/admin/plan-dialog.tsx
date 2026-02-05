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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createPlan, updatePlan } from '@/app/actions/plans';
import { Loader2, Plus, Pencil, Coins } from 'lucide-react';

interface PlanDialogProps {
    trigger?: React.ReactNode;
    plan?: {
        id: string;
        name: string;
        type: 'MONTHLY' | 'ONE_TIME';
        price: number;
        credits: number;
        stripeProductId: string | null;
        isDefault: boolean;
    };
}

export function PlanDialog({ trigger, plan }: PlanDialogProps) {
    const isEditing = !!plan;
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState(plan?.name || '');
    const [type, setType] = useState<'MONTHLY' | 'ONE_TIME'>(plan?.type || 'MONTHLY');
    const [price, setPrice] = useState(plan ? (plan.price / 100).toString() : ''); // User enters in dollars
    const [credits, setCredits] = useState(plan?.credits?.toString() || '0');
    const [stripeId, setStripeId] = useState(plan?.stripeProductId || '');
    const [isDefault, setIsDefault] = useState(plan?.isDefault || false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const priceInCents = Math.round(parseFloat(price) * 100);
            const creditsNum = parseInt(credits);

            if (isNaN(priceInCents)) {
                toast.error('Invalid price');
                return;
            }
            if (isNaN(creditsNum)) {
                toast.error('Invalid credits');
                return;
            }

            const payload = {
                name,
                type,
                price: priceInCents,
                credits: creditsNum,
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
                    setType('MONTHLY');
                    setPrice('');
                    setCredits('0');
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
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="type">Plan Type</Label>
                        <Select value={type} onValueChange={(v: any) => setType(v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="MONTHLY">Monthly Subscription</SelectItem>
                                <SelectItem value="ONE_TIME">Top-up / One-time Charge</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

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

                    <div className="grid grid-cols-2 gap-4">
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
                            <Label htmlFor="credits" className="flex items-center gap-1.5">
                                <Coins className="h-3 w-3" />
                                Credits
                            </Label>
                            <Input
                                id="credits"
                                type="number"
                                min="0"
                                value={credits}
                                onChange={(e) => setCredits(e.target.value)}
                                placeholder="1000"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="stripeId">Stripe Product or Price ID (Optional)</Label>
                        <Input
                            id="stripeId"
                            value={stripeId}
                            onChange={(e) => setStripeId(e.target.value)}
                            placeholder="prod_... or price_..."
                        />
                    </div>
                    <div className="flex items-center space-x-2 pt-2">
                        <Checkbox
                            id="default"
                            checked={isDefault}
                            onCheckedChange={(c) => setIsDefault(!!c)}
                        />
                        <Label htmlFor="default">Set as Default Plan</Label>
                    </div>
                    <DialogFooter className="pt-4">
                        <Button type="submit" className="w-full" disabled={loading}>
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
