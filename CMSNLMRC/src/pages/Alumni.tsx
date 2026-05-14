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
  UserPlus,
  Users,
  TrendingUp,
  Briefcase,
  Calendar,
  Phone,
  MapPin,
  Eye,
  FileText,
  Zap,
  Star,
  CheckCircle,
  Clock,
  Award,
  Edit,
  Trash2,
  Plus,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface AftercareRecord {
  id: string;
  institution_workshop: string;
  completion_status: string;
}

interface AlumniClient {
  id: string;
  name: string;
  status: string;
  contact: string | null;
  address: string | null;
  exit_date?: string;
  aftercare_records?: AftercareRecord[];
}

interface QuickActionItem {
  id: string;
  icon: any;
  title: string;
  subtitle: string;
  color: string;
}

const SortableQuickAction = ({ item }: { item: QuickActionItem }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = item.icon;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-move hover:shadow-lg transition-all border-t-4"
    >
      <CardContent className="p-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className={`p-4 ${item.color} rounded-lg`}>
            <Icon className="h-8 w-8 text-white" />
          </div>
          <div>
            <p className="font-semibold">{item.title}</p>
            <p className="text-sm text-muted-foreground">{item.subtitle}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function Alumni() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const canEdit = isAdmin || user?.role === 'social_work';
  const [alumni, setAlumni] = useState<AlumniClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [exitRecords, setExitRecords] = useState<Record<string, string>>({});
  
  const [quickActions, setQuickActions] = useState<QuickActionItem[]>([
    { id: "add", icon: UserPlus, title: "Add", subtitle: "Alumni", color: "bg-purple-500" },
    { id: "view", icon: Eye, title: "View", subtitle: "All Alumni", color: "bg-blue-500" },
    { id: "success", icon: Award, title: "Success", subtitle: "Stories", color: "bg-orange-500" },
    { id: "events", icon: Calendar, title: "Events", subtitle: "& Reunions", color: "bg-green-500" },
  ]);

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
          id, name, status, contact, address,
          aftercare_records (id, institution_workshop, completion_status)
        `)
        .or('status.like.Alumni%,status.eq.Complete')
        .order('name', { ascending: true });

      if (clientsError) throw clientsError;

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

      setAlumni(clientsData || []);
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleQuickActionsDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setQuickActions((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      "Alumni - Awaiting Placement": "bg-orange-500 text-white hover:bg-orange-600",
      "Alumni - Placed": "bg-green-500 text-white hover:bg-green-600",
      "Alumni": "bg-blue-500 text-white hover:bg-blue-600",
    };
    return colors[status] || "bg-gray-500 text-white hover:bg-gray-600";
  };

  const awaitingPlacement = alumni.filter(a => a.status === 'Alumni - Awaiting Placement').length;
  const placed = alumni.filter(a => a.status === 'Alumni - Placed').length;

  return (
    <div className="min-h-screen bg-background w-full max-w-full overflow-x-hidden">
      <div className="relative bg-gradient-to-r from-orange-600 to-purple-600 h-32 flex items-center px-4 sm:px-6 lg:px-8 w-full max-w-full">
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
          <Button className="bg-white text-orange-600 hover:bg-orange-50">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Alumni
          </Button>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-t-4 border-t-orange-500">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Medal className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{alumni.length}</p>
                  <p className="text-sm text-muted-foreground">TOTAL ALUMNI</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{awaitingPlacement}</p>
                  <p className="text-sm text-muted-foreground">AWAITING PLACEMENT</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-green-500">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{placed}</p>
                  <p className="text-sm text-muted-foreground">PLACED</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-500" />
              <CardTitle className="text-xl">Quick Actions</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              Common alumni management tasks (drag to reorder)
            </p>
          </CardHeader>
          <CardContent>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleQuickActionsDragEnd}
            >
              <SortableContext items={quickActions.map((item) => item.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {quickActions.map((item) => (
                    <SortableQuickAction key={item.id} item={item} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </CardContent>
        </Card>

        {/* Success Metrics */}
        <Card className="bg-gradient-to-r from-orange-50 to-purple-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-orange-500" />
              <CardTitle className="text-xl">Alumni Success Metrics</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm">
                <div className="p-3 bg-green-500 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">100%</p>
                  <p className="text-sm text-muted-foreground">Program Completion Rate</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm">
                <div className="p-3 bg-blue-500 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">80%</p>
                  <p className="text-sm text-muted-foreground">Employment Rate</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm">
                <div className="p-3 bg-purple-500 rounded-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">5</p>
                  <p className="text-sm text-muted-foreground">Active Alumni Network</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
              <Input placeholder="Search by name, location, or occupation..." className="flex-1" />
              <Select defaultValue="all-programs">
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="All Programs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-programs">All Programs</SelectItem>
                  <SelectItem value="counselling">Counselling</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="empowerment">Empowerment</SelectItem>
                  <SelectItem value="aftercare">Aftercare</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all-status">
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-status">All Status</SelectItem>
                  <SelectItem value="employed">Employed</SelectItem>
                  <SelectItem value="self-employed">Self-Employed</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="seeking">Job Seeking</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">Clear</Button>
            </div>

            {/* Alumni Table */}
            <div className="rounded-md border overflow-x-auto">
              <Table>
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
                  ) : alumni.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No alumni found. Clients with complete discharge will appear here.
                      </TableCell>
                    </TableRow>
                  ) : (
                    alumni.map((person, index) => (
                      <TableRow key={person.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className={getAvatarColor(index)}>
                              <AvatarFallback className={`${getAvatarColor(index)} text-white font-semibold`}>
                                {getInitials(person.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{person.name}</p>
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
                          <Badge className={getStatusColor(person.status)}>• {person.status}</Badge>
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
                          <div className="flex gap-2 flex-wrap">
                            <Button 
                              size="sm" 
                              className="bg-blue-500 hover:bg-blue-600 text-white"
                              onClick={() => navigate(`/clients/${person.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
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
