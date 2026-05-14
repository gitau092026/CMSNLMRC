import { useState, useEffect } from"react";
import { useNavigate } from"react-router-dom";
import { supabase } from"@/integrations/supabase/client";
import { ClipboardList, Plus, FileText, User, Clock, Edit, Trash2 } from"lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import { Button } from"@/components/ui/button";
import { Badge } from"@/components/ui/badge";
import { Avatar, AvatarFallback } from"@/components/ui/avatar";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from"@/components/ui/select";
import { useToast } from"@/hooks/use-toast";

interface DraftCasePlan {
 clientId: string;
 clientName: string;
 lastSaved: string;
 savedSections: string[];
}

const CasePlans = () => {
 const navigate = useNavigate();
 const { toast } = useToast();
 const [selectedClient, setSelectedClient] = useState("");
 const [clients, setClients] = useState<any[]>([]);
 const [draftPlans, setDraftPlans] = useState<DraftCasePlan[]>([]);
 const [activePlans, setActivePlans] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 fetchClients();
 loadDrafts();
 }, []);

 const fetchClients = async () => {
 try {
 const { data, error } = await supabase
 .from('clients')
 .select('*')
 .order('name');

 if (error) throw error;
 setClients(data || []);
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

 const loadDrafts = async () => {
 const draftsMap = new Map<string, DraftCasePlan>();

 // 1. Get all localStorage keys first
 for (let i = 0; i < localStorage.length; i++) {
 const key = localStorage.key(i);
 if (key && key.startsWith('case_plan_draft_')) {
 try {
 const clientId = key.replace('case_plan_draft_', '');
 const draftData = JSON.parse(localStorage.getItem(key) || '{}');
 draftsMap.set(clientId, {
 clientId,
 clientName:"Loading...", // Placeholder
 lastSaved: draftData.lastSaved,
 savedSections: draftData.savedSections || []
 });
 } catch (error) {
 console.error('Error loading local draft:', error);
 }
 }
 }

 // 2. Fetch Server Drafts and merge (Server takes priority)
 try {
 const { data: dbDrafts, error } = await (supabase as any)
 .from('case_plans')
 .select(`
 client_id,
 updated_at,
 saved_sections,
 clients ( name )
 `)
 .eq('status', 'Draft')
 .order('updated_at', { ascending: false });

 if (error) throw error;

 if (dbDrafts) {
 dbDrafts.forEach((d: any) => {
 draftsMap.set(d.client_id, {
 clientId: d.client_id,
 clientName: d.clients?.name ||"Unknown",
 lastSaved: d.updated_at,
 savedSections: d.saved_sections || []
 });
 });
 }
 } catch (error) {
 console.error('Error loading server drafts:', error);
 }

 // 3. Resolve names for local-only drafts
 const localOnlyIds = Array.from(draftsMap.values())
 .filter(d => d.clientName ==="Loading...")
 .map(d => d.clientId);

 if (localOnlyIds.length > 0) {
 const { data: clients } = await supabase
 .from('clients')
 .select('id, name')
 .in('id', localOnlyIds);

 if (clients) {
 clients.forEach(c => {
 const draft = draftsMap.get(c.id);
 if (draft && draft.clientName ==="Loading...") {
 draft.clientName = c.name;
 }
 });
 }
 }

 const combinedDrafts = Array.from(draftsMap.values())
 .filter(d => d.clientName !=="Loading...")
 .sort((a, b) => new Date(b.lastSaved).getTime() - new Date(a.lastSaved).getTime());

 setDraftPlans(combinedDrafts);

 // 4. Fetch Active (Completed) Plans
 try {
 const { data: dbActive, error } = await (supabase as any)
 .from('case_plans')
 .select(`
 id,
 client_id,
 updated_at,
 plan_date,
 clients ( name, client_id )
 `)
 .eq('status', 'Active')
 .order('updated_at', { ascending: false });

 if (dbActive) {
 setActivePlans(dbActive);
 }
 } catch (error) {
 console.error("Error fetching active plans:", error);
 }
 };

 const deleteDraft = async (clientId: string) => {
 try {
 await (supabase as any).from('case_plans').delete().eq('client_id', clientId).eq('status', 'Draft');

 // Also clear local for hygiene
 localStorage.removeItem(`case_plan_draft_${clientId}`);

 setDraftPlans(draftPlans.filter(draft => draft.clientId !== clientId));

 toast({
 title:"Draft deleted",
 description:"The draft case plan has been removed.",
 });
 } catch (error: any) {
 toast({
 title:"Error",
 description:"Failed to delete draft",
 variant:"destructive"
 });
 }
 };

 const handleAddCasePlan = () => {
 if (selectedClient) {
 navigate(`/case-plans/add?clientId=${selectedClient}`);
 } else {
 navigate('/case-plans/add');
 }
 };

 const handleContinueDraft = (clientId: string) => {
 navigate(`/case-plans/add?clientId=${clientId}`);
 };

 const formatLastSaved = (dateString: string) => {
 const date = new Date(dateString);
 const now = new Date();
 const diffMs = now.getTime() - date.getTime();
 const diffMins = Math.floor(diffMs / 60000);
 const diffHours = Math.floor(diffMs / 3600000);
 const diffDays = Math.floor(diffMs / 86400000);

 if (diffMins < 1) return 'Just now';
 if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
 if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
 if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
 return date.toLocaleDateString();
 };

 const getInitials = (name: string) => {
 return name
 .split(' ')
 .map(n => n[0])
 .join('')
 .toUpperCase()
 .slice(0, 2);
 };

 return (
 <div className="min-h-screen bg-background w-full">
 <div className="sticky top-14 z-10 shadow-md bg-gradient-to-r from-blue-600 to-cyan-600 h-24 flex items-center px-4 sm:px-6 lg:px-8">
 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
 <div className="relative">
 <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Case Plans</h1>
 <p className="text-sm sm:text-base text-white/90">Manage Case Plans For Clients</p>
 </div>
 </div>

 <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
 {/* Add New Case Plan Section */}
 <Card className="border-t-4 border-t-cyan-500">
 <CardHeader>
 <div className="flex items-center gap-2">
 <ClipboardList className="h-5 w-5" />
 <CardTitle>Create New Case Plan</CardTitle>
 </div>
 <p className="text-sm text-muted-foreground mt-1">
 Select a client to create a new case plan (Form 4)
 </p>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="flex flex-col sm:flex-row gap-4 items-end">
 <div className="flex-1 space-y-2">
 <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
 Select Client
 </label>
 <Select value={selectedClient} onValueChange={setSelectedClient}>
 <SelectTrigger className="w-full">
 <SelectValue placeholder="Choose a client..." />
 </SelectTrigger>
 <SelectContent className="bg-card z-50">
 {clients.map((client) => (
 <SelectItem key={client.id} value={client.id}>
 {client.name} ({client.client_id})
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 <Button
 className="bg-cyan-600 hover:bg-cyan-700 w-full sm:w-auto shrink-0"
 onClick={handleAddCasePlan}
 >
 <Plus className="h-4 w-4 mr-2" />
 Create Plan
 </Button>
 </div>
 </CardContent>
 </Card>

 {/* Draft Case Plans */}
 {draftPlans.length > 0 && (
 <Card className="border-t-4 border-t-orange-500">
 <CardHeader>
 <div className="flex items-center gap-2">
 <FileText className="h-5 w-5" />
 <CardTitle>Draft Case Plans</CardTitle>
 </div>
 <p className="text-sm text-muted-foreground mt-1">
 Continue working on incomplete case plans
 </p>
 </CardHeader>
 <CardContent>
 <div className="space-y-3">
 {draftPlans.map((draft) => (
 <div
 key={draft.clientId}
 className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors"
 onClick={() => handleContinueDraft(draft.clientId)}
 >
 <Avatar className="h-12 w-12 bg-cyan-500 text-white">
 <AvatarFallback className="bg-cyan-500 text-white font-semibold">
 {getInitials(draft.clientName)}
 </AvatarFallback>
 </Avatar>

 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2">
 <h3 className="font-semibold text-foreground">
 {draft.clientName}
 </h3>
 <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20">
 Draft
 </Badge>
 </div>
 <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
 <div className="flex items-center gap-1">
 <Clock className="h-3 w-3" />
 <span>{formatLastSaved(draft.lastSaved)}</span>
 </div>
 {draft.savedSections.length > 0 && (
 <span>
 {draft.savedSections.length} section{draft.savedSections.length > 1 ? 's' : ''} saved
 </span>
 )}
 </div>
 </div>

 <div className="flex gap-2">
 <Button
 variant="outline"
 size="sm"
 onClick={(e) => {
 e.stopPropagation();
 handleContinueDraft(draft.clientId);
 }}
 >
 <Edit className="h-4 w-4 mr-2" />
 Continue
 </Button>
 <Button
 variant="ghost"
 size="sm"
 className="text-destructive hover:text-destructive hover:bg-destructive/10"
 onClick={(e) => {
 e.stopPropagation();
 deleteDraft(draft.clientId);
 }}
 >
 <Trash2 className="h-4 w-4" />
 </Button>
 </div>
 </div>
 ))}
 </div>
 </CardContent>
 </Card>
 )}

 {/* Recent Case Plans (Completed) */}
 <Card className="border-t-4 border-t-cyan-500">
 <CardHeader>
 <div className="flex items-center gap-2">
 <FileText className="h-5 w-5" />
 <CardTitle>Recent Case Plans</CardTitle>
 </div>
 </CardHeader>
 <CardContent>
 {activePlans.length === 0 ? (
 <p className="text-muted-foreground text-center py-8">
 No completed case plans found. Create one above.
 </p>
 ) : (
 <div className="space-y-3">
 {activePlans.map((plan) => (
 <div
 key={plan.id}
 className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
 >
 <div className="p-2 rounded-full bg-cyan-100 text-cyan-600 dark:bg-cyan-900 dark:text-cyan-400">
 <FileText className="h-5 w-5" />
 </div>

 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2">
 <h3 className="font-semibold text-foreground">
 {plan.clients?.name}
 </h3>
 <Badge variant="outline" className="text-cyan-600 border-cyan-200">
 {plan.clients?.client_id}
 </Badge>
 </div>
 <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
 <div className="flex items-center gap-1">
 <Clock className="h-3 w-3" />
 <span>Updated: {new Date(plan.updated_at).toLocaleDateString()}</span>
 </div>
 <div className="flex items-center gap-1">
 <ClipboardList className="h-3 w-3" />
 <span>Plan Date: {new Date(plan.plan_date).toLocaleDateString()}</span>
 </div>
 </div>
 </div>

 <div className="flex gap-2">
 <Button
 variant="outline"
 size="sm"
 className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
 onClick={() => navigate(`/case-plans/${plan.id}`)}
 >
 <FileText className="h-4 w-4 mr-2" />
 View Report
 </Button>
 <Button
 variant="ghost"
 size="sm"
 onClick={() => navigate(`/case-plans/add?planId=${plan.id}&clientId=${plan.client_id}`)}
 >
 <Edit className="h-4 w-4" />
 <span className="sr-only">Edit</span>
 </Button>
 </div>
 </div>
 ))}
 </div>
 )}
 </CardContent>
 </Card>
 </div>
 </div>
 );
};

export default CasePlans;
