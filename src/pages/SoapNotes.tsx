import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar, User, Download, Search, Clock, StickyNote, ArrowLeft } from "lucide-react";
import { exportSoapNotePDF, exportAllSoapNotesPDF } from "@/utils/exportSoapNotePDF";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Client {
  id: string;
  name: string;
  nickname: string | null;
  age: number;
  admission_date: string;
  status: string;
  profile_picture?: string | null;
}

interface SoapNote {
  id: string;
  client_id: string;
  counsellor_name: string;
  session_date: string;
  session_time: string | null;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  next_session_date: string | null;
  areas_to_focus: string | null;
  created_at: string | null;
}

interface ClientWithNotes extends Client {
  soap_notes: SoapNote[];
  note_count: number;
}

export default function SoapNotes() {
  const { toast } = useToast();
  const [clients, setClients] = useState<ClientWithNotes[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientWithNotes | null>(null);

  useEffect(() => {
    fetchClientsWithNotes();
  }, []);

  const fetchClientsWithNotes = async () => {
    try {
      setLoading(true);
      // Get all clients who have SOAP notes
      const { data: notes, error: notesError } = await supabase
        .from('soap_notes')
        .select('client_id')
        .order('session_date', { ascending: false });

      if (notesError) throw notesError;

      // Get unique client IDs
      const clientIds = [...new Set(notes?.map(n => n.client_id) || [])];

      if (clientIds.length === 0) {
        setClients([]);
        return;
      }

      // Fetch client details and SOAP notes in parallel
      const [clientsRes, allNotesRes] = await Promise.all([
        supabase
          .from('clients')
          .select('id, name, nickname, age, admission_date, status, profile_picture')
          .in('id', clientIds),
        supabase
          .from('soap_notes')
          .select('*')
          .in('client_id', clientIds)
          .order('session_date', { ascending: false })
      ]);

      if (clientsRes.error) throw clientsRes.error;
      if (allNotesRes.error) throw allNotesRes.error;

      const clientsData = clientsRes.data;
      const allNotes = allNotesRes.data;

      // Combine client data with their notes
      const clientsWithNotes: ClientWithNotes[] = (clientsData || []).map(client => ({
        ...client,
        soap_notes: (allNotes || []).filter(n => n.client_id === client.id),
        note_count: (allNotes || []).filter(n => n.client_id === client.id).length,
      }));

      // Sort by most recent note
      clientsWithNotes.sort((a, b) => {
        const aDate = a.soap_notes[0]?.session_date || '';
        const bDate = b.soap_notes[0]?.session_date || '';
        return bDate.localeCompare(aDate);
      });

      setClients(clientsWithNotes);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleExportSoapNotePDF = async (note: SoapNote, client: ClientWithNotes | null) => {
    await exportSoapNotePDF({ note, client, toast });
  };

  const handleExportAllSoapNotesPDF = async (client: ClientWithNotes | null) => {
    if (!client) return;
    await exportAllSoapNotesPDF({ notes: client.soap_notes, client, toast });
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.nickname && client.nickname.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalNotes = clients.reduce((sum, c) => sum + c.note_count, 0);

  // If a client is selected, show their SOAP notes as a full page
  if (viewDialogOpen && selectedClient) {
    return (
      <div className="w-full max-w-full overflow-x-hidden">
        <div className="container mx-auto py-4 sm:py-6 lg:py-8 px-4 sm:px-6 space-y-6 max-w-3xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-4 border-orange-500">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => setViewDialogOpen(false)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold">SOAP Notes — {selectedClient.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {selectedClient.note_count} session{selectedClient.note_count !== 1 ? 's' : ''} recorded
                </p>
              </div>
            </div>
            {selectedClient.soap_notes.length > 0 && (
              <Button
                size="sm"
                onClick={() => handleExportAllSoapNotesPDF(selectedClient)}
                className="bg-orange-600 hover:bg-orange-700 text-white shrink-0"
              >
                <Download className="h-4 w-4 mr-1.5" />
                Export All Notes (PDF)
              </Button>
            )}
          </div>

          {selectedClient.soap_notes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No SOAP notes found</p>
          ) : (
            <div className="space-y-4">
              {selectedClient.soap_notes.map((note) => (
                <Card key={note.id} className="border-l-4 border-l-orange-500">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-orange-500" />
                        <span className="font-semibold">{note.session_date}</span>
                        {note.session_time && (
                          <>
                            <Clock className="h-4 w-4 ml-2" />
                            <span>{note.session_time}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{note.counsellor_name}</Badge>
                        <Button size="sm" variant="outline" onClick={() => handleExportSoapNotePDF(note, selectedClient)}>
                          <Download className="h-4 w-4 mr-1" />
                          Export PDF
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {note.subjective && (
                      <div>
                        <h4 className="font-semibold text-orange-600 text-sm">SUBJECTIVE</h4>
                        <p className="text-sm mt-1 whitespace-pre-wrap">{note.subjective}</p>
                      </div>
                    )}
                    {note.objective && (
                      <div>
                        <h4 className="font-semibold text-orange-600 text-sm">OBJECTIVE</h4>
                        <p className="text-sm mt-1 whitespace-pre-wrap">{note.objective}</p>
                      </div>
                    )}
                    {note.assessment && (
                      <div>
                        <h4 className="font-semibold text-orange-600 text-sm">ASSESSMENT</h4>
                        <p className="text-sm mt-1 whitespace-pre-wrap">{note.assessment}</p>
                      </div>
                    )}
                    {note.plan && (
                      <div>
                        <h4 className="font-semibold text-orange-600 text-sm">PLAN</h4>
                        <p className="text-sm mt-1 whitespace-pre-wrap">{note.plan}</p>
                      </div>
                    )}
                    {note.next_session_date && (
                      <div>
                        <h4 className="font-semibold text-sm">Next Session</h4>
                        <p className="text-sm mt-1">{note.next_session_date}</p>
                      </div>
                    )}
                    {note.areas_to_focus && (
                      <div>
                        <h4 className="font-semibold text-sm">Areas to Focus</h4>
                        <p className="text-sm mt-1 whitespace-pre-wrap">{note.areas_to_focus}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="container mx-auto py-4 sm:py-6 lg:py-8 px-4 sm:px-6 space-y-6 max-w-full">
        <div className="pb-6 border-b-4 border-orange-500">
          <h1 className="text-2xl sm:text-3xl font-bold">SOAP Notes</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            View and export all counselling SOAP notes
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{clients.length}</div>
              <p className="text-sm text-muted-foreground">Clients with Notes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{totalNotes}</div>
              <p className="text-sm text-muted-foreground">Total SOAP Notes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {clients.length > 0 ? Math.round(totalNotes / clients.length) : 0}
              </div>
              <p className="text-sm text-muted-foreground">Avg Notes per Client</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by client name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Client List */}
        <Card>
          <CardHeader>
            <CardTitle>Clients</CardTitle>
            <CardDescription>Select a client to view their SOAP notes</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Loading...</p>
            ) : filteredClients.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No clients with SOAP notes found</p>
            ) : (
              <div className="space-y-3">
                {filteredClients.map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => { setSelectedClient(client); setViewDialogOpen(true); }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-orange-100">
                        <User className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium">{client.name}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {client.age} yrs
                          </span>
                          <span>Admitted: {client.admission_date}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <StickyNote className="h-3 w-3" />
                        {client.note_count} notes
                      </Badge>
                      <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setSelectedClient(client); setViewDialogOpen(true); }}>
                        View Notes
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
}
