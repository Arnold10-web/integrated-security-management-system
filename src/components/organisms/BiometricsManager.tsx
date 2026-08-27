import React, { useCallback, useEffect, useState } from "react";
import { Fingerprint, Download } from "lucide-react";
import { domainApi } from "../../services/domainApi";
import { PersonnelFingerprintCaptureModal } from "./PersonnelFingerprintCaptureModal";
import { IsoExportModal, FingerExportRow } from "./IsoExportModal";
import type { CapturedFinger } from "../../utils/fingerprint";

export interface BiometricSubject {
  key: string; // forceNumber or userId
  label: string;
  kind: "officer" | "user";
}

interface BiometricsManagerProps {
  subjects: BiometricSubject[];
  captureType?: "PERSONNEL" | "ARMOURY";
  variant?: "button" | "inline";
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const BiometricsManager: React.FC<BiometricsManagerProps> = ({
  subjects,
  captureType = "PERSONNEL",
  variant = "button",
}) => {
  const [showCapture, setShowCapture] = useState(false);
  const [captureSubject, setCaptureSubject] = useState<BiometricSubject | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [enrolled, setEnrolled] = useState<Record<string, number>>({});
  const [toast, setToast] = useState("");

  const refreshEnrollment = useCallback(async () => {
    const map: Record<string, number> = {};
    // Limit concurrent queries to avoid hammering the API for large directories.
    const batch = subjects.slice(0, 500);
    await Promise.all(
      batch.map(async (s) => {
        try {
          const recs =
            s.kind === "officer"
              ? await domainApi.biometrics.listForForce(s.key, captureType)
              : await domainApi.biometrics.listForUser(s.key, captureType);
          map[s.key] = recs.length;
        } catch {
          map[s.key] = 0;
        }
      })
    );
    setEnrolled(map);
  }, [subjects, captureType]);

  useEffect(() => {
    if (subjects.length > 0) refreshEnrollment();
  }, [subjects, refreshEnrollment]);

  const openCapture = (s: BiometricSubject) => {
    setCaptureSubject(s);
    setShowCapture(true);
  };

  const handleSaveFingers = async (fingers: CapturedFinger[]) => {
    if (!captureSubject) return;
    await domainApi.biometrics.save({
      forceNumber: captureSubject.kind === "officer" ? captureSubject.key : undefined,
      userId: captureSubject.kind === "user" ? captureSubject.key : undefined,
      captureType,
      fingers: fingers.map((f) => ({
        fingerPosition: f.fingerPosition,
        fingerCode: f.fingerCode,
        imageData: f.imageData,
        hash: f.hash,
        qualityScore: f.qualityScore,
        capturedAt: f.capturedAt,
      })),
    });
  };

  const handleSaved = (count: number) => {
    setShowCapture(false);
    setCaptureSubject(null);
    setToast(`Saved ${count} fingerprint${count === 1 ? "" : "s"} for ${captureSubject?.label ?? "subject"}.`);
    setTimeout(() => setToast(""), 4000);
    refreshEnrollment();
  };

  const exportRows: FingerExportRow[] = subjects.map((s) => ({
    key: s.key,
    label: s.label,
    fingerCount: enrolled[s.key] ?? 0,
    hasAllTen: (enrolled[s.key] ?? 0) >= 10,
  }));

  const handleExport = async (keys: string[]) => {
    const { blob, filename } = await domainApi.biometrics.exportPersonnel(keys, captureType);
    triggerDownload(blob, filename);
    setShowExport(false);
    setToast(`Exported ${keys.length} subject${keys.length === 1 ? "" : "s"} as ISO/IEC 19794 CBEFF (.bir).`);
    setTimeout(() => setToast(""), 4000);
  };

  const captureTargets = subjects.filter((s) => s.kind === "officer").length
    ? subjects.filter((s) => s.kind === "officer")
    : subjects;

  return (
    <>
      {toast && (
        <div className="fixed bottom-5 right-5 z-[80] bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-2xl">
          {toast}
        </div>
      )}

      {variant === "inline" ? (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => openCapture(captureTargets[0])}
            disabled={captureTargets.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-all cursor-pointer disabled:opacity-50"
          >
            <Fingerprint className="w-3.5 h-3.5" />
            Capture 10-Finger
          </button>
          <button
            onClick={() => setShowExport(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export ISO (.bir)
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowExport(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all cursor-pointer"
        >
          <Fingerprint className="w-3.5 h-3.5" />
          Fingerprints
        </button>
      )}

      {showCapture && captureSubject && (
        <PersonnelFingerprintCaptureModal
          show
          subjectKey={captureSubject.key}
          subjectLabel={captureSubject.label}
          onClose={() => { setShowCapture(false); setCaptureSubject(null); }}
          onSaved={handleSaved}
          onSaveFingers={handleSaveFingers}
        />
      )}

      {showExport && (
        <IsoExportModal
          show
          rows={exportRows}
          onClose={() => setShowExport(false)}
          onExport={handleExport}
        />
      )}
    </>
  );
};
