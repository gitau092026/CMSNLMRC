import { useState, useEffect } from"react";
import { useNavigate, useLocation } from"react-router-dom";
import { GraduationCap, FileText, Clock, BarChart3, AlertCircle, Phone, Calendar, User, Building, BookOpen, Plus, Edit, ChevronDown, ChevronRight, MapPin, DollarSign, Briefcase, Trash2 } from"lucide-react";
import { MetricCard } from"@/components/MetricCard";
import { Card, CardContent } from"@/components/ui/card";
import { Badge } from"@/components/ui/badge";
import { Button } from"@/components/ui/button";
import { supabase } from"@/integrations/supabase/client";
import { useToast } from"@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from"@/components/ui/collapsible";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from"@/components/ui/alert-dialog";
import { useAuth } from"@/contexts/AuthContext";

interface AftercareRecord {
 id: string;
 institution_workshop: string;
 placement_course: string | null;
 contact_person: string | null;
 contact_phone: string | null;
 placement_date: string | null;
 completion_date: string | null;
 placement_location: string | null;
 placement_fees: number | null;
 placement_type: string | null;
 placement_type_details: string | null;
 completion_status: string;
 notes: string | null;
}

interface ClientWithAftercare {
 id: string;
 name: string;
 status: string;
 contact: string;
 aftercare_records: AftercareRecord[];
}

const statusColors: Record<string, string> = {
 'in progress': 'bg-blue-100 text-blue-800 border-blue-200',
 'internship': 'bg-purple-100 text-purple-800 border-purple-200',
 'employed': 'bg-green-100 text-green-800 border-green-200',
 'relapse': 'bg-red-100 text-red-800 border-red-200',
 'absconded': 'bg-orange-100 text-orange-800 border-orange-200',
 'attachment': 'bg-cyan-100 text-cyan-800 border-cyan-200',
 'completed': 'bg-teal-100 text-teal-800 border-teal-200',
};

const Aftercare = () => {
 const navigate = useNavigate();
 const location = useLocation();
 const { toast } = useToast();
 const { user } = useAuth();
 const isAdmin = user?.role === 'admin';
 const canEdit = isAdmin || user?.role === 'social_work' || user?.role === 'counsellor' || user?.role === 'intern_social_work' || user?.role === 'intern_counselling';
 const [clients, setClients] = useState<ClientWithAftercare[]>([]);
 const [loading, setLoading] = useState(true);
 const [expandedClient, setExpandedClient] = useState<string | null>(null);
 const [stats, setStats] = useState({
 graduated: 0,
 records: 0,
 awaitingPlacement: 0,
 employed: 0,
 inProgress: 0
 });

 const handleDeleteRecord = async (recordId: string) => {
 try {
 const { error } = await supabase
 .from('aftercare_records')
 .delete()
 .eq('id', recordId);

 if (error) throw error;

 toast({
 title:"Success",
 description:"Aftercare record deleted successfully"
 });
 fetchClients();
 } catch (error: any) {
 toast({
 title:"Error",
 description: error.message,
 variant:"destructive"
 });
 }
 };

 useEffect(() => {
 fetchClients();
 }, [location.search]);

 const fetchClients = async () => {
 try {
 setLoading(true);
 const { data, error } = await supabase
 .from('clients')
 .select(`
 id,
 name,
 status,
 contact,
 aftercare_records (
 id,
 institution_workshop,
 placement_course,
 contact_person,
 contact_phone,
 placement_date,
 completion_date,
 placement_location,
 placement_fees,
 placement_type,
 placement_type_details,
 completion_status,
 notes
 )
 `)
 .or('status.eq.Alumni - Awaiting Placement,status.eq.Complete,status.eq.Graduated,status.eq.Alumni - Placed,status.eq.Escape,status.eq.Voluntary Discharge,status.eq.Early Reintegration')
 .order('name', { ascending: true });

 if (error) throw error;

 const awaitingPlacement = data?.filter(c => c.status === 'Alumni - Awaiting Placement' || c.status === 'Complete') || [];
 const graduated = data?.filter(c => c.status === 'Graduated') || [];

 let employedCount = 0;
 let inProgressCount = 0;
 data?.forEach(client => {
 client.aftercare_records?.forEach(record => {
 if (record.completion_status === 'employed') employedCount++;
 if (record.completion_status === 'in progress') inProgressCount++;
 });
 });

 // Auto-fix: Update clients with aftercare records to"Alumni - Placed" status
 if (data && data.length > 0) {
 const clientsToUpdate = data.filter(
 client =>
 client.status === 'Alumni - Awaiting Placement' &&
 client.aftercare_records &&
 client.aftercare_records.length > 0
 );

 if (clientsToUpdate.length > 0) {
 // Update all clients that have aftercare records but wrong status
 const updatePromises = clientsToUpdate.map(client =>
 supabase
 .from('clients')
 .update({ status: 'Alumni - Placed' })
 .eq('id', client.id)
 );

 await Promise.all(updatePromises);

 // Refresh the data after updates
 const { data: refreshedData } = await supabase
 .from('clients')
 .select(`
 id,
 name,
 status,
 contact,
 aftercare_records (
 id,
 institution_workshop,
 placement_course,
 contact_person,
 contact_phone,
 placement_date,
 completion_date,
 placement_location,
 placement_fees,
 placement_type,
 placement_type_details,
 completion_status,
 notes
 )
 `)
 .or('status.eq.Alumni - Awaiting Placement,status.eq.Complete,status.eq.Graduated,status.eq.Alumni - Placed,status.eq.Escape,status.eq.Voluntary Discharge,status.eq.Early Reintegration')
 .order('name', { ascending: true });

 if (refreshedData) {
 const updatedAwaitingPlacement = refreshedData.filter(c => c.status === 'Alumni - Awaiting Placement' || c.status === 'Complete') || [];
 const updatedGraduated = refreshedData.filter(c => c.status === 'Graduated') || [];

 let updatedEmployedCount = 0;
 let updatedInProgressCount = 0;
 refreshedData.forEach(client => {
 client.aftercare_records?.forEach(record => {
 if (record.completion_status === 'employed') updatedEmployedCount++;
 if (record.completion_status === 'in progress') updatedInProgressCount++;
 });
 });

 setClients(refreshedData);
 setStats({
 graduated: updatedGraduated.length,
 records: refreshedData.reduce((acc, c) => acc + (c.aftercare_records?.length || 0), 0) || 0,
 awaitingPlacement: updatedAwaitingPlacement.length,
 employed: updatedEmployedCount,
 inProgress: updatedInProgressCount
 });
 return;
 }
 }
 }

 setClients(data || []);
 setStats({
 graduated: graduated.length,
 records: data?.reduce((acc, c) => acc + (c.aftercare_records?.length || 0), 0) || 0,
 awaitingPlacement: awaitingPlacement.length,
 employed: employedCount,
 inProgress: inProgressCount
 });
 } catch (error: any) {
 toast({
 title:"Error",
 description: error.message,
 variant:"destructive"
 });
 } finally {
 setLoading(false);
 }
 };

 const formatDate = (dateString: string | null) => {
 if (!dateString) return 'N/A';
 return new Date(dateString).toLocaleDateString('en-US', {
 year: 'numeric',
 month: 'short',
 day: 'numeric'
 });
 };

 const getStatusBadgeClass = (status: string) => {
 return statusColors[status.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
 };

 return (
 <div className="min-h-screen bg-background w-full">
 <div className="sticky top-14 z-10 shadow-md bg-gradient-primary h-24 flex items-center px-4 sm:px-6 lg:px-8">
 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
 <div className="relative">
 <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Aftercare Records</h1>
 </div>
 </div>

 <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
 <MetricCard
 title="Graduated"
 value={stats.graduated}
 icon={GraduationCap}
 variant="success"
 />
 <MetricCard
 title="Placement Records"
 value={stats.records}
 icon={FileText}
 variant="primary"
 />
 <MetricCard
 title="Awaiting Placement"
 value={stats.awaitingPlacement}
 icon={Clock}
 variant="primary"
 />
 <MetricCard
 title="Employed"
 value={stats.employed}
 icon={BarChart3}
 variant="success"
 />
 <MetricCard
 title="In Progress"
 value={stats.inProgress}
 icon={AlertCircle}
 variant="primary"
 />
 </div>

 <div className="space-y-4">
 <div>
 <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
 <FileText className="h-6 w-6" />
 Clients with Aftercare Records
 </h2>
 <p className="text-muted-foreground mt-1">Placement and follow-up tracking</p>
 </div>

  {loading ? (
    <Card className="border-border">
      <CardContent className="p-8 text-center text-muted-foreground">
        Loading clients...
      </CardContent>
    </Card>
  ) : clients.length === 0 ? (
    <Card className="border-border">
      <CardContent className="p-8 text-center text-muted-foreground">
        No graduated clients found
      </CardContent>
    </Card>
  ) : (
    <div className="space-y-4">
      {clients.map((client) => {
        const latestRecord = client.aftercare_records && client.aftercare_records.length > 0
          ? [...client.aftercare_records].sort((a, b) => {
              const dateA = a.placement_date ? new Date(a.placement_date).getTime() : 0;
              const dateB = b.placement_date ? new Date(b.placement_date).getTime() : 0;
              return dateB - dateA;
            })[0]
          : null;

        return (
          <Card key={client.id} className="border-border hover:shadow-md transition-shadow">
            <CardContent className="p-5 space-y-4">
              {/* Top Row: Client Info and Primary Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-3">
                <div className="flex flex-wrap items-center gap-3 flex-1">
                  <span className="font-semibold text-lg text-foreground">{client.name}</span>
                  <Badge className="bg-success/10 text-success hover:bg-success/20 border-success/20 text-xs">
                    {client.status}
                  </Badge>
                  {latestRecord && (
                    <Badge className={`${getStatusBadgeClass(latestRecord.completion_status)} text-xs capitalize`}>
                      Latest: {latestRecord.completion_status}
                    </Badge>
                  )}
                  {client.contact && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {client.contact}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {canEdit && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/aftercare/add/${client.id}`)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Placement
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate(`/clients/${client.id}`)}
                  >
                    Profile
                  </Button>
                </div>
              </div>

              {/* Placements List (Inline, no sub cards) */}
              {client.aftercare_records && client.aftercare_records.length > 0 ? (
                <div className="space-y-4 divide-y divide-border/60">
                  {client.aftercare_records.map((record, index) => (
                    <div key={record.id} className={`pt-3 ${index === 0 ? 'pt-0 border-t-0' : ''} space-y-2`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-primary">Placement #{index + 1}</span>
                        <div className="flex gap-2">
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/aftercare/add/${client.id}?edit=${record.id}`)}
                              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
                            >
                              <Edit className="h-3.5 w-3.5 mr-1" />
                              Edit
                            </Button>
                          )}
                          {isAdmin && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="w-[95vw] max-w-full sm:max-w-lg">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Aftercare Record</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this aftercare record? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteRecord(record.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        <div className="flex items-start gap-2 text-muted-foreground">
                          <Building className="h-4 w-4 mt-0.5 shrink-0 text-primary/70" />
                          <div>
                            <span className="font-medium text-foreground">Institution/Workshop:</span>{' '}
                            {record.institution_workshop}
                          </div>
                        </div>

                        {record.placement_course && (
                          <div className="flex items-start gap-2 text-muted-foreground">
                            <BookOpen className="h-4 w-4 mt-0.5 shrink-0 text-primary/70" />
                            <div>
                              <span className="font-medium text-foreground">Course/Class:</span>{' '}
                              {record.placement_course}
                            </div>
                          </div>
                        )}

                        {record.placement_type && (
                          <div className="flex items-start gap-2 text-muted-foreground">
                            <Briefcase className="h-4 w-4 mt-0.5 shrink-0 text-primary/70" />
                            <div>
                              <span className="font-medium text-foreground">
                                {record.placement_type === 'vocational_training' 
                                  ? 'Vocational Training' 
                                  : record.placement_type === 'school'
                                  ? 'School'
                                  : 'Apprenticeship'}:
                              </span>{' '}
                              {record.placement_type_details || 'No details provided'}
                            </div>
                          </div>
                        )}

                        {record.placement_location && (
                          <div className="flex items-start gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary/70" />
                            <div>
                              <span className="font-medium text-foreground">Location:</span>{' '}
                              {record.placement_location}
                            </div>
                          </div>
                        )}

                        {record.contact_person && (
                          <div className="flex items-start gap-2 text-muted-foreground">
                            <User className="h-4 w-4 mt-0.5 shrink-0 text-primary/70" />
                            <div>
                              <span className="font-medium text-foreground">Contact:</span>{' '}
                              {record.contact_person}
                              {record.contact_phone && ` (${record.contact_phone})`}
                            </div>
                          </div>
                        )}

                        {record.placement_fees != null && (
                          <div className="flex items-start gap-2 text-muted-foreground">
                            <DollarSign className="h-4 w-4 mt-0.5 shrink-0 text-primary/70" />
                            <div>
                              <span className="font-medium text-foreground">Fees:</span>{' '}
                              {record.placement_fees.toLocaleString()}
                            </div>
                          </div>
                        )}

                        {record.placement_date && (
                          <div className="flex items-start gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4 mt-0.5 shrink-0 text-primary/70" />
                            <div>
                              <span className="font-medium text-foreground">Placement Date:</span>{' '}
                              {formatDate(record.placement_date)}
                            </div>
                          </div>
                        )}

                        {record.completion_date && (
                          <div className="flex items-start gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4 mt-0.5 shrink-0 text-primary/70" />
                            <div>
                              <span className="font-medium text-foreground">Completion Date:</span>{' '}
                              {formatDate(record.completion_date)}
                            </div>
                          </div>
                        )}
                      </div>

                      {record.notes && (
                        <div className="mt-2 text-sm text-muted-foreground bg-muted/40 p-2.5 rounded border border-border/50">
                          <span className="font-medium text-foreground">Notes:</span>{' '}
                          <span className="whitespace-pre-wrap leading-relaxed">{record.notes}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground italic bg-muted/20 p-4 rounded text-center border border-dashed border-border">
                  No placement record available.
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  )}
 </div>
 </div>
 </div>
 );
};

export default Aftercare;
