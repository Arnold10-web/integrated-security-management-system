import React, { useState, useEffect } from "react";
import { ChevronRight, ChevronLeft, Plus, Trash2, AlertTriangle, Send } from "lucide-react";
import { getAccessToken } from "../../services/apiClient";

interface Template {
  id: string;
  name: string;
  category: string;
  description?: string;
  pdfFileName: string;
  pageCount: number;
}

interface Signer {
  signerName: string;
  signerTitle: string;
  signerEmail: string;
  signingOrder: number;
  signerRole: string; // "company_rep", "company_witness", "client_rep", "client_witness"
}

interface ContractCreationWizardProps {
  onCreated: (contractId: string) => void;
  onCancel: () => void;
}

export const DigitalContractWizard: React.FC<ContractCreationWizardProps> = ({ onCreated, onCancel }) => {
  const [step, setStep] = useState(1);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Client Details
  const [clientName, setClientName] = useState("");
  const [clientLocation, setClientLocation] = useState("");
  const [clientContactPerson, setClientContactPerson] = useState("");
  const [clientDesignation, setClientDesignation] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPostalAddress, setClientPostalAddress] = useState("");

  // Service Details (APPENDIX A)
  const [serviceLocation, setServiceLocation] = useState("");
  const [serviceDescription, setServiceDescription] = useState("Security guard services");
  const [dayRate, setDayRate] = useState("");
  const [nightRate, setNightRate] = useState("");
  const [numberOfGuards, setNumberOfGuards] = useState("1");
  const [vatRate] = useState("18");

  // Contract Dates
  const [contractDate, setContractDate] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Title (auto-generated or custom)
  const [title, setTitle] = useState("");

  // Signers (4 required: company rep, company witness, client rep, client witness)
  const [signers, setSigners] = useState<Signer[]>([
    { signerName: "", signerTitle: "Managing Director", signerEmail: "", signingOrder: 1, signerRole: "company_rep" },
    { signerName: "", signerTitle: "", signerEmail: "", signingOrder: 2, signerRole: "company_witness" },
    { signerName: "", signerTitle: "", signerEmail: "", signingOrder: 3, signerRole: "client_rep" },
    { signerName: "", signerTitle: "", signerEmail: "", signingOrder: 4, signerRole: "client_witness" },
  ]);

  const [saving, setSaving] = useState(false);

  const headers = () => {
    const t = getAccessToken() || localStorage.getItem("iscms_access_token") || "";
    return t ? { Authorization: `Bearer ${t}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
  };

  useEffect(() => { fetchTemplates(); }, []);

  useEffect(() => {
    if (clientName && !title) {
      setTitle(`Security Services Agreement - ${clientName}`);
    }
  }, [clientName]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/digital-contract-templates?active=true", { headers: headers() as any });
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.data || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setStep(2);
  };

  const updateSigner = (index: number, updates: Partial<Signer>) => {
    setSigners((prev) => prev.map((s, i) => (i === index ? { ...s, ...updates } : s)));
  };

  // Calculate totals
  const dayTotal = (parseFloat(dayRate) || 0) * (parseInt(numberOfGuards) || 1);
  const nightTotal = (parseFloat(nightRate) || 0) * (parseInt(numberOfGuards) || 1);
  const subTotal = dayTotal + nightTotal;
  const vatAmount = subTotal * (parseFloat(vatRate) / 100);
  const grandTotal = subTotal + vatAmount;

  const filledFields = {
    clientName,
    clientLocation,
    clientContactPerson,
    clientDesignation,
    clientPhone,
    clientEmail,
    clientPostalAddress,
    serviceLocation,
    serviceDescription,
    dayRate,
    nightRate,
    numberOfGuards,
    dayTotal: dayTotal.toString(),
    nightTotal: nightTotal.toString(),
    subTotal: subTotal.toString(),
    vatAmount: vatAmount.toString(),
    grandTotal: grandTotal.toString(),
    contractDate,
    effectiveDate,
    endDate,
  };

  const handleCreate = async () => {
    if (!selectedTemplate) return;
    if (!clientName.trim()) { setError("Client name is required"); return; }
    if (!effectiveDate) { setError("Effective date is required"); return; }
    if (signers.some((s) => !s.signerName.trim())) { setError("All signers must have a name"); return; }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/digital-contracts", {
        method: "POST",
        headers: headers() as any,
        body: JSON.stringify({
          title: title.trim() || `Security Services Agreement - ${clientName}`,
          templateId: selectedTemplate.id,
          contractType: "Client",
          category: "Client",
          partyName: clientName.trim(),
          clientAbbreviation: undefined, // Will be auto-generated
          startDate: effectiveDate || undefined,
          endDate: endDate || undefined,
          valueUgx: Math.round(grandTotal) || undefined,
          filledFields,
          signers: signers.map((s, i) => ({
            signerName: s.signerName.trim(),
            signerTitle: s.signerTitle.trim() || undefined,
            signerEmail: s.signerEmail.trim() || undefined,
            signingOrder: i + 1,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create contract");
      }

      const data = await res.json();
      onCreated(data.contract.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const signerRoleLabels: Record<string, string> = {
    company_rep: "Company Representative",
    company_witness: "Company Witness",
    client_rep: "Client Representative",
    client_witness: "Client Witness",
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800">
        <h2 className="text-lg font-black">Create Client Contract</h2>
        <p className="text-xs text-slate-400 mt-1">Step {step} of 5 — Fill in client details, service rates, and signers</p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-3 py-2 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Step 1: Select Template */}
      {step === 1 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-bold text-sm mb-3">Select Contract Template</h3>
          <p className="text-xs text-slate-500 mb-3">Choose the fixed PDF template. Company details are pre-filled in the template.</p>
          {loading ? (
            <p className="text-xs text-slate-500">Loading templates...</p>
          ) : templates.length === 0 ? (
            <p className="text-xs text-slate-500">No templates available. Upload a template first.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleTemplateSelect(t)}
                  className="text-left p-4 border border-slate-200 rounded-lg hover:border-cyan-400 hover:bg-cyan-50 transition-colors"
                >
                  <div className="font-semibold text-sm text-slate-900">{t.name}</div>
                  <div className="text-xs text-slate-600 mt-1">{t.category} — {t.pageCount} pages</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Client Details */}
      {step === 2 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-bold text-sm mb-3">Client Details</h3>
          <p className="text-xs text-slate-500 mb-3">Enter the client's information as it should appear in the contract.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Client / Company Name *</label>
              <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="e.g., Uganda Revenue Authority" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Client Location *</label>
              <input type="text" value={clientLocation} onChange={(e) => setClientLocation(e.target.value)} placeholder="e.g., Plot 32, Kampala Road" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person</label>
              <input type="text" value={clientContactPerson} onChange={(e) => setClientContactPerson(e.target.value)} placeholder="Full name" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Designation / Position</label>
              <input type="text" value={clientDesignation} onChange={(e) => setClientDesignation(e.target.value)} placeholder="e.g., Security Manager" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
              <input type="tel" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="+256 700 000000" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="client@example.com" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Postal Address</label>
              <input type="text" value={clientPostalAddress} onChange={(e) => setClientPostalAddress(e.target.value)} placeholder="P.O. Box 12345, Kampala" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs" />
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Service Details (APPENDIX A) */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="font-bold text-sm mb-3">Service Details — APPENDIX A</h3>
            <p className="text-xs text-slate-500 mb-3">Define the security services, location, and pricing.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Service Location *</label>
                <input type="text" value={serviceLocation} onChange={(e) => setServiceLocation(e.target.value)} placeholder="e.g., Client's Premises at Plot 32, Kampala Road" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Service Description</label>
                <input type="text" value={serviceDescription} onChange={(e) => setServiceDescription(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Number of Guards</label>
                <input type="number" value={numberOfGuards} onChange={(e) => setNumberOfGuards(e.target.value)} min="1" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="font-bold text-sm mb-3">Pricing Schedule</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Day Shift Rate (UGX per guard)</label>
                <input type="number" value={dayRate} onChange={(e) => setDayRate(e.target.value)} placeholder="0" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Night Shift Rate (UGX per guard)</label>
                <input type="number" value={nightRate} onChange={(e) => setNightRate(e.target.value)} placeholder="0" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs" />
              </div>
            </div>

            {/* Auto-calculated totals */}
            <div className="mt-4 bg-slate-50 rounded-lg p-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between"><span className="text-slate-600">Day Total:</span><span className="font-semibold">UGX {dayTotal.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Night Total:</span><span className="font-semibold">UGX {nightTotal.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Sub Total:</span><span className="font-semibold">UGX {subTotal.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">VAT ({vatRate}%):</span><span className="font-semibold">UGX {vatAmount.toLocaleString()}</span></div>
                <div className="col-span-2 flex justify-between border-t border-slate-300 pt-2 mt-1">
                  <span className="text-slate-900 font-bold">TOTAL:</span>
                  <span className="text-cyan-700 font-bold">UGX {grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Contract Dates */}
      {step === 4 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-bold text-sm mb-3">Contract Dates</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contract Date *</label>
              <input type="date" value={contractDate} onChange={(e) => setContractDate(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Effective Date *</label>
              <input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs" />
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Contract Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Auto-generated from client name" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs" />
          </div>
        </div>
      )}

      {/* Step 5: Signers (4 signature blocks) */}
      {step === 5 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-bold text-sm mb-3">Signatories</h3>
          <p className="text-xs text-slate-500 mb-3">The contract requires 4 signatures: Company Representative, Company Witness, Client Representative, and Client Witness.</p>
          <div className="space-y-3">
            {signers.map((signer, index) => (
              <div key={index} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="mb-2">
                  <span className="text-xs font-bold text-slate-900">{signerRoleLabels[signer.signerRole]}</span>
                  <span className="text-xs text-slate-500 ml-2">(Signature {index + 1} of 4)</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                    <input type="text" value={signer.signerName} onChange={(e) => updateSigner(index, { signerName: e.target.value })} placeholder="Full legal name" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Title / Position</label>
                    <input type="text" value={signer.signerTitle} onChange={(e) => updateSigner(index, { signerTitle: e.target.value })} placeholder="e.g., Managing Director" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                    <input type="email" value={signer.signerEmail} onChange={(e) => updateSigner(index, { signerEmail: e.target.value })} placeholder="For notifications" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review (before final step) */}
      {step === 6 && selectedTemplate && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-bold text-sm mb-3">Review Contract</h3>
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div><span className="text-slate-500 font-semibold">Template:</span> <span className="text-slate-900">{selectedTemplate.name}</span></div>
              <div><span className="text-slate-500 font-semibold">Client:</span> <span className="text-slate-900">{clientName || "—"}</span></div>
              <div><span className="text-slate-500 font-semibold">Location:</span> <span className="text-slate-900">{clientLocation || "—"}</span></div>
              <div><span className="text-slate-500 font-semibold">Service:</span> <span className="text-slate-900">{serviceLocation || "—"}</span></div>
              <div><span className="text-slate-500 font-semibold">Effective:</span> <span className="text-slate-900">{effectiveDate || "—"}</span></div>
              <div><span className="text-slate-500 font-semibold">Total:</span> <span className="text-slate-900 font-bold">UGX {grandTotal.toLocaleString()}</span></div>
            </div>
            <div>
              <span className="text-slate-500 font-semibold">Signers:</span>
              <div className="mt-1 space-y-1">
                {signers.map((s, i) => (
                  <div key={i} className="text-slate-900">
                    {i + 1}. <span className="font-semibold">{signerRoleLabels[s.signerRole]}</span>: {s.signerName} {s.signerTitle ? `(${s.signerTitle})` : ""}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={step === 1 ? onCancel : () => setStep(step - 1)}
          className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" /> {step === 1 ? "Cancel" : "Back"}
        </button>
        {step < 6 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={step === 1 && !selectedTemplate}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-semibold flex items-center gap-1 disabled:opacity-50"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleCreate}
            disabled={saving}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold flex items-center gap-1 disabled:opacity-50"
          >
            <Send className="w-4 h-4" /> {saving ? "Creating..." : "Create Contract"}
          </button>
        )}
      </div>
    </div>
  );
};
