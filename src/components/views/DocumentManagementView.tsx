import React, { useState, useRef, useCallback } from "react";
import { Upload, X, FileText, Trash2, Search, Eye, CheckCircle2 } from "lucide-react";
import type { DocumentRecord, User } from "../../types";
import { domainApi } from "../../services/domainApi";
import { useNotificationStore } from "../../stores/notificationStore";

interface DocumentManagementViewProps {
  documents: DocumentRecord[];
  onUploadDocument: (doc: Omit<DocumentRecord, "id">) => void;
  onUpdateDocument: (id: string, updates: Partial<DocumentRecord>) => void;
  onDeleteDocument: (id: string) => void;
  currentUser: User | null;
}

const MIME_ICONS: Record<string, string> = {
  "application/pdf": "bg-red-100 text-red-600",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "bg-blue-100 text-blue-600",
  "image/jpeg": "bg-emerald-100 text-emerald-600",
  "image/png": "bg-emerald-100 text-emerald-600",
};

export const DocumentManagementView: React.FC<DocumentManagementViewProps> = ({
  documents, onUploadDocument, onUpdateDocument, onDeleteDocument, currentUser,
}) => {
  const [showUpload, setShowUpload] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadForm, setUploadForm] = useState({ name: "", category: "Contract", referenceType: "Guard", referenceId: "", notes: "" });
  const [previewDoc, setPreviewDoc] = useState<DocumentRecord | null>(null);
  const [editName, setEditName] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const categories = ["All", ...new Set(documents.map((d) => d.category))];

  const filtered = documents.filter((d) => {
    if (categoryFilter !== "All" && d.category !== categoryFilter) return false;
    if (search && !d.name.toLowerCase().includes(search.toLowerCase()) && !d.code.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleFileSelected = (file: File | null) => {
    if (!file) return;
    setSelectedFile(file);
    if (!uploadForm.name) {
      setUploadForm((f) => ({ ...f, name: file.name.replace(/\.[^/.]+$/, "") }));
    }
  };

  const handleSubmitUpload = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("name", uploadForm.name || selectedFile.name);
    formData.append("category", uploadForm.category);
    formData.append("referenceType", uploadForm.referenceType);
    formData.append("referenceId", uploadForm.referenceId || "general");
    if (uploadForm.notes) formData.append("notes", uploadForm.notes);
    try {
      const result = await domainApi.documents.upload(formData);
      onUploadDocument({
        code: result.code || `DOC-${Date.now()}`,
        name: result.name || uploadForm.name || selectedFile.name,
        category: result.category || uploadForm.category,
        referenceType: result.referenceType || uploadForm.referenceType,
        referenceId: result.referenceId || "",
        mimeType: result.mimeType || selectedFile.type,
        fileSize: result.fileSize || selectedFile.size,
        filePath: result.filePath || selectedFile.name,
        uploadedBy: currentUser?.name || "system",
        notes: result.notes || uploadForm.notes,
        createdAt: new Date().toISOString().replace("T", " ").substring(0, 16),
      });
    } catch {
      useNotificationStore.getState().addNotification({ type: "error", title: "Upload Failed", message: "Could not upload document to server. Saved locally.", module: "Documents" });
      onUploadDocument({
        code: `DOC-${Date.now()}`,
        name: uploadForm.name || selectedFile.name,
        category: uploadForm.category,
        referenceType: uploadForm.referenceType,
        referenceId: uploadForm.referenceId,
        mimeType: selectedFile.type,
        fileSize: selectedFile.size,
        filePath: selectedFile.name,
        uploadedBy: currentUser?.name || "system",
        notes: uploadForm.notes,
        createdAt: new Date().toISOString().replace("T", " ").substring(0, 16),
      });
    }
    setUploadSuccess("Document uploaded");
    setTimeout(() => setUploadSuccess(""), 4000);
    setShowUpload(false);
    setSelectedFile(null);
    setUploadForm({ name: "", category: "Contract", referenceType: "Guard", referenceId: "", notes: "" });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelected(e.target.files?.[0] || null);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelected(e.dataTransfer.files[0] || null);
  }, []);

  const getFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-slate-900">Document Management</h1>
        <button onClick={() => setShowUpload(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black cursor-pointer hover:bg-slate-800">
          <Upload className="w-3.5 h-3.5" /> Upload Document
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search documents..." className="w-full p-2.5 pl-9 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none" />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
          className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none">
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {uploadSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-xs font-bold text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {uploadSuccess}
        </div>
      )}

      {showUpload && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowUpload(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-slate-900">Upload Document</h3>
              <button onClick={() => setShowUpload(false)} className="text-slate-400 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Document Name</label>
                <input value={uploadForm.name} onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select value={uploadForm.category} onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none">
                    <option value="Contract">Contract</option>
                    <option value="Certificate">Certificate</option>
                    <option value="ID Document">ID Document</option>
                    <option value="Invoice">Invoice</option>
                    <option value="Report">Report</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Reference Type</label>
                  <select value={uploadForm.referenceType} onChange={(e) => setUploadForm({ ...uploadForm, referenceType: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none">
                    <option value="Guard">Guard</option>
                    <option value="Site">Site</option>
                    <option value="Incident">Incident</option>
                    <option value="Vehicle">Vehicle</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              <input type="file" ref={fileInputRef} onChange={handleFileInputChange} className="hidden" />

              {selectedFile ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 text-xs truncate">{selectedFile.name}</p>
                      <p className="text-[10px] text-slate-500 font-semibold">{selectedFile.type || "Unknown type"} • {getFileSize(selectedFile.size)}</p>
                    </div>
                    <button onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="text-slate-400 hover:text-red-500 cursor-pointer shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full py-8 border-2 border-dashed rounded-xl text-slate-400 font-bold text-xs cursor-pointer hover:border-slate-400 hover:text-slate-500 transition-all text-center ${dragOver ? "border-blue-500 bg-blue-50 text-blue-600" : "border-slate-300"}`}>
                  <Upload className={`w-6 h-6 mx-auto mb-2 ${dragOver ? "text-blue-600" : ""}`} />
                  {dragOver ? "Drop file here" : "Drag & drop file here, or click to browse (PDF, DOC, JPG, PNG — max 10MB)"}
                </div>
              )}

              <button onClick={handleSubmitUpload} disabled={!selectedFile}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4" />
                Upload to Secure Cloud Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
          <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400 font-semibold">No documents found. Upload your first document.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {filtered.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-all">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${MIME_ICONS[doc.mimeType] || "bg-slate-100 text-slate-600"}`}>
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-xs">{doc.name}</p>
                  <p className="text-[10px] text-slate-400">
                    {doc.category} • {getFileSize(doc.fileSize)} • {doc.uploadedBy}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 bg-slate-100 rounded-lg text-slate-500 font-semibold">{doc.referenceType}</span>
                <button onClick={() => { setPreviewDoc(doc); setEditName(doc.name); setEditNotes(doc.notes || ""); }}
                  className="p-1.5 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-500 cursor-pointer transition-all">
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => onDeleteDocument(doc.id)}
                  className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 cursor-pointer transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {previewDoc && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setPreviewDoc(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-slate-900">Document Details</h3>
              <button onClick={() => setPreviewDoc(null)} className="text-slate-400 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Name</label>
                <input value={editName} onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <p className="p-2.5 bg-slate-100 rounded-xl font-semibold text-slate-800">{previewDoc.category}</p>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Type</label>
                  <p className="p-2.5 bg-slate-100 rounded-xl font-semibold text-slate-800">{previewDoc.referenceType}</p>
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">MIME Type</label>
                <p className="p-2.5 bg-slate-100 rounded-xl font-semibold text-slate-800">{previewDoc.mimeType}</p>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Uploaded By</label>
                <p className="p-2.5 bg-slate-100 rounded-xl font-semibold text-slate-800">{previewDoc.uploadedBy}</p>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Upload Date</label>
                <p className="p-2.5 bg-slate-100 rounded-xl font-semibold text-slate-800">{previewDoc.createdAt}</p>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes</label>
                <textarea rows={3} value={editNotes} onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none resize-none" />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button onClick={() => setPreviewDoc(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer">Close</button>
                <button onClick={() => { onUpdateDocument(previewDoc.id, { name: editName, notes: editNotes }); setPreviewDoc(null); }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold cursor-pointer hover:bg-blue-700">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
