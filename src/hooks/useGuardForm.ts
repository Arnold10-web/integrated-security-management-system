import { useState } from "react";
import type { Guard } from "../types";
import { nextForceNumber } from "../utils/forceNumber";

export interface GuardFormState {
  fullName: string;
  guardCode: string;
  photoUrl: string;
  designation: Guard["designation"];
  phone: string;
  nationalId: string;
  assignedSite: string;
  region: string;
  zone: string;
  guardLocation: string;
  bankAccount: string;
  bankName: string;
  finishedProbation: boolean;
  armedQualified: boolean;
  k9Qualified: boolean;
  tin: string;
  nssfNo: string;
  dateOfBirth: string;
  gender: Guard["gender"];
  maritalStatus: Guard["maritalStatus"];
  educationLevel: string;
  motherName: string;
  motherPhone: string;
  fatherName: string;
  fatherPhone: string;
  nextOfKinName: string;
  nextOfKinRelationship: string;
  nextOfKinPhone: string;
  nextOfKinResidence: string;
  relativesOrReferees: string;
  residenceDistrict: string;
  residenceSubCounty: string;
  residenceParish: string;
  residenceVillage: string;
  lc1Chairperson: string;
  lc1Contact: string;
  physicalAddress: string;
  emergencyContactPhone: string;
  surnameAtBirth: string;
  nationality: string;
  tribe: string;
  placeOfBirth: string;
  lc2Chairperson: string;
  closeRelatives: string;
  neighbours: string;
  fatherAlive: boolean;
  fatherResidence: string;
  bankAccountName: string;
  bankBranch: string;
  recruitmentTab: "primary" | "statutory" | "family" | "residence" | "referees" | "biodata";
}

export function useGuardForm(onAddGuard: (guard: Omit<Guard, "id">) => void, existingForceNumbers: string[] = []) {
  const [state, setState] = useState<GuardFormState>({
    fullName: "",
    guardCode: "",
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    designation: "Guard",
    phone: "",
    nationalId: "",
    assignedSite: "Bank of East Africa Headquarters",
    region: "Central (Kampala HQ)",
    zone: "",
    guardLocation: "Kampala Central (CBD)",
    bankAccount: "",
    bankName: "Stanbic Bank Uganda",
    finishedProbation: true,
    armedQualified: false,
    k9Qualified: false,
    tin: "",
    nssfNo: "",
    dateOfBirth: "1995-06-12",
    gender: "Male",
    maritalStatus: "Single",
    educationLevel: "Uganda Certificate of Education (O-Level)",
    motherName: "",
    motherPhone: "",
    fatherName: "",
    fatherPhone: "",
    nextOfKinName: "",
    nextOfKinRelationship: "Spouse",
    nextOfKinPhone: "",
    nextOfKinResidence: "",
    relativesOrReferees: "",
    residenceDistrict: "Kampala City",
    residenceSubCounty: "Kawempe Division",
    residenceParish: "Kazo Parish",
    residenceVillage: "Kazo Central Village",
    lc1Chairperson: "",
    lc1Contact: "",
    physicalAddress: "",
    emergencyContactPhone: "",
    surnameAtBirth: "",
    nationality: "Ugandan",
    tribe: "",
    placeOfBirth: "",
    lc2Chairperson: "",
    closeRelatives: "",
    neighbours: "",
    fatherAlive: true,
    fatherResidence: "",
    bankAccountName: "",
    bankBranch: "",
    recruitmentTab: "primary",
  });

  const set = (partial: Partial<GuardFormState>) =>
    setState((prev) => ({ ...prev, ...partial }));

  const reset = () =>
    setState((prev) => ({
      ...prev,
      fullName: "",
      guardCode: "",
      phone: "",
      nationalId: "",
      bankAccount: "",
      tin: "",
      nssfNo: "",
      motherName: "",
      fatherName: "",
      nextOfKinName: "",
      nextOfKinPhone: "",
      nextOfKinResidence: "",
      lc1Chairperson: "",
      lc1Contact: "",
      physicalAddress: "",
      emergencyContactPhone: "",
      surnameAtBirth: "",
      tribe: "",
      placeOfBirth: "",
      lc2Chairperson: "",
      closeRelatives: "",
      neighbours: "",
      fatherResidence: "",
      bankAccountName: "",
      bankBranch: "",
    }));

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddGuard({
      fullName: state.fullName,
      guardCode: state.guardCode || nextForceNumber(existingForceNumbers),
      photoUrl: state.photoUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
      designation: state.designation,
      phone: state.phone,
      nationalId: state.nationalId,
      tin: state.tin || `100${Math.floor(1000000 + Math.random() * 9000000)}`,
      nssfNo: state.nssfNo || `NS-${Math.floor(1000000 + Math.random() * 9000000)}-01`,
      assignedSite: state.assignedSite,
      region: state.region,
      zone: state.zone || undefined,
      status: "On Duty",
      lifecycleStage: "ENROLLED",
      location: state.guardLocation || "Kampala Central (CBD)",
      bankAccount: state.bankAccount || "90300188201",
      bankName: state.bankName || "Stanbic Bank Uganda",
      finishedProbation: state.finishedProbation,
      medicalCleared: true,
      armedQualified: state.armedQualified,
      k9Qualified: state.k9Qualified,
      joinDate: new Date().toISOString().split("T")[0],
      warningLettersCount: 0,
      certifications: ["Basic Security Training", "Crowd Control & Ethics"],
      idCardStatus: "Pending Records Issuance",
      dateOfBirth: state.dateOfBirth,
      gender: state.gender,
      maritalStatus: state.maritalStatus,
      educationLevel: state.educationLevel,
      motherName: state.motherName || "Mary Akello",
      motherPhone: state.motherPhone,
      fatherName: state.fatherName || "John Ssebaggala",
      fatherPhone: state.fatherPhone,
      nextOfKinName: state.nextOfKinName || "Grace Ssebaggala",
      nextOfKinRelationship: state.nextOfKinRelationship,
      nextOfKinPhone: state.nextOfKinPhone || state.phone,
      nextOfKinResidence: state.nextOfKinResidence || state.physicalAddress || "Kampala",
      relativesOrReferees: state.relativesOrReferees || "References verified by HR Officer",
      residenceDistrict: state.residenceDistrict,
      residenceSubCounty: state.residenceSubCounty,
      residenceParish: state.residenceParish,
      residenceVillage: state.residenceVillage,
      lc1Chairperson: state.lc1Chairperson || "Local LC1 Chairperson",
      lc1Contact: state.lc1Contact,
      physicalAddress: state.physicalAddress,
      emergencyContactPhone: state.emergencyContactPhone || state.phone,
      surnameAtBirth: state.surnameAtBirth,
      nationality: state.nationality || "Ugandan",
      tribe: state.tribe,
      placeOfBirth: state.placeOfBirth,
      lc2Chairperson: state.lc2Chairperson,
      closeRelatives: state.closeRelatives.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 3),
      neighbours: state.neighbours.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 2),
      fatherAlive: state.fatherAlive,
      fatherResidence: state.fatherResidence,
      bankAccountName: state.bankAccountName,
      bankBranch: state.bankBranch,
    });
    reset();
  };

  return { state, set, reset, handleAddSubmit };
}
