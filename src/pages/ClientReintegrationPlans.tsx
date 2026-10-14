import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  MapPin,
  Edit,
  Trash2,
  ArrowLeft,
  FileText,
  Download,
  Plus,
  User,
  Calendar,
  Shield,
  GraduationCap,
  Home,
  Phone,
  UserCircle,
} from "lucide-react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { drawPDFHeader } from "@/utils/pdfHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ClientAvatar } from "@/components/ClientAvatar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const ClientReintegrationPlans = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [client, setClient] = useState<any>(null);
  const [admissionDetails, setAdmissionDetails] = useState<any>(null);
  const [homeVisits, setHomeVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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

      // Fetch admission details for enriched client info
      const { data: admissionData } = await supabase
        .from('client_admission_details')
        .select('*')
        .eq('client_id', clientId)
        .single();
      if (admissionData) setAdmissionDetails(admissionData);

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
        title: "Error",
        description: error.message,
        variant: "destructive"
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
        title: "Success",
        description: "Reintegration plan deleted successfully"
      });

      fetchClientAndVisits();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleExportPDF = async (singleVisit?: any) => {
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const visitsToExport = (singleVisit && singleVisit.visit_date) ? [singleVisit] : homeVisits;

      const headerBottomY = await drawPDFHeader({
        doc,
        title: "Reintegration Plan Report",
        clientName: client?.name,
        clientId: client?.client_id,
        clientStatus: client?.status,
        profilePictureUrl: client?.profile_picture,
      });

      let yPos = headerBottomY + 5;
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.getHeight();
      const leftMargin = 14;
      const rightMargin = 14;
      const contentWidth = pageWidth - leftMargin - rightMargin;

      const fmtDate = (d?: string | null) =>
        d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—";

      const sectionGap = 4;
      const cellPad = { top: 2.5, bottom: 2.5, left: 4, right: 4 };

      const drawSection = (label: string, rows: [string, string][], accentColor: [number, number, number]) => {
        if (!rows.length) return;
        const gridHead = [[
          { content: label, styles: { fillColor: accentColor, textColor: 255, fontStyle: "bold", fontSize: 8, cellPadding: { top: 2, bottom: 2, left: 5, right: 5 } } }
        ]];
        const gridBody = rows.map(([k, v]) => [
          { content: k, styles: { fontStyle: "bold", fillColor: [243, 244, 246], fontSize: 8, cellPadding: cellPad, textColor: [71, 85, 105] } },
          { content: v, styles: { fillColor: [254, 254, 255], fontSize: 8.5, cellPadding: cellPad, textColor: [31, 41, 59] } }
        ]);
        autoTable(doc, {
          startY: yPos,
          head: gridHead,
          body: gridBody,
          theme: "grid",
          styles: { fontSize: 8, lineColor: [226, 232, 240], lineWidth: 0.2 },
          columnStyles: { 0: { cellWidth: 55 }, 1: { cellWidth: "auto" } },
          margin: { left: leftMargin, right: rightMargin },
          tableWidth: contentWidth,
        });
        yPos = (doc as any).lastAutoTable.finalY + sectionGap;
      };

      const drawNarrative = (label: string, content: string, accentColor: [number, number, number]) => {
        const trimmed = (content ?? "").trim();
        if (!trimmed) return;
        autoTable(doc, {
          startY: yPos,
          head: [[
            { content: label, styles: { fillColor: accentColor, textColor: 255, fontStyle: "bold", fontSize: 8, cellPadding: { top: 2, bottom: 2, left: 5, right: 5 } } }
          ]],
          body: [[
            { content: trimmed, styles: { fillColor: [254, 254, 255], fontSize: 9, cellPadding: { top: 4, bottom: 4, left: 5, right: 5 }, textColor: [31, 41, 59], overflow: "linebreak" } }
          ]],
          theme: "grid",
          styles: { lineColor: [226, 232, 240], lineWidth: 0.2 },
          margin: { left: leftMargin, right: rightMargin },
          tableWidth: contentWidth,
          columnStyles: { 0: { cellWidth: "auto" } },
        });
        yPos = (doc as any).lastAutoTable.finalY + sectionGap;
      };

      visitsToExport.forEach((visit, index) => {
        if (index > 0) { doc.addPage(); yPos = 20; }

        // ---- Plan banner ----
        autoTable(doc, {
          startY: yPos,
          head: [[
            { content: `REINTEGRATION PLAN  —  ${fmtDate(visit.visit_date)}`, styles: { fillColor: [249, 115, 22], textColor: 255, fontStyle: "bold", fontSize: 10.5, cellPadding: { top: 3.5, bottom: 3.5, left: 6, right: 6 } } }
          ]],
          body: [[]],
          theme: "grid",
          styles: { lineColor: [249, 115, 22], lineWidth: 0.5 },
          margin: { left: leftMargin, right: rightMargin },
          tableWidth: contentWidth,
        });
        yPos = (doc as any).lastAutoTable.finalY + sectionGap + 1;

        // ---- 1. ASSESSMENT REPORT (full narrative) ----
        drawNarrative("Assessment Report / Feedback", visit.assessment_report, [14, 116, 139]);

        // ---- 2. KEY CONTACTS ----
        if ((visit.key_contacts ?? "").trim()) {
          const contactsRows: [string, string][] = [
            ["Key Contacts", visit.key_contacts]
          ];
          drawSection("Key Contacts", contactsRows, [14, 116, 139]);
        }

        // ---- 3. PLANNED REINTEGRATION ACTIVITIES (full narrative) ----
        drawNarrative("Planned Reintegration Activities & Summary", visit.reintegration_plans, [22, 163, 74]);

        // ---- 4. REINTEGRATION RECOMMENDATIONS ----
        if ((visit.reintegration_recommendations ?? "").trim()) {
          drawNarrative("Reintegration Recommendations", visit.reintegration_recommendations, [22, 163, 74]);
        }

        // ---- 5. NATURE OF REINTEGRATION ----
        if ((visit.nature_of_reintegration ?? "").trim()) {
          drawNarrative("Nature of Reintegration", visit.nature_of_reintegration, [22, 163, 74]);
        }

        // ---- 6. CAREGIVER & PLACEMENT ----
        const caregiverRows: [string, string][] = [];
        if ((visit.proposed_caregivers ?? "").trim()) caregiverRows.push(["Proposed Caregiver(s)", visit.proposed_caregivers]);
        if ((visit.caregiver_relationship ?? "").trim()) caregiverRows.push(["Caregiver Relationship", visit.caregiver_relationship]);
        if ((visit.caregiver_contacts ?? "").trim()) caregiverRows.push(["Caregiver Contacts", visit.caregiver_contacts]);
        if ((visit.reintegration_location ?? "").trim()) caregiverRows.push(["Reintegration Location", visit.reintegration_location]);
        if ((visit.village ?? "").trim()) caregiverRows.push(["Village", visit.village]);
        if ((visit.subcounty ?? "").trim()) caregiverRows.push(["Sub-county", visit.subcounty]);
        if ((visit.county ?? "").trim()) caregiverRows.push(["County", visit.county]);
        if (caregiverRows.length) drawSection("Caregiver & Placement Details", caregiverRows, [79, 70, 229]);

        // ---- 7. EDUCATION & TRAINING ----
        drawNarrative("Education & Training / Course Placement Plans", visit.course_placement_plans, [147, 51, 234]);

        // ---- 8. FAMILY / HOUSEHOLD INTERVENTIONS ----
        drawNarrative("Family / Household Interventions", visit.family_interventions, [14, 116, 139]);

        // ---- 9. AFTERCARE FOLLOW-UP PLAN ----
        drawNarrative("Individual Aftercare Follow-up Plan", visit.aftercare_followup_plan, [249, 115, 22]);

        // ---- 10. REFERRAL & ADMISSION BACKGROUND (from admission details) ----
        const referralRows: [string, string][] = [];
        if ((admissionDetails?.pre_admission_living ?? "").trim()) referralRows.push(["Pre-Admission Living Situation", admissionDetails.pre_admission_living]);
        if ((admissionDetails?.committal_order_no ?? "").trim()) referralRows.push(["Committal Order No.", admissionDetails.committal_order_no]);
        if ((admissionDetails?.committal_date ?? "").trim()) referralRows.push(["Committal Date", fmtDate(admissionDetails.committal_date)]);
        if ((admissionDetails?.admission_order_issued ?? "").trim()) referralRows.push(["Admission Order Issued", admissionDetails.admission_order_issued]);
        if ((admissionDetails?.placement_order_no ?? "").trim()) referralRows.push(["Placement Order No.", admissionDetails.placement_order_no]);

        const fmtJson = (val: unknown): string => {
          if (!val) return "—";
          if (Array.isArray(val)) return val.filter(Boolean).join(", ");
          if (typeof val === "object") return JSON.stringify(val).replace(/[{}"]/g, "").replace(/_/g, " ");
          return String(val);
        };

        if (admissionDetails?.vulnerability_type) referralRows.push(["Vulnerability Type", fmtJson(admissionDetails.vulnerability_type)]);
        if (admissionDetails?.reasons_for_admission_list) referralRows.push(["Reasons for Admission", fmtJson(admissionDetails.reasons_for_admission_list)]);
        if ((admissionDetails?.vulnerability_location_separation ?? "").trim()) referralRows.push(["Separation Location", admissionDetails.vulnerability_location_separation]);
        if ((admissionDetails?.vulnerability_location_street ?? "").trim()) referralRows.push(["Street-level Location", admissionDetails.vulnerability_location_street]);
        if (admissionDetails?.current_care_placement_type) referralRows.push(["Current Care Placement Type", fmtJson(admissionDetails.current_care_placement_type)]);
        if ((admissionDetails?.current_care_provider_name ?? "").trim()) referralRows.push(["Care Provider Name", admissionDetails.current_care_provider_name]);
        if ((admissionDetails?.current_care_provider_reg ?? "").trim()) referralRows.push(["Care Provider Registration", admissionDetails.current_care_provider_reg]);
        if ((admissionDetails?.current_care_provider_phone ?? "").trim()) referralRows.push(["Care Provider Phone", admissionDetails.current_care_provider_phone]);
        if ((admissionDetails?.current_care_placement_other ?? "").trim()) referralRows.push(["Placement Other Details", admissionDetails.current_care_placement_other]);
        if ((admissionDetails?.reasons_for_admission_other ?? "").trim()) referralRows.push(["Reasons for Admission (Other)", admissionDetails.reasons_for_admission_other]);
        if ((admissionDetails?.history_of_placements_notes ?? "").trim()) referralRows.push(["History of Placements", admissionDetails.history_of_placements_notes]);
        if (referralRows.length) drawSection("Referral & Admission Background", referralRows, [71, 85, 105]);
      });

      // ---- Footer on every page ----
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.line(leftMargin, pageHeight - 12, pageWidth - rightMargin, pageHeight - 12);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text("Confidential — New Life Mwangaza Rehabilitation Centre", leftMargin, pageHeight - 7.5);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - rightMargin, pageHeight - 7.5, { align: "right" });
      }

      const isSingle = visitsToExport.length === 1;
      const dateSuffix = isSingle && visitsToExport[0]?.visit_date ? `_${visitsToExport[0].visit_date}` : "";
      doc.save(`Reintegration_Plan_${client?.name || "Client"}${dateSuffix}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({ title: "Error", description: "Failed to generate PDF", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background w-full pb-10">
      {/* Sticky Header Banner */}
      <div className="sticky top-14 z-20 shadow-md bg-gradient-primary min-h-[5.5rem] flex items-center px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
        <div className="relative w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/reintegration-plans')}
              className="text-white hover:bg-white/20 shrink-0 h-9 w-9 -ml-1 sm:ml-0"
              title="Back to Reintegration Plans"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight truncate">
                {client?.name || 'Client'} - Reintegration Plans
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {client?.client_id && (
                  <span className="text-xs font-semibold text-white/95 bg-white/15 px-2 py-0.5 rounded-md backdrop-blur-xs">
                    ID: {client.client_id}
                  </span>
                )}
                {client?.status && (
                  <span className="text-xs font-medium text-white/85 capitalize">
                    • {client.status}
                  </span>
                )}
                <span className="text-xs text-white/75 hidden sm:inline">
                  • {homeVisits.length} {homeVisits.length === 1 ? 'plan' : 'plans'}
                </span>
              </div>
            </div>
          </div>

          {/* Header Action Buttons: Only show Add Plan if no plans exist yet; Export All PDF is removed */}
          {homeVisits.length === 0 && (
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto w-full sm:w-auto justify-end">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/15 text-white border-white/30 hover:bg-white/25 hover:text-white text-xs sm:text-sm h-8 sm:h-9"
                onClick={() => navigate(`/reintegration-plans/add?clientId=${clientId}`)}
              >
                <Plus className="h-4 w-4 mr-1 sm:mr-1.5" />
                Add Plan
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Client Profile Summary Card */}
        {client && !loading && (
          <Card className="border border-border/80 shadow-xs overflow-hidden bg-card">
            <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                <ClientAvatar
                  src={client.profile_picture}
                  alt={client.name}
                  sizeClassName="h-12 w-12 sm:h-14 sm:w-14"
                  iconClassName="h-6 w-6 text-primary"
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-foreground truncate">
                      {client.name}
                    </h2>
                    <Badge variant="secondary" className="text-xs font-semibold">
                      ID: {client.client_id || 'N/A'}
                    </Badge>
                    {client.status && (
                      <Badge
                        className={cn(
                          "text-xs font-semibold capitalize",
                          client.status.toLowerCase() === 'active'
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {client.status}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                    {client.gender && <span>Gender: {client.gender}</span>}
                    {client.age && <span>Age: {client.age} yrs</span>}
                    {client.admission_date && (
                      <span>Admitted: {new Date(client.admission_date).toLocaleDateString()}</span>
                    )}
                    <span>
                      Recorded Plans: <strong className="text-foreground">{homeVisits.length}</strong>
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/60">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs sm:text-sm w-full md:w-auto"
                  onClick={() => navigate(`/clients/${client.id}`)}
                >
                  <UserCircle className="h-4 w-4 mr-1.5" />
                  View Client Profile
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Content Section */}
        {loading ? (
          <div className="space-y-6">
            <Card className="p-5">
              <div className="flex items-center gap-4">
                <Skeleton className="h-14 w-14 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </Card>
            <Card className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-56" />
                <Skeleton className="h-8 w-40" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Skeleton className="h-16 rounded-lg" />
                <Skeleton className="h-16 rounded-lg" />
                <Skeleton className="h-16 rounded-lg" />
                <Skeleton className="h-16 rounded-lg" />
              </div>
              <Skeleton className="h-28 rounded-lg" />
              <Skeleton className="h-28 rounded-lg" />
            </Card>
          </div>
        ) : homeVisits.length === 0 ? (
          <Card className="border border-border/80 shadow-xs">
            <CardContent className="p-8 sm:p-12 text-center max-w-md mx-auto space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-orange-500/10 text-orange-600 flex items-center justify-center">
                <FileText className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-foreground">No Reintegration Plans Found</h3>
                <p className="text-sm text-muted-foreground">
                  There are currently no reintegration plans filed for {client?.name || 'this client'}.
                </p>
              </div>
              <Button
                className="w-full sm:w-auto bg-gradient-primary text-white hover:opacity-90 shadow-sm"
                onClick={() => navigate(`/reintegration-plans/add?clientId=${clientId}`)}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Create First Reintegration Plan
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {homeVisits.map((visit, index) => (
              <Card
                key={visit.id}
                className="border border-border/80 border-t-4 border-t-orange-500 shadow-sm hover:shadow-md transition-shadow overflow-hidden bg-card"
              >
                {/* Plan Card Header */}
                <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-border/60 bg-muted/20">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      <div className="p-2.5 bg-orange-500/10 rounded-lg text-orange-600 shrink-0 mt-0.5 sm:mt-0">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <CardTitle className="text-base sm:text-lg font-bold text-foreground">
                            Reintegration Plan
                          </CardTitle>
                          <span className="text-sm font-medium text-muted-foreground">
                            • {visit.visit_date ? new Date(visit.visit_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Date not set'}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          <Badge className="bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20 text-[11px] font-semibold">
                            REINTEGRATION PLAN
                          </Badge>
                          {visit.nature_of_reintegration && (
                            <Badge variant="outline" className="text-[11px] bg-background text-foreground font-medium">
                              {visit.nature_of_reintegration}
                            </Badge>
                          )}
                          {index === 0 && homeVisits.length > 1 && (
                            <Badge className="bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20 text-[11px] font-semibold">
                              Latest Plan
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions Toolbar */}
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs sm:text-sm px-2.5 sm:px-3"
                        onClick={() => handleExportPDF(visit)}
                        title="Export Plan to PDF"
                      >
                        <Download className="h-3.5 w-3.5 mr-1" />
                        <span>PDF</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs sm:text-sm px-2.5 sm:px-3"
                        onClick={() => navigate(`/reintegration-plans/add?visitId=${visit.id}`)}
                        title="Edit Plan"
                      >
                        <Edit className="h-3.5 w-3.5 mr-1" />
                        <span>Edit</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs sm:text-sm px-2.5 sm:px-3 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setDeleteConfirmId(visit.id)}
                        title="Delete Plan"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        <span>Delete</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Plan Card Body */}
                <CardContent className="p-4 sm:p-6 space-y-6">
                  {/* Quick Meta Highlights */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
                      <div className="p-2 rounded-md bg-blue-500/10 text-blue-600 shrink-0 mt-0.5">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Caseworker</p>
                        <p className="text-sm font-semibold text-foreground truncate" title={visit.caseworker_name || 'Not assigned'}>
                          {visit.caseworker_name || 'Not assigned'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
                      <div className="p-2 rounded-md bg-purple-500/10 text-purple-600 shrink-0 mt-0.5">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Location</p>
                        <p
                          className="text-sm font-semibold text-foreground truncate"
                          title={[visit.village, visit.subcounty, visit.county].filter(Boolean).join(', ') || 'Not specified'}
                        >
                          {[visit.village, visit.subcounty, visit.county].filter(Boolean).join(', ') || 'Not specified'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
                      <div className="p-2 rounded-md bg-amber-500/10 text-amber-600 shrink-0 mt-0.5">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Date of Exit</p>
                        <p className="text-sm font-semibold text-foreground truncate">
                          {visit.date_of_exit ? new Date(visit.date_of_exit).toLocaleDateString() : 'Not set'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
                      <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-600 shrink-0 mt-0.5">
                        <Shield className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Disability Status</p>
                        <p className="text-sm font-semibold text-foreground truncate" title={visit.disability_status || 'None reported'}>
                          {visit.disability_status || 'None reported'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Section: Assessment & Background */}
                  {(visit.assessment_report || visit.key_contacts) && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-foreground pb-1 border-b border-border/40">
                        <FileText className="h-4 w-4 text-orange-600 shrink-0" />
                        <h3>Assessment & Background</h3>
                      </div>

                      {visit.assessment_report && (
                        <div className="rounded-lg border border-border/70 bg-muted/30 p-4 sm:p-5">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Assessment Report / Feedback
                          </p>
                          <p className="text-sm sm:text-base text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">
                            {visit.assessment_report}
                          </p>
                        </div>
                      )}

                      {visit.key_contacts && (
                        <div className="rounded-lg border border-border/70 bg-muted/30 p-4">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Key Contacts
                          </p>
                          <p className="text-sm sm:text-base text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">
                            {visit.key_contacts}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Section: Reintegration Strategy & Caregiver Placement */}
                  {(visit.reintegration_plans || visit.proposed_caregivers || visit.caregiver_relationship || visit.caregiver_contacts || visit.nature_of_reintegration) && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-foreground pb-1 border-b border-border/40">
                        <Home className="h-4 w-4 text-teal-600 shrink-0" />
                        <h3>Reintegration Strategy & Caregiver Placement</h3>
                      </div>

                      {visit.reintegration_plans && (
                        <div className="rounded-lg border border-border/70 bg-muted/30 p-4 sm:p-5">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Planned Reintegration Activities & Summary
                          </p>
                          <p className="text-sm sm:text-base text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">
                            {visit.reintegration_plans}
                          </p>
                        </div>
                      )}

                      {(visit.proposed_caregivers || visit.caregiver_relationship || visit.caregiver_contacts || visit.nature_of_reintegration) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-lg bg-card border border-border/70">
                          {visit.proposed_caregivers && (
                            <div>
                              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                Proposed Caregiver(s)
                              </p>
                              <p className="text-sm sm:text-base font-semibold text-foreground break-words">
                                {visit.proposed_caregivers}
                              </p>
                            </div>
                          )}
                          {visit.caregiver_relationship && (
                            <div>
                              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                Relationship
                              </p>
                              <p className="text-sm sm:text-base font-medium text-foreground break-words">
                                {visit.caregiver_relationship}
                              </p>
                            </div>
                          )}
                          {visit.caregiver_contacts && (
                            <div>
                              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                Caregiver Contacts
                              </p>
                              <p className="text-sm sm:text-base font-medium text-foreground break-words flex items-center gap-1.5">
                                <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span>{visit.caregiver_contacts}</span>
                              </p>
                            </div>
                          )}
                          {visit.nature_of_reintegration && (
                            <div>
                              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                Nature of Reintegration
                              </p>
                              <p className="text-sm sm:text-base font-medium text-foreground break-words">
                                {visit.nature_of_reintegration}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Section: Education, Training & Family Support */}
                  {(visit.course_placement_plans || visit.family_interventions) && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-foreground pb-1 border-b border-border/40">
                        <GraduationCap className="h-4 w-4 text-emerald-600 shrink-0" />
                        <h3>Education, Training & Family Support</h3>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {visit.course_placement_plans && (
                          <div className="rounded-lg border border-border/70 bg-muted/30 p-4 sm:p-5 space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              Course / School Placement Plans
                            </p>
                            <p className="text-sm sm:text-base text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">
                              {visit.course_placement_plans}
                            </p>
                          </div>
                        )}
                        {visit.family_interventions && (
                          <div className="rounded-lg border border-border/70 bg-muted/30 p-4 sm:p-5 space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              Family / Household Interventions
                            </p>
                            <p className="text-sm sm:text-base text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">
                              {visit.family_interventions}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Section: Aftercare & Recommendations */}
                  {(visit.aftercare_followup_plan || visit.reintegration_recommendations) && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-foreground pb-1 border-b border-border/40">
                        <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
                        <h3>Aftercare Plan & Recommendations</h3>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {visit.aftercare_followup_plan && (
                          <div className="rounded-lg border border-border/70 bg-muted/30 p-4 sm:p-5 space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              Individual Aftercare Follow-up Plan
                            </p>
                            <p className="text-sm sm:text-base text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">
                              {visit.aftercare_followup_plan}
                            </p>
                          </div>
                        )}
                        {visit.reintegration_recommendations && (
                          <div className="rounded-lg border border-border/70 bg-muted/30 p-4 sm:p-5 space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              Recommendations
                            </p>
                            <p className="text-sm sm:text-base text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">
                              {visit.reintegration_recommendations}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Reintegration Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this reintegration plan? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteConfirmId) {
                  handleDelete(deleteConfirmId);
                  setDeleteConfirmId(null);
                }
              }}
            >
              Delete Plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ClientReintegrationPlans;
