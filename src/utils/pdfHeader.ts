import jsPDF from "jspdf";

export interface DrawPDFHeaderOptions {
  doc: jsPDF;
  title: string;
  subtitle?: string;
  clientName?: string;
  clientId?: string;
  clientStatus?: string;
  profilePictureUrl?: string | null;
  logoUrl?: string;
  dateText?: string;
}

const imageCache = new Map<string, string>();

/**
 * Converts an image URL (relative, absolute, or data URL) into base64 data URL
 * compatible with jsPDF.addImage.
 */
export const getBase64Image = async (urlOrData: string): Promise<string | null> => {
  if (!urlOrData) return null;
  if (urlOrData.startsWith("data:")) return urlOrData;

  if (imageCache.has(urlOrData)) {
    return imageCache.get(urlOrData)!;
  }

  // 1. Try standard fetch as blob -> FileReader
  try {
    const response = await fetch(urlOrData, { mode: "cors" });
    if (response.ok) {
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      if (base64) {
        imageCache.set(urlOrData, base64);
        return base64;
      }
    }
  } catch {
    // Continue to canvas fallback
  }

  // 2. Fallback to HTMLImageElement + canvas
  return new Promise<string | null>((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
            imageCache.set(urlOrData, dataUrl);
            resolve(dataUrl);
            return;
          }
        } catch {
          // Canvas tainted or unavailable
        }
        resolve(null);
      };
      img.onerror = () => resolve(null);
      img.src = urlOrData;
    } catch {
      resolve(null);
    }
  });
};

/**
 * Draws a standardized header on a jsPDF document:
 * - Logo on the LEFT side
 * - Client profile picture on the RIGHT side
 * - Organization name and document title centered between them
 *
 * @returns The final Y coordinate (in mm) below the header and separator line
 */
export const drawPDFHeader = async (options: DrawPDFHeaderOptions): Promise<number> => {
  const {
    doc,
    title,
    subtitle = "New Life Mwangaza Rehabilitation Centre",
    clientName,
    clientId,
    clientStatus,
    profilePictureUrl,
    logoUrl = "/mwangaza_logo.png",
    dateText = `Generated on: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}`,
  } = options;

  const pageWidth = doc.internal.pageSize.width;
  const leftMargin = 14;
  const rightMargin = 14;
  const topY = 12;

  // 1. Logo on LEFT side
  const logoWidth = 28;
  const logoHeight = 28;
  try {
    const logoData = await getBase64Image(logoUrl);
    if (logoData) {
      doc.addImage(logoData, "PNG", leftMargin, topY, logoWidth, logoHeight);
    }
  } catch (err) {
    console.warn("Could not load logo in PDF header", err);
  }

  // 2. Profile picture on RIGHT side (standard 26x32mm passport aspect ratio)
  const photoWidth = 26;
  const photoHeight = 32;
  const photoX = pageWidth - rightMargin - photoWidth;
  const photoY = topY;

  let hasPhoto = false;
  if (profilePictureUrl) {
    try {
      const photoData = await getBase64Image(profilePictureUrl);
      if (photoData) {
        doc.addImage(photoData, "JPEG", photoX, photoY, photoWidth, photoHeight);
        doc.setDrawColor(203, 213, 225); // slate-300
        doc.setLineWidth(0.3);
        doc.rect(photoX, photoY, photoWidth, photoHeight);
        hasPhoto = true;
      }
    } catch (err) {
      console.warn("Could not load profile photo in PDF header", err);
    }
  }

  // Draw clean placeholder if no profile photo was rendered
  if (!hasPhoto && (clientName || profilePictureUrl !== undefined)) {
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.3);
    doc.rect(photoX, photoY, photoWidth, photoHeight, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text("Passport", photoX + photoWidth / 2, photoY + 14, { align: "center" });
    doc.text("Photo", photoX + photoWidth / 2, photoY + 19, { align: "center" });
  }

  // 3. Centered Content (between logo and photo)
  const centerX = pageWidth / 2;

  // Organization Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13.5);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(subtitle, centerX, topY + 5, { align: "center" });

  // Document Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  doc.setTextColor(79, 70, 229); // indigo-600
  doc.text(title, centerX, topY + 12, { align: "center" });

  // Client Details
  if (clientName) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85); // slate-700
    const idSnippet = clientId ? `  (ID: ${clientId})` : "";
    doc.text(`${clientName}${idSnippet}`, centerX, topY + 18, { align: "center" });
  }

  // Additional Meta: Date & Status
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // slate-500
  const metaText = clientStatus ? `${dateText}  •  Status: ${clientStatus}` : dateText;
  doc.text(metaText, centerX, topY + (clientName ? 24 : 18), { align: "center" });

  // 4. Subtle horizontal dividing rule
  const headerBottom = Math.max(topY + logoHeight, topY + photoHeight, topY + 28);
  const lineY = headerBottom + 4;
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.4);
  doc.line(leftMargin, lineY, pageWidth - rightMargin, lineY);

  return lineY;
};
