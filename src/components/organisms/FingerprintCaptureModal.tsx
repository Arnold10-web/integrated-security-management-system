import React, { useState, useEffect, useCallback } from "react";
import { X, Fingerprint, CheckCircle2, Loader2 } from "lucide-react";

interface FingerprintCaptureModalProps {
  show: boolean;
  onClose: () => void;
  onCapture: (fingerprintHash: string) => void;
  label?: string;
}

function generateFingerprintHash(): string {
  const chars = "abcdef0123456789";
  let hash = "FP-";
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

export const FingerprintCaptureModal: React.FC<FingerprintCaptureModalProps> = ({
  show,
  onClose,
  onCapture,
  label = "Sign Out",
}) => {
  const [phase, setPhase] = useState<"idle" | "scanning" | "captured">("idle");

  useEffect(() => {
    if (show) {
      setPhase("idle");
    }
  }, [show]);

  const handleStartScan = useCallback(() => {
    setPhase("scanning");
    setTimeout(() => {
      const hash = generateFingerprintHash();
      setPhase("captured");
      setTimeout(() => {
        onCapture(hash);
        setPhase("idle");
      }, 800);
    }, 2000);
  }, [onCapture]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Fingerprint className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Biometric {label}</h3>
              <p className="text-xs text-slate-500">Mantra MFS100 Fingerprint Scanner</p>
            </div>
          </div>
          <button
            onClick={() => { setPhase("idle"); onClose(); }}
            className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col items-center py-6">
          {phase === "idle" && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-indigo-50 border-2 border-dashed border-indigo-300 flex items-center justify-center">
                <Fingerprint className="w-12 h-12 text-indigo-400" />
              </div>
              <p className="text-sm text-slate-600 font-medium text-center">
                Place finger on the scanner to authenticate
              </p>
              <button
                onClick={handleStartScan}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
              >
                Start Fingerprint Scan
              </button>
            </div>
          )}

          {phase === "scanning" && (
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-200 animate-ping opacity-40" />
                <div className="absolute inset-0 rounded-full border-2 border-indigo-400 animate-spin" style={{ animationDuration: "1.5s" }} />
                <div className="absolute inset-2 rounded-full bg-indigo-50 flex items-center justify-center">
                  <Fingerprint className="w-10 h-10 text-indigo-500 animate-pulse" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                <p className="text-sm text-slate-700 font-semibold">Scanning fingerprint...</p>
              </div>
              <p className="text-xs text-slate-400 text-center">
                Hold finger steady on the Mantra MFS100 sensor
              </p>
            </div>
          )}

          {phase === "captured" && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-emerald-50 border-2 border-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-14 h-14 text-emerald-500" />
              </div>
              <p className="text-sm text-emerald-700 font-bold">Fingerprint Captured Successfully</p>
              <p className="text-xs text-slate-400 text-center">Biometric hash generated and stored</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
