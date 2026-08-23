import React from "react";
import { FileText, Printer, X, Download } from "lucide-react";
import type { DisciplinaryAction } from "../../types";

interface ChargeSheetModalProps {
  action: DisciplinaryAction | null;
  onClose: () => void;
}

const Row: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
  <div className="flex justify-between gap-4 py-1.5 border-b border-dotted border-slate-200 text-xs">
    <span className="font-bold text-slate-500 shrink-0">{label}</span>
    <span className="font-semibold text-slate-900 text-right">{value?.trim() ? value : "—"}</span>
  </div>
);

/**
 * Formal charge sheet viewer. Force Number is the primary employee identifier.
 * Pre-finalization: browser-print preview. Finalized: offers the archived canonical PDF.
 */
export const ChargeSheetModal: React.FC<ChargeSheetModalProps> = ({ action, onClose }) => {
  if (!action) return null;

  const printSheet = () => {
    const w = window.open("", "_blank", "width=800,height=900");
    if (!w) return;
    const esc = (s?: string | null) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const row = (l: string, v?: string | null) =>
      `<div class="row"><span>${esc(l)}</span><span>${esc(v && v.trim() ? v : "—")}</span></div>`;
    const priorRows = (action.priorHistory || [])
      .map((p) => `<div class="clause" style="font-size:12px">• ${esc(p)}</div>`)
      .join("");
    w.document.write(`<!DOCTYPE html><html><head><title>Charge Sheet ${esc(action.actionCode)}</title>
<style>body{font-family:'Times New Roman',serif;color:#111;margin:48px;line-height:1.6}.head{text-align:center;border-bottom:3px double #1e3a5f;padding-bottom:16px;margin-bottom:28px}.head h1{margin:0;font-size:24px;letter-spacing:1px;color:#1e3a5f}.head p{margin:2px 0;font-size:12px}h2{font-size:15px;border-bottom:1px solid #999;padding-bottom:4px;margin-top:26px;text-transform:uppercase}.row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dotted #ccc;font-size:13px}.row span:first-child{color:#444;font-weight:bold}.clause{font-size:13px;text-align:justify;margin:8px 0}.sig{margin-top:56px;display:flex;flex-wrap:wrap;gap:24px}.sig div{width:44%;text-align:center}.sig .line{border-top:1px solid #000;margin-top:44px;padding-top:6px;font-size:11px}@media print{body{margin:24px}}</style></head><body>
<div class="head"><h1>INTEGRATED SECURITY COMPANY LTD</h1><p>DISCIPLINARY CHARGE SHEET</p><p>Ref: <b>${esc(action.actionCode)}</b> &nbsp;·&nbsp; Issued: ${esc(action.createdAt?.split("T")[0])}${action.archivedPdfPath ? " &nbsp;·&nbsp; Canonical PDF on file" : ""}</p></div>
<h2>1. Employee Particulars</h2>
${row("Name", action.securityOfficerName)}${row("Force Number", action.forceNumber)}${row("Rank / Designation", action.securityOfficerDesignation)}${row("Station / Site", action.securityOfficerSite)}
<h2>2. Offence</h2>
${row("Category", action.offenceCategory)}${row("Offence", action.offence)}${row("Date of Offence", action.offenceDate)}${row("Time", action.offenceTime)}${row("Zone / Location", action.zone)}
<h2>3. Particulars of Allegation (Grounds)</h2>
<div class="clause">${esc(action.reason)}</div>
${action.linkedIncidentCode || action.linkedComplaintCode ? `<h2>4. Linked Records</h2>${action.linkedIncidentCode ? `<div class="clause"><b>Incident:</b> ${esc(action.linkedIncidentCode)} — ${esc(action.linkedIncidentTitle || "")}<br/>${esc(action.linkedIncidentDescription || "")}</div>` : ""}${action.linkedComplaintCode ? `<div class="clause"><b>Complaint:</b> ${esc(action.linkedComplaintCode)} — ${esc(action.linkedComplaintClient || "")} (${esc(action.linkedComplaintSite || "")})<br/>${esc(action.linkedComplaintDescription || "")}</div>` : ""}` : ""}
<h2>5. Previous Disciplinary Record</h2>
${priorRows || '<div class="clause">No previous disciplinary actions on record.</div>'}
<h2>6. Hearing &amp; Employee Response</h2>
${row("Hearing Date", action.hearingDate)}
${action.employeeResponse ? `<div class="clause">"${esc(action.employeeResponse)}"</div>${row("Recorded By", [action.responseRecordedBy, action.responseRecordedAt].filter(Boolean).join(" · "))}` : '<div class="clause"><i>No employee response recorded.</i></div>'}
<h2>7. Decision &amp; Action Taken</h2>
${row("Decision", action.actionType)}${row("Severity", action.severity)}${row("Action Taken", action.actionTaken)}${action.fineAmountUgx ? row("Fine", `${action.fineAmountUgx.toLocaleString("en-UG")}/=`) : ""}${row("Received By", action.receivedBy)}
<h2>8. Approval Trail</h2>
${row("Initiated By (Investigations)", action.initiatedBy)}${row("Regional Manager", action.regionalApprovedBy)}${row("Operations Manager", action.operationsApprovedBy)}${row("HR Manager (Final)", action.hrApprovedBy)}${row("Finalized On", action.approvedAt)}
<div class="sig">
<div><b>Investigations Officer</b><div class="line">Signature &amp; Date</div></div>
<div><b>Regional Manager</b><div class="line">Signature &amp; Date</div></div>
<div><b>Operations Manager</b><div class="line">Signature &amp; Date</div></div>
<div><b>HR Manager</b><div class="line">Signature &amp; Date</div></div>
<div style="width:100%"><b>Employee Acknowledgement — Force No. ${esc(action.forceNumber)}</b><div class="line">Signature confirms receipt; not an admission</div></div>
</div>
<p style="text-align:center;font-size:10px;color:#777;margin-top:36px">Generated ${new Date().toISOString().split("T")[0]} • ISCMS Disciplinary Register</p>
<script>window.onload=function(){setTimeout(function(){window.print();},400);};</script>
</body></html>`);
    w.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-red-600" />
            Charge Sheet {action.actionCode}
            {action.archivedPdfPath && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-wider">Canonical PDF Filed</span>
            )}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 pt-1">Employee Particulars</p>
          <Row label="Name" value={action.securityOfficerName} />
          <Row label="Force Number" value={action.forceNumber} />
          <Row label="Rank / Designation" value={action.securityOfficerDesignation} />
          <Row label="Station / Site" value={action.securityOfficerSite} />
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 pt-2">Offence</p>
          <Row label="Category" value={action.offenceCategory} />
          {action.fineAmountUgx ? <Row label="Fine" value={`${action.fineAmountUgx.toLocaleString("en-UG")}/=`} /> : null}
          <Row label="Offence" value={action.offence} />
          <Row label="Date / Time" value={[action.offenceDate, action.offenceTime].filter(Boolean).join(" @ ")} />
          <Row label="Zone / Location" value={action.zone} />
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 pt-2 mb-1">Particulars of Allegation (Grounds)</p>
          <p className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3 leading-relaxed">{action.reason}</p>
        </div>

        {(action.linkedIncidentCode || action.linkedComplaintCode) && (
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 space-y-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-amber-800 mb-1">Linked Records</p>
            {action.linkedIncidentCode && (
              <p className="text-xs text-slate-700">
                <span className="font-mono font-bold text-amber-700">{action.linkedIncidentCode}</span>
                {action.linkedIncidentTitle ? ` — ${action.linkedIncidentTitle}` : ""}
                {action.linkedIncidentDescription ? <span className="block text-[11px] text-slate-600 mt-0.5">{action.linkedIncidentDescription}</span> : null}
              </p>
            )}
            {action.linkedComplaintCode && (
              <p className="text-xs text-slate-700">
                <span className="font-mono font-bold text-amber-700">{action.linkedComplaintCode}</span>
                {action.linkedComplaintClient ? ` — ${action.linkedComplaintClient} (${action.linkedComplaintSite})` : ""}
                {action.linkedComplaintDescription ? <span className="block text-[11px] text-slate-600 mt-0.5">{action.linkedComplaintDescription}</span> : null}
              </p>
            )}
          </div>
        )}

        {(action.hearingDate || action.employeeResponse) && (
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 pt-2">Hearing &amp; Employee Response</p>
            <Row label="Hearing Date" value={action.hearingDate} />
            {action.employeeResponse && (
              <>
                <p className="text-xs text-slate-700 bg-blue-50/70 border border-blue-200 rounded-xl p-3 italic leading-relaxed">“{action.employeeResponse}”</p>
                <Row label="Recorded By" value={[action.responseRecordedBy, action.responseRecordedAt].filter(Boolean).join(" · ")} />
              </>
            )}
          </div>
        )}

        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 pt-2">Decision &amp; Action Taken</p>
          <Row label="Decision" value={action.actionType} />
          <Row label="Action Taken" value={action.actionTaken} />
          {action.fineAmountUgx ? <Row label="Fine" value={`${action.fineAmountUgx.toLocaleString("en-UG")}/=`} /> : null}
          <Row label="Received By" value={action.receivedBy} />
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 pt-2">Approval Trail</p>
          <Row label="Initiated By (Investigations)" value={action.initiatedBy} />
          <Row label="Regional Manager" value={action.regionalApprovedBy} />
          <Row label="Operations Manager" value={action.operationsApprovedBy} />
          <Row label="HR Manager (Final)" value={action.hrApprovedBy} />
          {action.rejectedBy && <Row label={`Rejected By (${action.rejectedAt})`} value={action.rejectedBy} />}
          {action.resolutionNotes && <Row label="Rejection Notes" value={action.resolutionNotes} />}
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            onClick={printSheet}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print / Save as PDF
          </button>
          {action.archivedPdfPath && (
            <a
              href={`/uploads/${encodeURIComponent(action.archivedPdfPath)}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Archived PDF
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
