import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, UserCheck, GraduationCap, MapPin, Search, Edit, Eye, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
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

interface Client {
  id: string;
  name: string;
  client_id: string;
  status: string;
}

const Clients = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [admissionFilter, setAdmissionFilter] = useState("all");
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    graduated: 0,
    street: 0
  });

  useEffect(() => {
    fetchClients();
    checkAdminRole();
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

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .not('status', 'eq', 'Alumni - Placed')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setClients(data || []);
      
      // Calculate stats
      const total = data?.length || 0;
      const active = data?.filter(c => c.status?.toLowerCase() === 'active').length || 0;
      const graduated = data?.filter(c => c.status?.toLowerCase() === 'graduated').length || 0;
      const street = data?.filter(c => c.status?.toLowerCase() === 'street').length || 0;
      
      setStats({ total, active, graduated, street });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-success/20 text-success border-success/30";
      case "Complete":
      case "Alumni - Awaiting Placement":
        return "bg-orange-100 text-orange-600 border-orange-300 dark:bg-orange-950 dark:text-orange-400";
      case "Alumni - Placed":
        return "bg-green-100 text-green-600 border-green-300 dark:bg-green-950 dark:text-green-400";
      case "Escape":
      case "Exited":
        return "bg-red-100 text-red-600 border-red-300 dark:bg-red-950 dark:text-red-400";
      case "Voluntary Discharge":
        return "bg-purple-100 text-purple-600 border-purple-300 dark:bg-purple-950 dark:text-purple-400";
      case "Early Reintegration":
        return "bg-blue-100 text-blue-600 border-blue-300 dark:bg-blue-950 dark:text-blue-400";
      default:
        return "bg-muted text-muted-foreground";
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

      if (error) throw error;

      toast({
        title: "Success",
        description: "Client deleted successfully",
      });

      setDeleteDialogOpen(false);
      setClientToDelete(null);
      fetchClients();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
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
        description: `Successfully updated status to "${bulkStatus}" for ${selectedIds.length} clients.`
      });

      setSelectedIds([]);
      fetchClients();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setBulkLoading(false);
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         client.client_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || client.status?.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden">
      {/* Purple Header */}
      <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 h-24 flex items-center px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <h1 className="relative text-2xl sm:text-3xl font-bold text-white">Client Records</h1>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-600">
                <Users className="h-5 w-5 text-white" />
              </div>
               <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-xs text-muted-foreground uppercase">Total</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success">
                <UserCheck className="h-5 w-5 text-white" />
              </div>
               <div>
                <p className="text-2xl font-bold text-foreground">{stats.active}</p>
                <p className="text-xs text-muted-foreground uppercase">Active</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
               <div>
                <p className="text-2xl font-bold text-foreground">{stats.graduated}</p>
                <p className="text-xs text-muted-foreground uppercase">Graduated</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-600">
                <MapPin className="h-5 w-5 text-white" />
              </div>
               <div>
                <p className="text-2xl font-bold text-foreground">{stats.street}</p>
                <p className="text-xs text-muted-foreground uppercase">Street</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="border-border">
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative md:col-span-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search clients by name, intake, or nickname..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Complete">Complete</SelectItem>
                  <SelectItem value="Alumni - Awaiting Placement">Alumni - Awaiting Placement</SelectItem>
                  <SelectItem value="Alumni - Placed">Alumni - Placed</SelectItem>
                  <SelectItem value="Graduated">Graduated</SelectItem>
                  <SelectItem value="Exited">Exited</SelectItem>
                  <SelectItem value="Escape">Escape</SelectItem>
                  <SelectItem value="Voluntary Discharge">Voluntary Discharge</SelectItem>
                  <SelectItem value="Early Reintegration">Early Reintegration</SelectItem>
                  <SelectItem value="Street">Street</SelectItem>
                </SelectContent>
              </Select>

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
            </div>

            <p className="text-sm text-muted-foreground">
              {filteredClients.length} clients found
            </p>
          </CardContent>
        </Card>

        {/* Client List */}
        <div className="space-y-3">
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
                  Clear Selections
                </Button>
              )}
            </div>
          )}

          {loading ? (
            <Card className="border-border">
              <CardContent className="p-8 text-center text-muted-foreground">
                Loading clients...
              </CardContent>
            </Card>
          ) : filteredClients.length === 0 ? (
            <Card className="border-border">
              <CardContent className="p-8 text-center text-muted-foreground">
                No clients found. Click "Register Client" to add your first client.
              </CardContent>
            </Card>
          ) : (
            filteredClients.map((client) => (
              <Card key={client.id} className={`border-border hover:shadow-md transition-shadow ${selectedIds.includes(client.id) ? 'border-primary/40 bg-primary/5' : ''}`}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Checkbox 
                      checked={selectedIds.includes(client.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedIds([...selectedIds, client.id]);
                        } else {
                          setSelectedIds(selectedIds.filter(id => id !== client.id));
                        }
                      }}
                      className="border-2 border-gray-400 dark:border-gray-500 bg-background mr-2"
                    />
                    <p className="font-medium text-foreground">{client.name}</p>
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                      {client.client_id}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={`${getStatusColor(client.status || '')} border`}>
                      <span className="inline-block w-2 h-2 rounded-full bg-current mr-2" />
                      {client.status || 'Unknown'}
                    </Badge>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => navigate(`/clients/${client.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => navigate(`/register?clientId=${client.id}&mode=edit`)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
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
            ))
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
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

      {/* Bulk Status Update Panel */}
      {selectedIds.length > 0 && (
        <Card className="border-primary/30 bg-card shadow-2xl fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-4xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-300 border-2">
          <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white bg-primary px-2.5 py-1 rounded-full text-xs">
                {selectedIds.length}
              </span>
              <span className="text-sm font-semibold text-gray-700">clients selected for bulk actions</span>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Select value={bulkStatus} onValueChange={setBulkStatus}>
                <SelectTrigger className="w-[180px] bg-background border-border">
                  <SelectValue placeholder="Choose Status" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Alumni - Awaiting Placement">Alumni - Awaiting Placement</SelectItem>
                  <SelectItem value="Alumni - Placed">Alumni - Placed</SelectItem>
                  <SelectItem value="Graduated">Graduated</SelectItem>
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
  );
};

export default Clients;
