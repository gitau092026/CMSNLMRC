import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  UserCheck,
  GraduationCap,
  MapPin,
  Search,
  Edit,
  Eye,
  Trash2,
  FileText,
  FolderKanban,
  Layers,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  List,
  Filter,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ClientAvatar } from "@/components/ClientAvatar";
import { setCachedClient, prefetchAvatars, prefetchImage, setCachedClientsList, getCachedClientsList, removeClientFromCache } from "@/lib/clientCache";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
  getClientIntake,
  getUniqueIntakes,
  groupClientsByIntake,
} from "@/utils/intakeUtils";

export interface Client {
  id: string;
  name: string;
  client_id: string;
  status: string;
  notes: string;
  profile_picture?: string | null;
  [key: string]: any;
}

export const isAlumniStatus = (s: string) =>
  ['complete', 'graduated', 'alumni', 'alumni - placed', 'alumni - awaiting placement'].includes((s || '').toLowerCase().trim());

export const isActiveStatus = (s: string) =>
  (s || '').toLowerCase().trim() === 'active';

const Clients = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [intakeFilter, setIntakeFilter] = useState("all");
  const [admissionFilter, setAdmissionFilter] = useState("all");
  const [assessmentFilter, setAssessmentFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grouped" | "flat">("grouped");
  const [collapsedIntakes, setCollapsedIntakes] = useState<Record<string, boolean>>({});
  const initialCached = getCachedClientsList() || [];
  const [clients, setClients] = useState<Client[]>(initialCached);
  const [loading, setLoading] = useState(initialCached.length === 0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState(() => {
    const total = initialCached.length;
    const active = initialCached.filter(c => isActiveStatus(c.status)).length;
    const graduated = initialCached.filter(c => isAlumniStatus(c.status)).length;
    const other = Math.max(0, total - active - graduated);
    return { total, active, graduated, other };
  });

  useEffect(() => {
    fetchClients(initialCached.length > 0);
    checkAdminRole();

    // Subscribe to realtime database changes for instant 0ms sync
    const channel = supabase
      .channel('clients-realtime-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clients' },
        () => {
          fetchClients(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkAdminRole = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    setIsAdmin(!!data && !error);
  };

  const fetchClients = async (isSilent = false) => {
    try {
      if (!isSilent && clients.length === 0) {
        setLoading(true);
      }
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, client_id, status, notes, profile_picture, intake_number, admission_date, admission_type, nickname, created_at, gender, age')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setCachedClientsList(data);
        setClients(data);

        // Calculate stats
        const total = data.length;
        const active = data.filter(c => isActiveStatus(c.status)).length;
        const graduated = data.filter(c => isAlumniStatus(c.status)).length;
        const other = Math.max(0, total - active - graduated);

        setStats({ total, active, graduated, other });
      }
    } catch (error: any) {
      if (!isSilent) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (isActiveStatus(status)) {
      return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300";
    }
    if (isAlumniStatus(status)) {
      return "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300";
    }
    switch (status) {
      case "Escape":
      case "Exited":
        return "bg-red-100 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-400";
      case "Voluntary Discharge":
        return "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-400";
      case "Early Reintegration":
        return "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-400";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const handleDeleteClick = (client: Client) => {
    setClientToDelete(client);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientToDelete.id);

      removeClientFromCache(clientToDelete.id);
      setClients(prev => prev.filter(c => c.id !== clientToDelete.id));

      toast({
        title: "Success",
        description: "Client deleted successfully",
      });

      setDeleteDialogOpen(false);
      setClientToDelete(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (selectedIds.length === 0 || !bulkStatus) return;

    try {
      setBulkLoading(true);
      const { error } = await supabase
        .from('clients')
        .update({ status: bulkStatus })
        .in('id', selectedIds);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Successfully updated status to "${bulkStatus}" for ${selectedIds.length} clients.`,
      });

      setSelectedIds([]);
      fetchClients();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setBulkLoading(false);
    }
  };

  const getAssessmentStatus = (notes: string | null) => {
    if (!notes) return "Pending";
    try {
      const parsed = typeof notes === 'string' ? JSON.parse(notes) : notes;
      return parsed.assessmentData?.assessmentStatus || "Pending";
    } catch {
      return "Pending";
    }
  };

  // Distinct list of available intakes across all clients
  const availableIntakes = getUniqueIntakes(clients);

  const filteredClients = clients.filter(client => {
    const q = searchQuery.toLowerCase().trim();
    const clientIntake = getClientIntake(client);
    const matchesSearch = !q ||
      client.name.toLowerCase().includes(q) ||
      client.client_id.toLowerCase().includes(q) ||
      (client.intake_number && client.intake_number.toLowerCase().includes(q)) ||
      clientIntake.toLowerCase().includes(q) ||
      (client.nickname && client.nickname.toLowerCase().includes(q));

    let matchesStatus = true;
    if (statusFilter === "all") {
      matchesStatus = true;
    } else if (statusFilter === "Active") {
      matchesStatus = isActiveStatus(client.status);
    } else if (statusFilter === "graduated" || statusFilter === "all-alumni") {
      matchesStatus = isAlumniStatus(client.status);
    } else if (statusFilter === "other") {
      matchesStatus = !isActiveStatus(client.status) && !isAlumniStatus(client.status);
    } else {
      matchesStatus = (client.status || '').toLowerCase() === statusFilter.toLowerCase();
    }

    const matchesIntake = intakeFilter === "all" || clientIntake === intakeFilter;

    let matchesAdmission = true;
    if (admissionFilter !== "all") {
      matchesAdmission = (client.admission_type || '').toLowerCase() === admissionFilter.toLowerCase();
    }

    const assessmentStatus = getAssessmentStatus(client.notes);
    const matchesAssessment = assessmentFilter === "all" || assessmentStatus === assessmentFilter;

    return matchesSearch && matchesStatus && matchesIntake && matchesAdmission && matchesAssessment;
  });

  const intakeGroups = groupClientsByIntake(filteredClients);

  const toggleIntakeCollapse = (intakeName: string) => {
    setCollapsedIntakes(prev => ({
      ...prev,
      [intakeName]: !prev[intakeName],
    }));
  };

  const expandAllIntakes = () => {
    setCollapsedIntakes({});
  };

  const collapseAllIntakes = () => {
    const all: Record<string, boolean> = {};
    intakeGroups.forEach(g => {
      all[g.intake] = true;
    });
    setCollapsedIntakes(all);
  };

  const renderClientCard = (client: Client) => {
    const isAlumni = isAlumniStatus(client.status);
    const isActive = isActiveStatus(client.status);
    const clientIntake = getClientIntake(client);

    return (
      <Card
        key={client.id}
        className={cn(
          "border-border hover:shadow-md transition-all duration-200 bg-card",
          selectedIds.includes(client.id) && "ring-2 ring-primary bg-primary/5",
          isActive && "border-l-[5px] border-l-emerald-500 bg-emerald-50/15 dark:bg-emerald-950/10 hover:border-l-emerald-600",
          isAlumni && "border-l-[5px] border-l-purple-600 bg-purple-50/20 dark:bg-purple-950/15 hover:border-l-purple-700",
          !isActive && !isAlumni && "border-l-[5px] border-l-muted-foreground/30"
        )}
      >
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Checkbox
              checked={selectedIds.includes(client.id)}
              onCheckedChange={(checked) => {
                if (checked) {
                  setSelectedIds([...selectedIds, client.id]);
                } else {
                  setSelectedIds(selectedIds.filter(id => id !== client.id));
                }
              }}
              className="border-2 border-gray-400 dark:border-gray-500 bg-background mr-1 shrink-0"
            />

            {/* Avatar with status ring */}
            <div className="shrink-0 relative">
              <ClientAvatar
                src={client.profile_picture}
                alt={client.name}
                sizeClassName="h-11 w-11"
                iconClassName="h-5 w-5 text-muted-foreground"
                className={cn(
                  "rounded-full ring-2 shadow-xs",
                  isActive ? "ring-emerald-500" : isAlumni ? "ring-purple-500" : "ring-border"
                )}
                priority={false}
              />
              {isActive && (
                <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-background flex items-center justify-center" title="Active Client">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                </span>
              )}
              {isAlumni && (
                <span className="absolute -top-1 -right-1 bg-purple-600 text-white rounded-full p-0.5 shadow-xs ring-2 ring-background" title="Graduated Alumni">
                  <GraduationCap className="h-3 w-3" />
                </span>
              )}
            </div>

            {/* Client Info */}
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-foreground truncate text-base">{client.name}</p>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 shrink-0 text-xs font-mono font-medium">
                  {client.client_id}
                </Badge>
                <Badge variant="outline" className="bg-blue-50/70 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 shrink-0 text-xs font-medium">
                  Intake: {clientIntake}
                </Badge>
                {isActive && (
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 font-semibold px-2.5 py-0.5 text-xs flex items-center gap-1.5 shrink-0 shadow-xs">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                    </span>
                    Active Client
                  </Badge>
                )}
                {isAlumni && (
                  <Badge className="bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950 dark:text-purple-200 font-semibold px-2.5 py-0.5 text-xs flex items-center gap-1.5 shrink-0 shadow-xs">
                    <GraduationCap className="h-3.5 w-3.5 text-purple-700 dark:text-purple-300 shrink-0" />
                    Graduated (Alumni)
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={`shrink-0 text-[11px] py-0 px-2 ${getAssessmentStatus(client.notes) === 'Completed' ? 'text-green-700 border-green-200 bg-green-50/70 dark:bg-green-950/40' : 'text-orange-700 border-orange-200 bg-orange-50/70 dark:bg-orange-950/40'}`}>
                  Assessment: {getAssessmentStatus(client.notes)}
                </Badge>
                {client.admission_type && (
                  <span className="text-xs text-muted-foreground capitalize">
                    • {client.admission_type}
                  </span>
                )}
                {client.admission_date && (
                  <span className="text-xs text-muted-foreground">
                    • Admitted: {new Date(client.admission_date).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto shrink-0 justify-between sm:justify-end">
            <Badge className={`${getStatusColor(client.status || '')} border shrink-0 text-xs py-1 px-2.5 shadow-xs font-medium`}>
              <span className="inline-block w-2 h-2 rounded-full bg-current mr-1.5" />
              {client.status === 'Alumni - Placed' || client.status === 'Alumni - Awaiting Placement'
                ? `Alumni (${client.status.replace('Alumni - ', '')})`
                : client.status === 'Complete' || client.status === 'Graduated'
                ? 'Graduated (Alumni)'
                : client.status || 'Unknown'}
            </Badge>
            <div className="flex gap-2 ml-auto sm:ml-0">
              <Button
                size="sm"
                variant="outline"
                onMouseEnter={() => prefetchImage(client.profile_picture)}
                onClick={() => navigate(`/clients/${client.id}`, { state: { client } })}
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/admission?clientId=${client.id}&mode=edit`)}
                title="Edit Admission Details"
              >
                <FileText className="h-4 w-4 mr-1" />
                Admission
              </Button>
              <Button
                size="sm"
                onClick={() => navigate(`/register?clientId=${client.id}&mode=edit`)}
                title="Edit Assessment Details"
              >
                <Edit className="h-4 w-4 mr-1" />
                Assessment
              </Button>
              {isAdmin && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeleteClick(client)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background w-full">
      {/* Purple Header */}
      <div className="sticky top-14 z-10 shadow-md bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 h-24 flex items-center px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="relative">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Client Records</h1>
          <p className="text-xs sm:text-sm text-purple-100/90 font-medium mt-0.5">
            Categorized by Intakes & Cohorts
          </p>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card onClick={() => setStatusFilter('all')} className={cn("border-border cursor-pointer hover:border-primary/50 transition-all shadow-xs", statusFilter === 'all' && "ring-2 ring-primary bg-primary/5")}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary text-white shadow-xs">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">All Clients</p>
              </div>
            </CardContent>
          </Card>

          <Card onClick={() => setStatusFilter(statusFilter === 'Active' ? 'all' : 'Active')} className={cn("border-border cursor-pointer hover:border-emerald-500/50 transition-all shadow-xs", statusFilter === 'Active' && "ring-2 ring-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20")}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-600 text-white shadow-xs">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-2xl font-bold text-foreground">{stats.active}</p>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                  </span>
                </div>
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Active Clients</p>
              </div>
            </CardContent>
          </Card>

          <Card onClick={() => setStatusFilter(statusFilter === 'graduated' || statusFilter === 'all-alumni' ? 'all' : 'graduated')} className={cn("border-border cursor-pointer hover:border-purple-500/50 transition-all shadow-xs", (statusFilter === 'graduated' || statusFilter === 'all-alumni') && "ring-2 ring-purple-600 bg-purple-50/40 dark:bg-purple-950/20")}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-purple-600 text-white shadow-xs">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.graduated}</p>
                <p className="text-xs font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wider">Graduated (Alumni)</p>
              </div>
            </CardContent>
          </Card>

          <Card onClick={() => setStatusFilter(statusFilter === 'other' ? 'all' : 'other')} className={cn("border-border cursor-pointer hover:border-amber-500/50 transition-all shadow-xs", statusFilter === 'other' && "ring-2 ring-amber-500 bg-amber-50/40 dark:bg-amber-950/20")}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-600 text-white shadow-xs">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.other}</p>
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Other Statuses</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="border-border shadow-xs">
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Search input */}
              <div className="relative sm:col-span-2 lg:col-span-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search name, ID, intake..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-background w-full"
                />
              </div>

              {/* Intake Filter */}
              <Select value={intakeFilter} onValueChange={setIntakeFilter}>
                <SelectTrigger className="bg-background">
                  <div className="flex items-center gap-2 truncate">
                    <FolderKanban className="h-4 w-4 text-primary shrink-0" />
                    <SelectValue placeholder="All Intakes" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50 max-h-72">
                  <SelectItem value="all">
                    📁 All Intakes ({stats.total})
                  </SelectItem>
                  {availableIntakes.map(intake => {
                    const count = clients.filter(c => getClientIntake(c) === intake).length;
                    return (
                      <SelectItem key={intake} value={intake}>
                        {intake} ({count})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  <SelectItem value="all">All Status ({stats.total})</SelectItem>
                  <SelectItem value="Active" className="text-emerald-700 dark:text-emerald-400 font-semibold">
                    🟢 Active Clients ({stats.active})
                  </SelectItem>
                  <SelectItem value="graduated" className="text-purple-700 dark:text-purple-400 font-semibold">
                    🎓 All Graduated / Alumni ({stats.graduated})
                  </SelectItem>
                  <SelectItem value="Graduated">🎓 Graduated</SelectItem>
                  <SelectItem value="Complete">🎓 Complete (Alumni)</SelectItem>
                  <SelectItem value="Alumni - Placed">🎓 Alumni - Placed</SelectItem>
                  <SelectItem value="Alumni - Awaiting Placement">🎓 Alumni - Awaiting Placement</SelectItem>
                  <SelectItem value="other">Other Statuses ({stats.other})</SelectItem>
                  <SelectItem value="Exited">Exited</SelectItem>
                  <SelectItem value="Escape">Escape</SelectItem>
                  <SelectItem value="Voluntary Discharge">Voluntary Discharge</SelectItem>
                  <SelectItem value="Early Reintegration">Early Reintegration</SelectItem>
                  <SelectItem value="Street">Street</SelectItem>
                </SelectContent>
              </Select>

              {/* Admission Type Filter */}
              <Select value={admissionFilter} onValueChange={setAdmissionFilter}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="All Admission Types" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  <SelectItem value="all">All Admission Types</SelectItem>
                  <SelectItem value="voluntary">Voluntary</SelectItem>
                  <SelectItem value="involuntary">Involuntary</SelectItem>
                </SelectContent>
              </Select>

              {/* Assessment Status Filter */}
              <Select value={assessmentFilter} onValueChange={setAssessmentFilter}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Assessment Status" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  <SelectItem value="all">All Assessments</SelectItem>
                  <SelectItem value="Pending">Pending (Draft)</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quick Filter Pills & View Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border/60">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground mr-1">Status:</span>
                <Button
                  type="button"
                  size="sm"
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('all')}
                  className={cn("h-7 px-3 text-xs font-medium rounded-full transition-colors", statusFilter === 'all' && "bg-primary text-primary-foreground")}
                >
                  All ({stats.total})
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={statusFilter === 'Active' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter(statusFilter === 'Active' ? 'all' : 'Active')}
                  className={cn(
                    "h-7 px-3 text-xs font-medium rounded-full gap-1.5 transition-colors",
                    statusFilter === 'Active'
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                  )}
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Active ({stats.active})
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={(statusFilter === 'graduated' || statusFilter === 'all-alumni') ? 'default' : 'outline'}
                  onClick={() => setStatusFilter(statusFilter === 'graduated' || statusFilter === 'all-alumni' ? 'all' : 'graduated')}
                  className={cn(
                    "h-7 px-3 text-xs font-medium rounded-full gap-1.5 transition-colors",
                    (statusFilter === 'graduated' || statusFilter === 'all-alumni')
                      ? "bg-purple-600 text-white hover:bg-purple-700"
                      : "border-purple-300 text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/50"
                  )}
                >
                  <GraduationCap className="h-3.5 w-3.5" />
                  Alumni ({stats.graduated})
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={statusFilter === 'other' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter(statusFilter === 'other' ? 'all' : 'other')}
                  className={cn(
                    "h-7 px-3 text-xs font-medium rounded-full transition-colors",
                    statusFilter === 'other'
                      ? "bg-amber-600 text-white hover:bg-amber-700"
                      : "text-muted-foreground"
                  )}
                >
                  Other ({stats.other})
                </Button>
              </div>

              {/* View Mode & Expand/Collapse Toggle */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                {viewMode === "grouped" && intakeGroups.length > 1 && (
                  <div className="flex items-center gap-1 mr-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={expandAllIntakes}
                      className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground"
                    >
                      Expand All
                    </Button>
                    <span className="text-muted-foreground/40">•</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={collapseAllIntakes}
                      className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground"
                    >
                      Collapse All
                    </Button>
                  </div>
                )}

                <div className="flex items-center rounded-lg border border-border p-0.5 bg-muted/40">
                  <Button
                    type="button"
                    size="sm"
                    variant={viewMode === "grouped" ? "default" : "ghost"}
                    onClick={() => setViewMode("grouped")}
                    className={cn(
                      "h-7 px-2.5 text-xs font-medium rounded-md gap-1.5",
                      viewMode === "grouped" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                    )}
                    title="View clients categorized into intake cohorts"
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">Categorized by</span> Intake
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={viewMode === "flat" ? "default" : "ghost"}
                    onClick={() => setViewMode("flat")}
                    className={cn(
                      "h-7 px-2.5 text-xs font-medium rounded-md gap-1.5",
                      viewMode === "flat" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                    )}
                    title="View clients as a flat list"
                  >
                    <List className="h-3.5 w-3.5" />
                    Flat List
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
              <span>
                Found <span className="font-semibold text-foreground">{filteredClients.length}</span> clients across{" "}
                <span className="font-semibold text-foreground">{intakeGroups.length}</span> {intakeGroups.length === 1 ? 'intake' : 'intakes'}
              </span>
              {(intakeFilter !== "all" || statusFilter !== "all" || admissionFilter !== "all" || assessmentFilter !== "all" || searchQuery) && (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                    setIntakeFilter("all");
                    setAdmissionFilter("all");
                    setAssessmentFilter("all");
                  }}
                  className="h-auto p-0 text-xs text-primary font-medium hover:underline"
                >
                  Clear all filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Client List */}
        <div className="space-y-4">
          {!loading && filteredClients.length > 0 && (
            <div className="flex items-center justify-between py-2 px-3 bg-muted/40 rounded-lg border border-border/60">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all"
                  checked={filteredClients.length > 0 && filteredClients.every(c => selectedIds.includes(c.id))}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      const newSelections = [...selectedIds];
                      filteredClients.forEach(c => {
                        if (!newSelections.includes(c.id)) newSelections.push(c.id);
                      });
                      setSelectedIds(newSelections);
                    } else {
                      const filteredIds = filteredClients.map(c => c.id);
                      setSelectedIds(selectedIds.filter(id => !filteredIds.includes(id)));
                    }
                  }}
                  className="border-2 border-gray-400 dark:border-gray-500 bg-background mr-1"
                />
                <Label htmlFor="select-all" className="text-sm font-medium text-muted-foreground cursor-pointer select-none">
                  Select All on Page ({filteredClients.length})
                </Label>
              </div>
              {selectedIds.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])} className="text-xs h-7 text-muted-foreground hover:text-foreground">
                  Clear Selections ({selectedIds.length})
                </Button>
              )}
            </div>
          )}

          {loading ? (
            // Skeleton Loading State
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-border">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <Skeleton className="h-11 w-11 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <div className="flex gap-2">
                      <Skeleton className="h-9 w-20" />
                      <Skeleton className="h-9 w-20" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredClients.length === 0 ? (
            <Card className="border-border">
              <CardContent className="p-12 text-center space-y-3">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <FolderKanban className="h-6 w-6" />
                </div>
                <h3 className="text-base font-semibold text-foreground">No clients found</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  No client records matched your search query or selected intake and status filters.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                    setIntakeFilter("all");
                    setAdmissionFilter("all");
                    setAssessmentFilter("all");
                  }}
                >
                  Reset Filters
                </Button>
              </CardContent>
            </Card>
          ) : viewMode === "grouped" ? (
            /* GROUPED BY INTAKE VIEW */
            <div className="space-y-6">
              {intakeGroups.map((group) => {
                const isCollapsed = !!collapsedIntakes[group.intake];
                const groupClientIds = group.clients.map(c => c.id);
                const isGroupSelected = group.clients.length > 0 && group.clients.every(c => selectedIds.includes(c.id));

                return (
                  <div
                    key={group.intake}
                    className="border border-border/80 rounded-xl overflow-hidden shadow-xs bg-card/60 transition-all duration-200"
                  >
                    {/* Intake Group Header */}
                    <div
                      onClick={() => toggleIntakeCollapse(group.intake)}
                      className={cn(
                        "p-4 bg-gradient-to-r from-muted/80 via-muted/40 to-background flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-muted/70 transition-colors select-none border-b",
                        isCollapsed ? "border-transparent" : "border-border/60"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
                          <FolderKanban className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                              {group.intake}
                            </h2>
                            <Badge variant="secondary" className="bg-primary text-primary-foreground font-semibold px-2 py-0.5 text-xs">
                              {group.stats.total} {group.stats.total === 1 ? 'client' : 'clients'}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-medium">
                              🟢 {group.stats.active} Active
                            </span>
                            {group.stats.graduated > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 font-medium">
                                🎓 {group.stats.graduated} Alumni
                              </span>
                            )}
                            {group.stats.other > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-medium">
                                📁 {group.stats.other} Other
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        <div
                          className="flex items-center gap-1.5 px-2 py-1 rounded bg-background/80 border border-border/60 hover:bg-background"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            id={`select-intake-${group.intake}`}
                            checked={isGroupSelected}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                const next = [...selectedIds];
                                groupClientIds.forEach(id => {
                                  if (!next.includes(id)) next.push(id);
                                });
                                setSelectedIds(next);
                              } else {
                                setSelectedIds(selectedIds.filter(id => !groupClientIds.includes(id)));
                              }
                            }}
                            className="border-2 border-gray-400 dark:border-gray-500 bg-background"
                          />
                          <Label
                            htmlFor={`select-intake-${group.intake}`}
                            className="text-xs text-muted-foreground cursor-pointer select-none font-medium"
                          >
                            Select Intake
                          </Label>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          aria-label={isCollapsed ? "Expand intake" : "Collapse intake"}
                        >
                          {isCollapsed ? (
                            <ChevronRight className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Intake Group Clients */}
                    {!isCollapsed && (
                      <div className="p-3 sm:p-4 space-y-3 bg-muted/10">
                        {group.clients.map(client => renderClientCard(client))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* FLAT LIST VIEW */
            <div className="space-y-3">
              {filteredClients.map(client => renderClientCard(client))}
            </div>
          )}

          {/* Bulk Status Update Panel */}
          {selectedIds.length > 0 && (
            <Card className="border-primary/30 bg-card shadow-2xl fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-4xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-300 border-2">
              <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white bg-primary px-2.5 py-1 rounded-full text-xs">
                    {selectedIds.length}
                  </span>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    clients selected for bulk actions
                  </span>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <Select value={bulkStatus} onValueChange={setBulkStatus}>
                    <SelectTrigger className="w-full sm:w-[180px] bg-background border-border">
                      <SelectValue placeholder="Choose Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border z-50">
                      <SelectItem value="Active">🟢 Active</SelectItem>
                      <SelectItem value="Graduated">🎓 Graduated (Alumni)</SelectItem>
                      <SelectItem value="Complete">🎓 Complete (Alumni)</SelectItem>
                      <SelectItem value="Alumni - Placed">🎓 Alumni - Placed</SelectItem>
                      <SelectItem value="Alumni - Awaiting Placement">🎓 Alumni - Awaiting Placement</SelectItem>
                      <SelectItem value="Exited">Exited</SelectItem>
                      <SelectItem value="Escape">Escape</SelectItem>
                      <SelectItem value="Voluntary Discharge">Voluntary Discharge</SelectItem>
                      <SelectItem value="Early Reintegration">Early Reintegration</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    disabled={!bulkStatus || bulkLoading}
                    onClick={handleBulkStatusUpdate}
                    className="flex-1 md:flex-initial"
                  >
                    {bulkLoading ? "Updating..." : "Update Status"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedIds([])}
                    className="border-border hover:bg-muted"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="w-[95vw] max-w-full sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the client "{clientToDelete?.name}" and all associated records.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Clients;
