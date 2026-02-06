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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MoreHorizontal, Shield, Trash2, Coins } from 'lucide-react';
import { updateUserRole, updateUserCredits, deleteUser } from '@/app/actions/admin';
import { toast } from 'sonner';

interface UserActionsProps {
    user: {
        id: string;
        name: string | null;
        role: 'USER' | 'ADMIN';
        credits: number;
    };
}

export function UserActions({ user }: UserActionsProps) {
    const [openMenu, setOpenMenu] = useState(false);

    // Dialog States
    const [showRoleDialog, setShowRoleDialog] = useState(false);
    const [showCreditsDialog, setShowCreditsDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form States
    const [selectedRole, setSelectedRole] = useState(user.role);
    const [creditAmount, setCreditAmount] = useState(user.credits);

    const handleUpdateRole = async () => {
        setLoading(true);
        const result = await updateUserRole(user.id, selectedRole);
        setLoading(false);

        if (result.success) {
            toast.success('User role updated');
            setShowRoleDialog(false);
            setOpenMenu(false);
        } else {
            toast.error(result.error);
        }
    };

    const handleUpdateCredits = async () => {
        setLoading(true);
        const result = await updateUserCredits(user.id, Number(creditAmount));
        setLoading(false);

        if (result.success) {
            toast.success('User credits updated');
            setShowCreditsDialog(false);
            setOpenMenu(false);
        } else {
            toast.error(result.error);
        }
    };

    const handleDeleteUser = async () => {
        setLoading(true);
        const result = await deleteUser(user.id);
        setLoading(false);

        if (result.success) {
            toast.success('User deleted');
            setShowDeleteDialog(false);
            setOpenMenu(false);
        } else {
            toast.error(result.error);
        }
    };

    return (
        <>
            <DropdownMenu open={openMenu} onOpenChange={setOpenMenu}>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => setShowRoleDialog(true)}>
                        <Shield className="mr-2 h-4 w-4" />
                        Edit Role
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowCreditsDialog(true)}>
                        <Coins className="mr-2 h-4 w-4" />
                        Manage Credits
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete User
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Role Dialog */}
            <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User Role</DialogTitle>
                        <DialogDescription>
                            Change the permission level for {user.name || 'this user'}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="role" className="text-right">Role</Label>
                            <Select
                                value={selectedRole}
                                onValueChange={(val: 'USER' | 'ADMIN') => setSelectedRole(val)}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="USER">User</SelectItem>
                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRoleDialog(false)}>Cancel</Button>
                        <Button onClick={handleUpdateRole} disabled={loading}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Credits Dialog */}
            <Dialog open={showCreditsDialog} onOpenChange={setShowCreditsDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Manage Credits</DialogTitle>
                        <DialogDescription>
                            Set the number of available credits for {user.name || 'this user'}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="credits" className="text-right">Credits</Label>
                            <Input
                                id="credits"
                                type="number"
                                value={creditAmount}
                                onChange={(e) => setCreditAmount(Number(e.target.value))}
                                className="col-span-3"
                                min="0"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreditsDialog(false)}>Cancel</Button>
                        <Button onClick={handleUpdateCredits} disabled={loading}>Update Credits</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Alert */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the user account
                            and remove their data from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700">
                            Delete Account
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
