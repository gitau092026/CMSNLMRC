import { useState, useEffect } from"react";
import { useParams, useNavigate } from"react-router-dom";
import { supabase } from"@/integrations/supabase/client";
import { MapPin, Edit, Trash2, ArrowLeft, FileText, Download } from"lucide-react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { drawPDFHeader } from "@/utils/pdfHeader";
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import { Button } from"@/components/ui/button";
import { Badge } from"@/components/ui/badge";
import { useToast } from"@/hooks/use-toast";

const ClientReintegrationPlans = () => {
 const { clientId } = useParams();
 const navigate = useNavigate();
 const { toast } = useToast();
 const [client, setClient] = useState<any>(null);
 const [homeVisits, setHomeVisits] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 fetchClientAndVisits();
 }, [clientId]);

 const fetchClientAndVisits = async () => {
 try {
 setLoading(true);

 // Fetch client details
 const { data: clientData, error: clientError } = await supabase
 .from('clients')
 .select('*')
 .eq('id', clientId)
 .single();

 if (clientError) throw clientError;
 setClient(clientData);

 // Fetch all home visits for this client
 const { data: visitsData, error: visitsError } = await supabase
 .from('home_visits')
 .select('*')
 .eq('client_id', clientId)
 .order('visit_date', { ascending: false });

 if (visitsError) throw visitsError;
 setHomeVisits(visitsData || []);
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

 const handleDelete = async (visitId: string) => {
 try {
 const { error } = await supabase
 .from('home_visits')
 .delete()
 .eq('id', visitId);

 if (error) throw error;

 toast({
 title:"Success",
 description:"Reintegration plan deleted successfully"
 });

 fetchClientAndVisits();
 } catch (error: any) {
 toast({
 title:"Error",
 description: error.message,
 variant:"destructive"
 });
 }
 };

 const handleExportPDF = async (singleVisit?: any) => {
   try {
     const doc = new jsPDF();

 // Determine which visits to export
 // Check if singleVisit is a valid visit object (has id), otherwise export all
 const visitsToExport = (singleVisit && singleVisit.visit_date) ? [singleVisit] : homeVisits;

 const headerBottomY = await drawPDFHeader({
   doc,
   title: "Reintegration Plans Report",
   clientName: client?.name,
   clientId: client?.client_id,
   clientStatus: client?.status,
   profilePictureUrl: client?.profile_picture,
 });

 let yPos = headerBottomY + 8;

 visitsToExport.forEach((visit) => {
 // Check for page break
 if (yPos > 250) {
 doc.addPage();
 yPos = 20;
 }

 // Visit Header
 doc.setFontSize(14);
 doc.setFillColor(249, 115, 22);
 doc.setTextColor(249, 115, 22);
 doc.text(`Plan Date: ${new Date(visit.visit_date).toLocaleDateString()}`, 14, yPos);

 yPos += 5;

 const rows = [
 ['Caseworker', visit.caseworker_name],
 ['Location', [visit.village, visit.subcounty, visit.county].filter(Boolean).join(', ')],
 ['Disability Status', visit.disability_status],
 ['Date of Exit', visit.date_of_exit ? new Date(visit.date_of_exit).toLocaleDateString() : ''],
 ['Assessment Report', visit.assessment_report],
 ['Reintegration Plans', visit.reintegration_plans],
 ['Proposed Caregivers', visit.proposed_caregivers],
 ['Caregiver Relationship', visit.caregiver_relationship],
 ['Caregiver Contacts', visit.caregiver_contacts],
 ['Nature of Reintegration', visit.nature_of_reintegration],
 ['Recommendations', visit.reintegration_recommendations],
 ['Course Placement', visit.course_placement_plans],
 ['Family Interventions', visit.family_interventions],
 ['Aftercare Plan', visit.aftercare_followup_plan],
 ['Key Contacts', visit.key_contacts],
 ].filter(row => row[1] && row[1].trim() !== ''); // Filter empty fields

 autoTable(doc, {
 startY: yPos,
 head: [['Field', 'Details']],
 body: rows,
 theme: 'grid',
 headStyles: {
 fillColor: [249, 115, 22],
 textColor: 255,
 fontStyle: 'bold'
 },
 columnStyles: {
 0: { fontStyle: 'bold', cellWidth: 50 },
 1: { cellWidth: 'auto' }
 },
 margin: { left: 14, right: 14 }
 });

 yPos = (doc as any).lastAutoTable.finalY + 15;
 });

 doc.save(`Reintegration_Plans_${client?.name || 'Client'}.pdf`);
 } catch (error) {
 console.error("Error generating PDF:", error);
 toast({
 title:"Error",
 description:"Failed to generate PDF with logo",
 variant:"destructive"
 });
 }
 };

 return (
 <div className="min-h-screen bg-background w-full">
 <div className="sticky top-14 z-10 shadow-md bg-gradient-primary h-24 flex items-center px-4 sm:px-6 lg:px-8">
 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
 <div className="relative flex items-center gap-4">
 <Button
 variant="ghost"
 size="icon"
 onClick={() => navigate('/reintegration-plans')}
 className="text-white hover:bg-white/20"
 >
 <ArrowLeft className="h-5 w-5" />
 </Button>
 <div>
 <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
 {client?.name || 'Client'} - Reintegration Plans
 </h1>
 <p className="text-sm sm:text-base text-white/90">
 {client?.client_id && `ID: ${client.client_id}`}
 </p>
 </div>

 </div>
 </div>

 <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
 {loading ? (
 <div className="text-center text-muted-foreground py-8">
 Loading reintegration plans...
 </div>
 ) : homeVisits.length === 0 ? (
 <Card>
 <CardContent className="p-8 text-center">
 <p className="text-muted-foreground">No reintegration plans found for this client.</p>
 <Button
 className="mt-4 bg-orange-500 hover:bg-orange-600"
 onClick={() => navigate(`/reintegration-plans/add?clientId=${clientId}`)}
 >
 Add First Reintegration Plan
 </Button>
 </CardContent>
 </Card>
 ) : (
 <div className="space-y-6">
 {homeVisits.map((visit) => (
 <Card key={visit.id} className="border-t-4 border-t-orange-500">
 <CardHeader>
 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
 <div className="space-y-2 min-w-0">
 <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
 <FileText className="h-5 w-5 shrink-0" />
 Reintegration Plan - {new Date(visit.visit_date).toLocaleDateString()}
 </CardTitle>
 <Badge className="bg-teal-500/10 text-teal-600 hover:bg-teal-500/20 border-teal-500/20 whitespace-nowrap">
 REINTEGRATION PLAN
 </Badge>
 </div>
 <div className="flex gap-2 flex-wrap w-full sm:w-auto">
 <Button
 variant="outline"
 size="sm"
 onClick={() => handleExportPDF(visit)}
 >
 <Download className="h-4 w-4 mr-1" />
 Export PDF
 </Button>
 <Button
 variant="outline"
 size="sm"
 onClick={() => navigate(`/reintegration-plans/add?visitId=${visit.id}`)}
 >
 <Edit className="h-4 w-4 mr-1" />
 Edit
 </Button>
 <Button
 variant="destructive"
 size="sm"
 onClick={() => handleDelete(visit.id)}
 >
 <Trash2 className="h-4 w-4 mr-1" />
 Delete
 </Button>
 </div>
 </div>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {visit.caseworker_name && (
 <div>
 <p className="text-sm sm:text-base font-bold text-foreground mb-1">Caseworker</p>
 <p className="text-sm sm:text-base">{visit.caseworker_name}</p>
 </div>
 )}
 {visit.village && (
 <div>
 <p className="text-sm sm:text-base font-bold text-foreground mb-1">Location</p>
 <p className="text-sm sm:text-base flex items-center gap-1">
 <MapPin className="h-3 w-3" />
 {visit.village}, {visit.subcounty}, {visit.county}
 </p>
 </div>
 )}
 {visit.disability_status && (
 <div>
 <p className="text-sm sm:text-base font-bold text-foreground mb-1">Disability Status</p>
 <p className="text-sm sm:text-base">{visit.disability_status}</p>
 </div>
 )}
 {visit.date_of_exit && (
 <div>
 <p className="text-sm sm:text-base font-bold text-foreground mb-1">Date of Exit</p>
 <p className="text-sm sm:text-base">{new Date(visit.date_of_exit).toLocaleDateString()}</p>
 </div>
 )}
 </div>

 {visit.assessment_report && (
 <div>
 <p className="text-sm sm:text-base font-bold text-foreground mb-1">Assessment Report</p>
 <p className="text-sm sm:text-base bg-muted/50 p-3 rounded-md">{visit.assessment_report}</p>
 </div>
 )}

 {visit.reintegration_plans && (
 <div>
 <p className="text-sm sm:text-base font-bold text-foreground mb-1">Reintegration Plans</p>
 <p className="text-sm sm:text-base bg-muted/50 p-3 rounded-md">{visit.reintegration_plans}</p>
 </div>
 )}

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {visit.proposed_caregivers && (
 <div>
 <p className="text-sm sm:text-base font-bold text-foreground mb-1">Proposed Caregivers</p>
 <p className="text-sm sm:text-base">{visit.proposed_caregivers}</p>
 </div>
 )}
 {visit.caregiver_relationship && (
 <div>
 <p className="text-sm sm:text-base font-bold text-foreground mb-1">Caregiver Relationship</p>
 <p className="text-sm sm:text-base">{visit.caregiver_relationship}</p>
 </div>
 )}
 {visit.caregiver_contacts && (
 <div>
 <p className="text-sm sm:text-base font-bold text-foreground mb-1">Caregiver Contacts</p>
 <p className="text-sm sm:text-base">{visit.caregiver_contacts}</p>
 </div>
 )}
 {visit.nature_of_reintegration && (
 <div>
 <p className="text-sm sm:text-base font-bold text-foreground mb-1">Nature of Reintegration</p>
 <p className="text-sm sm:text-base">{visit.nature_of_reintegration}</p>
 </div>
 )}
 </div>

 {visit.reintegration_recommendations && (
 <div>
 <p className="text-sm sm:text-base font-bold text-foreground mb-1">Reintegration Recommendations</p>
 <p className="text-sm sm:text-base bg-muted/50 p-3 rounded-md">{visit.reintegration_recommendations}</p>
 </div>
 )}

 {visit.course_placement_plans && (
 <div>
 <p className="text-sm sm:text-base font-bold text-foreground mb-1">Course Placement Plans</p>
 <p className="text-sm sm:text-base bg-muted/50 p-3 rounded-md">{visit.course_placement_plans}</p>
 </div>
 )}

 {visit.family_interventions && (
 <div>
 <p className="text-sm sm:text-base font-bold text-foreground mb-1">Family Interventions</p>
 <p className="text-sm sm:text-base bg-muted/50 p-3 rounded-md">{visit.family_interventions}</p>
 </div>
 )}

 {visit.aftercare_followup_plan && (
 <div>
 <p className="text-sm sm:text-base font-bold text-foreground mb-1">Aftercare Follow-up Plan</p>
 <p className="text-sm sm:text-base bg-muted/50 p-3 rounded-md">{visit.aftercare_followup_plan}</p>
 </div>
 )}

 {visit.key_contacts && (
 <div>
 <p className="text-sm sm:text-base font-bold text-foreground mb-1">Key Contacts</p>
 <p className="text-sm sm:text-base bg-muted/50 p-3 rounded-md">{visit.key_contacts}</p>
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
};

export default ClientReintegrationPlans;
