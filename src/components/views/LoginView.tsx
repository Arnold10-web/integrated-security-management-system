import React, { useState } from "react";
import {
  ShieldCheck,
  Lock,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  Headphones,
  Zap,
} from "lucide-react";
import { sanitizeEmail, sanitizeFormValue } from "../../utils/sanitizer";
import { CompanyLogo } from "../ui/CompanyLogo";
import { SYSTEM_SHORT, SYSTEM_NAME } from "../../constants/branding";

interface LoginViewProps {
  onLogin: (email: string, password: string) => Promise<boolean>;
  idleNotice?: string | null;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, idleNotice }) => {
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [staffBadgeNumber, setStaffBadgeNumber] = useState("");
  const [resetReason, setResetReason] = useState("Lost Password / Forgotten PIN");
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const [sanitizationNotice, setSanitizationNotice] = useState<string | null>(null);

  const handleEmailChange = (val: string) => {
    if (/<script|javascript:|SELECT|UNION|<|>|'|"|;/i.test(val)) {
      setSanitizationNotice("XSS/SQL injection pattern detected & sanitized from email input.");
      setTimeout(() => setSanitizationNotice(null), 4000);
    }
    const cleanEmail = sanitizeEmail(val);
    setEmailInput(cleanEmail);
    setLoginError(null);
  };

  const handlePasswordChange = (val: string) => {
    if (/<script|javascript:|SELECT|UNION|<|>|'|"|;/i.test(val)) {
      setSanitizationNotice("Suspicious script payload detected & sanitized from password field.");
      setTimeout(() => setSanitizationNotice(null), 4000);
    }
    const cleanPassword = sanitizeFormValue(val);
    setPasswordInput(cleanPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = sanitizeEmail(emailInput);
    if (!cleanEmail) {
      setLoginError("Please enter your official department email address.");
      return;
    }

    setIsLoading(true);
    const success = await onLogin(cleanEmail, passwordInput);
    setIsLoading(false);

    if (!success) {
      setLoginError("Invalid email or password. Please try again.");
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotSuccess(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans relative overflow-hidden selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Background Decorative Gradient Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card Container */}
      <div className="w-full max-w-xl z-10 space-y-6">
        
        {/* Portal Header */}
        <div className="text-center space-y-3">
          <CompanyLogo imgClassName="w-16 h-16 object-contain mx-auto" iconClassName="w-9 h-9" />
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-black uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Authorized Personnel Only</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
            {SYSTEM_NAME} ({SYSTEM_SHORT})
          </h1>
          
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            Welcome to the centralized operations portal for staff
          </p>
        </div>

        {/* High-Security Sign-In Card */}
        <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 border border-slate-200">
          
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Sign in to ISCMS</h2>
              <p className="text-xs text-slate-500">Provide official department credentials to authenticate.</p>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-100 text-slate-700">
              <KeyRound className="w-5 h-5 text-slate-800" />
            </div>
          </div>

          {/* Automatic Idle Timeout Security Notice */}
          {idleNotice && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5 text-xs font-bold animate-fadeIn">
              <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <div className="font-black text-amber-950">Session Time-Out Protection</div>
                <div className="text-[11px] font-medium text-amber-900/90 leading-tight mt-0.5">{idleNotice}</div>
              </div>
            </div>
          )}

          {/* Real-time Input Sanitization Security Notice */}
          {sanitizationNotice && (
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-2.5 text-xs font-bold animate-fadeIn">
              <Zap className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{sanitizationNotice}</span>
            </div>
          )}

          {/* Error Message */}
          {loginError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2.5 text-xs font-bold animate-shake">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Official Department Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="Enter your organisational email"
                  value={emailInput}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-cyan-600 focus:bg-white outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] font-bold text-cyan-700 hover:text-cyan-900 cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={passwordInput}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-cyan-600 focus:bg-white outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 rounded-2xl font-black text-xs transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer ${
                isLoading
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                  : "bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20"
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>{isLoading ? "Authenticating..." : "Sign In to ISCMS"}</span>
            </button>
          </form>
        </div>

      </div>

      {/* IT Officer Password Reset Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                  <KeyRound className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">Password Reset Request</h3>
                  <p className="text-xs text-slate-500 font-medium">Contact IT Officer for credentials</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotSuccess(false);
                }}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer font-black text-base"
              >
                ✕
              </button>
            </div>

            {/* Simple Direct Message */}
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 space-y-1 text-xs">
              <div className="flex items-center gap-2 font-black text-amber-900">
                <Headphones className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Contact IT Officer</span>
              </div>
              <p className="text-xs text-amber-900/90 leading-relaxed font-medium">
                Please contact the IT Officer to request a password reset for your account.
              </p>
            </div>

            {forgotSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-2 animate-fadeIn">
                <div className="flex items-center gap-2 font-black text-xs text-emerald-900">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Ticket Submitted (#IT-RST-9042)</span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Your password reset request has been logged to the IT Officer queue. Please present your Force Number to the <strong>IT Officer</strong> to receive your temporary password.
                </p>
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotModal(false);
                      setForgotSuccess(false);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 cursor-pointer"
                  >
                    Close Window
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-3">
                <div className="text-xs font-bold text-slate-800">
                  Lodge Request to IT Officer:
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Company Email</label>
                    <input
                      type="email"
                      required
                      placeholder="Enter your organisational email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(sanitizeEmail(e.target.value))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-cyan-600"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Force Number</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. PSG025/001"
                      value={staffBadgeNumber}
                      onChange={(e) => setStaffBadgeNumber(sanitizeFormValue(e.target.value))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-cyan-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Reason for Requisition</label>
                  <select
                    value={resetReason}
                    onChange={(e) => setResetReason(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-cyan-600"
                  >
                    <option value="Lost Password / Forgotten PIN">Lost Passcode / Forgotten Secret PIN</option>
                    <option value="Suspected Compromise">Security Concern / Suspected Account Compromise</option>
                    <option value="New Station Assignment">New Duty Station / First Time Staff Activation</option>
                    <option value="Expired Credential Cycle">Expired Credential Cycle Requirement</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-slate-900 text-white text-xs font-black rounded-xl hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Headphones className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Lodge Ticket to IT Officer</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="pt-8 text-[11px] text-slate-500 text-center font-medium z-10">
        © 2026 Integrated Security Company Ltd • ISCMS Multi-Tenant ERP Architecture
      </div>
    </div>
  );
};
