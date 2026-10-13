import { useState, useEffect } from"react";
import { useParams, useNavigate } from"react-router-dom";
import { supabase } from"@/integrations/supabase/client";
import { useToast } from"@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import { Button } from"@/components/ui/button";
import { Badge } from"@/components/ui/badge";
import { ArrowLeft, Download, FileText, CheckCircle2, Shield, Heart, Activity, Users, DollarSign, GraduationCap } from "lucide-react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { drawPDFHeader } from "@/utils/pdfHeader";

const CasePlanDetails = () => {
 const { id } = useParams();
 const navigate = useNavigate();
 const { toast } = useToast();
 const [plan, setPlan] = useState<any>(null);
 const [client, setClient] = useState<any>(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 if (id) {
 fetchPlanDetails();
 }
 }, [id]);

 const fetchPlanDetails = async () => {
 try {
 setLoading(true);
 const { data: planData, error: planError } = await (supabase as any)
 .from('case_plans')
 .select('*')
 .eq('id', id)
 .single();

 if (planError) throw planError;
 setPlan(planData);

 if (planData && planData.client_id) {
 const { data: clientData, error: clientError } = await supabase
 .from('clients')
 .select('*')
 .eq('id', planData.client_id)
 .single();

 if (clientError) throw clientError;
 setClient(clientData);
 }
 } catch (error: any) {
 toast({
 title:"Error",
 description:"Failed to load case plan details.",
 variant:"destructive"
 });
 console.error(error);
 } finally {
 setLoading(false);
 }
 };

 const handleExportPDF = async () => {
 if (!plan || !client) return;

 try {
 const doc = new jsPDF();

 const headerBottomY = await drawPDFHeader({
   doc,
   title: "Case Plan Report",
   clientName: client.name,
   clientId: client.client_id,
   clientStatus: client.status,
   profilePictureUrl: client.profile_picture,
 });

 let yPos = headerBottomY + 8;

 const addSection = (title: string, goals: string, entries: any[]) => {
 if (yPos > 250) { doc.addPage(); yPos = 20; }

 doc.setFontSize(14);
 doc.setTextColor(249, 115, 22);
 doc.text(title, 14, yPos);
 yPos += 7;

 if (goals) {
 doc.setFontSize(10);
 doc.setTextColor(0);
 doc.text("Overall Goals:", 14, yPos);
 yPos += 5;
 const splitGoals = doc.splitTextToSize(goals, 180);
 doc.text(splitGoals, 14, yPos);
 yPos += (splitGoals.length * 5) + 5;
 }

 if (entries && entries.length > 0) {
 const tableHead = [['Need Identified', 'Actions', 'Responsible', 'Deadline', 'Status', 'Reason (Gap)', 'New Action']];
 const tableBody = entries.map((e: any) => {
 return [
 e.needIdentified || '',
 e.proposedActions || '',
 e.personResponsible || '',
 e.deadline ? new Date(e.deadline).toLocaleDateString() : '',
 e.actionsCompleted === 'yes' ? 'Done' : e.actionsCompleted === 'in_progress' ? 'In Prog' : 'Pending',
 e.explanationIfNotCompleted || '',
 e.newActionIdentified || ''
 ];
 });

 autoTable(doc, {
 startY: yPos,
 head: tableHead,
 body: tableBody,
 theme: 'grid',
 headStyles: { fillColor: [249, 115, 22] },
 styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak' },
 columnStyles: {
 0: { cellWidth: 30 },
 1: { cellWidth: 40 },
 2: { cellWidth: 20 },
 3: { cellWidth: 18 },
 4: { cellWidth: 16 },
 5: { cellWidth: 30 },
 6: { cellWidth: 30 }
 }
 });
 yPos = (doc as any).lastAutoTable.finalY + 10;
 }
 };

 addSection("Education Goals", plan.education_goals, plan.education_entries);
 addSection("Protection & Safety", plan.protection_goals, plan.protection_entries);
 addSection("Psychosocial Well-being", plan.psychosocial_goals, plan.psychosocial_entries);
 addSection("Health & Development", plan.health_goals, plan.health_entries);
 addSection("Child-Caregiver Relationship", plan.relationship_goals, plan.relationship_entries);
 addSection("Economic Stability", plan.economic_goals, plan.economic_entries);

 // Signatures
 if (yPos > 250) { doc.addPage(); yPos = 20; }
 doc.setFontSize(12);
 doc.setTextColor(0);
 doc.text("Signatures", 14, yPos);
 yPos += 10;

 autoTable(doc, {
 startY: yPos,
 head: [['Role', 'Name', 'Date', 'Signature']],
 body: [
 ['Caseworker', plan.caseworker_name || '', plan.caseworker_date || '', plan.caseworker_signature ? '(Signed)' : ''],
 ['Case Manager', plan.case_manager_name || '', plan.case_manager_date || '', plan.case_manager_signature ? '(Signed)' : '']
 ],
 theme: 'plain'
 });

 doc.save(`Case_Plan_${client.name}.pdf`);

 } catch (error) {
 console.error(error);
 toast({ title:"Export Failed", variant:"destructive" });
 }
 };

 if (loading) {
 return <div className="p-8 text-center">Loading case plan details...</div>;
 }

 if (!plan) return <div className="p-8 text-center">Plan not found.</div>;

 const renderSection = (title: string, icon: any, goals: string, entries: any[], colorClass: string) => {
 const Icon = icon;
 return (
 <Card className={`border-t-4 ${colorClass} mb-6`}>
 <CardHeader>
 <CardTitle className="flex items-center gap-2 text-lg">
 <Icon className="h-5 w-5" />
 {title}
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-6">
 {goals && (
 <div className="bg-muted/30 p-4 rounded-md">
 <h4 className="font-semibold text-sm mb-2 text-muted-foreground uppercase tracking-wide">Overall Goals</h4>
 <p className="whitespace-pre-wrap text-foreground">{goals}</p>
 </div>
 )}

 {entries && entries.length > 0 && (
 <div>
 <h4 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wide">Action Plan</h4>
 <div className="grid grid-cols-1 gap-4">
 {entries.map((entry: any, idx: number) => (
 <div key={idx} className="border rounded-lg p-4 bg-card shadow-sm">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
 <div>
 <span className="text-xs font-semibold text-muted-foreground uppercase">Need Identified</span>
 <p className="mt-1">{entry.needIdentified || 'N/A'}</p>
 </div>
 <div>
 <span className="text-xs font-semibold text-muted-foreground uppercase">Proposed Actions</span>
 <p className="mt-1">{entry.proposedActions || 'N/A'}</p>
 </div>
 </div>
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-muted/20 p-3 rounded">
 <div>
 <span className="text-xs font-semibold text-muted-foreground block">Deadline</span>
 {entry.deadline ? new Date(entry.deadline).toLocaleDateString() : '-'}
 </div>
 <div>
 <span className="text-xs font-semibold text-muted-foreground block">Responsible</span>
 {entry.personResponsible || '-'}
 </div>
 <div>
 <span className="text-xs font-semibold text-muted-foreground block">Status</span>
 <Badge variant="outline" className={
 entry.actionsCompleted === 'yes' ? 'bg-green-100 text-green-700 border-green-200' :
 entry.actionsCompleted === 'in_progress' ? 'bg-blue-100 text-blue-700 border-blue-200' :
 'bg-gray-100 text-gray-700 border-gray-200'
 }>
 {entry.actionsCompleted === 'yes' ? 'Completed' :
 entry.actionsCompleted === 'in_progress' ? 'In Progress' : 'Pending'}
 </Badge>
 </div>
 </div>
 {entry.actionsCompleted === 'no' && (entry.explanationIfNotCompleted || entry.newActionIdentified) && (
 <div className="mt-4 pt-4 border-t text-sm">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {entry.explanationIfNotCompleted && (
 <div>
 <span className="text-xs font-semibold text-red-600 block">Reason Not Completed</span>
 <p>{entry.explanationIfNotCompleted}</p>
 </div>
 )}
 {entry.newActionIdentified && (
 <div>
 <span className="text-xs font-semibold text-blue-600 block">New Action</span>
 <p>{entry.newActionIdentified}</p>
 </div>
 )}
 </div>
 </div>
 )}
 </div>
 ))}
 </div>
 </div>
 )}
 </CardContent>
 </Card>
 );
 };

 return (
 <div className="min-h-screen bg-background w-full overflow-x-hidden">
 <div className="sticky top-14 z-10 shadow-md bg-gradient-to-r from-blue-600 to-cyan-600 h-24 flex items-center px-4 sm:px-6 lg:px-8 overflow-x-hidden">
 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
 <div className="relative flex items-center gap-4 w-full">
 <Button variant="ghost" className="text-white hover:bg-white/20" onClick={() => navigate("/case-plans")}>
 <ArrowLeft className="h-5 w-5" />
 </Button>
 <div>
 <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Case Plan Report</h1>
 <p className="text-sm sm:text-base text-white/90">
 {client ? `For ${client.name}` :"Loading..."}
 </p>
 </div>
 <div className="ml-auto">
 <Button onClick={handleExportPDF} variant="secondary" className="bg-white/90 text-blue-600 hover:bg-white">
 <Download className="mr-2 h-4 w-4" /> Export PDF
 </Button>
 </div>
 </div>
 </div>

 <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto overflow-x-hidden">
 <Card className="mb-8 border-l-4 border-l-blue-500">
 <CardContent className="p-6">
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <div>
 <h3 className="text-sm font-medium text-muted-foreground">Client Name</h3>
 <p className="text-lg font-semibold">{client?.name}</p>
 </div>
 <div>
 <h3 className="text-sm font-medium text-muted-foreground">Client ID</h3>
 <p className="text-lg font-semibold">{client?.client_id}</p>
 </div>
 <div>
 <h3 className="text-sm font-medium text-muted-foreground">Plan Date</h3>
 <p className="text-lg font-semibold">{new Date(plan.plan_date).toLocaleDateString()}</p>
 </div>
 </div>
 </CardContent>
 </Card>

 {renderSection("Education", GraduationCap, plan.education_goals, plan.education_entries,"border-t-purple-500")}
 {renderSection("Protection & Safety", Shield, plan.protection_goals, plan.protection_entries,"border-t-red-500")}
 {renderSection("Psychosocial Well-being", Heart, plan.psychosocial_goals, plan.psychosocial_entries,"border-t-green-500")}
 {renderSection("Health & Development", Activity, plan.health_goals, plan.health_entries,"border-t-blue-500")}
 {renderSection("Child-Caregiver Relationship", Users, plan.relationship_goals, plan.relationship_entries,"border-t-orange-500")}
 {renderSection("Economic Stability", DollarSign, plan.economic_goals, plan.economic_entries,"border-t-yellow-500")}

 {/* Signatures */}
 <Card className="mt-8 bg-muted/10">
 <CardHeader><CardTitle className="text-lg">Approvals</CardTitle></CardHeader>
 <CardContent>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
 <div className="space-y-2">
 <span className="text-sm text-muted-foreground">Caseworker</span>
 <div className="font-semibold text-lg">{plan.caseworker_name ||"N/A"}</div>
 <div className="text-sm">Date: {plan.caseworker_date ||"-"}</div>
 {plan.caseworker_signature && <div className="text-xs text-green-600 font-medium flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Signed Digitally</div>}
 </div>
 <div className="space-y-2">
 <span className="text-sm text-muted-foreground">Case Manager</span>
 <div className="font-semibold text-lg">{plan.case_manager_name ||"N/A"}</div>
 <div className="text-sm">Date: {plan.case_manager_date ||"-"}</div>
 {plan.case_manager_signature && <div className="text-xs text-green-600 font-medium flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Signed Digitally</div>}
 </div>
 </div>
 </CardContent>
 </Card>

 <div className="mt-8 flex justify-end">
 <Button variant="outline" onClick={() => navigate(`/case-plans/add?planId=${plan.id}&clientId=${plan.client_id}`)}>
 <FileText className="mr-2 h-4 w-4" /> Edit Plan
 </Button>
 </div>
 </div>
 </div>
 );
};

export default CasePlanDetails;
