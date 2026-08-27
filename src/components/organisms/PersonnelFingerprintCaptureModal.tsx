import React, { useState } from "react";
import { X, Fingerprint, CheckCircle2, Loader2, RefreshCw, Save } from "lucide-react";
import { FINGER_POSITIONS, FINGER_CODE_BY_POSITION } from "../../types";
import { captureFinger, CapturedFinger } from "../../utils/fingerprint";

interface PersonnelFingerprintCaptureModalProps {
  show: boolean;
  subjectKey: string; // forceNumber or userId
  subjectLabel: string;
  onClose: () => void;
  onSaved: (count: number) => void;
  onSaveFingers: (fingers: CapturedFinger[]) => Promise<void>;
}

export const PersonnelFingerprintCaptureModal: React.FC<PersonnelFingerprintCaptureModalProps> = ({
  show,
  subjectKey,
  subjectLabel,
  onClose,
  onSaved,
  onSaveFingers,
}) => {
  const [captured, setCaptured] = useState<Record<number, CapturedFinger>>({});
  const [scanning, setScanning] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<CapturedFinger | null>(null);

  const capturedCount = Object.keys(captured).length;

  const reset = () => {
    setCaptured({});
    setScanning(null);
    setSaving(false);
    setError("");
    setPreview(null);
  };

  if (!show) return null;

  const runCapture = async (position: number) => {
    setError("");
    setScanning(position);
    await new Promise((r) => setTimeout(r, 1400));
    const finger = await captureFinger(subjectKey, position, FINGER_CODE_BY_POSITION[position]);
    setCaptured((prev) => ({ ...prev, [position]: finger }));
    setPreview(finger);
    setScanning(null);
  };

  const captureAll = async () => {
    setError("");
    for (const f of FINGER_POSITIONS) {
      if (captured[f.code]) continue;
      setScanning(f.code);
      await new Promise((r) => setTimeout(r, 500));
      const finger = await captureFinger(subjectKey, f.code, f.label.replace(/\s+/g, "").toUpperCase());
      setCaptured((prev) => ({ ...prev, [f.code]: finger }));
      setPreview(finger);
    }
    setScanning(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await onSaveFingers(Object.values(captured));
      onSaved(capturedCount);
      reset();
    } catch (e: any) {
      setError(e.message || "Failed to save fingerprints");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Fingerprint className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Biometric Enrollment (10-Finger)</h3>
              <p className="text-xs text-slate-500">
                {subjectLabel} — {subjectKey} · Mantra MFS100
              </p>
            </div>
          </div>
          <button
            onClick={() => { reset(); onClose(); }}
            className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 bg-slate-50 rounded-xl p-3">
          <div className="text-xs text-slate-600">
            <span className="font-bold text-indigo-600">{capturedCount}/10</span> fingers captured
          </div>
          <div className="flex gap-2">
            <button
              onClick={captureAll}
              disabled={scanning !== null || saving}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className="w-3 h-3 inline mr-1" />
              Simulate All
            </button>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {FINGER_POSITIONS.map((f) => {
            const already = captured[f.code];
            const isScanning = scanning === f.code;
            return (
              <button
                key={f.code}
                onClick={() => !already && !isScanning && runCapture(f.code)}
                disabled={isScanning || saving}
                className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-2 transition-all cursor-pointer disabled:cursor-default ${
                  already
                    ? "border-emerald-400 bg-emerald-50"
                    : isScanning
                    ? "border-indigo-400 bg-indigo-50"
                    : "border-dashed border-slate-300 hover:border-indigo-300"
                }`}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden">
                  {already ? (
                    <img src={already.imageData} alt={f.short} className="w-full h-full object-cover" />
                  ) : isScanning ? (
                    <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                  ) : (
                    <Fingerprint className="w-6 h-6 text-slate-300" />
                  )}
                </div>
                <span className="text-[11px] font-bold text-slate-700">{f.short}</span>
                {already && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              </button>
            );
          })}
        </div>

        {preview && !saving && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-2">
            <img src={preview.imageData} alt="preview" className="w-14 h-16 object-cover rounded-lg border border-emerald-300" />
            <div className="text-xs text-slate-700">
              <p className="font-bold text-emerald-700">
                {FINGER_POSITIONS.find((f) => f.code === preview.fingerPosition)?.short} captured
              </p>
              <p className="text-slate-500 font-mono truncate max-w-[36ch]">Quality {preview.qualityScore}/100</p>
            </div>
          </div>
        )}

        {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            onClick={() => { reset(); onClose(); }}
            className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={capturedCount === 0 || saving}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all cursor-pointer disabled:opacity-40 flex items-center gap-2 ${
              capturedCount === 10 ? "bg-emerald-600 hover:bg-emerald-500" : "bg-indigo-600 hover:bg-indigo-500"
            }`}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving
              ? "Saving..."
              : capturedCount === 10
              ? "Save Full Enrollment"
              : `Save ${capturedCount} Finger${capturedCount === 1 ? "" : "s"}`}
          </button>
        </div>
      </div>
    </div>
  );
};
