import React, { useState } from "react";
import { GraduationCap, Award, Target, Users, Plus, Search, CheckCircle2, Calendar, BookOpen, ShieldCheck, Clock, BarChart2 } from "lucide-react";
import type { TrainingCohort, RecruitTrainee, UserRole } from "../../types";
import { toast } from "../../stores/toastStore";
import { TrainingCohortCardGrid, TrainingTraineeTable, AddCohortModal, AddTraineeModal, PassOutModal } from "../organisms";

interface TrainingSchoolViewProps {
  cohorts: TrainingCohort[];
  trainees: RecruitTrainee[];
  activeRole: UserRole;
  onAddCohort: (newCohort: Omit<TrainingCohort, "id">) => void;
  onUpdateCohort?: (id: string, updates: Partial<TrainingCohort>) => void;
  onDeleteCohort?: (id: string) => void;
  onAddTrainee: (newTrainee: Omit<RecruitTrainee, "id">) => void;
  onUpdateTrainee?: (id: string, updates: Partial<RecruitTrainee>) => void;
  onDeleteTrainee?: (id: string) => void;
  onGraduateTrainee: (traineeId: string, forceNumber: string) => void;
  existingForceNumbers?: string[];
}

export const TrainingSchoolView: React.FC<TrainingSchoolViewProps> = ({
  cohorts, trainees, onAddCohort, onUpdateCohort, onDeleteCohort, onAddTrainee, onUpdateTrainee, onDeleteTrainee, onGraduateTrainee, existingForceNumbers = [],
}) => {
  const [subTab, setSubTab] = useState<"cohorts" | "trainees">("cohorts");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCohortFilter, setSelectedCohortFilter] = useState("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");

  const [showAddCohortModal, setShowAddCohortModal] = useState(false);
  const [showAddTraineeModal, setShowAddTraineeModal] = useState(false);
  const [showPassOutModal, setShowPassOutModal] = useState(false);
  const [selectedTraineeForPassOut, setSelectedTraineeForPassOut] = useState<RecruitTrainee | null>(null);

  const totalTrainees = trainees.length;
  const passedOutCount = trainees.filter((t) => t.overallStatus === "Graduated & Certified").length;
  const underTrainingCount = trainees.filter((t) => t.overallStatus === "Under Training").length;
  const avgMarks =
    totalTrainees > 0
      ? Math.round(trainees.reduce((acc, t) => acc + (t.drillScore + t.marksmanshipScore + t.theoryScore) / 3, 0) / totalTrainees)
      : 0;

  const filteredTrainees = trainees.filter((t) => {
    if (selectedCohortFilter !== "ALL" && t.cohortId !== selectedCohortFilter) return false;
    if (selectedStatusFilter !== "ALL" && t.overallStatus !== selectedStatusFilter) return false;
    if (searchQuery && !t.fullName.toLowerCase().includes(searchQuery.toLowerCase()) && !t.nationalIdNumber.toLowerCase().includes(searchQuery.toLowerCase()) && !t.traineeCode.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-black uppercase tracking-wider border border-emerald-500/30">
              Operations Department • Guard Training Division
            </span>
            <span className="text-slate-400 text-xs font-mono">Kyankwanzi Training Academy</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-emerald-400" />
            Security Guard Training Academy & Pass-Out School
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-3xl">
            Oversee recruit intake cohorts, physical conditioning drills, live firing marksmanship assessments, weapons handling certification, and force number allocation under Operations.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setShowAddCohortModal(true)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer">
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Create New Intake Cohort</span>
          </button>
          <button onClick={() => setShowAddTraineeModal(true)}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-lg shadow-emerald-900/30 flex items-center gap-2 cursor-pointer">
            <Users className="w-4 h-4" />
            <span>Enroll Recruit Trainee</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Cohorts</span>
            <Calendar className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{cohorts.length} Intake Cohorts</div>
          <p className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{cohorts.filter((c) => c.status === "In Session").length} Currently In Training</span>
          </p>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Graduated & Certified Guards</span>
            <Award className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{passedOutCount} Guards Passed Out</div>
          <p className="text-[11px] font-semibold text-cyan-700 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Assigned Force Numbers & Deployed</span>
          </p>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Recruits Under Training</span>
            <Users className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{underTrainingCount} Trainees</div>
          <p className="text-[11px] font-semibold text-amber-700 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Ongoing Drills & Range Score</span>
          </p>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Marksmanship & Drill Avg</span>
            <Target className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{avgMarks}% Overall Average</div>
          <p className="text-[11px] font-semibold text-purple-700 flex items-center gap-1">
            <BarChart2 className="w-3.5 h-3.5" />
            <span>AK-47 & Parade Performance</span>
          </p>
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button onClick={() => setSubTab("cohorts")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${subTab === "cohorts" ? "bg-slate-900 text-white shadow-md" : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"}`}>
          <BookOpen className="w-4 h-4 text-emerald-400" />
          <span>Intake Cohorts & Curriculum ({cohorts.length})</span>
        </button>
        <button onClick={() => setSubTab("trainees")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${subTab === "trainees" ? "bg-slate-900 text-white shadow-md" : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"}`}>
          <Users className="w-4 h-4 text-cyan-400" />
          <span>Recruit Guards & Scores ({trainees.length})</span>
        </button>
      </div>

      {/* Subtab 1: Intake Cohorts */}
      {subTab === "cohorts" && (
        <TrainingCohortCardGrid cohorts={cohorts} onViewGuards={(cohortId) => { setSelectedCohortFilter(cohortId); setSubTab("trainees"); }} onDeleteCohort={onDeleteCohort} onUpdateCohort={onUpdateCohort} />
      )}

      {/* Subtab 2: Trainee Guards & Performance Scores */}
      {subTab === "trainees" && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              <span className="font-bold text-slate-600">Cohort Filter:</span>
              <select value={selectedCohortFilter} onChange={(e) => setSelectedCohortFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-800 outline-none">
                <option value="ALL">All Intake Cohorts ({cohorts.length})</option>
                {cohorts.map((c) => (<option key={c.id} value={c.id}>{c.code} - {c.name}</option>))}
              </select>
              <span className="font-bold text-slate-600 ml-2">Status:</span>
              <select value={selectedStatusFilter} onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-800 outline-none">
                <option value="ALL">All Statuses</option>
                <option value="Under Training">Under Training</option>
                <option value="Graduated & Certified">Graduated & Certified</option>
                <option value="Deferred">Deferred</option>
                <option value="Disqualified">Disqualified</option>
              </select>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-72 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input type="text" placeholder="Search recruit by name, NIN or code..."
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent outline-none font-semibold text-slate-800 placeholder:text-slate-400" />
            </div>
          </div>

          <TrainingTraineeTable trainees={filteredTrainees}
            onPassOut={(t) => { setSelectedTraineeForPassOut(t); setShowPassOutModal(true); }}
            onViewCert={(t) => toast.success("Pass-Out Certificate", `Name: ${t.fullName} · Force Number: ${t.assignedForceNumber} · NIN: ${t.nationalIdNumber} · Training Average: ${Math.round((t.drillScore + t.marksmanshipScore + t.theoryScore) / 3)}% · Graduated: ${t.dateGraduated}`)}
            onDeleteTrainee={onDeleteTrainee}
            onUpdateTrainee={onUpdateTrainee}
          />
        </div>
      )}

      <AddCohortModal show={showAddCohortModal} onClose={() => setShowAddCohortModal(false)} onSubmit={onAddCohort} />
      <AddTraineeModal show={showAddTraineeModal} cohorts={cohorts} onClose={() => setShowAddTraineeModal(false)} onSubmit={onAddTrainee} />
      <PassOutModal show={showPassOutModal} trainee={selectedTraineeForPassOut} onClose={() => { setShowPassOutModal(false); setSelectedTraineeForPassOut(null); }} onSubmit={onGraduateTrainee} existingForceNumbers={existingForceNumbers} />
    </div>
  );
};
