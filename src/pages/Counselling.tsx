import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { FileText, StickyNote, LogOut, FolderOpen, Calendar, User, UserPlus, Download, Clock } from "lucide-react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { drawPDFHeader } from "@/utils/pdfHeader";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import ClientCounsellingRecords from "@/components/ClientCounsellingRecords";
import { setCachedClient, prefetchAvatars, prefetchImage } from "@/lib/clientCache";

interface Client {
  id: string;
  name: string;
  nickname: string | null;
  age: number;
  date_of_birth: string | null;
  admission_date: string;
  intake_number: string | null;
  status: string;
  profile_picture?: string | null;
  [key: string]: any;
}

interface ExitFormData {
  exit_date: string;
  nature_of_discharge: "Complete" | "Incomplete" | "";
  incomplete_reason: string[];
  discharge_remarks: string;
  reasons_for_treatment: string;
  treatment_plan_problems: string;
  family_involvement: string;
  aftercare_plan: string;
  aftercare_completion_date: string;
  receiving_adult_name: string;
  receiving_adult_id_number: string;
  receiving_adult_relationship: string;
  receiving_adult_relationship_other: string;
  receiving_agency_name: string;
  receiving_agency_contacts: string;
  receiving_adult_position: string;
  receiving_adult_address: string;
  receiving_adult_remarks: string;
  client_signature_name: string;
  client_signature_date: string;
  receiving_adult_signature_name: string;
  receiving_adult_signature_date: string;
  counsellor_signature_name: string;
  counsellor_signature_date: string;
  hors_signature_name: string;
  hors_signature_date: string;
}

interface SoapNoteFormData {
  counsellor_name: string;
  session_date: string;
  session_time: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  next_session_date: string;
  areas_to_focus: string;
}

const initialExitFormData: ExitFormData = {
  exit_date: format(new Date(), "yyyy-MM-dd"),
  nature_of_discharge: "",
  incomplete_reason: [],
  discharge_remarks: "",
  reasons_for_treatment: "",
  treatment_plan_problems: "",
  family_involvement: "",
  aftercare_plan: "",
  aftercare_completion_date: "",
  receiving_adult_name: "",
  receiving_adult_id_number: "",
  receiving_adult_relationship: "",
  receiving_adult_relationship_other: "",
  receiving_agency_name: "",
  receiving_agency_contacts: "",
  receiving_adult_position: "",
  receiving_adult_address: "",
  receiving_adult_remarks: "",
  client_signature_name: "",
  client_signature_date: "",
  receiving_adult_signature_name: "",
  receiving_adult_signature_date: "",
  counsellor_signature_name: "",
  counsellor_signature_date: "",
  hors_signature_name: "",
  hors_signature_date: "",
};

const initialSoapNoteFormData: SoapNoteFormData = {
  counsellor_name: "",
  session_date: format(new Date(), "yyyy-MM-dd"),
  session_time: "",
  subjective: "",
  objective: "",
  assessment: "",
  plan: "",
  next_session_date: "",
  areas_to_focus: "",
};

export default function Counselling() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Exit Form State
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [exitFormData, setExitFormData] = useState<ExitFormData>(initialExitFormData);
  const [submittingExit, setSubmittingExit] = useState(false);

  // SOAP Note State
  const [soapDialogOpen, setSoapDialogOpen] = useState(false);
  const [soapNoteClient, setSoapNoteClient] = useState<Client | null>(null);
  const [soapFormData, setSoapFormData] = useState<SoapNoteFormData>(initialSoapNoteFormData);
  const [submittingSoap, setSubmittingSoap] = useState(false);

  // Client Records View State
  const [selectedRecordsClient, setSelectedRecordsClient] = useState<Client | null>(null);

  // View SOAP Notes Dialog State
  const [viewSoapDialogOpen, setViewSoapDialogOpen] = useState(false);
  const [viewSoapClient, setViewSoapClient] = useState<Client | null>(null);
  const [viewSoapNotes, setViewSoapNotes] = useState<any[]>([]);
  const [loadingSoapNotes, setLoadingSoapNotes] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, nickname, age, date_of_birth, admission_date, intake_number, status, profile_picture')
        .or('status.eq.Active,status.eq.Complete')
        .order('admission_date', { ascending: false });

      if (error) throw error;
      setClients(data || []);

      if (data && data.length > 0) {
        data.forEach((c: any) => setCachedClient(c));
        prefetchAvatars(data.map((c: any) => c.profile_picture));
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

  // Exit Form Handlers
  const handleExitClick = (client: Client) => {
    setSelectedClient(client);
    setExitFormData(initialExitFormData);
    setExitDialogOpen(true);
  };

  const handleExitInputChange = (field: keyof ExitFormData, value: string) => {
    setExitFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleIncompleteReasonChange = (reason: string, checked: boolean) => {
    setExitFormData(prev => ({
      ...prev,
      incomplete_reason: checked 
        ? [...prev.incomplete_reason, reason]
        : prev.incomplete_reason.filter(r => r !== reason)
    }));
  };

  const handleExitSubmit = async () => {
    if (!selectedClient) return;
    
    if (!exitFormData.nature_of_discharge) {
      toast({
        title: "Error",
        description: "Please select nature of discharge",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmittingExit(true);
      
      const { error } = await supabase
        .from('exit_records')
        .insert({
          client_id: selectedClient.id,
          exit_date: exitFormData.exit_date,
          nature_of_discharge: exitFormData.nature_of_discharge,
          incomplete_reason: exitFormData.incomplete_reason.join(", ") || null,
          discharge_remarks: exitFormData.discharge_remarks || null,
          reasons_for_treatment: exitFormData.reasons_for_treatment || null,
          treatment_plan_problems: exitFormData.treatment_plan_problems || null,
          family_involvement: exitFormData.family_involvement || null,
          aftercare_plan: exitFormData.aftercare_plan || null,
          aftercare_completion_date: exitFormData.aftercare_completion_date || null,
          receiving_adult_name: exitFormData.receiving_adult_name || null,
          receiving_adult_id_number: exitFormData.receiving_adult_id_number || null,
          receiving_adult_relationship: exitFormData.receiving_adult_relationship || null,
          receiving_adult_relationship_other: exitFormData.receiving_adult_relationship_other || null,
          receiving_agency_name: exitFormData.receiving_agency_name || null,
          receiving_agency_contacts: exitFormData.receiving_agency_contacts || null,
          receiving_adult_position: exitFormData.receiving_adult_position || null,
          receiving_adult_address: exitFormData.receiving_adult_address || null,
          receiving_adult_remarks: exitFormData.receiving_adult_remarks || null,
          client_signature_name: exitFormData.client_signature_name || null,
          client_signature_date: exitFormData.client_signature_date || null,
          receiving_adult_signature_name: exitFormData.receiving_adult_signature_name || null,
          receiving_adult_signature_date: exitFormData.receiving_adult_signature_date || null,
          counsellor_signature_name: exitFormData.counsellor_signature_name || null,
          counsellor_signature_date: exitFormData.counsellor_signature_date || null,
          hors_signature_name: exitFormData.hors_signature_name || null,
          hors_signature_date: exitFormData.hors_signature_date || null,
        });

      if (error) throw error;

      // Update client status based on nature of discharge
      // Complete discharge -> Alumni (Awaiting Placement for aftercare tracking)
      // Incomplete discharge -> Exited
      const newStatus = exitFormData.nature_of_discharge === 'Complete' 
        ? 'Alumni - Awaiting Placement' 
        : 'Exited';
      
      await supabase
        .from('clients')
        .update({ status: newStatus })
        .eq('id', selectedClient.id);

      toast({
        title: "Success",
        description: exitFormData.nature_of_discharge === 'Complete'
          ? "Client moved to Alumni - Awaiting Placement"
          : "Exit record created successfully"
      });

      setExitDialogOpen(false);
      if (exitFormData.nature_of_discharge === 'Complete') {
        navigate(`/aftercare/add/${selectedClient.id}`);
      } else {
        fetchClients();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSubmittingExit(false);
    }
  };

  // SOAP Note Handlers
  const handleSoapNoteClick = (client: Client) => {
    setSoapNoteClient(client);
    setSoapFormData(initialSoapNoteFormData);
    setSoapDialogOpen(true);
  };

  const handleSoapInputChange = (field: keyof SoapNoteFormData, value: string) => {
    setSoapFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSoapSubmit = async () => {
    if (!soapNoteClient) return;
    
    if (!soapFormData.counsellor_name) {
      toast({
        title: "Error",
        description: "Please enter counsellor name",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmittingSoap(true);
      
      const { error } = await supabase
        .from('soap_notes')
        .insert({
          client_id: soapNoteClient.id,
          counsellor_name: soapFormData.counsellor_name,
          session_date: soapFormData.session_date,
          session_time: soapFormData.session_time || null,
          subjective: soapFormData.subjective || null,
          objective: soapFormData.objective || null,
          assessment: soapFormData.assessment || null,
          plan: soapFormData.plan || null,
          next_session_date: soapFormData.next_session_date || null,
          areas_to_focus: soapFormData.areas_to_focus || null,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "SOAP Note saved successfully"
      });

      setSoapDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSubmittingSoap(false);
    }
  };

  // View SOAP Notes Handler
  const handleViewSoapNotes = async (client: Client) => {
    try {
      setLoadingSoapNotes(true);
      const { data, error } = await supabase
        .from('soap_notes')
        .select('*')
        .eq('client_id', client.id)
        .order('session_date', { ascending: false });

      if (error) throw error;
      setViewSoapNotes(data || []);
      setViewSoapClient(client);
      setViewSoapDialogOpen(true);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoadingSoapNotes(false);
    }
  };

  // Export single SOAP note to PDF
  const handleExportSoapNotePDF = async (note: any, client: Client | null) => {
    const doc = new jsPDF();
    const headerBottomY = await drawPDFHeader({
      doc,
      title: "SOAP Note",
      clientName: client?.name,
      clientId: client?.intake_number || undefined,
      clientStatus: client?.status,
      profilePictureUrl: client?.profile_picture,
      dateText: `Session Date: ${note.session_date}`,
    });
    let finalY = headerBottomY + 6;
    autoTable(doc, {
      startY: finalY,
      head: [[{ content: 'Session Information', colSpan: 2, styles: { halign: 'left', fillColor: [63, 81, 181], textColor: 255 } }]],
      body: [
        [{ content: 'Client Name', styles: { fontStyle: 'bold', fillColor: [240, 244, 248] } }, clientName],
        [{ content: 'Counsellor', styles: { fontStyle: 'bold', fillColor: [240, 244, 248] } }, note.counsellor_name],
        [{ content: 'Session Date', styles: { fontStyle: 'bold', fillColor: [240, 244, 248] } }, note.session_date],
        ...(note.session_time ? [[{ content: 'Session Time', styles: { fontStyle: 'bold', fillColor: [240, 244, 248] } }, note.session_time]] : []),
        ...(note.next_session_date ? [[{ content: 'Next Session', styles: { fontStyle: 'bold', fillColor: [240, 244, 248] } }, note.next_session_date]] : []),
        ...(note.areas_to_focus ? [[{ content: 'Areas to Focus', styles: { fontStyle: 'bold', fillColor: [240, 244, 248] } }, note.areas_to_focus]] : []),
      ],
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

  // If viewing a client's records, show the records component
  if (selectedRecordsClient) {
    return (
      <div className="w-full max-w-full overflow-x-hidden">
        <div className="container mx-auto py-4 sm:py-6 lg:py-8 px-4 sm:px-6 space-y-6 max-w-full">
          <div className="text-center space-y-2 pb-6 border-b-4 border-orange-500">
            <h1 className="text-2xl sm:text-3xl font-bold">Counselling Department</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Treatment Plans & Client Records</p>
          </div>
          <ClientCounsellingRecords 
            client={selectedRecordsClient} 
            onBack={() => setSelectedRecordsClient(null)} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="container mx-auto py-4 sm:py-6 lg:py-8 px-4 sm:px-6 space-y-6 max-w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b-4 border-orange-500">
          <div className="text-center sm:text-left space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold">Counselling Department</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Treatment Plans & Client Records</p>
          </div>
          <Button
            className="bg-orange-500 hover:bg-orange-600 text-white self-center sm:self-auto"
            onClick={() => navigate('/register')}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Register Client
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Active Clients</CardTitle>
            <CardDescription>Clients currently in counselling programs - Click on a client name to view records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">CLIENT NAME</TableHead>
                  <TableHead className="font-bold">AGE</TableHead>
                  <TableHead className="font-bold">ADMISSION DATE</TableHead>
                  <TableHead className="font-bold">STATUS</TableHead>
                  <TableHead className="font-bold">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Loading clients...
                    </TableCell>
                  </TableRow>
                ) : clients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No active clients found
                    </TableCell>
                  </TableRow>
                ) : (
                  clients.map((client) => (
                    <TableRow key={client.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell 
                        className="font-medium text-orange-500 hover:underline cursor-pointer"
                        onClick={() => setSelectedRecordsClient(client)}
                      >
                        {client.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{client.age} years</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{client.admission_date}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-500 hover:bg-green-600 text-white">
                          {client.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white whitespace-nowrap">
                            <FileText className="h-4 w-4 mr-1" />
                            Plan
                          </Button>
                          <Button 
                            size="sm" 
                            className="bg-orange-500 hover:bg-orange-600 text-white whitespace-nowrap"
                            onClick={(e) => { e.stopPropagation(); handleSoapNoteClick(client); }}
                          >
                            <StickyNote className="h-4 w-4 mr-1" />
                            Note
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="whitespace-nowrap"
                            onClick={(e) => { e.stopPropagation(); handleViewSoapNotes(client); }}
                          >
                            <StickyNote className="h-4 w-4 mr-1" />
                            View Notes
                          </Button>
                        <Button 
                          size="sm" 
                          className="bg-red-500 hover:bg-red-600 text-white whitespace-nowrap"
                          onClick={(e) => { e.stopPropagation(); handleExitClick(client); }}
                        >
                          <LogOut className="h-4 w-4 mr-1" />
                          Exit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="whitespace-nowrap"
                          onMouseEnter={() => prefetchImage(client.profile_picture)}
                          onClick={(e) => { e.stopPropagation(); navigate(`/clients/${client.id}`, { state: { client } }); }}
                        >
                          <FolderOpen className="h-4 w-4 mr-1" />
                          Profile
                        </Button>
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

      {/* SOAP Notes Dialog */}
      <Dialog open={soapDialogOpen} onOpenChange={setSoapDialogOpen}>
        <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center border-b pb-4">
              SOAP NOTES
            </DialogTitle>
            <DialogDescription className="text-center">
              Session documentation for {soapNoteClient?.name}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[70vh] pr-4">
            <div className="space-y-6 p-2">
              {/* Client and Counsellor Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>CLIENT'S NAME</Label>
                  <Input value={soapNoteClient?.name || ""} disabled className="bg-muted font-medium" />
                </div>
                <div>
                  <Label>NAME OF COUNSELLOR <span className="text-red-500">*</span></Label>
                  <Input 
                    value={soapFormData.counsellor_name}
                    onChange={(e) => handleSoapInputChange("counsellor_name", e.target.value)}
                    placeholder="Enter counsellor name..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>DATE</Label>
                  <Input 
                    type="date" 
                    value={soapFormData.session_date}
                    onChange={(e) => handleSoapInputChange("session_date", e.target.value)}
                  />
                </div>
                <div>
                  <Label>TIME</Label>
                  <Input 
                    type="time" 
                    value={soapFormData.session_time}
                    onChange={(e) => handleSoapInputChange("session_time", e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              {/* SUBJECTIVE */}
              <div>
                <Label className="text-base font-semibold text-orange-600">SUBJECTIVE</Label>
                <p className="text-xs text-muted-foreground mb-2">What the client reports - their feelings, concerns, symptoms, and perspective</p>
                <Textarea 
                  value={soapFormData.subjective}
                  onChange={(e) => handleSoapInputChange("subjective", e.target.value)}
                  rows={6}
                  placeholder="Document the client's subjective experience, statements, and reported symptoms..."
                  className="resize-none"
                />
              </div>

              {/* OBJECTIVE */}
              <div>
                <Label className="text-base font-semibold text-orange-600">OBJECTIVE</Label>
                <p className="text-xs text-muted-foreground mb-2">Observable and measurable findings - behavior, appearance, test results</p>
                <Textarea 
                  value={soapFormData.objective}
                  onChange={(e) => handleSoapInputChange("objective", e.target.value)}
                  rows={6}
                  placeholder="Document observable behaviors, appearance, affect, and any measurable data..."
                  className="resize-none"
                />
              </div>

              {/* ASSESSMENT */}
              <div>
                <Label className="text-base font-semibold text-orange-600">ASSESSMENT</Label>
                <p className="text-xs text-muted-foreground mb-2">Clinical conclusions, diagnosis, and interpretation of findings</p>
                <Textarea 
                  value={soapFormData.assessment}
                  onChange={(e) => handleSoapInputChange("assessment", e.target.value)}
                  rows={5}
                  placeholder="Document your clinical assessment, diagnosis, and interpretation..."
                  className="resize-none"
                />
              </div>

              {/* PLAN */}
              <div>
                <Label className="text-base font-semibold text-orange-600">PLAN</Label>
                <p className="text-xs text-muted-foreground mb-2">Treatment plan, interventions, and next steps</p>
                <Textarea 
                  value={soapFormData.plan}
                  onChange={(e) => handleSoapInputChange("plan", e.target.value)}
                  rows={4}
                  placeholder="Document the treatment plan and interventions..."
                  className="resize-none"
                />
              </div>

              <Separator />

              {/* Next Session Date */}
              <div>
                <Label className="text-base font-semibold">DATE OF NEXT SESSION</Label>
                <Input 
                  type="date" 
                  value={soapFormData.next_session_date}
                  onChange={(e) => handleSoapInputChange("next_session_date", e.target.value)}
                  className="max-w-xs"
                />
              </div>

              {/* Areas to Focus */}
              <div>
                <Label className="text-base font-semibold">AREAS TO FOCUS ATTENTION ON</Label>
                <Textarea 
                  value={soapFormData.areas_to_focus}
                  onChange={(e) => handleSoapInputChange("areas_to_focus", e.target.value)}
                  rows={4}
                  placeholder="Document areas that need special attention in future sessions..."
                  className="resize-none"
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-4 pt-4">
                <Button variant="outline" onClick={() => setSoapDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSoapSubmit} 
                  disabled={submittingSoap}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {submittingSoap ? "Saving..." : "Save SOAP Note"}
                </Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* View SOAP Notes Dialog */}
      <Dialog open={viewSoapDialogOpen} onOpenChange={setViewSoapDialogOpen}>
        <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center border-b pb-4">
              SOAP NOTES — {viewSoapClient?.name}
            </DialogTitle>
            <DialogDescription className="text-center">
              All recorded SOAP notes for this client
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[70vh] pr-4">
            {loadingSoapNotes ? (
              <p className="text-center text-muted-foreground py-8">Loading notes...</p>
            ) : viewSoapNotes.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No SOAP notes recorded yet</p>
            ) : (
              <div className="space-y-4 p-2">
                {viewSoapNotes.map((note) => (
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
                          <Button size="sm" variant="outline" onClick={() => handleExportSoapNotePDF(note, viewSoapClient)}>
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

      {/* Exit Form Dialog */}
      <Dialog open={exitDialogOpen} onOpenChange={setExitDialogOpen}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center border-b pb-4">
              CLIENT DISCHARGE / EXIT FORM
            </DialogTitle>
            <DialogDescription className="text-center">
              Complete this form to process client discharge
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[70vh] pr-4">
            <div className="space-y-6 p-2">
              {/* Date */}
              <div className="flex justify-end">
                <div className="w-48">
                  <Label>Date</Label>
                  <Input 
                    type="date" 
                    value={exitFormData.exit_date}
                    onChange={(e) => handleExitInputChange("exit_date", e.target.value)}
                  />
                </div>
              </div>

              {/* Client Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Name of Child / Young Person</Label>
                  <Input value={selectedClient?.name || ""} disabled className="bg-muted" />
                </div>
                <div>
                  <Label>Also Known As (AKA)</Label>
                  <Input value={selectedClient?.nickname || ""} disabled className="bg-muted" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Date of Birth</Label>
                  <Input value={selectedClient?.date_of_birth || ""} disabled className="bg-muted" />
                </div>
                <div>
                  <Label>Client's NLMRC Admission Number</Label>
                  <Input value={selectedClient?.intake_number || ""} disabled className="bg-muted" />
                </div>
                <div>
                  <Label>Date of Admission</Label>
                  <Input value={selectedClient?.admission_date || ""} disabled className="bg-muted" />
                </div>
              </div>

              <Separator />

              {/* Nature of Discharge */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-semibold">Nature of Discharge</Label>
                  <RadioGroup 
                    value={exitFormData.nature_of_discharge}
                    onValueChange={(value) => handleExitInputChange("nature_of_discharge", value)}
                    className="flex gap-6 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Complete" id="complete" />
                      <Label htmlFor="complete">Complete</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Incomplete" id="incomplete" />
                      <Label htmlFor="incomplete">Incomplete</Label>
                    </div>
                  </RadioGroup>
                </div>

                {exitFormData.nature_of_discharge === "Incomplete" && (
                  <div className="pl-4 border-l-2 border-orange-500">
                    <Label className="text-sm font-medium">If Incomplete, specify (Tick all that apply)</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      {["Escapee", "Voluntary discharge", "Early Reintegration", "Involuntary discharge"].map((reason) => (
                        <div key={reason} className="flex items-center space-x-2">
                          <Checkbox 
                            id={reason}
                            checked={exitFormData.incomplete_reason.includes(reason)}
                            onCheckedChange={(checked) => handleIncompleteReasonChange(reason, checked as boolean)}
                          />
                          <Label htmlFor={reason} className="text-sm">{reason}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label>Reasons / Remarks for the Discharge if other than Complete Discharge (by NLMRC Staff)</Label>
                <Textarea 
                  value={exitFormData.discharge_remarks}
                  onChange={(e) => handleExitInputChange("discharge_remarks", e.target.value)}
                  rows={3}
                  placeholder="Enter remarks..."
                />
              </div>

              <Separator />

              {/* Treatment Information */}
              <div>
                <Label>Reasons for entering treatment</Label>
                <Textarea 
                  value={exitFormData.reasons_for_treatment}
                  onChange={(e) => handleExitInputChange("reasons_for_treatment", e.target.value)}
                  rows={3}
                  placeholder="Enter reasons..."
                />
              </div>

              <div>
                <Label>Problems as identified on the treatment plan problem list</Label>
                <Textarea 
                  value={exitFormData.treatment_plan_problems}
                  onChange={(e) => handleExitInputChange("treatment_plan_problems", e.target.value)}
                  rows={3}
                  placeholder="Enter problems..."
                />
              </div>

              <div>
                <Label>Family's involvement in the treatment process</Label>
                <Textarea 
                  value={exitFormData.family_involvement}
                  onChange={(e) => handleExitInputChange("family_involvement", e.target.value)}
                  rows={3}
                  placeholder="Enter details..."
                />
              </div>

              <div>
                <Label>Client aftercare plan & expected date/year of completion from Aftercare program</Label>
                <Textarea 
                  value={exitFormData.aftercare_plan}
                  onChange={(e) => handleExitInputChange("aftercare_plan", e.target.value)}
                  rows={3}
                  placeholder="Enter aftercare plan..."
                />
              </div>

              <Separator />

              {/* Receiving Adult Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Receiving Adult Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Name of Adult receiving the Client</Label>
                    <Input 
                      value={exitFormData.receiving_adult_name}
                      onChange={(e) => handleExitInputChange("receiving_adult_name", e.target.value)}
                      placeholder="Enter name..."
                    />
                  </div>
                  <div>
                    <Label>ID Number of Adult receiving the Client</Label>
                    <Input 
                      value={exitFormData.receiving_adult_id_number}
                      onChange={(e) => handleExitInputChange("receiving_adult_id_number", e.target.value)}
                      placeholder="Enter ID number..."
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Relationship of the receiving adult with the client</Label>
                  <RadioGroup 
                    value={exitFormData.receiving_adult_relationship}
                    onValueChange={(value) => handleExitInputChange("receiving_adult_relationship", value)}
                    className="flex flex-wrap gap-4 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Parent" id="parent" />
                      <Label htmlFor="parent">Parent</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Guardian" id="guardian" />
                      <Label htmlFor="guardian">Guardian</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Other" id="other" />
                      <Label htmlFor="other">Other</Label>
                    </div>
                  </RadioGroup>
                  {exitFormData.receiving_adult_relationship === "Other" && (
                    <Input 
                      className="mt-2"
                      value={exitFormData.receiving_adult_relationship_other}
                      onChange={(e) => handleExitInputChange("receiving_adult_relationship_other", e.target.value)}
                      placeholder="Specify relationship..."
                    />
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Name of Agency / Organization represented by the receiving Adult</Label>
                    <Input 
                      value={exitFormData.receiving_agency_name}
                      onChange={(e) => handleExitInputChange("receiving_agency_name", e.target.value)}
                      placeholder="Enter agency name..."
                    />
                  </div>
                  <div>
                    <Label>Agency Contacts</Label>
                    <Input 
                      value={exitFormData.receiving_agency_contacts}
                      onChange={(e) => handleExitInputChange("receiving_agency_contacts", e.target.value)}
                      placeholder="Enter contacts..."
                    />
                  </div>
                </div>

                <div>
                  <Label>Position of the Receiving Adult</Label>
                  <Input 
                    value={exitFormData.receiving_adult_position}
                    onChange={(e) => handleExitInputChange("receiving_adult_position", e.target.value)}
                    placeholder="Enter position..."
                  />
                </div>

                <div>
                  <Label>Physical address of the Receiving adult / Agency</Label>
                  <Textarea 
                    value={exitFormData.receiving_adult_address}
                    onChange={(e) => handleExitInputChange("receiving_adult_address", e.target.value)}
                    rows={2}
                    placeholder="Enter address..."
                  />
                </div>

                <div>
                  <Label>Brief remarks by the receiving Adult (Where applicable)</Label>
                  <Textarea 
                    value={exitFormData.receiving_adult_remarks}
                    onChange={(e) => handleExitInputChange("receiving_adult_remarks", e.target.value)}
                    rows={3}
                    placeholder="Enter remarks..."
                  />
                </div>
              </div>

              <Separator />

              {/* Signatures */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Signatures</h3>
                
                {/* Client Signature */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                  <div>
                    <Label>Client Name</Label>
                    <Input 
                      value={exitFormData.client_signature_name}
                      onChange={(e) => handleExitInputChange("client_signature_name", e.target.value)}
                      placeholder="Enter client name..."
                    />
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input 
                      type="date" 
                      value={exitFormData.client_signature_date}
                      onChange={(e) => handleExitInputChange("client_signature_date", e.target.value)}
                    />
                  </div>
                </div>

                {/* Receiving Adult Signature */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                  <div>
                    <Label>Receiving Adult Name</Label>
                    <Input 
                      value={exitFormData.receiving_adult_signature_name}
                      onChange={(e) => handleExitInputChange("receiving_adult_signature_name", e.target.value)}
                      placeholder="Enter name..."
                    />
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input 
                      type="date" 
                      value={exitFormData.receiving_adult_signature_date}
                      onChange={(e) => handleExitInputChange("receiving_adult_signature_date", e.target.value)}
                    />
                  </div>
                </div>

                {/* NLMRC Counsellor Signature */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                  <div>
                    <Label>NLMRC Counsellor Name</Label>
                    <Input 
                      value={exitFormData.counsellor_signature_name}
                      onChange={(e) => handleExitInputChange("counsellor_signature_name", e.target.value)}
                      placeholder="Enter counsellor name..."
                    />
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input 
                      type="date" 
                      value={exitFormData.counsellor_signature_date}
                      onChange={(e) => handleExitInputChange("counsellor_signature_date", e.target.value)}
                    />
                  </div>
                </div>

                {/* HORS Signature */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                  <div>
                    <Label>HORS Name</Label>
                    <Input 
                      value={exitFormData.hors_signature_name}
                      onChange={(e) => handleExitInputChange("hors_signature_name", e.target.value)}
                      placeholder="Enter HORS name..."
                    />
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input 
                      type="date" 
                      value={exitFormData.hors_signature_date}
                      onChange={(e) => handleExitInputChange("hors_signature_date", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-4 pt-4">
                <Button variant="outline" onClick={() => setExitDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleExitSubmit} 
                  disabled={submittingExit}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  {submittingExit ? "Submitting..." : "Submit Exit Form"}
                </Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
