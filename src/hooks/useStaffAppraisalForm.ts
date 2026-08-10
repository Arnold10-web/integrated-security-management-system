import { useState } from "react";
import type { StaffAppraisal, Guard } from "../types";
import { computeOverallRating } from "../services/calculationService";

export function useStaffAppraisalForm(guards: Guard[], initialAppraisals: StaffAppraisal[] = []) {
  const [appraisals, setAppraisals] = useState<StaffAppraisal[]>(initialAppraisals);
  const [showAppraisalModal, setShowAppraisalModal] = useState(false);
  const [appraisalSearch, setAppraisalSearch] = useState("");
  const [appraisalPeriodFilter, setAppraisalPeriodFilter] = useState("ALL");
  const [appraisalRatingFilter, setAppraisalRatingFilter] = useState("ALL");
  const [selectedAppraisalForReport, setSelectedAppraisalForReport] = useState<StaffAppraisal | null>(null);

  const [appraisalGuardId, setAppraisalGuardId] = useState("");
  const [appraisalPeriod, setAppraisalPeriod] = useState<StaffAppraisal["reviewPeriod"]>("Annual 2026");
  const [appraisalType, setAppraisalType] = useState<StaffAppraisal["reviewType"]>("Annual Evaluation");
  const [evaluatorNameInput, setEvaluatorNameInput] = useState("Sarah Akello");
  const [evaluatorTitleInput, setEvaluatorTitleInput] = useState("HR & Performance Manager");
  const [disciplineScore, setDisciplineScore] = useState(5);
  const [punctualityScore, setPunctualityScore] = useState(5);
  const [clientRatingScore, setClientRatingScore] = useState(4);
  const [appearanceScore, setAppearanceScore] = useState(5);
  const [incidentScore, setIncidentScore] = useState(4);
  const [appraisalRecommendation, setAppraisalRecommendation] = useState<StaffAppraisal["recommendation"]>("Promotion");
  const [appraisalComments, setAppraisalComments] = useState("");
  const [keyStrengthsInput, setKeyStrengthsInput] = useState("");
  const [growthAreasInput, setGrowthAreasInput] = useState("");
  const [agreedGoalsInput, setAgreedGoalsInput] = useState("");
  const [supervisorCommentsInput, setSupervisorCommentsInput] = useState("");
  const [staffFeedbackInput, setStaffFeedbackInput] = useState("");

  const handleCreateAppraisal = (e: React.FormEvent) => {
    e.preventDefault();
    const guard = guards.find((g) => g.id === appraisalGuardId) || guards[0];
    const overallRating = computeOverallRating(
      disciplineScore,
      punctualityScore,
      clientRatingScore,
      appearanceScore,
      incidentScore
    );

    const newAppraisal: StaffAppraisal = {
      id: `apr-${Date.now()}`,
      guardId: guard ? guard.id : "grd-101",
      guardName: guard ? guard.fullName : "John Bosco Kateregga",
      guardCode: guard ? guard.guardCode : "SG-2024-001",
      designation: guard ? guard.designation : "Guard",
      siteName: guard ? guard.assignedSite : "Kampala Station",
      reviewPeriod: appraisalPeriod,
      reviewType: appraisalType,
      evaluatorName: evaluatorNameInput || "Sarah Akello",
      evaluatorTitle: evaluatorTitleInput || "HR & Performance Manager",
      evaluationDate: new Date().toISOString().split("T")[0],
      disciplineScore,
      punctualityScore,
      clientRatingScore,
      appearanceScore,
      incidentHandlingScore: incidentScore,
      overallRating,
      recommendation: appraisalRecommendation,
      comments: appraisalComments || "Annual performance review completed.",
      keyStrengths: keyStrengthsInput || "Demonstrates strong integrity and dedication on post.",
      growthAreas: growthAreasInput || "Continued training in advanced security procedures.",
      agreedDevelopmentGoals: agreedGoalsInput || "1. Complete annual refresher training.\n2. Maintain punctual attendance record.",
      supervisorComments: supervisorCommentsInput || "Satisfactory progress and strong commitment shown.",
      staffFeedbackComments: staffFeedbackInput || "Agreed with appraisal outcomes and developmental targets.",
      status: "Approved & Archived",
    };
    setAppraisals([newAppraisal, ...appraisals]);
    setShowAppraisalModal(false);
    setAppraisalComments("");
    setKeyStrengthsInput("");
    setGrowthAreasInput("");
    setAgreedGoalsInput("");
    setSupervisorCommentsInput("");
    setStaffFeedbackInput("");
  };

  return {
    appraisals,
    setAppraisals,
    showAppraisalModal,
    setShowAppraisalModal,
    appraisalSearch,
    setAppraisalSearch,
    appraisalPeriodFilter,
    setAppraisalPeriodFilter,
    appraisalRatingFilter,
    setAppraisalRatingFilter,
    selectedAppraisalForReport,
    setSelectedAppraisalForReport,
    appraisalGuardId,
    setAppraisalGuardId,
    appraisalPeriod,
    setAppraisalPeriod,
    appraisalType,
    setAppraisalType,
    evaluatorNameInput,
    setEvaluatorNameInput,
    evaluatorTitleInput,
    setEvaluatorTitleInput,
    disciplineScore,
    setDisciplineScore,
    punctualityScore,
    setPunctualityScore,
    clientRatingScore,
    setClientRatingScore,
    appearanceScore,
    setAppearanceScore,
    incidentScore,
    setIncidentScore,
    appraisalRecommendation,
    setAppraisalRecommendation,
    appraisalComments,
    setAppraisalComments,
    keyStrengthsInput,
    setKeyStrengthsInput,
    growthAreasInput,
    setGrowthAreasInput,
    agreedGoalsInput,
    setAgreedGoalsInput,
    supervisorCommentsInput,
    setSupervisorCommentsInput,
    staffFeedbackInput,
    setStaffFeedbackInput,
    handleCreateAppraisal,
  };
}
