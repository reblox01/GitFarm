'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Shield, ShieldAlert, Trash2, Loader2, Coins } from 'lucide-react';
import { toast } from 'sonner';
import { updateUserRole, deleteUser, updateUserCredits } from '@/app/actions/admin';
import { Role } from '@prisma/client';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UserActionsProps {
    userId: string;
    currentRole: Role;
    userName: string;
    currentCredits: number;
}

export function UserActions({ userId, currentRole, userName, currentCredits }: UserActionsProps) {
    const [loading, setLoading] = useState(false);
    const [showCreditsDialog, setShowCreditsDialog] = useState(false);
    const [credits, setCredits] = useState(currentCredits.toString());

    const handleRoleChange = async (newRole: Role) => {
        setLoading(true);
        try {
            const result = await updateUserRole(userId, newRole);
            if (result.success) {
                toast.success(`User role updated to ${newRole}`);
            } else {
                toast.error(result.error || 'Failed to update role');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateCredits = async () => {
        const creditValue = parseInt(credits);
        if (isNaN(creditValue)) {
            toast.error('Invalid credit amount');
            return;
        }

        setLoading(true);
        try {
            const result = await updateUserCredits(userId, creditValue);
            if (result.success) {
                toast.success('Credits updated successfully');
                setShowCreditsDialog(false);
            } else {
                toast.error(result.error || 'Failed to update credits');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
            return;
        }

        setLoading(true);
        try {
            const result = await deleteUser(userId);
            if (result.success) {
                toast.success('User deleted successfully');
            } else {
                toast.error(result.error || 'Failed to delete user');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0" disabled={loading}>
                        <span className="sr-only">Open menu</span>
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <MoreHorizontal className="h-4 w-4" />
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => navigator.clipboard.writeText(userId)}
                    >
                        Copy User ID
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowCreditsDialog(true)}>
                        <Coins className="mr-2 h-4 w-4" />
                        Edit Credits
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {currentRole === 'USER' ? (
                        <DropdownMenuItem onClick={() => handleRoleChange('ADMIN')}>
                            <ShieldAlert className="mr-2 h-4 w-4" />
                            Promote to Admin
                        </DropdownMenuItem>
                    ) : (
                        <DropdownMenuItem onClick={() => handleRoleChange('USER')}>
                            <Shield className="mr-2 h-4 w-4" />
                            Demote to User
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={handleDelete}>
                        < Trash2 className="mr-2 h-4 w-4" />
                        Delete User
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={showCreditsDialog} onOpenChange={setShowCreditsDialog}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Credits</DialogTitle>
                        <DialogDescription>
                            Manually adjust credits for {userName}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="credits" className="text-right">
                                Credits
                            </Label>
                            <Input
                                id="credits"
                                type="number"
                                value={credits}
                                onChange={(e) => setCredits(e.target.value)}
                                className="col-span-3"
                                placeholder="0"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreditsDialog(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateCredits} disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Save changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
