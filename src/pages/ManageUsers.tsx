import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    UserPlus,
    Users,
    CheckCircle,
    AlertCircle,
    MessageCircle,
    Lightbulb,
    GraduationCap,
    Edit,
    Trash2,
    Shield,
    Clock,
    Loader2,
    Heart,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { supabase, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { Navigate } from "react-router-dom";

type AppRole = "admin" | "social_work" | "education" | "counselling" | "empowerment" | "aftercare" | "alumni" | "intern_social_work" | "intern_counselling";

interface UserData {
    id: string;
    email: string;
    username: string;
    fullName: string | null;
    role: AppRole;
    createdAt: string;
    lastSignIn: string | null;
}

interface NewUserForm {
    email: string;
    password: string;
    username: string;
    fullName: string;
    role: AppRole;
}

const initialFormData: NewUserForm = {
    email: "",
    password: "",
    username: "",
    fullName: "",
    role: "social_work",
};

const roleLabels: Record<AppRole, string> = {
    admin: "Administrator",
    social_work: "Social Work",
    education: "Education",
    counselling: "Counselling",
    empowerment: "Empowerment",
    aftercare: "Aftercare",
    alumni: "Alumni",
    intern_social_work: "Intern - Social Work",
    intern_counselling: "Intern - Counselling",
};

const roleIcons: Record<AppRole, React.ElementType> = {
    admin: Shield,
    social_work: Heart,
    education: GraduationCap,
    counselling: MessageCircle,
    empowerment: Lightbulb,
    aftercare: Heart,
    alumni: GraduationCap,
    intern_social_work: Heart,
    intern_counselling: MessageCircle,
};

const roleColors: Record<AppRole, string> = {
    admin: "bg-red-100 text-red-700 border-red-300",
    social_work: "bg-green-100 text-green-700 border-green-300",
    education: "bg-blue-100 text-blue-700 border-blue-300",
    counselling: "bg-purple-100 text-purple-700 border-purple-300",
    empowerment: "bg-orange-100 text-orange-700 border-orange-300",
    aftercare: "bg-rose-100 text-rose-700 border-rose-300",
    alumni: "bg-indigo-100 text-indigo-700 border-indigo-300",
    intern_social_work: "bg-teal-100 text-teal-700 border-teal-300",
    intern_counselling: "bg-violet-100 text-violet-700 border-violet-300",
};

export default function ManageUsers() {
    const { user } = useAuth();
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [formData, setFormData] = useState<NewUserForm>(initialFormData);
    const [editRole, setEditRole] = useState<AppRole>("social_work");
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterRole, setFilterRole] = useState<string>("all");

    useEffect(() => {
        if (user?.role === "admin") {
            fetchUsers();
        }
    }, [user?.role]);

    // Redirect non-admin users
    if (user?.role !== "admin") {
        return <Navigate to="/" replace />;
    }

    const fetchUsers = async () => {
        setLoading(true);
        try {
            // Fetch user roles with profiles
            const { data: rolesData, error: rolesError } = await supabase
                .from("user_roles")
                .select(`
 user_id,
 role,
 created_at
 `);

            if (rolesError) throw rolesError;

            // Fetch profiles
            const { data: profilesData, error: profilesError } = await supabase
                .from("profiles")
                .select("id, username, full_name, created_at");

            if (profilesError) throw profilesError;

            // Combine data
            const usersMap = new Map<string, UserData>();

            rolesData?.forEach((roleData) => {
                const profile = profilesData?.find((p) => p.id === roleData.user_id);
                if (profile) {
                    usersMap.set(roleData.user_id, {
                        id: roleData.user_id,
                        email: profile.username, // Using username which contains email
                        username: profile.username,
                        fullName: profile.full_name,
                        role: roleData.role as AppRole,
                        createdAt: roleData.created_at || profile.created_at,
                        lastSignIn: null,
                    });
                }
            });

            setUsers(Array.from(usersMap.values()));
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = async () => {
        if (!formData.email || !formData.password || !formData.username) {
            toast.error("Please fill in all required fields");
            return;
        }

        if (formData.password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        setSubmitting(true);
        try {
            // Check if username is already taken to prevent database trigger unique constraint violation
            const { data: existingProfile, error: profileCheckError } = await supabase
                .from("profiles")
                .select("id")
                .eq("username", formData.username)
                .maybeSingle();

            if (profileCheckError) throw profileCheckError;

            if (existingProfile) {
                toast.error("Username is already taken. Please choose a different one.");
                setSubmitting(false);
                return;
            }

            // Create a secondary client so we don't overwrite the admin's session
            const secondarySupabase = createClient(
                SUPABASE_URL,
                SUPABASE_PUBLISHABLE_KEY,
                {
                    auth: {
                        persistSession: false,
                        autoRefreshToken: false,
                        detectSessionInUrl: false,
                    },
                }
            );

            // Create the user using signUp on the secondary client
            const { data, error } = await secondarySupabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        username: formData.username,
                        full_name: formData.fullName,
                        role: formData.role,
                    },
                    emailRedirectTo: `${window.location.origin}/`,
                },
            });

            if (error) throw error;

            if (data.user) {
                toast.success("User created successfully");
                setDialogOpen(false);
                setFormData(initialFormData);
                fetchUsers();
            }
        } catch (error: any) {
            console.error("Error creating user:", error);
            toast.error(error.message || "Failed to create user");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditRole = async () => {
        if (!selectedUser) return;

        setSubmitting(true);
        try {
            // First try to delete other roles to ensure clean state
            await supabase.from("user_roles").delete().eq("user_id", selectedUser.id);

            // Then upsert the new role to handle any race conditions or if delete failed for the specific target role
            const { error } = await supabase
                .from("user_roles")
                .upsert({
                    user_id: selectedUser.id,
                    role: editRole
                }, { onConflict: 'user_id, role' });

            if (error) throw error;

            toast.success("User role updated successfully");
            setEditDialogOpen(false);
            setSelectedUser(null);
            fetchUsers();
        } catch (error: any) {
            console.error("Error updating role:", error);
            toast.error(error.message || "Failed to update role");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) return;

        setSubmitting(true);
        try {
            // Delete user role first
            const { error: roleError } = await supabase
                .from("user_roles")
                .delete()
                .eq("user_id", selectedUser.id);

            if (roleError) throw roleError;

            // Delete profile
            const { error: profileError } = await supabase
                .from("profiles")
                .delete()
                .eq("id", selectedUser.id);

            if (profileError) throw profileError;

            toast.success("User removed successfully");
            setDeleteDialogOpen(false);
            setSelectedUser(null);
            fetchUsers();
        } catch (error: any) {
            console.error("Error deleting user:", error);
            toast.error(error.message || "Failed to delete user");
        } finally {
            setSubmitting(false);
        }
    };

    const filteredUsers = users.filter((u) => {
        const matchesSearch =
            u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
        const matchesRole = filterRole === "all" || u.role === filterRole;
        return matchesSearch && matchesRole;
    });

    const getInitials = (username: string, fullName: string | null) => {
        if (fullName) {
            return fullName
                .split("")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
        }
        return username.slice(0, 2).toUpperCase();
    };

    const getAvatarColor = (role: AppRole) => {
        const colors: Record<AppRole, string> = {
            admin: "bg-red-500",
            social_work: "text-pink-500",
            education: "text-blue-500",
            counselling: "text-purple-500",
            empowerment: "text-yellow-500",
            aftercare: "text-rose-500",
            alumni: "text-indigo-500",
            intern_social_work: "text-pink-400",
            intern_counselling: "text-purple-400",
        };
        return colors[role] || "text-slate-500";
    };

    // Calculate statistics
    const stats = {
        total: users.length,
        byRole: users.reduce((acc, u) => {
            acc[u.role] = (acc[u.role] || 0) + 1;
            return acc;
        }, {} as Record<string, number>),
    };

    return (
        <div className="min-h-screen bg-background w-full max-w-full">
            {/* Header */}
            <div className="sticky top-14 z-10 shadow-md bg-gradient-to-r from-purple-600 to-purple-700 h-32 flex items-center px-4 sm:px-6 lg:px-8 w-full max-w-full">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <div className="relative w-full flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                            System Users
                        </h1>
                        <p className="text-sm sm:text-base text-white/90">
                            Manage user accounts and permissions across all departments
                        </p>
                    </div>
                    <Button
                        onClick={() => setDialogOpen(true)}
                        className="bg-white text-purple-600 hover:bg-purple-50"
                    >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add New User
                    </Button>
                </div>
            </div>

            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                {/* Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    <Card className="border-t-4 border-t-blue-500">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Users className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats.total}</p>
                                    <p className="text-xs text-muted-foreground">Total Users</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-t-4 border-t-red-500">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-100 rounded-lg">
                                    <Shield className="h-5 w-5 text-red-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats.byRole.admin || 0}</p>
                                    <p className="text-xs text-muted-foreground">Administrators</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-t-4 border-t-green-500">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <Heart className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">
                                        {stats.byRole.social_work || 0}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Social Workers</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-t-4 border-t-purple-500">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <MessageCircle className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">
                                        {stats.byRole.counselling || 0}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Counsellors</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-t-4 border-t-blue-500">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <GraduationCap className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">
                                        {stats.byRole.education || 0}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Educators</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* System Status */}
                <Card className="bg-muted/30">
                    <CardContent className="p-4">
                        <div className="flex flex-wrap items-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                                <span className="font-medium">System Status:</span>
                                <span className="text-green-600">Online</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span className="font-medium">Total Users:</span>
                                <span>{stats.total}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="font-medium">Active:</span>
                                <span className="text-green-600">{stats.total}</span>
                            </div>
                            <div className="flex items-center gap-2 ml-auto">
                                <Clock className="h-4 w-4" />
                                <span className="text-muted-foreground">
                                    Last updated: {format(new Date(), "HH:mm:ss")}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* User Management */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl">User Management</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Search, filter, and manage system users
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Search & Filter */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Input
                                placeholder="Search by username or name..."
                                className="flex-1"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <Select value={filterRole} onValueChange={setFilterRole}>
                                <SelectTrigger className="w-full sm:w-[200px]">
                                    <SelectValue placeholder="All Departments" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Departments</SelectItem>
                                    <SelectItem value="admin">Administrator</SelectItem>
                                    <SelectItem value="social_work">Social Work</SelectItem>
                                    <SelectItem value="counselling">Counselling</SelectItem>
                                    <SelectItem value="education">Education</SelectItem>
                                    <SelectItem value="empowerment">Empowerment</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSearchTerm("");
                                    setFilterRole("all");
                                }}
                            >
                                Clear
                            </Button>
                        </div>

                        {/* Users Table */}
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <div className="rounded-md border overflow-x-auto">
                                <Table className="min-w-[600px]">
                                    <TableHeader className="bg-slate-800">
                                        <TableRow>
                                            <TableHead className="text-white font-semibold">
                                                AVATAR
                                            </TableHead>
                                            <TableHead className="text-white font-semibold">
                                                USER DETAILS
                                            </TableHead>
                                            <TableHead className="text-white font-semibold">
                                                DEPARTMENT
                                            </TableHead>
                                            <TableHead className="text-white font-semibold">
                                                CREATED
                                            </TableHead>
                                            <TableHead className="text-white font-semibold">
                                                ACTIONS
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredUsers.length === 0 ? (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={5}
                                                    className="text-center py-8 text-muted-foreground"
                                                >
                                                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                                                    No users found
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredUsers.map((userData) => {
                                                const RoleIcon = roleIcons[userData.role];
                                                return (
                                                    <TableRow key={userData.id}>
                                                        <TableCell>
                                                            <div className="relative">
                                                                <Avatar
                                                                    className={getAvatarColor(userData.role)}
                                                                >
                                                                    <AvatarFallback className="text-white font-semibold">
                                                                        {getInitials(
                                                                            userData.username,
                                                                            userData.fullName
                                                                        )}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white" />
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div>
                                                                <p className="font-medium">{userData.username}</p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {userData.fullName || "No name set"}
                                                                </p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                variant="outline"
                                                                className={roleColors[userData.role]}
                                                            >
                                                                <RoleIcon className="h-3 w-3 mr-1" />
                                                                {roleLabels[userData.role]}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-sm">
                                                            {format(
                                                                new Date(userData.createdAt),
                                                                "MMM dd, yyyy"
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    className="bg-blue-500 hover:bg-blue-600 text-white"
                                                                    onClick={() => {
                                                                        setSelectedUser(userData);
                                                                        setEditRole(userData.role);
                                                                        setEditDialogOpen(true);
                                                                    }}
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                                {userData.id !== user?.id && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="destructive"
                                                                        onClick={() => {
                                                                            setSelectedUser(userData);
                                                                            setDeleteDialogOpen(true);
                                                                        }}
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Add User Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-md w-[95vw] max-w-full">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-purple-600" />
                            Add New User
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Email *</Label>
                            <Input
                                type="email"
                                placeholder="user@example.com"
                                value={formData.email}
                                onChange={(e) =>
                                    setFormData({ ...formData, email: e.target.value })
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Username *</Label>
                            <Input
                                placeholder="Username"
                                value={formData.username}
                                onChange={(e) =>
                                    setFormData({ ...formData, username: e.target.value })
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input
                                placeholder="Full Name"
                                value={formData.fullName}
                                onChange={(e) =>
                                    setFormData({ ...formData, fullName: e.target.value })
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Password *</Label>
                            <Input
                                type="password"
                                placeholder="Minimum 6 characters"
                                value={formData.password}
                                onChange={(e) =>
                                    setFormData({ ...formData, password: e.target.value })
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Department *</Label>
                            <Select
                                value={formData.role}
                                onValueChange={(value: AppRole) =>
                                    setFormData({ ...formData, role: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Administrator</SelectItem>
                                    <SelectItem value="social_work">Social Work</SelectItem>
                                    <SelectItem value="counselling">Counselling</SelectItem>
                                    <SelectItem value="education">Education</SelectItem>
                                    <SelectItem value="empowerment">Empowerment</SelectItem>
                                    <SelectItem value="aftercare">Aftercare</SelectItem>
                                    <SelectItem value="alumni">Alumni</SelectItem>
                                    <SelectItem value="intern_social_work">Intern - Social Work</SelectItem>
                                    <SelectItem value="intern_counselling">Intern - Counselling</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddUser}
                            disabled={submitting}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Add User
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Role Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="max-w-md w-[95vw] max-w-full">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Edit className="h-5 w-5 text-blue-600" />
                            Edit User Role
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-muted-foreground">User</p>
                            <p className="font-medium">{selectedUser?.username}</p>
                        </div>

                        <div className="space-y-2">
                            <Label>Department</Label>
                            <Select
                                value={editRole}
                                onValueChange={(value: AppRole) => setEditRole(value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Administrator</SelectItem>
                                    <SelectItem value="social_work">Social Work</SelectItem>
                                    <SelectItem value="counselling">Counselling</SelectItem>
                                    <SelectItem value="education">Education</SelectItem>
                                    <SelectItem value="empowerment">Empowerment</SelectItem>
                                    <SelectItem value="aftercare">Aftercare</SelectItem>
                                    <SelectItem value="alumni">Alumni</SelectItem>
                                    <SelectItem value="intern_social_work">Intern - Social Work</SelectItem>
                                    <SelectItem value="intern_counselling">Intern - Counselling</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleEditRole}
                            disabled={submitting}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove {selectedUser?.username}? This
                            action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteUser}
                            className="bg-destructive hover:bg-destructive/90"
                            disabled={submitting}
                        >
                            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
