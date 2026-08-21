import React, { useState, useRef, useEffect, useCallback } from "react";
import { Upload, Save, Trash2, Plus, Move, Type, Calendar, Hash, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";

interface FieldDefinition {
  id: string;
  label: string;
  type: "text" | "date" | "number" | "select";
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  required: boolean;
  defaultValue?: string;
  options?: string[];
}

interface SignatureArea {
  id: string;
  label: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  signerRole: string;
  signerNameField?: string;
  signerTitleField?: string;
}

interface FieldDefinitions {
  fields: FieldDefinition[];
  signatureAreas: SignatureArea[];
}

interface TemplateBuilderProps {
  onSave: (name: string, category: string, description: string, fieldDefinitions: FieldDefinitions, pdfFile: File) => Promise<void>;
  onCancel: () => void;
}

const CATEGORIES = ["Client", "Guard", "Staff", "Custom"];

export const PdfTemplateBuilder: React.FC<TemplateBuilderProps> = ({ onSave, onCancel }) => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [templateName, setTemplateName] = useState("");
  const [category, setCategory] = useState("Client");
  const [description, setDescription] = useState("");
  const [fieldDefinitions, setFieldDefinitions] = useState<FieldDefinitions>({ fields: [], signatureAreas: [] });
  const [selectedItem, setSelectedItem] = useState<{ type: "field" | "signature"; index: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<"field" | "signature" | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      setFieldDefinitions({ fields: [], signatureAreas: [] });
      setError(null);
    } else {
      setError("Please select a PDF file");
    }
  }, []);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  const addField = useCallback(() => {
    const newField: FieldDefinition = {
      id: `field_${Date.now()}`,
      label: `Field ${fieldDefinitions.fields.length + 1}`,
      type: "text",
      page: currentPage,
      x: 100,
      y: 100,
      width: 200,
      height: 25,
      required: false,
    };
    setFieldDefinitions((prev) => ({
      ...prev,
      fields: [...prev.fields, newField],
    }));
    setSelectedItem({ type: "field", index: fieldDefinitions.fields.length });
  }, [currentPage, fieldDefinitions.fields.length]);

  const addSignatureArea = useCallback(() => {
    const newSig: SignatureArea = {
      id: `sig_${Date.now()}`,
      label: `Signature ${fieldDefinitions.signatureAreas.length + 1}`,
      page: currentPage,
      x: 100,
      y: 500,
      width: 250,
      height: 80,
      signerRole: "Party",
    };
    setFieldDefinitions((prev) => ({
      ...prev,
      signatureAreas: [...prev.signatureAreas, newSig],
    }));
    setSelectedItem({ type: "signature", index: fieldDefinitions.signatureAreas.length });
  }, [currentPage, fieldDefinitions.signatureAreas.length]);

  const updateField = useCallback((index: number, updates: Partial<FieldDefinition>) => {
    setFieldDefinitions((prev) => ({
      ...prev,
      fields: prev.fields.map((f, i) => (i === index ? { ...f, ...updates } : f)),
    }));
  }, []);

  const updateSignatureArea = useCallback((index: number, updates: Partial<SignatureArea>) => {
    setFieldDefinitions((prev) => ({
      ...prev,
      signatureAreas: prev.signatureAreas.map((s, i) => (i === index ? { ...s, ...updates } : s)),
    }));
  }, []);

  const removeField = useCallback((index: number) => {
    setFieldDefinitions((prev) => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index),
    }));
    if (selectedItem?.type === "field" && selectedItem.index === index) {
      setSelectedItem(null);
    }
  }, [selectedItem]);

  const removeSignatureArea = useCallback((index: number) => {
    setFieldDefinitions((prev) => ({
      ...prev,
      signatureAreas: prev.signatureAreas.filter((_, i) => i !== index),
    }));
    if (selectedItem?.type === "signature" && selectedItem.index === index) {
      setSelectedItem(null);
    }
  }, [selectedItem]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent, type: "field" | "signature", index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragType(type);
    setSelectedItem({ type, index });
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !dragType || !selectedItem || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - canvasRect.left - dragOffset.x;
    const y = e.clientY - canvasRect.top - dragOffset.y;

    if (dragType === "field") {
      updateField(selectedItem.index, { x: Math.max(0, x), y: Math.max(0, y) });
    } else {
      updateSignatureArea(selectedItem.index, { x: Math.max(0, x), y: Math.max(0, y) });
    }
  }, [isDragging, dragType, selectedItem, dragOffset, updateField, updateSignatureArea]);

  const handleCanvasMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragType(null);
  }, []);

  const handleSave = async () => {
    if (!pdfFile) { setError("Please upload a PDF template"); return; }
    if (!templateName.trim()) { setError("Please enter a template name"); return; }
    if (fieldDefinitions.fields.length === 0 && fieldDefinitions.signatureAreas.length === 0) {
      setError("Please add at least one field or signature area");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave(templateName, category, description, fieldDefinitions, pdfFile);
    } catch (err: any) {
      setError(err.message || "Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800">
        <h2 className="text-lg font-black">PDF Template Builder</h2>
        <p className="text-xs text-slate-400 mt-1">Upload a PDF and visually mark fill-in fields and signature areas.</p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-3 py-2 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Panel - Configuration */}
        <div className="space-y-4">
          {/* Template Info */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="font-bold text-sm mb-3">Template Info</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g., Client Security Contract"
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
                  placeholder="Optional description"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* Upload PDF */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="font-bold text-sm mb-3">Upload PDF Template</h3>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-cyan-400 transition-colors"
            >
              <Upload className="w-6 h-6 mx-auto text-slate-400 mb-2" />
              <p className="text-xs text-slate-600">
                {pdfFile ? pdfFile.name : "Click to upload PDF"}
              </p>
              {pdfFile && (
                <p className="text-[11px] text-slate-500 mt-1">
                  {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              )}
            </button>
          </div>

          {/* Add Elements */}
          {pdfFile && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="font-bold text-sm mb-3">Add Elements</h3>
              <div className="space-y-2">
                <button
                  onClick={addField}
                  className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2"
                >
                  <Type className="w-3 h-3" /> Add Fill-in Field
                </button>
                <button
                  onClick={addSignatureArea}
                  className="w-full px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2"
                >
                  <Plus className="w-3 h-3" /> Add Signature Area
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Center - PDF Preview with Fields */}
        <div className="lg:col-span-2">
          {pdfUrl ? (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage <= 1}
                    className="px-2 py-1 bg-slate-200 rounded text-xs disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <span className="text-xs font-semibold">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage >= totalPages}
                    className="px-2 py-1 bg-slate-200 rounded text-xs disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="text-xs text-slate-500">
                  {fieldDefinitions.fields.length} fields, {fieldDefinitions.signatureAreas.length} signature areas
                </div>
              </div>

              {/* PDF Canvas Container */}
              <div
                ref={canvasRef}
                className="relative border border-slate-300 bg-slate-50 overflow-auto"
                style={{ height: "600px" }}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
              >
                {/* PDF Background (using iframe for simplicity) */}
                <iframe
                  src={`${pdfUrl}#page=${currentPage}`}
                  className="absolute inset-0 w-full h-full border-0"
                  style={{ pointerEvents: "none" }}
                  title="PDF Preview"
                />

                {/* Fill-in Fields */}
                {fieldDefinitions.fields
                  .filter((f) => f.page === currentPage)
                  .map((field, idx) => {
                    const actualIndex = fieldDefinitions.fields.findIndex((f) => f.id === field.id);
                    return (
                      <div
                        key={field.id}
                        className={`absolute border-2 cursor-move ${
                          selectedItem?.type === "field" && selectedItem.index === actualIndex
                            ? "border-blue-500 bg-blue-100"
                            : "border-blue-400 bg-blue-50"
                        }`}
                        style={{
                          left: field.x,
                          top: field.y,
                          width: field.width,
                          height: field.height,
                        }}
                        onMouseDown={(e) => handleCanvasMouseDown(e, "field", actualIndex)}
                      >
                        <div className="text-[10px] font-semibold text-blue-700 px-1 truncate">
                          {field.label}
                        </div>
                      </div>
                    );
                  })}

                {/* Signature Areas */}
                {fieldDefinitions.signatureAreas
                  .filter((s) => s.page === currentPage)
                  .map((sig, idx) => {
                    const actualIndex = fieldDefinitions.signatureAreas.findIndex((s) => s.id === sig.id);
                    return (
                      <div
                        key={sig.id}
                        className={`absolute border-2 border-dashed cursor-move ${
                          selectedItem?.type === "signature" && selectedItem.index === actualIndex
                            ? "border-emerald-500 bg-emerald-100"
                            : "border-emerald-400 bg-emerald-50"
                        }`}
                        style={{
                          left: sig.x,
                          top: sig.y,
                          width: sig.width,
                          height: sig.height,
                        }}
                        onMouseDown={(e) => handleCanvasMouseDown(e, "signature", actualIndex)}
                      >
                        <div className="text-[10px] font-semibold text-emerald-700 px-1 truncate">
                          {sig.label}
                        </div>
                        <div className="text-[9px] text-emerald-600 px-1">
                          {sig.signerRole}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Upload className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p className="text-sm text-slate-500">Upload a PDF template to start building</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Selected Item Properties */}
      {selectedItem && (
        <div className="fixed right-4 top-4 w-72 bg-white rounded-xl border border-slate-200 p-4 shadow-lg z-50">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-sm">
              {selectedItem.type === "field" ? "Field Properties" : "Signature Area Properties"}
            </h3>
            <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-slate-600">
              ×
            </button>
          </div>

          {selectedItem.type === "field" && fieldDefinitions.fields[selectedItem.index] && (
            <FieldProperties
              field={fieldDefinitions.fields[selectedItem.index]}
              onUpdate={(updates) => updateField(selectedItem.index, updates)}
              onRemove={() => removeField(selectedItem.index)}
            />
          )}

          {selectedItem.type === "signature" && fieldDefinitions.signatureAreas[selectedItem.index] && (
            <SignatureAreaProperties
              area={fieldDefinitions.signatureAreas[selectedItem.index]}
              onUpdate={(updates) => updateSignatureArea(selectedItem.index, updates)}
              onRemove={() => removeSignatureArea(selectedItem.index)}
            />
          )}
        </div>
      )}

      {/* Action Buttons */}
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

// ── Field Properties Sub-component ──
const FieldProperties: React.FC<{
  field: FieldDefinition;
  onUpdate: (updates: Partial<FieldDefinition>) => void;
  onRemove: () => void;
}> = ({ field, onUpdate, onRemove }) => (
  <div className="space-y-3">
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1">Label</label>
      <input
        type="text"
        value={field.label}
        onChange={(e) => onUpdate({ label: e.target.value })}
        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
      />
    </div>
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
      <select
        value={field.type}
        onChange={(e) => onUpdate({ type: e.target.value as FieldDefinition["type"] })}
        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
      >
        <option value="text">Text</option>
        <option value="date">Date</option>
        <option value="number">Number</option>
        <option value="select">Select</option>
      </select>
    </div>
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1">Page</label>
      <input
        type="number"
        value={field.page}
        onChange={(e) => onUpdate({ page: parseInt(e.target.value) || 1 })}
        min={1}
        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
      />
    </div>
    <div className="grid grid-cols-2 gap-2">
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">X</label>
        <input
          type="number"
          value={Math.round(field.x)}
          onChange={(e) => onUpdate({ x: parseInt(e.target.value) || 0 })}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Y</label>
        <input
          type="number"
          value={Math.round(field.y)}
          onChange={(e) => onUpdate({ y: parseInt(e.target.value) || 0 })}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
        />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-2">
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Width</label>
        <input
          type="number"
          value={field.width}
          onChange={(e) => onUpdate({ width: parseInt(e.target.value) || 100 })}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Height</label>
        <input
          type="number"
          value={field.height}
          onChange={(e) => onUpdate({ height: parseInt(e.target.value) || 25 })}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
        />
      </div>
    </div>
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={field.required}
        onChange={(e) => onUpdate({ required: e.target.checked })}
        className="rounded"
      />
      <label className="text-xs font-semibold text-slate-700">Required</label>
    </div>
    <button
      onClick={onRemove}
      className="w-full px-3 py-2 bg-red-100 text-red-700 rounded-lg text-xs font-semibold flex items-center gap-2"
    >
      <Trash2 className="w-3 h-3" /> Remove Field
    </button>
  </div>
);

// ── Signature Area Properties Sub-component ──
const SignatureAreaProperties: React.FC<{
  area: SignatureArea;
  onUpdate: (updates: Partial<SignatureArea>) => void;
  onRemove: () => void;
}> = ({ area, onUpdate, onRemove }) => (
  <div className="space-y-3">
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1">Label</label>
      <input
        type="text"
        value={area.label}
        onChange={(e) => onUpdate({ label: e.target.value })}
        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
      />
    </div>
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1">Signer Role</label>
      <input
        type="text"
        value={area.signerRole}
        onChange={(e) => onUpdate({ signerRole: e.target.value })}
        placeholder="e.g., Client, Director, HR Manager"
        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
      />
    </div>
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1">Page</label>
      <input
        type="number"
        value={area.page}
        onChange={(e) => onUpdate({ page: parseInt(e.target.value) || 1 })}
        min={1}
        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
      />
    </div>
    <div className="grid grid-cols-2 gap-2">
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">X</label>
        <input
          type="number"
          value={Math.round(area.x)}
          onChange={(e) => onUpdate({ x: parseInt(e.target.value) || 0 })}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Y</label>
        <input
          type="number"
          value={Math.round(area.y)}
          onChange={(e) => onUpdate({ y: parseInt(e.target.value) || 0 })}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
        />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-2">
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Width</label>
        <input
          type="number"
          value={area.width}
          onChange={(e) => onUpdate({ width: parseInt(e.target.value) || 200 })}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Height</label>
        <input
          type="number"
          value={area.height}
          onChange={(e) => onUpdate({ height: parseInt(e.target.value) || 80 })}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
        />
      </div>
    </div>
    <button
      onClick={onRemove}
      className="w-full px-3 py-2 bg-red-100 text-red-700 rounded-lg text-xs font-semibold flex items-center gap-2"
    >
      <Trash2 className="w-3 h-3" /> Remove Signature Area
    </button>
  </div>
);
