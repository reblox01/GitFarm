'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getPlanLimits, updatePlanLimit, togglePlanFeature } from '@/app/actions/admin';
import { toast } from 'sonner';
import { Loader2, Save, CheckCircle2, Circle } from 'lucide-react';

export function PlanLimitsManager() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{ plans: any[], allFeatures: any[] } | null>(null);
    const [saving, setSaving] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const result = await getPlanLimits();
            setData(result);
        } catch (error) {
            toast.error('Failed to load plan limits');
        } finally {
            setLoading(false);
        }
    }

    const handleFeatureToggle = async (planId: string, featureId: string, enabled: boolean) => {
        setSaving(`${planId}-${featureId}`);
        try {
            await togglePlanFeature(planId, featureId, enabled);
            await loadData(); // Refresh to get active/inactive state
            toast.success('Feature toggled');
        } catch (error) {
            toast.error('Failed to toggle feature');
        } finally {
            setSaving(null);
        }
    };

    const handleLimitChange = async (planId: string, featureId: string, value: string) => {
        const numValue = value === '' ? null : parseInt(value);
        if (numValue !== null && isNaN(numValue)) return;

        setSaving(`${planId}-${featureId}`);
        try {
            await updatePlanLimit(planId, featureId, numValue);
            await loadData();
            toast.success('Limit updated');
        } catch (error) {
            toast.error('Failed to update limit');
        } finally {
            setSaving(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Plan Feature Limits</CardTitle>
                    <CardDescription>
                        Define feature access and usage limits for each subscription tier.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[200px]">Feature</TableHead>
                                    {data?.plans.map((plan: any) => (
                                        <TableHead key={plan.id} className="text-center">
                                            {plan.name}
                                            <div className="text-xs font-normal text-muted-foreground">
                                                ${(plan.price / 100).toFixed(2)}/mo
                                            </div>
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data?.allFeatures.map((feature: any) => (
                                    <TableRow key={feature.id}>
                                        <TableCell className="font-medium">
                                            <div>{feature.name}</div>
                                            <div className="text-xs text-muted-foreground">{feature.key}</div>
                                        </TableCell>
                                        {data.plans.map((plan: any) => {
                                            const planFeature = plan.features.find((f: any) => f.featureId === feature.id);
                                            const isEnabled = !!planFeature;
                                            const isSaving = saving === `${plan.id}-${feature.id}`;

                                            return (
                                                <TableCell key={plan.id} className="text-center">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <div className="flex items-center gap-2">
                                                            <Switch
                                                                checked={isEnabled}
                                                                onCheckedChange={(val) => handleFeatureToggle(plan.id, feature.id, val)}
                                                                disabled={isSaving}
                                                            />
                                                            {isSaving && <Loader2 className="h-3 w-3 animate-spin" />}
                                                        </div>

                                                        {isEnabled && (
                                                            <div className="flex flex-col gap-1 w-24">
                                                                <Label className="text-[10px] text-muted-foreground uppercase">Limit</Label>
                                                                <Input
                                                                    type="number"
                                                                    placeholder="∞"
                                                                    className="h-7 text-xs text-center"
                                                                    defaultValue={planFeature.limitValue ?? ''}
                                                                    onBlur={(e) => handleLimitChange(plan.id, feature.id, e.target.value)}
                                                                    disabled={isSaving}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
