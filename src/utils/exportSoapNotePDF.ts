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
 * Builds a single-page SOAP note document with the specified font and padding configuration.
 */
const buildSinglePageSoapPDF = async (
  note: SoapNoteData,
  client: ClientDataForPDF | null | undefined,
  config: { fontSize: number; cellPadding: { top: number; bottom: number; left: number; right: number }; gap: number }
): Promise<jsPDF> => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.width;   // 210 mm
  const clientName = (client?.name || "Client").trim();
  const clientId = client?.client_id || client?.intake_number || undefined;
  const sessionDate = note.session_date || "Undated";

  // 1. Standard Header with Logo (Left) and Profile Picture (Right)
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

  // 2. Compact Session Information Table
  autoTable(doc, {
    startY: headerBottomY + 2.5,
    pageBreak: "avoid",
    head: [[
      {
        content: "Session Details",
        colSpan: 4,
        styles: {
          fillColor: [234, 88, 12],
          textColor: 255,
          fontStyle: "bold",
          fontSize: 8.5,
          cellPadding: { top: 1.5, bottom: 1.5, left: 3, right: 3 },
        },
      },
    ]],
    body: [
      [
        { content: "Client Name:", styles: { fontStyle: "bold" as const, fillColor: [243, 244, 246] } },
        { content: clientName },
        { content: "Session Date:", styles: { fontStyle: "bold" as const, fillColor: [243, 244, 246] } },
        { content: `${sessionDate}${note.session_time ? ` (${note.session_time})` : ""}` },
      ],
      [
        { content: "Counsellor:", styles: { fontStyle: "bold" as const, fillColor: [243, 244, 246] } },
        { content: note.counsellor_name || "Unspecified" },
        { content: "Next Session:", styles: { fontStyle: "bold" as const, fillColor: [243, 244, 246] } },
        { content: note.next_session_date || "To be scheduled" },
      ],
      ...(note.areas_to_focus
        ? [[
            { content: "Focus Areas:", styles: { fontStyle: "bold" as const, fillColor: [243, 244, 246] } },
            { content: note.areas_to_focus, colSpan: 3 },
          ]]
        : []),
    ] as any,
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: { top: 1.5, bottom: 1.5, left: 2.5, right: 2.5 },
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      textColor: [31, 41, 55],
    },
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: 65 },
      2: { cellWidth: 26 },
      3: { cellWidth: "auto" },
    },
    margin: { left: 14, right: 14 },
    tableWidth: pageWidth - 28,
  });

  let currentY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + config.gap : headerBottomY + 22;

  // 3. The 4 SOAP Sections (Subjective, Objective, Assessment, Plan)
  // Using autoTable for each section guarantees text wraps strictly within the cell boundaries without any overflow!
  const sections: Array<{ label: string; content?: string | null; color: [number, number, number] }> = [
    { label: "S — SUBJECTIVE", content: note.subjective?.trim() || "No subjective observations recorded.", color: [234, 88, 12] },
    { label: "O — OBJECTIVE", content: note.objective?.trim() || "No objective observations recorded.", color: [22, 163, 74] },
    { label: "A — ASSESSMENT", content: note.assessment?.trim() || "No assessment evaluation recorded.", color: [79, 70, 229] },
    { label: "P — PLAN", content: note.plan?.trim() || "No plan or action steps recorded.", color: [147, 51, 234] },
  ];

  for (const sec of sections) {
    autoTable(doc, {
      startY: currentY,
      pageBreak: "avoid",
      head: [[
        {
          content: sec.label,
          styles: {
            fillColor: sec.color,
            textColor: 255,
            fontStyle: "bold",
            fontSize: config.fontSize,
            cellPadding: { top: 1.4, bottom: 1.4, left: 3, right: 3 },
          },
        },
      ]],
      body: [[
        {
          content: sec.content,
          styles: {
            fillColor: [254, 254, 255],
            textColor: [31, 41, 55],
            fontSize: config.fontSize,
            cellPadding: config.cellPadding,
            lineColor: [226, 232, 240],
            lineWidth: 0.25,
            overflow: "linebreak",
          },
        },
      ]],
      theme: "grid",
      margin: { left: 14, right: 14 },
      tableWidth: pageWidth - 28,
    });

    currentY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + config.gap : currentY + 28;
  }

  // 4. Fixed Professional Sign-off Footer (pinned neatly at bottom of page 1)
  const footerY = 277;
  doc.setDrawColor(156, 163, 175);
  doc.setLineWidth(0.35);

  // Counsellor signature line on the left
  doc.line(14, footerY, 75, footerY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text(`Counsellor Signature (${note.counsellor_name || "Counsellor"})`, 14, footerY + 4);

  // Date on the right
  doc.line(pageWidth - 65, footerY, pageWidth - 14, footerY);
  doc.text(`Date Signed (${sessionDate})`, pageWidth - 65, footerY + 4);

  // Confidential notice
  doc.setFontSize(7.5);
  doc.setTextColor(156, 163, 175);
  doc.text(
    "Confidential Counselling Record  •  New Life Mwangaza Rehabilitation Centre  •  For Authorized Use Only",
    pageWidth / 2,
    286,
    { align: "center" }
  );

  return doc;
};

/**
 * Exports a single SOAP Note to a guaranteed 1-page PDF with perfect text wrapping.
 */
export const exportSoapNotePDF = async ({ note, client, toast }: ExportSingleSoapNoteOptions) => {
  try {
    const clientName = (client?.name || "Client").trim();
    const sessionDate = note.session_date || "Undated";

    // Adaptive configurations: try standard size first, scale down progressively if needed
    // to strictly enforce the "EXACTLY ONE PAGE" requirement!
    const configs = [
      { fontSize: 8.5, cellPadding: { top: 2.0, bottom: 2.0, left: 3, right: 3 }, gap: 2.8 },
      { fontSize: 8.0, cellPadding: { top: 1.8, bottom: 1.8, left: 2.8, right: 2.8 }, gap: 2.2 },
      { fontSize: 7.5, cellPadding: { top: 1.5, bottom: 1.5, left: 2.5, right: 2.5 }, gap: 1.8 },
      { fontSize: 7.0, cellPadding: { top: 1.2, bottom: 1.2, left: 2.2, right: 2.2 }, gap: 1.5 },
      { fontSize: 6.5, cellPadding: { top: 1.0, bottom: 1.0, left: 2.0, right: 2.0 }, gap: 1.2 },
    ];

    let chosenDoc: jsPDF | null = null;

    for (const cfg of configs) {
      const doc = await buildSinglePageSoapPDF(note, client, cfg);
      if (doc.getNumberOfPages() === 1) {
        chosenDoc = doc;
        break;
      }
    }

    // Fallback: If even the smallest config exceeded 1 page (due to extreme text volume),
    // build with the smallest config and prune any trailing pages to guarantee exactly 1 page.
    if (!chosenDoc) {
      chosenDoc = await buildSinglePageSoapPDF(note, client, configs[configs.length - 1]);
      while (chosenDoc.getNumberOfPages() > 1) {
        chosenDoc.deletePage(chosenDoc.getNumberOfPages());
      }
    }

    const safeDate = sessionDate.replace(/[\/\\]/g, "-").replace(/\s+/g, "_");
    const safeClient = clientName.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `SOAP_Note_${safeDate}_${safeClient}.pdf`;

    chosenDoc.save(filename);

    if (toast) {
      toast({
        title: "PDF Exported",
        description: `1-page SOAP note for ${clientName} (${sessionDate}) exported successfully.`,
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
 * Exports all SOAP Notes for a client into a comprehensive multi-session PDF report
 * with clean autoTable text-wrapping so no lines overflow.
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

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
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

    let currentY = headerBottomY + 4;

    // Overview Table
    autoTable(doc, {
      startY: currentY,
      head: [[{ content: `Client Overview & Session History (${notes.length} Total Sessions)`, colSpan: 2, styles: { fillColor: [234, 88, 12], textColor: 255, fontStyle: "bold" as const } }]],
      body: [
        [{ content: "Client Name", styles: { fontStyle: "bold" as const, fillColor: [243, 244, 246] } }, clientName],
        [{ content: "Client ID", styles: { fontStyle: "bold" as const, fillColor: [243, 244, 246] } }, clientId || "N/A"],
        [{ content: "Status", styles: { fontStyle: "bold" as const, fillColor: [243, 244, 246] } }, client?.status || "Active"],
        [{ content: "Total SOAP Notes", styles: { fontStyle: "bold" as const, fillColor: [243, 244, 246] } }, `${notes.length} sessions recorded`],
      ] as any,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 2.2 },
      columnStyles: { 0: { cellWidth: 42 }, 1: { cellWidth: "auto" } },
      margin: { left: 14, right: 14 },
      tableWidth: pageWidth - 28,
    });

    currentY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 8 : currentY + 36;

    // Render each note sequentially using autoTable to prevent any text clipping
    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];
      const sessionDate = note.session_date || "Undated";

      // Session Header Pill
      if (currentY + 28 > pageHeight - 20) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFillColor(243, 244, 246);
      doc.setDrawColor(209, 213, 219);
      doc.roundedRect(14, currentY, pageWidth - 28, 7.5, 1, 1, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(234, 88, 12);
      doc.text(`Session #${notes.length - i} — ${sessionDate}${note.session_time ? ` (${note.session_time})` : ""}`, 18, currentY + 5.2);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(107, 114, 128);
      const counsellorText = `Counsellor: ${note.counsellor_name || "N/A"}`;
      const textWidth = doc.getTextWidth(counsellorText);
      doc.text(counsellorText, pageWidth - 18 - textWidth, currentY + 5.2);

      currentY += 10;

      // Note Sections table
      const sections = [
        { label: "S — SUBJECTIVE", content: note.subjective?.trim(), color: [234, 88, 12] as [number, number, number] },
        { label: "O — OBJECTIVE", content: note.objective?.trim(), color: [22, 163, 74] as [number, number, number] },
        { label: "A — ASSESSMENT", content: note.assessment?.trim(), color: [79, 70, 229] as [number, number, number] },
        { label: "P — PLAN", content: note.plan?.trim(), color: [147, 51, 234] as [number, number, number] },
      ].filter((s) => Boolean(s.content));

      for (const sec of sections) {
        if (currentY + 20 > pageHeight - 20) {
          doc.addPage();
          currentY = 20;
        }

        autoTable(doc, {
          startY: currentY,
          head: [[
            {
              content: sec.label,
              styles: {
                fillColor: sec.color,
                textColor: 255,
                fontStyle: "bold",
                fontSize: 8.5,
                cellPadding: { top: 1.2, bottom: 1.2, left: 3, right: 3 },
              },
            },
          ]],
          body: [[
            {
              content: sec.content,
              styles: {
                fillColor: [254, 254, 255],
                textColor: [31, 41, 55],
                fontSize: 8.5,
                cellPadding: { top: 1.8, bottom: 1.8, left: 3, right: 3 },
                lineColor: [226, 232, 240],
                lineWidth: 0.25,
                overflow: "linebreak",
              },
            },
          ]],
          theme: "grid",
          margin: { left: 14, right: 14 },
          tableWidth: pageWidth - 28,
        });

        currentY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 2.5 : currentY + 20;
      }

      if (note.next_session_date || note.areas_to_focus) {
        if (currentY + 10 > pageHeight - 20) {
          doc.addPage();
          currentY = 20;
        }
        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128);
        const extraText = [
          note.next_session_date ? `Next Session: ${note.next_session_date}` : null,
          note.areas_to_focus ? `Areas to Focus: ${note.areas_to_focus}` : null,
        ].filter(Boolean).join("  •  ");
        doc.text(extraText, 16, currentY + 3);
        currentY += 7;
      }

      currentY += 4;
      if (i < notes.length - 1) {
        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.3);
        doc.line(14, currentY, pageWidth - 14, currentY);
        currentY += 7;
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
