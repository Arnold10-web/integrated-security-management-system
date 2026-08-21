import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, AlertTriangle, CheckCircle } from "lucide-react";

interface EmbeddedSigningProps {
  signingToken: string;
  onClose: () => void;
}

/**
 * Embedded signing component that loads the public signing page in an iframe.
 * Use this when an admin needs to preview or facilitate signing within the app.
 * The actual signing page is the standalone /digital-sign/:token page.
 */
export const EmbeddedSigningWidget: React.FC<EmbeddedSigningProps> = ({ signingToken, onClose }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const signingUrl = `/digital-sign/${signingToken}`;

  useEffect(() => {
    setLoading(true);
    setError(null);
  }, [signingToken]);

  const handleLoad = useCallback(() => {
    setLoading(false);
  }, []);

  const handleError = useCallback(() => {
    setLoading(false);
    setError("Failed to load the signing page. Please try again.");
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 border-b border-slate-200">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Contract Signing</h3>
            <p className="text-xs text-slate-500">Share this link or sign directly below</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.open(signingUrl, "_blank")}
              className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
            >
              Open in New Tab
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-cyan-500 rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-500 mt-3">Loading signing page...</p>
              </div>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
              <div className="text-center">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                <p className="text-sm text-slate-700 font-semibold">{error}</p>
                <button
                  onClick={() => { setError(null); setLoading(true); iframeRef.current?.reload(); }}
                  className="mt-3 px-4 py-2 bg-cyan-600 text-white rounded-lg text-xs font-semibold"
                >
                  Retry
                </button>
              </div>
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={signingUrl}
            className="w-full h-full border-0"
            onLoad={handleLoad}
            onError={handleError}
            title="Contract Signing"
          />
        </div>
      </div>
    </div>
  );
};
