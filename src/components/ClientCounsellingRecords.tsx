import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, StickyNote, FileText, LogOut, Calendar, User, Clock, Download } from "lucide-react";
import { exportSoapNotePDF, exportAllSoapNotesPDF } from "@/utils/exportSoapNotePDF";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

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
}

interface SoapNote {
  id: string;
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

interface ExitRecord {
  id: string;
  exit_date: string;
  nature_of_discharge: string;
  incomplete_reason: string | null;
  discharge_remarks: string | null;
  reasons_for_treatment: string | null;
  treatment_plan_problems: string | null;
  family_involvement: string | null;
  aftercare_plan: string | null;
  aftercare_completion_date: string | null;
  receiving_adult_name: string | null;
  receiving_adult_relationship: string | null;
  receiving_agency_name: string | null;
  created_at: string | null;
}

interface ClientCounsellingRecordsProps {
  client: Client;
  onBack: () => void;
}

export default function ClientCounsellingRecords({ client, onBack }: ClientCounsellingRecordsProps) {
  const { toast } = useToast();
  const [soapNotes, setSoapNotes] = useState<SoapNote[]>([]);
  const [exitRecords, setExitRecords] = useState<ExitRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecords();
  }, [client.id]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      
      const [soapResult, exitResult] = await Promise.all([
        supabase
          .from('soap_notes')
          .select('*')
          .eq('client_id', client.id)
          .order('session_date', { ascending: false }),
        supabase
          .from('exit_records')
          .select('*')
          .eq('client_id', client.id)
          .order('exit_date', { ascending: false })
      ]);

      if (soapResult.error) throw soapResult.error;
      if (exitResult.error) throw exitResult.error;

      setSoapNotes(soapResult.data || []);
      setExitRecords(exitResult.data || []);
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

  const handleExportSoapNotePDF = async (note: SoapNote) => {
    await exportSoapNotePDF({ note, client, toast });
  };

  const handleExportAllSoapNotesPDF = async () => {
    await exportAllSoapNotesPDF({ notes: soapNotes, client, toast });
  };

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Clients
        </Button>
      </div>

      {/* Client Info Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-orange-500">{client.name}</CardTitle>
              {client.nickname && (
                <CardDescription>Also known as: {client.nickname}</CardDescription>
              )}
            </div>
            <Badge className={client.status === 'Active' ? 'bg-green-500' : 'bg-gray-500'}>
              {client.status}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>{client.age} years old</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Admitted: {client.admission_date}</span>
            </div>
            {client.intake_number && (
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>Intake #: {client.intake_number}</span>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Records Tabs */}
      <Tabs defaultValue="soap" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="soap" className="flex items-center gap-2">
            <StickyNote className="h-4 w-4" />
            SOAP Notes ({soapNotes.length})
          </TabsTrigger>
          <TabsTrigger value="plans" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Treatment Plans
          </TabsTrigger>
          <TabsTrigger value="exit" className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Exit Records ({exitRecords.length})
          </TabsTrigger>
        </TabsList>

        {/* SOAP Notes Tab */}
        <TabsContent value="soap" className="mt-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
              <div>
                <CardTitle>SOAP Notes History</CardTitle>
                <CardDescription>All counselling session notes for this client ({soapNotes.length})</CardDescription>
              </div>
              {soapNotes.length > 0 && (
                <Button
                  size="sm"
                  onClick={handleExportAllSoapNotesPDF}
                  className="bg-orange-600 hover:bg-orange-700 text-white shrink-0 self-start sm:self-auto"
                >
                  <Download className="h-4 w-4 mr-1.5" />
                  Export All Notes (PDF)
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center text-muted-foreground py-8">Loading records...</p>
              ) : soapNotes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No SOAP notes recorded yet</p>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {soapNotes.map((note) => (
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
                            <Badge variant="outline">{note.counsellor_name}</Badge>
                            <Button size="sm" variant="outline" onClick={() => handleExportSoapNotePDF(note)}>
                              <Download className="h-4 w-4 mr-1" />
                              Export PDF
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
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
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Treatment Plans Tab */}
        <TabsContent value="plans" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Treatment Plans</CardTitle>
              <CardDescription>Treatment plans and goals for this client</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                Treatment plans feature coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exit Records Tab */}
        <TabsContent value="exit" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Exit Records</CardTitle>
              <CardDescription>Discharge and exit records for this client</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center text-muted-foreground py-8">Loading records...</p>
              ) : exitRecords.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No exit records found</p>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {exitRecords.map((record) => (
                      <Card key={record.id} className="border-l-4 border-l-red-500">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-red-500" />
                              <span className="font-semibold">Exit Date: {record.exit_date}</span>
                            </div>
                            <Badge className={record.nature_of_discharge === 'Complete' ? 'bg-green-500' : 'bg-amber-500'}>
                              {record.nature_of_discharge}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {record.incomplete_reason && (
                            <div>
                              <h4 className="font-semibold text-sm">Reason for Incomplete Discharge</h4>
                              <p className="text-sm mt-1">{record.incomplete_reason}</p>
                            </div>
                          )}
                          {record.discharge_remarks && (
                            <div>
                              <h4 className="font-semibold text-sm">Discharge Remarks</h4>
                              <p className="text-sm mt-1 whitespace-pre-wrap">{record.discharge_remarks}</p>
                            </div>
                          )}
                          {record.reasons_for_treatment && (
                            <div>
                              <h4 className="font-semibold text-sm">Reasons for Treatment</h4>
                              <p className="text-sm mt-1 whitespace-pre-wrap">{record.reasons_for_treatment}</p>
                            </div>
                          )}
                          {record.treatment_plan_problems && (
                            <div>
                              <h4 className="font-semibold text-sm">Treatment Plan Problems</h4>
                              <p className="text-sm mt-1 whitespace-pre-wrap">{record.treatment_plan_problems}</p>
                            </div>
                          )}
                          {record.family_involvement && (
                            <div>
                              <h4 className="font-semibold text-sm">Family Involvement</h4>
                              <p className="text-sm mt-1 whitespace-pre-wrap">{record.family_involvement}</p>
                            </div>
                          )}
                          {record.aftercare_plan && (
                            <div>
                              <h4 className="font-semibold text-sm">Aftercare Plan</h4>
                              <p className="text-sm mt-1 whitespace-pre-wrap">{record.aftercare_plan}</p>
                              {record.aftercare_completion_date && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  Expected completion: {record.aftercare_completion_date}
                                </p>
                              )}
                            </div>
                          )}
                          
                          <Separator />
                          
                          <div>
                            <h4 className="font-semibold text-sm mb-2">Receiving Adult/Agency</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              {record.receiving_adult_name && (
                                <div>
                                  <span className="text-muted-foreground">Name:</span> {record.receiving_adult_name}
                                </div>
                              )}
                              {record.receiving_adult_relationship && (
                                <div>
                                  <span className="text-muted-foreground">Relationship:</span> {record.receiving_adult_relationship}
                                </div>
                              )}
                              {record.receiving_agency_name && (
                                <div>
                                  <span className="text-muted-foreground">Agency:</span> {record.receiving_agency_name}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
