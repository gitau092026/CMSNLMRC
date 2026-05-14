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
 const canEdit = isAdmin || user?.role === 'social_work';
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

 <Card>
 <CardContent className="p-0">
 {loading ? (
 <div className="p-8 text-center text-muted-foreground">
 Loading clients...
 </div>
 ) : clients.length === 0 ? (
 <div className="p-8 text-center text-muted-foreground">
 No graduated clients found
 </div>
 ) : (
 <div className="divide-y divide-border">
 {clients.map((client) => {
 const aftercareRecord = client.aftercare_records?.[0];
 const isExpanded = expandedClient === client.id;

 return (
 <Collapsible
 key={client.id}
 open={isExpanded}
 onOpenChange={() => setExpandedClient(isExpanded ? null : client.id)}
 >
 <CollapsibleTrigger className="w-full">
 <div className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors">
 <div className="w-1 h-8 bg-success rounded-full" />
 <div className="flex-1 text-left">
 <span className="font-medium text-foreground">{client.name}</span>
 </div>
 {aftercareRecord && (
 <Badge className={`${getStatusBadgeClass(aftercareRecord.completion_status)} text-xs`}>
 {aftercareRecord.completion_status}
 </Badge>
 )}
 {isExpanded ? (
 <ChevronDown className="h-5 w-5 text-muted-foreground" />
 ) : (
 <ChevronRight className="h-5 w-5 text-muted-foreground" />
 )}
 </div>
 </CollapsibleTrigger>

 <CollapsibleContent>
 <div className="px-4 pb-4 pl-8 space-y-4 bg-muted/30">
 <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
 <Phone className="h-4 w-4" />
 <span>{client.contact || 'N/A'}</span>
 <span className="mx-2">•</span>
 <Badge className="bg-success/10 text-success hover:bg-success/20 border-success/20 text-xs">
 {client.status}
 </Badge>
 </div>

 {aftercareRecord ? (
 <div className="space-y-3 border-l-2 border-success/30 pl-4">
 {canEdit && (
 <Button
 variant="outline"
 size="sm"
 onClick={(e) => {
 e.stopPropagation();
 navigate(`/aftercare/add/${client.id}`);
 }}
 className="mb-2"
 >
 <Plus className="h-4 w-4 mr-1" />
 Add Another Placement
 </Button>
 )}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
 <div className="flex items-start gap-2 text-muted-foreground">
 <Building className="h-4 w-4 mt-0.5 shrink-0" />
 <div>
 <span className="font-medium text-foreground">Institution/Workshop:</span>{' '}
 {aftercareRecord.institution_workshop}
 </div>
 </div>

 {aftercareRecord.placement_course && (
 <div className="flex items-start gap-2 text-muted-foreground">
 <BookOpen className="h-4 w-4 mt-0.5 shrink-0" />
 <div>
 <span className="font-medium text-foreground">Course/Class:</span>{' '}
 {aftercareRecord.placement_course}
 </div>
 </div>
 )}

 {aftercareRecord.placement_type && (
 <div className="flex items-start gap-2 text-muted-foreground">
 <Briefcase className="h-4 w-4 mt-0.5 shrink-0" />
 <div>
 <span className="font-medium text-foreground">
 {aftercareRecord.placement_type === 'vocational_training' ? 'Vocational Training' : 'Apprenticeship'}:
 </span>{' '}
 {aftercareRecord.placement_type_details || 'No details provided'}
 </div>
 </div>
 )}

 {aftercareRecord.placement_location && (
 <div className="flex items-start gap-2 text-muted-foreground">
 <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
 <div>
 <span className="font-medium text-foreground">Location:</span>{' '}
 {aftercareRecord.placement_location}
 </div>
 </div>
 )}

 {aftercareRecord.contact_person && (
 <div className="flex items-start gap-2 text-muted-foreground">
 <User className="h-4 w-4 mt-0.5 shrink-0" />
 <div>
 <span className="font-medium text-foreground">Contact:</span>{' '}
 {aftercareRecord.contact_person}
 {aftercareRecord.contact_phone && ` (${aftercareRecord.contact_phone})`}
 </div>
 </div>
 )}

 {aftercareRecord.placement_fees != null && (
 <div className="flex items-start gap-2 text-muted-foreground">
 <DollarSign className="h-4 w-4 mt-0.5 shrink-0" />
 <div>
 <span className="font-medium text-foreground">Fees:</span>{' '}
 {aftercareRecord.placement_fees.toLocaleString()}
 </div>
 </div>
 )}

 {aftercareRecord.placement_date && (
 <div className="flex items-start gap-2 text-muted-foreground">
 <Calendar className="h-4 w-4 mt-0.5 shrink-0" />
 <div>
 <span className="font-medium text-foreground">Placement Date:</span>{' '}
 {formatDate(aftercareRecord.placement_date)}
 </div>
 </div>
 )}

 {aftercareRecord.completion_date && (
 <div className="flex items-start gap-2 text-muted-foreground">
 <Calendar className="h-4 w-4 mt-0.5 shrink-0" />
 <div>
 <span className="font-medium text-foreground">Completion Date:</span>{' '}
 {formatDate(aftercareRecord.completion_date)}
 </div>
 </div>
 )}
 </div>

 <div className="flex gap-2">
 {canEdit && (
 <Button
 variant="outline"
 size="sm"
 onClick={(e) => {
 e.stopPropagation();
 navigate(`/aftercare/add/${client.id}?edit=${aftercareRecord.id}`);
 }}
 >
 <Edit className="h-4 w-4 mr-1" />
 Edit Placement
 </Button>
 )}
 {isAdmin && (
 <AlertDialog>
 <AlertDialogTrigger asChild>
 <Button
 variant="destructive"
 size="sm"
 onClick={(e) => e.stopPropagation()}
 >
 <Trash2 className="h-4 w-4 mr-1" />
 Delete
 </Button>
 </AlertDialogTrigger>
 <AlertDialogContent onClick={(e) => e.stopPropagation()}>
 <AlertDialogHeader>
 <AlertDialogTitle>Delete Aftercare Record</AlertDialogTitle>
 <AlertDialogDescription>
 Are you sure you want to delete this aftercare record? This action cannot be undone.
 </AlertDialogDescription>
 </AlertDialogHeader>
 <AlertDialogFooter>
 <AlertDialogCancel>Cancel</AlertDialogCancel>
 <AlertDialogAction onClick={() => handleDeleteRecord(aftercareRecord.id)}>
 Delete
 </AlertDialogAction>
 </AlertDialogFooter>
 </AlertDialogContent>
 </AlertDialog>
 )}
 <Button
 variant="ghost"
 size="sm"
 onClick={(e) => {
 e.stopPropagation();
 navigate(`/clients/${client.id}`);
 }}
 >
 View Profile
 </Button>
 </div>
 </div>
 ) : (
 <div className="space-y-2">
 <p className="text-sm text-muted-foreground italic">
 No placement record available
 </p>
 <Button
 variant="outline"
 size="sm"
 onClick={(e) => {
 e.stopPropagation();
 navigate(`/aftercare/add/${client.id}`);
 }}
 >
 <Plus className="h-4 w-4 mr-1" />
 Add Placement
 </Button>
 </div>
 )}
 </div>
 </CollapsibleContent>
 </Collapsible>
 );
 })}
 </div>
 )}
 </CardContent>
 </Card>
 </div>
 </div>
 </div>
 );
};

export default Aftercare;
