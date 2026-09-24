import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, User, Download, Search, Clock, StickyNote } from "lucide-react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Client {
  id: string;
  name: string;
  nickname: string | null;
  age: number;
  admission_date: string;
  status: string;
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

      // Fetch client details for those IDs
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, name, nickname, age, admission_date, status')
        .in('id', clientIds);

      if (clientsError) throw clientsError;

      // Fetch all SOAP notes for these clients
      const { data: allNotes, error: allNotesError } = await supabase
        .from('soap_notes')
        .select('*')
        .in('client_id', clientIds)
        .order('session_date', { ascending: false });

      if (allNotesError) throw allNotesError;

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

  const handleExportSoapNotePDF = async (note: SoapNote, clientName: string) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let startY = 20;
    try {
      const logoUrl = '/mwangaza_logo.png';
      const img = new Image();
      img.src = logoUrl;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject();
      });
      if (img.width) {
        const imgWidth = 30;
        const imgHeight = (img.height * imgWidth) / img.width;
        const imgX = (pageWidth - imgWidth) / 2;
        doc.addImage(img, 'PNG', imgX, 10, imgWidth, imgHeight);
        startY = 10 + imgHeight + 8;
      }
    } catch {
      console.error("Error adding logo to PDF");
    }
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text("SOAP Note", pageWidth / 2, startY, { align: "center" });
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, startY + 6, { align: "center" });
    let finalY = startY + 14;
    const sessionInfoBody: any[] = [
      [{ content: 'Client Name', styles: { fontStyle: 'bold', fillColor: [240, 244, 248] } }, clientName],
      [{ content: 'Counsellor', styles: { fontStyle: 'bold', fillColor: [240, 244, 248] } }, note.counsellor_name],
      [{ content: 'Session Date', styles: { fontStyle: 'bold', fillColor: [240, 244, 248] } }, note.session_date],
      ...(note.session_time ? [[{ content: 'Session Time', styles: { fontStyle: 'bold', fillColor: [240, 244, 248] } }, note.session_time]] : []),
      ...(note.next_session_date ? [[{ content: 'Next Session', styles: { fontStyle: 'bold', fillColor: [240, 244, 248] } }, note.next_session_date]] : []),
      ...(note.areas_to_focus ? [[{ content: 'Areas to Focus', styles: { fontStyle: 'bold', fillColor: [240, 244, 248] } }, note.areas_to_focus]] : []),
    ];

    autoTable(doc, {
      startY: finalY,
      head: [[{ content: 'Session Information', colSpan: 2, styles: { halign: 'left', fillColor: [63, 81, 181], textColor: 255 } }]],
      body: sessionInfoBody,
      theme: 'grid',
      columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 'auto' } },
    });
    finalY = (doc as any).lastAutoTable.finalY + 8;
    const addSection = (label: string, content: string | null, color: [number, number, number]) => {
      if (!content) return;
      doc.setFontSize(12);
      doc.setTextColor(color[0], color[1], color[2]);
      doc.setFont("helvetica", "bold");
      doc.text(label, 14, finalY + 6);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(40, 40, 40);
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(content, pageWidth - 28);
      doc.text(lines, 14, finalY + 14);
      finalY = finalY + 14 + (lines.length * 5) + 8;
    };
    addSection('S - SUBJECTIVE', note.subjective, [217, 87, 37]);
    addSection('O - OBJECTIVE', note.objective, [46, 125, 50]);
    addSection('A - ASSESSMENT', note.assessment, [63, 81, 181]);
    addSection('P - PLAN', note.plan, [156, 39, 176]);
    doc.save(`SOAP_Note_${note.session_date.replace(/\//g, '-')}_${clientName.replace(/\s+/g, '_')}.pdf`);
    toast({ title: "PDF Exported", description: "SOAP note has been exported to PDF successfully." });
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.nickname && client.nickname.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalNotes = clients.reduce((sum, c) => sum + c.note_count, 0);

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

      {/* SOAP Notes View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center border-b pb-4">
              SOAP Notes — {selectedClient?.name}
            </DialogTitle>
            <DialogDescription className="text-center">
              {selectedClient?.note_count} note{selectedClient?.note_count !== 1 ? 's' : ''} recorded
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[70vh] pr-4">
            {selectedClient && selectedClient.soap_notes.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No SOAP notes found</p>
            ) : (
              <div className="space-y-4 p-2">
                {selectedClient?.soap_notes.map((note) => (
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
                          <Button size="sm" variant="outline" onClick={() => handleExportSoapNotePDF(note, selectedClient?.name || "")}>
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
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
