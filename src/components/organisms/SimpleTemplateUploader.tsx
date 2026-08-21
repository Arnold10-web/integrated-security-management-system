import React, { useState, useRef } from "react";
import { Upload, Save, X, AlertTriangle, FileText } from "lucide-react";

const CATEGORIES = ["Client", "Staff", "Custom"];

interface SimpleTemplateUploaderProps {
  onSave: (name: string, category: string, description: string, pdfFile: File) => Promise<void>;
  onCancel: () => void;
}

export const SimpleTemplateUploader: React.FC<SimpleTemplateUploaderProps> = ({ onSave, onCancel }) => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [category, setCategory] = useState("Client");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
      setError(null);
      if (!templateName) {
        setTemplateName(file.name.replace(/\.pdf$/i, ""));
      }
    } else {
      setError("Please select a PDF file");
    }
  };

  const handleSave = async () => {
    if (!pdfFile) { setError("Please upload a PDF template"); return; }
    if (!templateName.trim()) { setError("Please enter a template name"); return; }

    setSaving(true);
    setError(null);
    try {
      await onSave(templateName, category, description, pdfFile);
    } catch (err: any) {
      setError(err.message || "Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800">
        <h2 className="text-lg font-black">Upload Contract Template</h2>
        <p className="text-xs text-slate-400 mt-1">
          Upload a fixed PDF contract template. These are constant legal documents that don't change.
        </p>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-3 py-2 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="font-bold text-sm mb-3">Template Details</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Template Name *</label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g., Client Security Services Agreement"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Optional description of this template"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="font-bold text-sm mb-3">Upload PDF</h3>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-cyan-400 transition-colors"
        >
          {pdfFile ? (
            <div className="flex items-center justify-center gap-3">
              <FileText className="w-8 h-8 text-cyan-500" />
              <div className="text-left">
                <p className="text-xs font-semibold text-slate-900">{pdfFile.name}</p>
                <p className="text-[11px] text-slate-500">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setPdfFile(null); }}
                className="ml-4 p-1 hover:bg-slate-100 rounded"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="text-xs text-slate-600">Click to upload PDF template</p>
              <p className="text-[11px] text-slate-500 mt-1">PDF files up to 20MB</p>
            </>
          )}
        </button>
      </div>

      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !pdfFile || !templateName.trim()}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save Template"}
        </button>
      </div>
    </div>
  );
};
