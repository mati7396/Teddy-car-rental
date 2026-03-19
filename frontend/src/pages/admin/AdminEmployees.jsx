import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Users, Plus, Search, Mail, Phone,
    ShieldCheck, UserPlus, MoreHorizontal,
    UserCheck, UserX, Edit, Loader2
} from 'lucide-react';

// Shadcn Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import AdminLayout from "@/components/admin-layout";
import { api } from "@/api";
import { toast } from 'sonner';

const AdminEmployees = () => {
    const { t } = useTranslation();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        role: 'EMPLOYEE',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        address: ''
    });

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const data = await api.get('/users');
            // Filter for staff and admins only (including deactivated ones)
            const staff = data.filter(u => u.role === 'EMPLOYEE' || u.role === 'ADMIN');
            setEmployees(staff);
        } catch (error) {
            console.error('Failed to fetch employees:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const resetForm = () => {
        setFormData({
            email: '',
            password: '',
            role: 'EMPLOYEE',
            firstName: '',
            lastName: '',
            phoneNumber: '',
            address: ''
        });
    };

    const handleOpenDialog = () => {
        resetForm();
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/auth/register', formData);
            toast.success(t('admin.staffAdded'));
            setIsDialogOpen(false);
            fetchEmployees();
        } catch (error) {
            toast.error(error.message || 'Failed to add staff');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRoleUpdate = async (userId, newRole) => {
        try {
            await api.patch(`/users/${userId}/role`, { role: newRole });
            toast.success(t('admin.roleUpdated'));
            fetchEmployees();
        } catch (error) {
            toast.error(error.message || 'Failed to update role');
        }
    };

    const handleDelete = async (userId, isActive) => {
        if (isActive === false) {
            // Reactivate
            setConfirmDialog({
                open: true,
                title: 'Activate Account',
                message: 'Are you sure you want to reactivate this account?',
                onConfirm: async () => {
                    try {
                        await api.patch(`/users/${userId}/reactivate`);
                        toast.success('Account reactivated successfully');
                        fetchEmployees();
                    } catch (error) {
                        toast.error(error.message || 'Failed to reactivate account');
                    } finally {
                        setConfirmDialog(prev => ({ ...prev, open: false }));
                    }
                }
            });
        } else {
            // Deactivate
            setConfirmDialog({
                open: true,
                title: 'Deactivate Account',
                message: 'Are you sure you want to deactivate this account? This action can be reversed later.',
                onConfirm: async () => {
                    try {
                        await api.delete(`/users/${userId}`);
                        toast.success(t('admin.accountDeactivated'));
                        fetchEmployees();
                    } catch (error) {
                        toast.error(error.message || 'Failed to deactivate account');
                    } finally {
                        setConfirmDialog(prev => ({ ...prev, open: false }));
                    }
                }
            });
        }
    };

    const getInitials = (user) => {
        if (user.customerProfile) {
            return `${user.customerProfile.firstName?.[0] || ''}${user.customerProfile.lastName?.[0] || ''}` || 'U';
        }
        return user.email[0].toUpperCase();
    };


    const filteredEmployees = employees.filter(emp => {
        const fullName = emp.customerProfile ? `${emp.customerProfile.firstName} ${emp.customerProfile.lastName}` : '';
        return fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            emp.email.toLowerCase().includes(searchQuery.toLowerCase());
    });


    return (
        <>
            <AdminLayout>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Employee Management</h1>
                        <p className="text-muted-foreground mt-1">Oversee staff accounts, roles, and access.</p>
                    </div>
                    <Button className="gap-2 shadow-lg hover:shadow-primary/25" onClick={handleOpenDialog}>
                        <UserPlus size={18} />
                        Add Staff Member
                    </Button>
                </div>

                <Card className="border-border/60 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-border bg-card flex flex-col md:flex-row gap-4 justify-between items-center">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                                placeholder="Search employees by name or email..."
                                className="pl-10 h-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        {loading && <Loader2 className="animate-spin text-primary" size={20} />}
                    </div>
                    <Table>
                        <TableHeader className="bg-muted/40">
                            <TableRow>
                                <TableHead>Staff Member</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Contact Info</TableHead>
                                <TableHead>Account Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {!loading && filteredEmployees.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                        No staff members found.
                                    </TableCell>
                                </TableRow>
                            )}
                            {filteredEmployees.map((emp) => (
                                <TableRow key={emp.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10 border border-primary/10">
                                                <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                                                    {getInitials(emp)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-sm">
                                                    {emp.customerProfile
                                                        ? `${emp.customerProfile.firstName} ${emp.customerProfile.lastName}`
                                                        : <span className="italic text-muted-foreground">Name not set</span>}
                                                </span>
                                                <span className="text-xs text-muted-foreground">ID: Staff-#{emp.id}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5">
                                            <ShieldCheck size={14} className={emp.role === 'ADMIN' ? 'text-primary' : 'text-muted-foreground'} />
                                            <span className="text-sm capitalize">{emp.role.toLowerCase()}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Mail size={12} /> {emp.email}
                                            </div>
                                            {emp.customerProfile?.phoneNumber && (
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Phone size={12} /> {emp.customerProfile.phoneNumber}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {emp.isActive === false ? (
                                            <Badge className="bg-red-100 text-red-800 border-red-200 gap-1 font-medium">
                                                Deactivated
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 gap-1 font-medium">
                                                Active
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal size={16} />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem 
                                                    className={emp.isActive === false ? "gap-2 text-green-600" : "gap-2 text-red-600"} 
                                                    onClick={() => handleDelete(emp.id, emp.isActive)}
                                                >
                                                    {emp.isActive === false ? <UserCheck size={14} /> : <UserX size={14} />}
                                                    {emp.isActive === false ? 'Activate Account' : 'Deactivate Account'}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="gap-2" onClick={() => handleRoleUpdate(emp.id, emp.role === 'ADMIN' ? 'EMPLOYEE' : 'ADMIN')}>
                                                    <ShieldCheck size={14} /> {emp.role === 'ADMIN' ? 'Make Employee' : 'Make Admin'}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Add New Staff Member</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name</Label>
                                <Input id="firstName" required value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input id="lastName" required value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input id="email" type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="password">Password</Label>
                                <Input id="password" type="password" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phoneNumber">Phone Number</Label>
                                <Input id="phoneNumber" required value={formData.phoneNumber} onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <Select value={formData.role} onValueChange={val => setFormData({ ...formData, role: val })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="EMPLOYEE">Employee</SelectItem>
                                        <SelectItem value="ADMIN">Administrator</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="address">Address</Label>
                                <Input id="address" required value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                            </div>

                            <DialogFooter className="col-span-2 mt-4">
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={submitting}>
                                    {submitting ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                                    Add Staff Member
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </AdminLayout>

            {/* Confirm Dialog */}
            <Dialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog(prev => ({ ...prev, open: false }))}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{confirmDialog.title}</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground mt-2">{confirmDialog.message}</p>
                    <DialogFooter className="mt-6">
                        <Button variant="outline" onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDialog.onConfirm}>Confirm</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default AdminEmployees;
