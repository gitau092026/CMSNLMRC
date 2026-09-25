import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { drawPDFHeader } from "@/utils/pdfHeader";

export interface SoapNoteData {
  id?: string;
  client_id?: string;
  counsellor_name?: string;
  session_date: string;
  session_time?: string | null;
  subjective?: string | null;
  objective?: string | null;
  assessment?: string | null;
  plan?: string | null;
  next_session_date?: string | null;
  areas_to_focus?: string | null;
  created_at?: string;
  [key: string]: any;
}

export interface ClientDataForPDF {
  id?: string;
  name?: string;
  client_id?: string;
  intake_number?: string;
  status?: string;
  profile_picture?: string | null;
  [key: string]: any;
}

interface ExportSingleSoapNoteOptions {
  note: SoapNoteData;
  client?: ClientDataForPDF | null;
  toast?: (options: { title: string; description: string; variant?: "default" | "destructive" }) => void;
}

interface ExportAllSoapNotesOptions {
  notes: SoapNoteData[];
  client?: ClientDataForPDF | null;
  toast?: (options: { title: string; description: string; variant?: "default" | "destructive" }) => void;
}

/**
 * Exports a single SOAP Note to a beautifully formatted PDF.
 */
export const exportSoapNotePDF = async ({ note, client, toast }: ExportSingleSoapNoteOptions) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    const clientName = (client?.name || "Client").trim();
    const clientId = client?.client_id || client?.intake_number || undefined;
    const sessionDate = note.session_date || "Undated";

    const headerBottomY = await drawPDFHeader({
      doc,
      title: "Counselling SOAP Note",
      subtitle: "New Life Mwangaza Rehabilitation Centre",
      clientName,
      clientId,
      clientStatus: client?.status,
      profilePictureUrl: client?.profile_picture,
      dateText: `Session Date: ${sessionDate}`,
    });

    let finalY = headerBottomY + 6;

    // Session Details Table
    const sessionInfoBody: any[] = [
      [{ content: "Client Name", styles: { fontStyle: "bold", fillColor: [243, 244, 246] } }, clientName],
      [{ content: "Counsellor", styles: { fontStyle: "bold", fillColor: [243, 244, 246] } }, note.counsellor_name || "Unspecified"],
      [{ content: "Session Date", styles: { fontStyle: "bold", fillColor: [243, 244, 246] } }, sessionDate],
    ];

    if (note.session_time) {
      sessionInfoBody.push([{ content: "Session Time", styles: { fontStyle: "bold", fillColor: [243, 244, 246] } }, note.session_time]);
    }
    if (note.next_session_date) {
      sessionInfoBody.push([{ content: "Next Session", styles: { fontStyle: "bold", fillColor: [243, 244, 246] } }, note.next_session_date]);
    }
    if (note.areas_to_focus) {
      sessionInfoBody.push([{ content: "Areas to Focus", styles: { fontStyle: "bold", fillColor: [243, 244, 246] } }, note.areas_to_focus]);
    }

    autoTable(doc, {
      startY: finalY,
      head: [[{ content: "Session Information", colSpan: 2, styles: { halign: "left", fillColor: [234, 88, 12], textColor: 255, fontStyle: "bold" } }]],
      body: sessionInfoBody,
      theme: "grid",
      styles: { fontSize: 9.5, cellPadding: 2.8 },
      columnStyles: { 0: { cellWidth: 42 }, 1: { cellWidth: "auto" } },
      margin: { left: 14, right: 14 },
    });

    finalY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 8 : finalY + 45;

    // SOAP Sections
    const sections: Array<{ key: string; label: string; content?: string | null; color: [number, number, number] }> = [
      { key: "S", label: "S - SUBJECTIVE", content: note.subjective, color: [234, 88, 12] },     // Orange
      { key: "O", label: "O - OBJECTIVE", content: note.objective, color: [22, 163, 74] },      // Emerald
      { key: "A", label: "A - ASSESSMENT", content: note.assessment, color: [79, 70, 229] },   // Indigo
      { key: "P", label: "P - PLAN", content: note.plan, color: [147, 51, 234] },             // Purple
    ];

    for (const sec of sections) {
      if (!sec.content || !sec.content.trim()) continue;

      const lines = doc.splitTextToSize(sec.content.trim(), pageWidth - 36);
      const textHeight = lines.length * 4.8;
      const totalBlockHeight = 8 + textHeight + 8;

      // Check for page break
      if (finalY + totalBlockHeight > pageHeight - 20) {
        doc.addPage();
        finalY = 20;
      }

      // Section Header Banner
      doc.setFillColor(sec.color[0], sec.color[1], sec.color[2]);
      doc.roundedRect(14, finalY, pageWidth - 28, 7.5, 1, 1, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(sec.label, 18, finalY + 5.2);

      // Section Body Card
      const cardY = finalY + 7.5;
      const cardHeight = textHeight + 8;
      doc.setDrawColor(229, 231, 235);
      doc.setFillColor(254, 254, 255);
      doc.rect(14, cardY, pageWidth - 28, cardHeight, "FD");

      doc.setTextColor(31, 41, 55);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.text(lines, 18, cardY + 5.5);

      finalY = cardY + cardHeight + 6;
    }

    // Sign-off / Signature section
    if (finalY + 28 > pageHeight - 15) {
      doc.addPage();
      finalY = 20;
    }

    doc.setDrawColor(156, 163, 175);
    doc.setLineWidth(0.4);
    doc.line(14, finalY + 12, 75, finalY + 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(107, 114, 128);
    doc.text(`Counsellor Signature (${note.counsellor_name || "Counsellor"})`, 14, finalY + 17);

    // Save PDF
    const safeDate = sessionDate.replace(/[\/\\]/g, "-").replace(/\s+/g, "_");
    const safeClient = clientName.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `SOAP_Note_${safeDate}_${safeClient}.pdf`;

    doc.save(filename);

    if (toast) {
      toast({
        title: "PDF Exported",
        description: `SOAP note for ${clientName} (${sessionDate}) exported successfully.`,
      });
    }
  } catch (error: any) {
    console.error("Error exporting SOAP note PDF:", error);
    if (toast) {
      toast({
        title: "Export Failed",
        description: error?.message || "An error occurred while generating the SOAP note PDF.",
        variant: "destructive",
      });
    }
  }
};

/**
 * Exports all SOAP Notes for a client into a comprehensive multi-session PDF report.
 */
export const exportAllSoapNotesPDF = async ({ notes, client, toast }: ExportAllSoapNotesOptions) => {
  try {
    if (!notes || notes.length === 0) {
      if (toast) {
        toast({
          title: "No Notes to Export",
          description: "This client has no recorded SOAP notes to export.",
          variant: "destructive",
        });
      }
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    const clientName = (client?.name || "Client").trim();
    const clientId = client?.client_id || client?.intake_number || undefined;

    const headerBottomY = await drawPDFHeader({
      doc,
      title: "Comprehensive SOAP Notes Report",
      subtitle: "New Life Mwangaza Rehabilitation Centre",
      clientName,
      clientId,
      clientStatus: client?.status,
      profilePictureUrl: client?.profile_picture,
      dateText: `Total Sessions: ${notes.length} | Exported: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}`,
    });

    let finalY = headerBottomY + 6;

    // Overview Table
    autoTable(doc, {
      startY: finalY,
      head: [[{ content: `Client Overview & Session History (${notes.length} Total Sessions)`, colSpan: 2, styles: { fillColor: [234, 88, 12], textColor: 255, fontStyle: "bold" } }]],
      body: [
        [{ content: "Client Name", styles: { fontStyle: "bold", fillColor: [243, 244, 246] } }, clientName],
        [{ content: "Client ID", styles: { fontStyle: "bold", fillColor: [243, 244, 246] } }, clientId || "N/A"],
        [{ content: "Status", styles: { fontStyle: "bold", fillColor: [243, 244, 246] } }, client?.status || "Active"],
        [{ content: "Total SOAP Notes", styles: { fontStyle: "bold", fillColor: [243, 244, 246] } }, `${notes.length} sessions recorded`],
      ],
      theme: "grid",
      styles: { fontSize: 9.5, cellPadding: 2.5 },
      columnStyles: { 0: { cellWidth: 42 }, 1: { cellWidth: "auto" } },
      margin: { left: 14, right: 14 },
    });

    finalY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 10 : finalY + 40;

    // Render each note sequentially
    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];
      const sessionDate = note.session_date || "Undated";

      // If we don't have enough room for at least session header + subjective, add a page
      if (finalY + 35 > pageHeight - 20) {
        doc.addPage();
        finalY = 20;
      }

      // Session Header Pill
      doc.setFillColor(243, 244, 246);
      doc.setDrawColor(209, 213, 219);
      doc.roundedRect(14, finalY, pageWidth - 28, 8, 1, 1, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(234, 88, 12);
      doc.text(`Session #${notes.length - i} — ${sessionDate}${note.session_time ? ` (${note.session_time})` : ""}`, 18, finalY + 5.5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(107, 114, 128);
      const counsellorText = `Counsellor: ${note.counsellor_name || "N/A"}`;
      const textWidth = doc.getTextWidth(counsellorText);
      doc.text(counsellorText, pageWidth - 18 - textWidth, finalY + 5.5);

      finalY += 12;

      // Note Sections
      const sections = [
        { label: "S - SUBJECTIVE", content: note.subjective, color: [234, 88, 12] as [number, number, number] },
        { label: "O - OBJECTIVE", content: note.objective, color: [22, 163, 74] as [number, number, number] },
        { label: "A - ASSESSMENT", content: note.assessment, color: [79, 70, 229] as [number, number, number] },
        { label: "P - PLAN", content: note.plan, color: [147, 51, 234] as [number, number, number] },
      ];

      for (const sec of sections) {
        if (!sec.content || !sec.content.trim()) continue;

        const lines = doc.splitTextToSize(sec.content.trim(), pageWidth - 36);
        const textHeight = lines.length * 4.5;
        const totalBlockHeight = 6 + textHeight + 6;

        if (finalY + totalBlockHeight > pageHeight - 20) {
          doc.addPage();
          finalY = 20;
        }

        // Section header line
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(sec.color[0], sec.color[1], sec.color[2]);
        doc.text(sec.label, 16, finalY + 4);

        // Section content
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(31, 41, 55);
        doc.text(lines, 16, finalY + 9);

        finalY += 9 + textHeight + 4;
      }

      if (note.next_session_date || note.areas_to_focus) {
        if (finalY + 12 > pageHeight - 20) {
          doc.addPage();
          finalY = 20;
        }
        doc.setFontSize(8.5);
        doc.setTextColor(107, 114, 128);
        const extraText = [
          note.next_session_date ? `Next Session: ${note.next_session_date}` : null,
          note.areas_to_focus ? `Areas to Focus: ${note.areas_to_focus}` : null,
        ].filter(Boolean).join(" | ");
        doc.text(extraText, 16, finalY + 4);
        finalY += 8;
      }

      // Separator line between sessions
      finalY += 4;
      if (i < notes.length - 1) {
        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.3);
        doc.line(14, finalY, pageWidth - 14, finalY);
        finalY += 8;
      }
    }

    const safeClient = clientName.replace(/[^a-zA-Z0-9_-]/g, "_");
    doc.save(`All_SOAP_Notes_${safeClient}.pdf`);

    if (toast) {
      toast({
        title: "All Notes Exported",
        description: `Successfully exported all ${notes.length} SOAP notes for ${clientName}.`,
      });
    }
  } catch (error: any) {
    console.error("Error exporting all SOAP notes:", error);
    if (toast) {
      toast({
        title: "Export Failed",
        description: error?.message || "Failed to generate comprehensive SOAP notes PDF.",
        variant: "destructive",
      });
    }
  }
};
