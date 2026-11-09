import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  GraduationCap, FileText, Clock, BarChart3, AlertCircle,
  Phone, Calendar, User, Building, BookOpen, Plus, Edit,
  MapPin, DollarSign, Briefcase, Trash2, TrendingUp, ChevronDown, ChevronUp,
} from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { setCachedClient, prefetchAvatars, prefetchImage } from "@/lib/clientCache";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";

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
  client_id?: string | null;
  profile_picture?: string | null;
  status: string;
  contact: string;
  aftercare_records: AftercareRecord[];
  [key: string]: any;
}

const completionColors: Record<string, string> = {
  "in progress":  "bg-blue-100 text-blue-800 border-blue-200",
  internship:     "bg-purple-100 text-purple-800 border-purple-200",
  employed:       "bg-green-100 text-green-800 border-green-200",
  relapse:        "bg-red-100 text-red-800 border-red-200",
  absconded:      "bg-orange-100 text-orange-800 border-orange-200",
  attachment:     "bg-cyan-100 text-cyan-800 border-cyan-200",
  completed:      "bg-teal-100 text-teal-800 border-teal-200",
};

const clientStatusColors: Record<string, string> = {
  "Alumni - Awaiting Placement": "bg-amber-100 text-amber-800 border-amber-200",
  "Graduated":                   "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Alumni - Placed":             "bg-blue-100 text-blue-800 border-blue-200",
};

const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "N/A";

const placementTypeLabel = (t: string | null) =>
  t === "vocational_training" ? "Vocational Training"
  : t === "school" ? "School"
  : t === "apprenticeship" ? "Apprenticeship"
  : t ?? "Unspecified";

/* ─── Single client card ─────────────────────────────────────── */
function ClientCard({
  client, canEdit, isAdmin, onDelete, navigate,
}: {
  client: ClientWithAftercare;
  canEdit: boolean;
  isAdmin: boolean;
  onDelete: (id: string) => void;
  navigate: (path: string, opts?: any) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const latestRecord = client.aftercare_records?.length
    ? [...client.aftercare_records].sort((a, b) =>
        (b.placement_date ? new Date(b.placement_date).getTime() : 0) -
        (a.placement_date ? new Date(a.placement_date).getTime() : 0)
      )[0]
    : null;

  return (
    <Card className="border-border shadow-sm">
      {/* Client header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-border/60">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          {/* Avatar circle */}
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold text-sm">
            {client.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground leading-tight">{client.name}</p>
            {client.contact && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Phone className="h-3 w-3" />{client.contact}
              </p>
            )}
          </div>
          <Badge className={`text-xs border ${clientStatusColors[client.status] ?? "bg-muted text-muted-foreground"}`}>
            {client.status}
          </Badge>
          {latestRecord && (
            <Badge className={`text-xs capitalize border ${completionColors[latestRecord.completion_status.toLowerCase()] ?? "bg-muted text-muted-foreground"}`}>
              {latestRecord.completion_status}
            </Badge>
          )}
        </div>

        <div className="flex gap-2 shrink-0">
          {canEdit && (
            <Button size="sm" variant="outline" onClick={() => navigate(`/aftercare/add/${client.id}`)}>
              <Plus className="h-3.5 w-3.5 mr-1" />Add Placement
            </Button>
          )}
          <Button size="sm" variant="ghost" onMouseEnter={() => prefetchImage(client.profile_picture)}
            onClick={() => navigate(`/clients/${client.id}`, { state: { client } })}>
            Profile
          </Button>
          {client.aftercare_records?.length > 0 && (
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setExpanded(e => !e)}>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>

      {/* Placement records */}
      {expanded && (
        <CardContent className="p-0">
          {client.aftercare_records?.length > 0 ? (
            <div className="divide-y divide-border/50">
              {client.aftercare_records.map((record, index) => (
                <div key={record.id} className="px-5 py-4 space-y-3">
                  {/* Record header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        Placement #{index + 1}
                      </span>
                      <Badge className={`text-xs capitalize border ${completionColors[record.completion_status.toLowerCase()] ?? "bg-muted text-muted-foreground"}`}>
                        {record.completion_status}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      {canEdit && (
                        <Button variant="ghost" size="sm"
                          onClick={() => navigate(`/aftercare/add/${client.id}?edit=${record.id}`)}
                          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground">
                          <Edit className="h-3 w-3 mr-1" />Edit
                        </Button>
                      )}
                      {isAdmin && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm"
                              className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10">
                              <Trash2 className="h-3 w-3 mr-1" />Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="w-[95vw] max-w-lg">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Aftercare Record</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this aftercare record? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onDelete(record.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>

                  {/* Record detail grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                    <DetailRow icon={Building} label="Institution" value={record.institution_workshop} />
                    {record.placement_course && <DetailRow icon={BookOpen} label="Course/Class" value={record.placement_course} />}
                    {record.placement_type && <DetailRow icon={Briefcase} label={placementTypeLabel(record.placement_type)} value={record.placement_type_details ?? "No details"} />}
                    {record.placement_location && <DetailRow icon={MapPin} label="Location" value={record.placement_location} />}
                    {record.contact_person && <DetailRow icon={User} label="Contact" value={record.contact_person + (record.contact_phone ? ` (${record.contact_phone})` : "")} />}
                    {record.placement_fees != null && <DetailRow icon={DollarSign} label="Fees" value={`KES ${record.placement_fees.toLocaleString()}`} />}
                    {record.placement_date && <DetailRow icon={Calendar} label="Placed" value={formatDate(record.placement_date)} />}
                    {record.completion_date && <DetailRow icon={Calendar} label="Completed" value={formatDate(record.completion_date)} />}
                  </div>

                  {record.notes && (
                    <p className="text-sm text-muted-foreground bg-muted/40 rounded px-3 py-2 border border-border/50">
                      <span className="font-medium text-foreground">Notes: </span>{record.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-6 text-sm text-muted-foreground italic text-center border-t border-dashed border-border">
              No placement record yet.
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 text-muted-foreground">
      <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary/60" />
      <span><span className="font-medium text-foreground">{label}:</span> {value}</span>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────── */
const TABS = [
  { key: "awaiting", label: "Awaiting Placement", status: "Alumni - Awaiting Placement" },
  { key: "graduated", label: "Graduated",          status: "Graduated" },
  { key: "placed",    label: "Alumni - Placed",    status: "Alumni - Placed" },
] as const;

type TabKey = typeof TABS[number]["key"];

const Aftercare = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const canEdit = isAdmin || ["social_work", "counselling", "intern_social_work", "intern_counselling"].includes(user?.role ?? "");

  const [clients, setClients] = useState<ClientWithAftercare[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("awaiting");
  const [stats, setStats] = useState({ graduated: 0, records: 0, awaitingPlacement: 0, placed: 0, employed: 0, inProgress: 0 });

  const handleDeleteRecord = async (recordId: string) => {
    try {
      const { error } = await supabase.from("aftercare_records").delete().eq("id", recordId);
      if (error) throw error;
      toast({ title: "Success", description: "Aftercare record deleted" });
      fetchClients();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  useEffect(() => { fetchClients(); }, [location.search]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("clients")
        .select(`id, name, client_id, profile_picture, status, contact,
          aftercare_records (
            id, institution_workshop, placement_course, contact_person, contact_phone,
            placement_date, completion_date, placement_location, placement_fees,
            placement_type, placement_type_details, completion_status, notes
          )`)
        .or("status.eq.Alumni - Awaiting Placement,status.eq.Graduated,status.eq.Alumni - Placed")
        .order("name", { ascending: true });

      if (error) throw error;

      if (data?.length) {
        data.forEach((c: any) => setCachedClient(c));
        prefetchAvatars(data.map((c: any) => c.profile_picture));
      }

      // Auto-promote: clients with records but still "Awaiting" → "Alumni - Placed"
      const toUpdate = (data ?? []).filter(
        c => c.status === "Alumni - Awaiting Placement" && c.aftercare_records?.length > 0
      );
      if (toUpdate.length > 0) {
        await Promise.all(toUpdate.map(c => supabase.from("clients").update({ status: "Alumni - Placed" }).eq("id", c.id)));
        return fetchClients();
      }

      computeStats(data ?? []);
      setClients(data ?? []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const computeStats = (data: any[]) => {
    let employed = 0, inProgress = 0;
    data.forEach(c => c.aftercare_records?.forEach((r: AftercareRecord) => {
      if (r.completion_status === "employed") employed++;
      if (r.completion_status === "in progress") inProgress++;
    }));
    setStats({
      graduated:        data.filter(c => c.status === "Graduated").length,
      placed:           data.filter(c => c.status === "Alumni - Placed").length,
      awaitingPlacement:data.filter(c => c.status === "Alumni - Awaiting Placement").length,
      records:          data.reduce((acc, c) => acc + (c.aftercare_records?.length ?? 0), 0),
      employed, inProgress,
    });
  };

  const tabClients = clients.filter(c => c.status === TABS.find(t => t.key === activeTab)?.status);

  return (
    <div className="min-h-screen bg-background w-full">
      {/* Header */}
      <div className="sticky top-14 z-10 shadow-md bg-gradient-primary h-24 flex items-center px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="relative">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-0.5">Aftercare</h1>
          <p className="text-white/80 text-sm">Placement and follow-up tracking for graduated clients</p>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-8">

        {/* ── Metric cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <MetricCard title="Graduated"          value={stats.graduated}         icon={GraduationCap} variant="success" />
          <MetricCard title="Placed"             value={stats.placed}            icon={BarChart3}     variant="success" />
          <MetricCard title="Awaiting Placement" value={stats.awaitingPlacement} icon={Clock}         variant="primary" />
          <MetricCard title="Placement Records"  value={stats.records}           icon={FileText}      variant="primary" />
          <MetricCard title="Employed"           value={stats.employed}          icon={TrendingUp}    variant="success" />
          <MetricCard title="In Progress"        value={stats.inProgress}        icon={AlertCircle}   variant="primary" />
        </div>

        {/* ── Tabbed client list ── */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />Client Records
          </h2>

          {/* Tab bar */}
          <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
            {TABS.map(tab => {
              const count = clients.filter(c => c.status === tab.status).length;
              return (
                <button key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5
                    ${activeTab === tab.key
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"}`}>
                  {tab.label}
                  <span className={`text-xs rounded-full px-1.5 py-0.5 font-bold
                    ${activeTab === tab.key ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Client cards */}
          {loading ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Loading clients…</CardContent></Card>
          ) : tabClients.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">No clients in this category.</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {tabClients.map(client => (
                <ClientCard key={client.id} client={client} canEdit={canEdit} isAdmin={isAdmin}
                  onDelete={handleDeleteRecord} navigate={navigate} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Aftercare;
