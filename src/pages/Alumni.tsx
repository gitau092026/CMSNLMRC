import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Medal,
  Calendar,
  Phone,
  MapPin,
  Eye,
  CheckCircle,
  Clock,
  Edit,
  Trash2,
  Plus,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { setCachedClient, prefetchAvatars, prefetchImage } from "@/lib/clientCache";

interface AftercareRecord {
  id: string;
  institution_workshop: string;
  completion_status: string;
  [key: string]: any;
}

interface AlumniClient {
  id: string;
  name: string;
  client_id?: string | null;
  profile_picture?: string | null;
  status: string;
  contact: string | null;
  address: string | null;
  date_of_birth?: string | null;
  age?: number | null;
  gender?: string | null;
  notes?: string | null;
  created_at?: string | null;
  exit_date?: string;
  aftercare_records?: AftercareRecord[];
  [key: string]: any;
}

export default function Alumni() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const canEdit = isAdmin || user?.role === 'social_work' || user?.role === 'counselling' || user?.role === 'intern_social_work' || user?.role === 'intern_counselling';
  const [alumni, setAlumni] = useState<AlumniClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [exitRecords, setExitRecords] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all-status");

  useEffect(() => {
    fetchAlumni();
  }, []);

  const fetchAlumni = async () => {
    try {
      setLoading(true);
      // Fetch clients with Alumni or Complete status along with their aftercare records
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select(`
          id, name, client_id, profile_picture, status, contact, address,
          date_of_birth, age, gender, notes, created_at,
          aftercare_records (*)
        `)
        .in('status', ['Alumni - Awaiting Placement', 'Alumni - Placed', 'Complete', 'Alumni', 'Graduated'])
        .order('name', { ascending: true });

      if (clientsError) throw clientsError;

      if (clientsData && clientsData.length > 0) {
        clientsData.forEach((c: any) => setCachedClient(c));
        prefetchAvatars(clientsData.map((c: any) => c.profile_picture));
      }

      // Fetch exit records for alumni to get exit dates
      if (clientsData && clientsData.length > 0) {
        const clientIds = clientsData.map(c => c.id);
        const { data: exitData, error: exitError } = await supabase
          .from('exit_records')
          .select('client_id, exit_date')
          .in('client_id', clientIds);

        if (!exitError && exitData) {
          const exitMap: Record<string, string> = {};
          exitData.forEach(record => {
            exitMap[record.client_id] = record.exit_date;
          });
          setExitRecords(exitMap);
        }
      }

      // Auto-fix: Update statuses based on placements and graduation
      if (clientsData && clientsData.length > 0) {
        const clientsToUpdate = clientsData.filter(
          client => 
            (client.status === 'Alumni - Awaiting Placement' && client.aftercare_records && client.aftercare_records.length > 0) ||
            client.status === 'Graduated'
        );

        if (clientsToUpdate.length > 0) {
          const updatePromises = clientsToUpdate.map(client => {
            const hasPlacement = client.aftercare_records && client.aftercare_records.length > 0;
            const newStatus = hasPlacement ? 'Alumni - Placed' : 'Alumni - Awaiting Placement';
            return supabase
              .from('clients')
              .update({ status: newStatus })
              .eq('id', client.id);
          });

          await Promise.all(updatePromises);

          // Refresh the data after updates
          const { data: refreshedData, error: refreshError } = await supabase
            .from('clients')
            .select(`
              id, name, client_id, profile_picture, status, contact, address,
              date_of_birth, age, gender, notes, created_at,
              aftercare_records (*)
            `)
            .in('status', ['Alumni - Awaiting Placement', 'Alumni - Placed', 'Complete', 'Alumni', 'Graduated'])
            .order('name', { ascending: true });

          if (!refreshError && refreshedData) {
            refreshedData.forEach((c: any) => setCachedClient(c));
            prefetchAvatars(refreshedData.map((c: any) => c.profile_picture));
            setAlumni(refreshedData);
          } else {
            setAlumni(clientsData);
          }
        } else {
          setAlumni(clientsData || []);
        }
      } else {
        setAlumni(clientsData || []);
      }
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

  const handleDeleteRecord = async (recordId: string) => {
    try {
      const { error } = await supabase
        .from('aftercare_records')
        .delete()
        .eq('id', recordId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Aftercare record deleted successfully"
      });
      fetchAlumni();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getAvatarColor = (index: number) => {
    const colors = ['bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-green-500', 'bg-pink-500'];
    return colors[index % colors.length];
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      "Alumni - Awaiting Placement": "bg-rose-500 text-white hover:bg-rose-600",
      "Alumni - Placed": "bg-rose-500 text-white hover:bg-rose-600",
      "Alumni": "bg-blue-500 text-white hover:bg-blue-600",
    };
    return colors[status] || "bg-gray-500 text-white hover:bg-gray-600";
  };

  // Filter alumni based on search and filters
  const filteredAlumni = alumni.filter(person => {
    // Search filter
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery ||
      person.name.toLowerCase().includes(searchLower) ||
      person.address?.toLowerCase().includes(searchLower) ||
      person.contact?.toLowerCase().includes(searchLower);

    // Status filter
    const matchesStatus = statusFilter === 'all-status' || person.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const awaitingPlacement = alumni.filter(a => a.status === 'Alumni - Awaiting Placement').length;
  const placed = alumni.filter(a => a.status === 'Alumni - Placed').length;

  return (
    <div className="min-h-screen bg-background w-full max-w-full">
      <div className="sticky top-14 z-10 shadow-md bg-gradient-to-r from-orange-600 to-purple-600 h-32 flex items-center px-4 sm:px-6 lg:px-8 w-full max-w-full">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="relative w-full flex justify-between items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 flex items-center gap-2">
              <Medal className="h-8 w-8" />
              Alumni Network
            </h1>
            <p className="text-sm sm:text-base text-white/90">
              Celebrating success stories and tracking alumni progress
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-t-4 border-t-orange-500 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Medal className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold leading-none">{alumni.length}</p>
                  <p className="text-xs font-medium text-muted-foreground mt-1">TOTAL ALUMNI</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-blue-500 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold leading-none">{awaitingPlacement}</p>
                  <p className="text-xs font-medium text-muted-foreground mt-1">AWAITING PLACEMENT</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-green-500 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold leading-none">{placed}</p>
                  <p className="text-xs font-medium text-muted-foreground mt-1">PLACED</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alumni Directory */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Alumni Directory</CardTitle>
            <p className="text-sm text-muted-foreground">
              Complete list of program graduates and their current status
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                placeholder="Search by name, address, or contact..."
                className="flex-1"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-status">All Status</SelectItem>
                  <SelectItem value="Alumni - Awaiting Placement">Awaiting Placement</SelectItem>
                  <SelectItem value="Alumni - Placed">Placed</SelectItem>
                  <SelectItem value="Complete">Complete</SelectItem>
                  <SelectItem value="Graduated">Graduated</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all-status");
                }}
              >
                Clear
              </Button>
            </div>

            {/* Alumni Table */}
            <div className="rounded-md border overflow-x-auto">
              <Table className="min-w-[600px]">
                <TableHeader className="bg-gradient-to-r from-orange-500 to-purple-500">
                  <TableRow>
                    <TableHead className="text-white font-semibold">ALUMNI</TableHead>
                    <TableHead className="text-white font-semibold">EXIT DATE</TableHead>
                    <TableHead className="text-white font-semibold">STATUS</TableHead>
                    <TableHead className="text-white font-semibold">CONTACT</TableHead>
                    <TableHead className="text-white font-semibold">ADDRESS</TableHead>
                    <TableHead className="text-white font-semibold">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Loading alumni...
                      </TableCell>
                    </TableRow>
                  ) : filteredAlumni.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {alumni.length === 0 ? 'No alumni found. Clients with complete discharge will appear here.' : 'No alumni match your search criteria.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAlumni.map((person, index) => (
                      <TableRow key={person.id}>
                        <TableCell>
                          <div
                            className="flex items-center gap-3 cursor-pointer group"
                            onMouseEnter={() => prefetchImage(person.profile_picture)}
                            onClick={() => navigate(`/clients/${person.id}`, { state: { client: person } })}
                            title="Click to view alumni profile"
                          >
                            {person.profile_picture ? (
                              <img
                                src={person.profile_picture}
                                alt={person.name}
                                className="h-10 w-10 rounded-full object-cover border border-primary/20 shadow-sm shrink-0"
                                loading="eager"
                              />
                            ) : (
                              <Avatar className={cn(getAvatarColor(index), "h-10 w-10 shrink-0")}>
                                <AvatarFallback className={`${getAvatarColor(index)} text-white font-semibold`}>
                                  {getInitials(person.name)}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div>
                              <p className="font-medium group-hover:text-primary transition-colors flex items-center gap-1.5">
                                {person.name}
                                {person.client_id && (
                                  <span className="text-xs text-muted-foreground font-normal">({person.client_id})</span>
                                )}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-orange-500" />
                            <span className="text-sm">{exitRecords[person.id] || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(getStatusColor(person.status), "whitespace-nowrap")}>• {person.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-orange-500" />
                            <span className="text-sm">{person.contact || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-orange-500" />
                            <span className="text-sm">{person.address || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 flex-wrap items-center">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-primary/40 text-primary hover:bg-primary/10 hover:text-primary font-medium"
                              onMouseEnter={() => prefetchImage(person.profile_picture)}
                              onClick={() => navigate(`/clients/${person.id}`, { state: { client: person } })}
                            >
                              <Eye className="h-4 w-4 mr-1.5" />
                              View Profile
                            </Button>

                            {person.aftercare_records && person.aftercare_records.length > 0 ? (
                              <>
                                {canEdit && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => navigate(`/aftercare/add/${person.id}?edit=${person.aftercare_records![0].id}`)}
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit Placement
                                  </Button>
                                )}
                                {isAdmin && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button size="sm" variant="destructive">
                                        <Trash2 className="h-4 w-4 mr-1" />
                                        Delete
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Aftercare Record</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete this aftercare record? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteRecord(person.aftercare_records![0].id)}>
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                              </>
                            ) : (
                              canEdit && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => navigate(`/aftercare/add/${person.id}`)}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Add Placement
                                </Button>
                              )
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}