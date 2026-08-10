import React, { useState } from "react";
import { CheckCircle2, AlertTriangle, Printer, Camera, PenLine, FileDown, Info, UserCheck } from "lucide-react";
import { saveAs } from "file-saver";
import type { Guard } from "../../types";
import { SignaturePad } from "./SignaturePad";
import { IdCaptureCamera } from "./IdCaptureCamera";
import { CompanyLogo } from "../ui/CompanyLogo";

interface IdentityCardPrintModalProps {
  show: boolean;
  guard: Guard | null;
  onClose: () => void;
  onUpdateGuard?: (guardId: string, updates: Partial<Guard>) => void;
  /** When true (IT verification), the modal is view/verify only — no capture, issuance, or printing. */
  readOnly?: boolean;
  /** Display name of the signing officer (Records Officer who issues the card). */
  issuerName?: string;
}

const CR80_W = 1012; // 85.6mm @ 300 DPI
const CR80_H = 638; // 54mm @ 300 DPI

export const IdentityCardPrintModal: React.FC<IdentityCardPrintModalProps> = ({ show, guard, onClose, onUpdateGuard, readOnly = false, issuerName }) => {
  const [photo, setPhoto] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [issuerSignature, setIssuerSignature] = useState<string | null>(null);
  const [showCapture, setShowCapture] = useState(false);
  const [printerName, setPrinterName] = useState("");
  const [cardSides, setCardSides] = useState<"Single" | "Dual">("Single");
  const [copies, setCopies] = useState(1);
  const [showPrintHelp, setShowPrintHelp] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  if (!show || !guard) return null;

  const effectivePhoto = photo ?? guard.photoUrl;
  const effectiveSignature = signature ?? guard.signatureUrl;
  const effectiveIssuerSignature = issuerSignature ?? guard.idCardIssuerSignatureUrl ?? null;
  const effectiveIssuerName = issuerName ?? guard.idCardIssuerName ?? "Records Officer";
  const isIssued = guard.idCardStatus === "Issued & Active";

  const issue = () => {
    if (onUpdateGuard && issuerName) {
      const today = new Date().toISOString().split("T")[0];
      const exp = new Date();
      exp.setFullYear(exp.getFullYear() + 2);
      const expStr = exp.toISOString().split("T")[0];
      const cardNum = `ID-UG-2026-${guard.guardCode.replace(/\D/g, "") || String(Math.floor(1000 + Math.random() * 9000))}`;
      onUpdateGuard(guard.id, {
        idCardStatus: "Issued & Active",
        idCardNumber: cardNum,
        idCardIssuedDate: today,
        idCardExpiryDate: expStr,
        idCardIssuerName: issuerName,
        ...(photo ? { photoUrl: photo } : {}),
        ...(signature ? { signatureUrl: signature } : {}),
        ...(issuerSignature ? { idCardIssuerSignatureUrl: issuerSignature } : {}),
      });
    }
  };

  const loadImage = (src: string | null | undefined): Promise<HTMLImageElement | null> =>
    new Promise((resolve) => {
      if (!src) {
        resolve(null);
        return;
      }
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });

  const drawCardToCanvas = async (): Promise<HTMLCanvasElement> => {
    const canvas = document.createElement("canvas");
    canvas.width = CR80_W;
    canvas.height = CR80_H;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas unavailable");

    const W = CR80_W;
    const H = CR80_H;

    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#0f172a");
    bg.addColorStop(0.55, "#020617");
    bg.addColorStop(1, "#083344");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 3;
    ctx.strokeRect(6, 6, W - 12, H - 12);

    const [photoImg, holderSigImg, issuerSigImg] = await Promise.all([
      loadImage(effectivePhoto),
      loadImage(effectiveSignature),
      loadImage(effectiveIssuerSignature),
    ]);

    const padX = 34;
    const padY = 30;

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 30px 'Arial Black', Arial, sans-serif";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("INTEGRATED SECURITY COMPANY LTD", padX, padY + 26);
    ctx.fillStyle = "#22d3ee";
    ctx.font = "bold 17px Arial, sans-serif";
    ctx.fillText("LICENSED PRIVATE SECURITY ORGANIZATION", padX, padY + 50);

    const badgeX = W - 190;
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.roundRect(badgeX, padY - 6, 150, 42, 8);
    ctx.fill();
    ctx.fillStyle = "#020617";
    ctx.font = "bold 19px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("OFFICIAL ID", badgeX + 75, padY + 26);
    ctx.textAlign = "left";

    const dividerY = padY + 72;
    ctx.fillStyle = "rgba(148,163,184,0.55)";
    ctx.fillRect(padX, dividerY, W - padX * 2, 1.5);

    const photoX = padX + 10;
    const photoY = dividerY + 26;
    const photoW = 205;
    const photoH = 252;
    ctx.strokeStyle = "#22d3ee";
    ctx.lineWidth = 2.5;
    if (photoImg) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(photoX, photoY, photoW, photoH, 10);
      ctx.clip();
      ctx.drawImage(photoImg, photoX, photoY, photoW, photoH);
      ctx.restore();
      ctx.strokeRect(photoX, photoY, photoW, photoH);
    } else {
      ctx.fillStyle = "#1e293b";
      ctx.beginPath();
      ctx.roundRect(photoX, photoY, photoW, photoH, 10);
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = "#22d3ee";
    ctx.font = "bold 13px Arial, sans-serif";
    ctx.fillText("VERIFIED PHOTO", photoX + 40, photoY + photoH + 18);

    const fieldsX = photoX + photoW + 32;
    const fieldW = W - fieldsX - padX - 8;

    const label = (text: string, y: number) => {
      ctx.fillStyle = "rgba(148,163,184,0.9)";
      ctx.font = "bold 13px Arial, sans-serif";
      ctx.fillText(text.toUpperCase(), fieldsX, y);
    };

    label("Force / Registration No.", photoY + 22);
    ctx.fillStyle = "#22d3ee";
    ctx.font = "bold 25px 'Courier New', monospace";
    ctx.fillText(guard.guardCode, fieldsX, photoY + 52);

    label("Full Names", photoY + 86);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 25px Arial, sans-serif";
    ctx.fillText(guard.fullName.toUpperCase().slice(0, 32), fieldsX, photoY + 116);

    const rowY = photoY + 150;
    const colW = fieldW / 2;
    label("Designation", rowY);
    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 21px Arial, sans-serif";
    ctx.fillText(guard.designation.slice(0, 22), fieldsX, rowY + 30);
    label("NIN No.", fieldsX + colW);
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "bold 19px 'Courier New', monospace";
    ctx.fillText(guard.nationalId.slice(0, 18), fieldsX + colW, rowY + 30);

    let bottomY = rowY + 62;
    if (holderSigImg) {
      label("Holder Signature", bottomY);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(fieldsX, bottomY + 8, 210, 42);
      ctx.drawImage(holderSigImg, fieldsX, bottomY + 8, 210, 42);
      bottomY += 78;
    }

    ctx.fillStyle = "rgba(148,163,184,0.9)";
    ctx.font = "bold 13px Arial, sans-serif";
    ctx.fillText(`ISSUED BY: ${effectiveIssuerName.toUpperCase().slice(0, 26)}`, fieldsX, bottomY + 6);
    if (issuerSigImg) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(fieldsX + 14, bottomY + 14, 200, 40);
      ctx.drawImage(issuerSigImg, fieldsX + 14, bottomY + 14, 200, 40);
    }

    const footY = H - 44;
    ctx.fillStyle = "rgba(226,232,240,0.85)";
    ctx.font = "bold 15px Arial, sans-serif";
    ctx.fillText(`ISSUED: ${guard.idCardIssuedDate || new Date().toISOString().split("T")[0]}`, padX, footY);
    ctx.fillStyle = "#fbbf24";
    ctx.fillText(`EXPIRY: ${guard.idCardExpiryDate || ""}`, padX + 220, footY);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 17px 'Courier New', monospace";
    ctx.fillText("||| | |||| | ||| | ||||", W - 210, footY);

    return canvas;
  };

  const exportPrintReady = async () => {
    try {
      const canvas = await drawCardToCanvas();
      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
      if (!blob) throw new Error("render failed");
      const filename = `${guard.guardCode.replace(/[^a-zA-Z0-9]/g, "")}-identity-card-CR80-300dpi.png`;
      saveAs(blob, filename);
      setExportStatus(`Print-ready card exported: ${filename}${printerName ? ` → ${printerName}` : ""}`);
      setTimeout(() => setExportStatus(null), 6000);
    } catch {
      setExportStatus("Export failed — please try again.");
    }
  };

  const printReady = effectivePhoto && effectiveSignature && effectiveIssuerSignature;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4 sticky top-0 bg-white z-10">
          <div>
            <span className="px-2.5 py-0.5 bg-cyan-100 text-cyan-900 font-extrabold text-[10px] rounded-full uppercase border border-cyan-200">
              {readOnly ? "IT DEPARTMENT • ID VERIFICATION" : "RECORDS OFFICE • ID MODULE"}
            </span>
            <h3 className="text-lg font-black text-slate-900 mt-1">
              Official High-Security PVC Identity Card
            </h3>
          </div>
          <button onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer p-1">✕</button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-slate-500 tracking-wider">
              Live Identity Card Preview (PVC CR80 Format)
            </span>
            <span className={`px-2 py-0.5 text-[10px] font-black rounded-full uppercase ${
              isIssued
                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                : "bg-amber-100 text-amber-900 border border-amber-300"
            }`}>
              Status: {guard.idCardStatus || "Pending Records Issuance"}
            </span>
          </div>

          <div className="relative w-full max-w-md mx-auto aspect-[1.586] rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 text-white p-4 shadow-xl border-2 border-amber-400/80 overflow-hidden flex flex-col justify-between">
            <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-slate-700/80 pb-2 relative z-10">
              <div className="flex items-center gap-2">
                <CompanyLogo imgClassName="w-7 h-7 object-contain rounded-md" iconClassName="w-4 h-4" />
                <div>
                  <span className="font-black text-xs tracking-wider text-white block leading-tight">
                    INTEGRATED SECURITY COMPANY LTD
                  </span>
                  <span className="text-[8px] text-cyan-300 font-bold block tracking-tight">
                    LICENSED PRIVATE SECURITY ORGANIZATION
                  </span>
                </div>
              </div>
              <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 border border-amber-300">
                OFFICIAL ID
              </span>
            </div>

            <div className="grid grid-cols-12 gap-3 items-center my-auto relative z-10">
              <div className="col-span-4 flex flex-col items-center">
                <div className="w-20 h-24 rounded-xl bg-slate-800 overflow-hidden border-2 border-cyan-400 shadow-md flex items-center justify-center">
                  {effectivePhoto ? (
                    <img src={effectivePhoto} alt={guard.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-black text-white">{guard.fullName.substring(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <span className="text-[7px] text-cyan-400 font-mono mt-1 tracking-tight">VERIFIED PHOTO</span>
              </div>

              <div className="col-span-8 space-y-1">
                <div>
                  <span className="text-[7px] text-slate-400 uppercase font-bold block">FORCE / REGISTRATION NO.</span>
                  <span className="text-xs font-black text-cyan-300 font-mono bg-slate-800/80 px-2 py-0.5 rounded border border-cyan-500/30 inline-block">
                    {guard.guardCode}
                  </span>
                </div>
                <div>
                  <span className="text-[7px] text-slate-400 uppercase font-bold block">FULL NAMES</span>
                  <span className="text-xs font-black text-white block leading-tight uppercase">{guard.fullName}</span>
                </div>
                <div className="grid grid-cols-2 gap-1 pt-0.5">
                  <div>
                    <span className="text-[7px] text-slate-400 uppercase font-bold block">DESIGNATION</span>
                    <span className="text-[10px] font-bold text-amber-300 block">{guard.designation}</span>
                  </div>
                  <div>
                    <span className="text-[7px] text-slate-400 uppercase font-bold block">NIN NO.</span>
                    <span className="text-[9px] font-mono font-bold text-slate-200 block">{guard.nationalId}</span>
                  </div>
                </div>
                {effectiveSignature && (
                  <div>
                    <span className="text-[7px] text-slate-400 uppercase font-bold block">HOLDER SIGNATURE</span>
                    <img src={effectiveSignature} alt="Holder signature" className="h-6 bg-white rounded-sm mt-0.5" />
                  </div>
                )}
                {effectiveIssuerSignature && (
                  <div className="pt-0.5">
                    <span className="text-[7px] text-slate-400 uppercase font-bold block">ISSUED BY {effectiveIssuerName.toUpperCase()} (RECORDS OFFICER)</span>
                    <img src={effectiveIssuerSignature} alt="Issuer signature" className="h-5 bg-white rounded-sm mt-0.5" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-700/80 pt-1.5 relative z-10 text-[8px]">
              <div>
                <span className="text-slate-400 block font-bold">ISSUED: <strong className="text-white">{guard.idCardIssuedDate || "2026-07-28"}</strong></span>
              </div>
              <div>
                <span className="text-slate-400 block font-bold">EXPIRY: <strong className="text-amber-300">{guard.idCardExpiryDate || "2028-07-28"}</strong></span>
              </div>
              <div className="bg-white px-1 py-0.5 rounded flex items-center gap-0.5">
                <span className="font-mono text-[7px] text-slate-900 font-black">||| | |||| | |||</span>
              </div>
            </div>
          </div>
        </div>

        {readOnly ? (
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-cyan-600" />
              Genuineness Verification Summary
            </h4>
            <dl className="grid sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <dt className="text-[10px] uppercase font-black text-slate-500">Card Number</dt>
                <dd className="font-mono font-extrabold text-slate-900 mt-0.5">{guard.idCardNumber || "Not issued yet"}</dd>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <dt className="text-[10px] uppercase font-black text-slate-500">Status</dt>
                <dd className="font-bold text-slate-900 mt-0.5">{guard.idCardStatus || "Pending Records Issuance"}</dd>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <dt className="text-[10px] uppercase font-black text-slate-500">Issued On</dt>
                <dd className="font-bold text-slate-900 mt-0.5">{guard.idCardIssuedDate || "—"}</dd>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <dt className="text-[10px] uppercase font-black text-slate-500">Expires On</dt>
                <dd className="font-bold text-slate-900 mt-0.5">{guard.idCardExpiryDate || "—"}</dd>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 sm:col-span-2">
                <dt className="text-[10px] uppercase font-black text-slate-500">Issued By (Records Officer)</dt>
                <dd className="font-bold text-slate-900 mt-0.5">
                  {guard.idCardIssuerName || "—"} {guard.idCardIssuerSignatureUrl && "· Signature verified on file"}
                </dd>
              </div>
            </dl>
            <p className="text-[10px] text-slate-500 font-semibold inline-flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-cyan-500" />
              Cross-check the card number, photo, holder signature and Records Officer issuer signature against this card before accepting it as genuine.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Camera className="w-4 h-4 text-cyan-600" />
                ID Holder Photo & Signature Capture
              </h4>
              {!showCapture && (
                <button
                  onClick={() => setShowCapture(true)}
                  className="w-full px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>{isIssued ? "Re-capture Holder Photo & Signature" : "Capture ID Holder Photo & Signature (Required before issuance)"}</span>
                </button>
              )}
              {showCapture && (
                <div className="grid md:grid-cols-2 gap-5">
                  <IdCaptureCamera onCapture={setPhoto} initial={guard.photoUrl} />
                  <SignaturePad onChange={setSignature} initial={guard.signatureUrl} holderName={guard.fullName} />
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <PenLine className="w-4 h-4 text-amber-500" />
                Issuer Signature — {issuerName || "Records Officer"}
              </h4>
              <SignaturePad onChange={setIssuerSignature} initial={guard.idCardIssuerSignatureUrl} holderName={issuerName || "Records Officer (Issuer)"} />
              <p className="text-[10px] text-slate-500 font-semibold">
                The issuing Records Officer signs here to authorize the card. This signature is printed on the card and stored for verification.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                IT Identity Card Management Actions
              </h4>
              <div className="flex flex-wrap gap-2">
                {!isIssued ? (
                  <button
                    onClick={issue}
                    disabled={!effectivePhoto || !effectiveSignature || !effectiveIssuerSignature}
                    title={(!effectivePhoto || !effectiveSignature || !effectiveIssuerSignature) ? "Capture the holder's photo, holder signature and issuer signature first" : undefined}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve & Issue Official Identity Card</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (onUpdateGuard) {
                        onUpdateGuard(guard.id, { idCardStatus: "Revoked" });
                      }
                    }}
                    className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Revoke / Cancel Identity Card</span>
                  </button>
                )}
              </div>

              <div className="border-t border-slate-200 pt-3 space-y-3">
                <div className="flex flex-wrap items-end gap-3">
                  <label className="flex-1 min-w-[180px] block">
                    <span className="text-[10px] font-black uppercase text-slate-500 block mb-1">Printer Name</span>
                    <input
                      type="text"
                      value={printerName}
                      onChange={(e) => setPrinterName(e.target.value)}
                      placeholder="e.g. Magicard Enduro 3E (USB)"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-black uppercase text-slate-500 block mb-1">Sides</span>
                    <select
                      value={cardSides}
                      onChange={(e) => setCardSides(e.target.value as "Single" | "Dual")}
                      className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="Single">Single-sided</option>
                      <option value="Dual">Dual-sided</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-black uppercase text-slate-500 block mb-1">Copies</span>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={copies}
                      onChange={(e) => setCopies(Math.max(1, Number(e.target.value)))}
                      className="w-20 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </label>
                  <button
                    onClick={exportPrintReady}
                    disabled={!printReady}
                    title={!printReady ? "Capture the holder photo, holder signature and issuer signature first" : undefined}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <FileDown className="w-4 h-4 text-cyan-400" />
                    <span>Prepare {cardSides.toLowerCase()}-sided × {copies} for Printer</span>
                  </button>
                  <button
                    onClick={() => setShowPrintHelp(true)}
                    className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Setup Guide</span>
                  </button>
                </div>
                {exportStatus && (
                  <p className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 inline-block">
                    {exportStatus}
                  </p>
                )}
                <p className="text-[10px] text-slate-500 font-semibold flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-cyan-500 shrink-0 mt-0.5" />
                  Browsers cannot drive ID card printers directly. This exports a print-ready CR80 card image at 300 DPI which the card printer's vendor software (e.g. Magicard / Fargo driver) prints onto blank PVC cards.
                </p>
              </div>
            </div>
          </>
        )}
        </div>

        {showPrintHelp && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">PVC Card Printing Setup Guide</h4>
                <button onClick={() => setShowPrintHelp(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer p-1">✕</button>
              </div>
              <ol className="space-y-2 text-xs text-slate-700 font-medium">
                <li className="flex gap-2"><span className="font-black text-cyan-700">1.</span> Install the card printer's vendor driver & software (Magicard / Fargo / Evolis).</li>
                <li className="flex gap-2"><span className="font-black text-cyan-700">2.</span> Load blank CR80 PVC cards into the printer input tray and install the correct YMCKO ribbon panel.</li>
                <li className="flex gap-2"><span className="font-black text-cyan-700">3.</span> Click "Prepare ... for Printer" to export the print-ready 300 DPI card image (PNG).</li>
                <li className="flex gap-2"><span className="font-black text-cyan-700">4.</span> Open the exported PNG in the vendor software and print {cardSides.toLowerCase()}-sided at actual size (85.6 × 54 mm).</li>
                <li className="flex gap-2"><span className="font-black text-cyan-700">5.</span> Set copies to {copies} and run the print job. Keep the cleaning kit handy between card batches.</li>
              </ol>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900 font-semibold">
                <strong>Affordable printers (under $1,000):</strong> Magicard Enduro 3E (~$750–850), Fargo DTC1250e (~$600–700), Fargo DTC4250e (~$850–950), Evolis Elypso (~$800–950). Consumables: YMCKO ribbon (~$30–50 per ~200 cards) + CR80 blank cards.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
