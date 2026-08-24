/**
 * Pass-Out Certificate (PDF) — issued by the Training Officer at pass-out.
 * Client-side jsPDF, same pattern as IdentityCardPrintModal. The subject is
 * the EXISTING SecurityOfficer record created by HR at recruitment.
 */
import { jsPDF } from "jspdf";
import { LEGAL_COMPANY_NAME, COMPANY_CONTACT, COMPANY_RETURN_LOCATION } from "../constants/branding";

export interface PassOutCertificateData {
  fullName: string;
  forceNumber: string;
  nationalId?: string;
  passedOutDate: string; // ISO yyyy-mm-dd
  cohortName?: string;
  drillScore: number;
  marksmanshipScore: number;
  theoryScore: number;
  overallScore: number;
  trainingOfficerName: string;
}

const fmtDate = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });

export function downloadPassOutCertificate(d: PassOutCertificateData): void {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Border frame
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(1.4);
  doc.rect(10, 10, W - 20, H - 20);
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.5);
  doc.rect(13.5, 13.5, W - 27, H - 27);

  // Header — company
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42);
  doc.text(LEGAL_COMPANY_NAME.toUpperCase(), W / 2, 30, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(COMPANY_RETURN_LOCATION, W / 2, 36, { align: "center" });
  doc.text(COMPANY_CONTACT, W / 2, 41, { align: "center" });

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(5, 150, 105);
  doc.text("PASS-OUT CERTIFICATE", W / 2, 60, { align: "center" });
  doc.setDrawColor(5, 150, 105);
  doc.setLineWidth(0.8);
  doc.line(W / 2 - 45, 65, W / 2 + 45, 65);

  // Body
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  doc.text("This is to certify that", W / 2, 78, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42);
  doc.text(d.fullName, W / 2, 90, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  const lines = [
    `Force Number: ${d.forceNumber}${d.nationalId ? `    NIN: ${d.nationalId}` : ""}`,
    d.cohortName ? `has successfully completed recruit training with ${d.cohortName}` : "has successfully completed recruit training at the Training School",
    `and was passed out on ${fmtDate(d.passedOutDate)}.`,
  ];
  doc.text(lines[0], W / 2, 101, { align: "center" });
  doc.text(lines[1], W / 2, 108, { align: "center" });
  doc.text(lines[2], W / 2, 115, { align: "center" });

  // Scores table
  const rows: [string, string][] = [
    ["Drill & Parade", `${d.drillScore}%`],
    ["Marksmanship", `${d.marksmanshipScore}%`],
    ["Theory", `${d.theoryScore}%`],
    ["Overall Score", `${d.overallScore}%`],
  ];
  let y = 128;
  for (const [label, value] of rows) {
    const isOverall = label === "Overall Score";
    doc.setFillColor(isOverall ? 236 : 248, isOverall ? 253 : 250, isOverall ? 245 : 252);
    doc.roundedRect(W / 2 - 55, y, 110, 8.5, 2, 2, "F");
    doc.setFont("helvetica", isOverall ? "bold" : "normal");
    doc.setFontSize(isOverall ? 11 : 10);
    doc.setTextColor(51, 65, 85);
    doc.text(label, W / 2 - 50, y + 6);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(isOverall ? 5 : 15, isOverall ? 150 : 23, isOverall ? 105 : 42);
    doc.text(value, W / 2 + 50, y + 6, { align: "right" });
    y += 11;
  }

  // Signature blocks
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.3);
  doc.line(40, H - 38, 95, H - 38);
  doc.line(W - 95, H - 38, W - 40, H - 38);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(d.trainingOfficerName, 67.5, H - 33, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Training Officer", 67.5, H - 28.5, { align: "center" });
  doc.text(`Date: ${fmtDate(d.passedOutDate)}`, W - 67.5, H - 28.5, { align: "center" });
  doc.text("Authorised Signatory", W - 67.5, H - 33, { align: "center" });
  doc.text("", W - 67.5, H - 24);

  // Footer note
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Issued under the Integrated Security Company Management System • Certificate reference PSG-PO-${d.passedOutDate.replace(/-/g, "")}-${d.forceNumber.replace(/[^A-Z0-9]/gi, "")}`,
    W / 2,
    H - 17,
    { align: "center" }
  );

  doc.save(`Pass-Out-Certificate-${d.forceNumber.replace(/[^A-Za-z0-9]/g, "-")}.pdf`);
}
