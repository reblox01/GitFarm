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
import { MoreHorizontal, Shield, Trash2, Coins, Key, Copy, Check, CreditCard } from 'lucide-react';
import { updateUserRole, updateUserCredits, deleteUser, adminResetUserPassword } from '@/app/actions/admin';
import { toast } from 'sonner';

interface UserActionsProps {
    user: {
        id: string;
        name: string | null;
        email: string;
        role: 'USER' | 'ADMIN';
        credits: number;
    };
}

export function UserActions({ user }: UserActionsProps) {
    const [openMenu, setOpenMenu] = useState(false);

    // Dialog States
    const [showRoleDialog, setShowRoleDialog] = useState(false);
    const [showCreditsDialog, setShowCreditsDialog] = useState(false);
    const [showPasswordDialog, setShowPasswordDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form States
    const [selectedRole, setSelectedRole] = useState(user.role);
    const [creditAmount, setCreditAmount] = useState(user.credits);
    const [newPassword, setNewPassword] = useState('');
    const [copied, setCopied] = useState(false);

    const handleCopyId = () => {
        navigator.clipboard.writeText(user.id);
        setCopied(true);
        toast.success('User ID copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
    };

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

    const handleResetPassword = async () => {
        if (newPassword.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }

        setLoading(true);
        const result = await adminResetUserPassword(user.id, newPassword);
        setLoading(false);

        if (result.success) {
            toast.success('Password reset successfully');
            setShowPasswordDialog(false);
            setNewPassword('');
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
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={handleCopyId}>
                        {copied ? <Check className="mr-2 h-4 w-4 text-green-500" /> : <Copy className="mr-2 h-4 w-4" />}
                        Copy User ID
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowRoleDialog(true)}>
                        <Shield className="mr-2 h-4 w-4" />
                        Edit Role
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowCreditsDialog(true)}>
                        <Coins className="mr-2 h-4 w-4" />
                        Manage Credits
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowPasswordDialog(true)}>
                        <Key className="mr-2 h-4 w-4" />
                        Reset Password
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <a href={`/admin/payments?search=${encodeURIComponent(user.email)}`}>
                            <CreditCard className="mr-2 h-4 w-4" />
                            View Payments
                        </a>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50">
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

            {/* Password Reset Dialog */}
            <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reset User Password</DialogTitle>
                        <DialogDescription>
                            Enter a new password for {user.name || 'this user'}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="password" className="text-right">New Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="col-span-3"
                                placeholder="Enter min 8 characters"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>Cancel</Button>
                        <Button onClick={handleResetPassword} disabled={loading}>Reset Password</Button>
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
