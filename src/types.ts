export type UserRole =
  // Top Management
  | "General Manager"
  | "Director"
  // HR Department
  | "HR Manager"
  | "HR Assistant"
  | "Records Officer"
  // Marketing Department
  | "Business Development Manager"
  | "Sales and Marketing Supervisor"
  // Operations Department (Operations Manager is overall Dept Head)
  | "Operations Manager"
  | "Regional Manager"
  | "Fleet Manager"
  | "Training Officer"
  | "Investigations Officer"
  | "Guard Officer"
  | "Armorer"
  | "K9 Supervisor"
  | "K9 Handler"
  // Finance Department
  | "Finance Manager"
  | "Accountant"
  | "Assistant Accountant"
  | "Internal Auditor"
  | "Cashier"
  // Administration Department
  | "Administrative Officer"
  // IT Department (IT Officer handles all IT functions)
  | "IT Officer";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  department: string;
  forceNumber?: string; // Unique Force Number
  region?: string; // e.g. "Central (Kampala HQ)", "Western (Mbarara Station)", "Northern (Gulu Station)", "Eastern (Jinja Station)"
  lastActive: string;
  status: "Active" | "Suspended" | "Inactive";
  customPermissions?: Record<string, "view" | "full" | "none">;
  phone?: string;
  // Time-bound acting delegation (§5.4). role above stays the base role; the
  // effective (acting) role is resolved server-side at sign-in.
  effectiveRole?: UserRole;
  actingRole?: UserRole;
  actingExpiresAt?: string;
  actingGrantedBy?: string;
  actingGrantedAt?: string;
  // Staff identity card (plastic) — mirrors the guard paper-ID lifecycle.
  idCardStatus?: string;
  idCardNumber?: string;
  idCardIssuedDate?: string;
  idCardExpiryDate?: string;
  idCardIssuerName?: string;
  idCardIssuerSignatureUrl?: string;
  // Staff biodata — captured the same way as guard biodata (§HR personnel).
  photoUrl?: string;
  signatureUrl?: string;
  dateOfBirth?: string;
  gender?: string;
  maritalStatus?: string;
  educationLevel?: string;
  motherName?: string;
  motherPhone?: string;
  fatherName?: string;
  fatherPhone?: string;
  nextOfKinName?: string;
  nextOfKinRelationship?: string;
  nextOfKinPhone?: string;
  nextOfKinResidence?: string;
  relativesOrReferees?: string;
  residenceDistrict?: string;
  residenceSubCounty?: string;
  residenceParish?: string;
  residenceVillage?: string;
  lc1Chairperson?: string;
  lc1Contact?: string;
  physicalAddress?: string;
  emergencyContactPhone?: string;
  surnameAtBirth?: string;
  nationality?: string;
  tribe?: string;
  placeOfBirth?: string;
  lc2Chairperson?: string;
  closeRelatives?: string[];
  neighbours?: string[];
  fatherAlive?: boolean;
  fatherResidence?: string;
}

/** §11 — HR-initiated acting-privilege request, executed by the IT Officer.
 *  Who needs coverage, for which role, why, until when (requestedBy) and the
 *  IT officer who carried out the grant (grantedBy). */
export interface ActingPrivilegeRequest {
  id: string;
  targetUserId: string;
  targetName: string;
  actingRole: UserRole;
  reason: string;
  expiresAt: string;
  status: "Pending" | "Granted" | "Denied" | "Cancelled";
  requestedById: string;
  requestedByName: string;
  grantedById?: string | null;
  grantedByName?: string | null;
  grantedAt?: string | null;
  createdAt: string;
}

export interface RegionalOffice {
  id: string;
  code: string;
  name: string;
  regionName: string;
  locationCity: string;
  regionalManagerName: string;
  phone: string;
  email: string;
  activeGuardsCount: number;
  clientSitesCount: number;
  armouryVaultStatus: "Fully Operational" | "Restricted Vault" | "Main Hub Vault";
  vehiclesAssigned: number;
}

export interface CustomRoleDefinition {
  id: string;
  roleName: string;
  department: string;
  description: string;
  allowedModules: string[];
  assignedRegions?: string[];
  createdDate: string;
  isSystemDefault?: boolean;
}

export interface AdminRequisition {
  id: string;
  reqCode: string;
  department: string;
  requestedBy: string;
  itemDescription: string;
  quantity: number;
  estimatedCostUgx: number;
  priority: "High" | "Medium" | "Low";
  status: "Pending Approval" | "Approved" | "Procured" | "Rejected";
  dateRequested: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
}

export type GuardLifecycleStage =
  | "ENROLLED"
  | "HANDED_TO_OPERATIONS"
  | "IN_TRAINING"
  | "PASSED_OUT"
  | "DEPLOYED";

export interface Guard {
  id: string;
  forceNumber: string; // FORCE/NO (Unique Force Number — canonical identifier for guards and all staff)
  fullName: string; // NAME
  photoUrl?: string; // Personnel Passport Photo / Biodata Image
  signatureUrl?: string; // ID holder's captured signature (signature pad)
  designation: "Guard" | "K9 Handler" | "Armorer" | "Site In-Charge" | "Inspector";
  phone: string; // TEL NO
  nationalId: string; // NIN (National Identification Number)
  tin?: string; // Tax Identification Number (TIN)
  nssfNo?: string; // NSSF Number
  assignedSite: string;
  location?: string; // LOCATION (Station / Deployment Location)
  region?: string; // Deployment region (scoped for RM/Ops visibility)
  zone?: string; // Zone supervised (Inspector) / site zone (Site In-Charge)
  bankAccount?: string; // BANK ACCOUNT
  bankName?: string; // BANK NAME
  finishedProbation?: boolean; // FINISHED PROBATION
  status: "On Duty" | "Off Duty" | "On Leave" | "Suspended" | "Deserted" | "Archived";
  lifecycleStage?: GuardLifecycleStage;
  isDeserter?: boolean;
  desertionDate?: string;
  desertionNotes?: string;
  medicalCleared: boolean;
  armedQualified: boolean;
  k9Qualified: boolean;
  joinDate: string;
  warningLettersCount: number;
  certifications: string[];

  // IT ID Card Issuance & System Account Tracking
  idCardStatus?: "Pending Records Issuance" | "Issued & Active" | "Revoked" | "Expired" | "Reissue Required";
  idCardNumber?: string; // e.g. IDC-2026-SG001
  idCardIssuedDate?: string;
  idCardExpiryDate?: string;
  idCardIssuerName?: string;
  idCardIssuerSignatureUrl?: string;
  hasSystemAccount?: boolean;
  linkedUserId?: string;
  terminationReason?: string;
  terminationDate?: string;
  terminationCategory?: string;

  // Comprehensive HR Onboarding & Employee Biodata Fields
  dateOfBirth?: string;
  gender?: "Male" | "Female";
  maritalStatus?: "Single" | "Married" | "Widowed" | "Divorced";
  educationLevel?: string;
  motherName?: string;
  motherPhone?: string;
  fatherName?: string;
  fatherPhone?: string;
  nextOfKinName?: string;
  nextOfKinRelationship?: string;
  nextOfKinPhone?: string;
  nextOfKinResidence?: string;
  relativesOrReferees?: string;
  residenceDistrict?: string;
  residenceSubCounty?: string;
  residenceParish?: string;
  residenceVillage?: string;
  lc1Chairperson?: string;
  lc1Contact?: string;
  physicalAddress?: string;
  emergencyContactPhone?: string;
  surnameAtBirth?: string;
  nationality?: string;
  tribe?: string;
  placeOfBirth?: string;
  lc2Chairperson?: string;
  closeRelatives?: string[];
  neighbours?: string[];
  fatherAlive?: boolean;
  fatherResidence?: string;
  bankAccountName?: string;
  bankBranch?: string;
}

export interface HRRemittanceRecord {
  id: string;
  guardId: string;
  name: string;             // name
  forceNo: string;          // ForceNo
  daysNormal: number;       // DaysNormal
  daysOT: number;           // DaysOT
  grossPay: number;         // Gross Allowance & Pay (UGX)
  paye: number;             // PAYE tax (UGX)
  nssf: number;             // NSSF contribution (UGX)
  shoes: number;            // Shoes (UGX)
  uniform: number;          // Uniform (UGX)
  advance: number;          // advance (UGX)
  food: number;             // Food (UGX)
  fine: number;             // Fine (UGX)
  rent: number;             // Rent (UGX)
  loan: number;             // Loan (UGX)
  refund: number;           // Refund (UGX)
  location: string;         // Location
  totalDeductions: number;  // deductions (UGX)
  nssfNo: string;           // nssfno
  tin: string;              // TIN
  netPay: number;           // net pay (UGX)
  telNo: string;            // TelNo
  bank: string;             // Bank
  bankName: string;         // Bankname
  cyclePeriod: string;      // e.g., "July 2026"
  status: "Draft" | "Verified by HR" | "Approved" | "Processed";
}

export interface LeaveRequest {
  id: string;
  guardId: string;
  guardName: string;
  forceNumber: string;
  leaveType: "Annual Leave" | "Sick Leave" | "Emergency Leave" | "Maternity/Paternity" | "Compassionate Leave" | "Unpaid Leave" | "Paternity Leave" | "Maternity Leave" | "Compensatory Leave" | "Study Leave";
  startDate: string;
  endDate: string;
  durationDays: number;
  reason: string;
  reliefGuardName?: string;
  reliefForceNumber?: string;
  appliedDate: string;
  status: "Approved" | "Pending HR Approval" | "Pending GM Approval" | "Rejected" | "Completed";
  approvedBy?: string;
  notes?: string;
  contactAddress?: string;
  entitlement?: number;
  taken?: number;
  balance?: number;
  resumptionDate?: string;
  gmApprovedBy?: string;
  approvalId?: string;
  requestedByRole?: string;
}

export interface StaffAppraisal {
  id: string;
  guardId: string;
  guardName: string;
  forceNumber: string;
  designation: string;
  siteName: string;
  reviewPeriod: "Q1 2026" | "Mid-Year 2026" | "Q3 2026" | "Annual 2026" | "Annual 2025" | "Annual 2027";
  reviewType?: "Annual Evaluation" | "Mid-Year Review" | "Quarterly Review" | "Probation Assessment";
  evaluatorName: string;
  evaluatorTitle?: string;
  evaluationDate: string;
  disciplineScore: number; // 1 to 5
  punctualityScore: number; // 1 to 5
  clientRatingScore: number; // 1 to 5
  appearanceScore: number; // 1 to 5
  incidentHandlingScore: number; // 1 to 5
  overallRating: "Outstanding (A)" | "Exceeds Expectations (B)" | "Satisfactory (C)" | "Needs Improvement (D)" | "Unsatisfactory (F)";
  recommendation: "Promotion" | "Salary Adjustment" | "Contract Renewal" | "Refresher Training" | "Routine Supervision";
  comments: string;
  keyStrengths?: string;
  growthAreas?: string;
  agreedDevelopmentGoals?: string; // Agreed-upon professional development goals
  supervisorComments?: string;
  staffFeedbackComments?: string;
  status: "Draft" | "Pending Approval" | "Approved & Archived";
}

export const SITE_ZONES = [
  "Central Business",
  "North District",
  "Northern District",
  "South Extension",
  "Western District",
  "Industrial Zone",
] as const;

export type SiteZone = (typeof SITE_ZONES)[number];

export interface ClientSite {
  id: string;
  clientName: string;
  siteName: string;
  location: string;
  zone: SiteZone;
  region?: string;
  dayShiftGuards: number;
  nightShiftGuards: number;
  dayShiftArmed: number;
  nightShiftArmed: number;
  armedGuardsRequired: number;
  k9Required: boolean;
  contactPerson: string;
  contactPhone: string;
  slaStatus: "Compliant" | "Understaffed" | "Attention Needed";
  satisfactionRating?: number;
  deploymentStatus?: "Not Deployed" | "Deployed" | "Partially Deployed";
  wonBy?: string;
}

export interface ContractScanPage {
  id: string;
  pageNo: number;
  name: string;
  dataUrl: string;
}

export interface ContractRecord {
  id: string;
  contractCode: string;
  title: string;
  contractType: "Staff Contract" | "Client Contract";
  partyName: string; // Staff member or Client company name
  category: "Guard Employment SLA" | "Executive Employment" | "Corporate Client Service Agreement" | "Retail Site Agreement" | "Vendor SLA";
  startDate: string;
  endDate: string;
  valueUgx?: number;
  status: "Draft" | "Active" | "Expiring Soon" | "Expired" | "Pending Renewal" | "Terminated" | "Archived";
  documentRef: string;
  managedBy: string; // e.g. "Records Officer"
  notes?: string;
  region?: string;
  autoRenew?: boolean;
  paymentTerms?: string;
  billingCycle?: string;
  slaTerms?: string;
  createdBy?: string;
  preparedBy?: string;
  issuedBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  approvalStep?: string;
  relatedForceNumber?: string;
  relatedSiteName?: string;
  voidReason?: string;
  siteSurvey?: string;
  siteSurveyBy?: string;
  siteSurveyAt?: string;
  scanPages?: ContractScanPage[];
}

export interface DutyRoster {
  id: string;
  guardId: string;
  guardName: string;
  siteId: string;
  siteName: string;
  region?: string;
  shiftDate: string;
  shiftType: "Day Shift (06:00-18:00)" | "Night Shift (18:00-06:00)";
  status: "Scheduled" | "Present" | "Absent" | "On Overtime";
  checkInTime?: string;
  checkOutTime?: string;
}

export interface ArmouryItem {
  id: string;
  assetTag: string;
  serialNumber: string;
  category: "Firearm" | "Ammunition" | "Body Armor" | "Tactical Gear" | "Communications";
  name: string;
  caliberOrSpecs: string;
  totalQuantity: number;
  availableQuantity: number;
  condition: "Excellent" | "Good" | "Requires Service" | "Decommissioned";
  assignedToGuardId?: string;
  assignedToGuardName?: string;
  location: "Main Vault" | "Issued Out" | "Armoury Maintenance";
}

export interface ArmouryLog {
  id: string;
  serialNumberLog: string; // Serial Number of Log / Dispatch Sl. No
  guardId: string;
  guardName: string; // Name of Guard
  locationName: string; // Name of Location (Post / Duty Site)
  firearmSerialNumber: string; // Fire Arm Serial Number
  assetName: string; // Firearm Model Name
  assetTag: string;
  ammoRoundsOut: number; // Ammunition Number of Rounds (Rounds Out)
  dateOut: string; // Date Out
  timeOut: string; // Time Out
  signOutConfirmed: boolean; // Sign Out Confirmation
  dateIn?: string; // Date In
  timeIn?: string; // Time In
  ammoRoundsIn?: number; // Round In (Rounds Returned)
  signInConfirmed?: boolean; // Sign In Confirmation
  substituteReceiver?: string; // Substitute Receiver (if returned by replacement officer)
  armourerInCharge: string; // Armory Incharge (Armourer Officer)
  status: "Checked Out" | "Returned" | "Discrepancy Reported";
  notes?: string;
}

export interface K9Dog {
  id: string;
  code: string;
  name: string;
  breed: "German Shepherd" | "Belgian Malinois" | "Rottweiler" | "Doberman Pinscher";
  chipNumber: string;
  ageYears: number;
  status: "Active Duty" | "In Training" | "Medical Leave" | "Retired";
  assignedHandlerId?: string;
  assignedHandlerName?: string;
  kennelNumber: string;
  rabiesVaccineDate: string;
  lastVetCheck: string;
  specialization: "Explosive Detection" | "Patrol & Attack" | "Narcotics Detection" | "Perimeter Guarding";
  currentWeightKg?: number;
  healthCondition?: "Optimal / Fit for Duty" | "Minor Fatigue / Rest Prescribed" | "Under Veterinary Treatment" | "Unfit for Duty";
  vaccinationStatus?: "Up to Date - Fully Vaccinated" | "Rabies Booster Due" | "Deworming Required" | "Pending Vet Booster";
}

export interface K9HealthInspection {
  id: string;
  inspectionCode: string;
  k9Id: string;
  k9Name: string;
  handlerName: string;
  inspectionDate: string;
  weightKg: number;
  vaccinationStatus: "Up to Date - Fully Vaccinated" | "Rabies Booster Due" | "Deworming Required" | "Pending Vet Booster";
  physicalCondition: "Optimal / Fit for Duty" | "Minor Fatigue / Rest Prescribed" | "Under Veterinary Treatment" | "Unfit for Duty";
  coatAndSkinCheck: "Normal & Clean" | "Skin Rash / Mange" | "Ticks / Parasites Found" | "Wounds / Abrasions";
  appetiteAndHydration: "Normal / Healthy" | "Reduced Appetite" | "Dehydrated";
  temperatureCelsius?: number;
  inspectingOfficer: string;
  notes?: string;
}

export interface K9Log {
  id: string;
  k9Id: string;
  k9Name: string;
  handlerName: string;
  siteName: string;
  deploymentDate: string;
  shiftType: "Day Shift" | "Night Shift";
  trainingScore: "Outstanding" | "Satisfactory" | "Needs Refresher";
  vetNotes?: string;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  vehicleType: "Patrol SUV" | "Motorcycle" | "Armored Escort" | "Crew Van";
  makeModel: string;
  driverAssigned: string;
  fuelLevelPercentage: number;
  mileageKm: number;
  status: "Operational" | "In Service" | "Fueling Needed" | "Grounded";
  lastServiceDate: string;
  nextServiceDueKm: number;
  chassisNumber?: string;
  insuranceExpiryDate?: string;
  roadLicenceExpiryDate?: string;
  deploymentBranch?: string;
  conditionRating?: "Excellent" | "Good" | "Needs Repair" | "Critical";
  replacementStatus?: "Active Fleet" | "Scheduled for Maintenance" | "Recommended for Replacement" | "Decommissioned";
  gpsTrackerId?: string;
  lifetimeMaintenanceCost?: number;
  serviceIntervalKm?: number;
  lastOilChangeKm?: number;
  lastOilChangeDate?: string;
  oilStatus?: "Good" | "Due Soon" | "Overdue";
  lastTyreCheckDate?: string;
  tyreTreadDepthMm?: number;
  tyreStatus?: "Pass" | "Inspect Soon" | "Replace Required";
}

export interface VehicleTripLog {
  id: string;
  tripCode: string;
  vehicleId: string;
  plateNumber: string;
  driverName: string;
  destination: string;
  purpose: string;
  startMileageKm: number;
  endMileageKm?: number;
  distanceKm?: number;
  departureTime: string;
  arrivalTime?: string;
  status: "In Transit" | "Completed" | "Cancelled";
  authorizedBy: string;
}

export interface FuelRequisitionLog {
  id: string;
  voucherCode: string;
  vehicleId: string;
  plateNumber: string;
  driverName: string;
  fuelLitres: number;
  costUgx: number;
  mileageAtRefillKm: number;
  fuelType: "Diesel" | "Petrol";
  stationName: string;
  refillDate: string;
  approvedBy: string;
  reconciled: boolean;
}

export interface TransportRequest {
  id: string;
  requestCode: string;
  requestedBy: string;
  requestedByName: string;
  requesterDepartment: string;
  destination: string;
  purpose: string;
  travelDate: string;
  travelTime?: string;
  returnTime?: string;
  vehicleType: "Car" | "Motorcycle" | "Any";
  passengersCount: number;
  status: "Pending Fleet" | "Approved" | "Declined";
  assignedVehicleId?: string;
  assignedVehicle?: string;
  assignedDriverId?: string;
  assignedDriver?: string;
  assignedRiderId?: string;
  assignedRider?: string;
  declinedReason?: string;
  actedBy?: string;
  actedAt?: string;
  approvalId?: string;
}

export type SiteSurveyStatus = "Requested" | "In Progress" | "Completed" | "Cancelled";

export interface SiteSurvey {
  id: string;
  surveyCode: string;
  clientName: string;
  siteName: string;
  region?: string;
  status: SiteSurveyStatus;
  requestedBy: string;
  requestedByName: string;
  requestedDepartment: string;
  surveyedBy?: string;
  premisesType?: string;
  perimeterStatus?: string;
  entryPoints?: number;
  riskLevel?: string;
  highValueAssets?: string;
  dayGuardsNeeded?: number;
  nightGuardsNeeded?: number;
  armedDay?: boolean;
  armedNight?: boolean;
  equipmentNeeded?: string;
  k9Required?: boolean;
  patrolVehicleRequired?: boolean;
  accessHours?: string;
  recommendation?: string;
  notes?: string;
  reportPath?: string;
  createdAt?: string;
}

export interface ContractInquiry {
  id: string;
  inquiryCode: string;
  requestedBy: string;
  requestedByName: string;
  requesterDepartment: string;
  clientName: string;
  siteName?: string;
  searchHints?: string;
  purpose: "Confirmation" | "Full Copy";
  status: "Pending" | "Answered";
  respondedBy?: string;
  responseType?: "Confirmation" | "Full Copy";
  responseNotes?: string;
  responsePath?: string;
  respondedAt?: string;
}

export interface MaintenanceServiceLog {
  id: string;
  serviceCode: string;
  vehicleId: string;
  plateNumber: string;
  serviceType: "Routine Oil & Filter" | "Brake & Suspension" | "Tyre Replacement" | "Engine Overhaul" | "Electrical & Beacon";
  description: string;
  mileageAtServiceKm: number;
  serviceDate: string;
  nextDueDate: string;
  costUgx: number;
  workshopName: string;
  status: "Scheduled" | "In Progress" | "Completed";
}

export interface DriverRecord {
  id: string;
  driverCode: string;
  forceNumber?: string;
  roleType?: "Driver" | "Rider";
  fullName: string;
  contactPhone?: string;
  nationalId?: string;
  licenceNumber: string;
  licenceClass: "Class B & DL (Light/Heavy)" | "Class A (Motorcycles)" | "Class CM (Armored/Heavy)";
  licenceExpiryDate: string;
  assignedVehiclePlate: string;
  dutyShift: "Day Shift Patrol" | "Night Shift Response" | "On Call Standby";
  safetyScorePct: number;
  totalTripsCompleted: number;
  trainingBadges: string[];
  sourceRef?: string;
  approvedBy?: string;
  approvedAt?: string;
  status: "Active Duty" | "Pending FM Approval" | "On Leave" | "Suspended";
}

export interface DailyVehicleInspection {
  id: string;
  inspectionCode: string;
  vehicleId: string;
  plateNumber: string;
  inspectorDriver: string;
  inspectionDate: string;
  inspectionTime: string;
  brakesCheck: "Pass" | "Defect Noted";
  tyresCheck: "Pass" | "Low Pressure" | "Worn Out";
  lightsSirensCheck: "Pass" | "Defect Noted";
  oilLevelCheck: "Pass" | "Low";
  coolantCheck: "Pass" | "Low";
  batteryCheck: "Pass" | "Weak";
  overallCondition: "Pass - Safe for Duty" | "Requires Attention" | "Ground Vehicle";
  defectsNoted: string;
}

export interface FleetBreakdownEmergency {
  id: string;
  incidentCode: string;
  vehicleId: string;
  plateNumber: string;
  driverName: string;
  location: string;
  issueType: "Engine Breakdown" | "Puncture / Tyre Burst" | "Collision / Accident" | "Battery Failure" | "Fuel Exhaustion";
  description: string;
  reportedTime: string;
  recoveryAssigned: string;
  backupVehicleDispatched?: string;
  status: "Active Emergency" | "Towed to Workshop" | "Resolved & Back on Road";
}

export interface Incident {
  id: string;
  incidentCode: string;
  title: string;
  siteName: string;
  reportedByGuard: string;
  incidentDate: string;
  category: "Security Breach" | "Theft Attempt" | "Weapon Discharge" | "K9 Alert" | "Unauthorized Entry" | "Medical Emergency";
  severity: "Low" | "Medium" | "High" | "Critical";
  description: string;
  status: "Open" | "Under Investigation" | "Resolved" | "Escalated";
  evidenceAttached: boolean;
  region?: string;
  assignedTo?: string;
  investigatedBy?: string;
  escalatedBy?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userName: string;
  userRole: string;
  action: string;
  module: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
}

// Finance Department Interfaces
export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  siteName: string;
  date: string;
  dueDate: string;
  amount: number;
  status: "Draft" | "Paid" | "Pending" | "Overdue";
  itemsCount: number;
  approvedBy?: string;
  approvedAt?: string;
  sentAt?: string;
}

export interface Reminder {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  clientName: string;
  channel: string;
  recipient: string;
  status: string;
  reason?: string;
  message: string;
  triggeredBy: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  category: "Fuel & Patrol" | "Armoury Maintenance" | "K9 Vet & Feeding" | "Uniforms & Gear" | "Administrative";
  description: string;
  amount: number;
  date: string;
  status: "Approved" | "Pending" | "Pending GM Approval" | "Rejected";
  approvedBy: string;
  submittedBy?: string;
  gmApprovedBy?: string;
  approvalStep?: string;
}

export interface CashierTransaction {
  id: string;
  guardName: string;
  forceNumber: string;
  type: "Salary Advance" | "Meal Allowance" | "Housing Grant" | "Loan Repayment";
  amount: number;
  date: string;
  status: "Pending Approval" | "Disbursed" | "Rejected";
  processedBy: string;
  phone?: string;
  signatureUrl?: string;
  notes?: string;
  approvedBy?: string;
  rejectedBy?: string;
  approvedAt?: string;
}

// Marketing & Sales Department Interfaces
export type LeadSource =
  | "Website"
  | "LinkedIn"
  | "X"
  | "TikTok"
  | "Referral"
  | "Walk-in"
  | "Security Expo"
  | "Direct Mail"
  | "Other";

export type LeadStage =
  | "New"
  | "Contacted"
  | "Qualified"
  | "Proposal Sent"
  | "Closed Won"
  | "Closed Lost";

export interface Lead {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  estimatedValue: number;
  /** Mandatory at creation — where this prospect originated (Website is auto-set by the public intake endpoint). */
  source: LeadSource;
  stage: LeadStage;
  /** Owner display name — every lead has exactly one owner. */
  assignedTo: string;
  /** Owner user id — reliable ownership checks for owner-only stage advancement. */
  ownerId?: string;
  region?: string;
  wonBy?: string;
  lostReason?: string;
  /** ISO date of the next scheduled follow-up — drives the Marketing follow-up panel. */
  followUpDate?: string;
  /** ISO timestamp of the last contact/engagement with the prospect. */
  lastContactedAt?: string;
}

export interface Campaign {
  id: string;
  name: string;
  channel: "LinkedIn" | "Twitter / X" | "TikTok" | "Security Expo" | "Direct Mail";
  leadsGenerated: number;
  budget: number;
  conversions: number;
  proposedBy?: string;
  budgetStatus?: "Pending Approval" | "Approved" | "Rejected";
  budgetApprovedBy?: string;
  budgetApprovedAt?: string;
}

// Governance: Complaints, Discipline, Deployments
export interface Complaint {
  id: string;
  complaintCode: string;
  clientName: string;
  siteName: string;
  category: string;
  description: string;
  satisfactionRating?: number;
  status?: "Open" | "Investigating" | "Resolved" | "Referred";
  ownedBy?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
  referredForInvestigation?: boolean;
  linkedIncidentCode?: string;
  reportedDate: string;
  region?: string;
}

export interface DisciplinaryAction {
  id: string;
  actionCode: string;
  guardId: string;
  guardName: string;
  forceNumber: string;
  actionType: "Warning Letter" | "Suspension" | "Termination" | "Desertion";
  reason: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  status?: "Initiated" | "Pending Regional Approval" | "Pending Ops Approval" | "Pending HR Approval" | "Finalized" | "Rejected";
  initiatedBy?: string;
  regionalApprovedBy?: string;
  operationsApprovedBy?: string;
  hrApprovedBy?: string;
  approvedAt?: string;
  linkedIncidentCode?: string;
  linkedComplaintCode?: string;
  offenceCategory?: "Category 1" | "Category 2";
  offence?: string;
  offenceDate?: string;
  offenceTime?: string;
  zone?: string;
  actionTaken?: string;
  createdAt: string;
}

export interface SiteDeployment {
  id: string;
  deploymentCode: string;
  siteId: string;
  siteName: string;
  clientName: string;
  guardId: string;
  guardName: string;
  shiftType: string;
  deployedBy: string;
  deployedAt: string;
  status?: "Active" | "Completed";
  region?: string;
}

export interface DeploymentOrder {
  id: string;
  orderCode: string;
  siteId: string;
  siteName: string;
  clientName: string;
  region?: string;
  requiredHeadcount: number;
  shiftType: string;
  targetStartDate: string;
  targetEndDate: string;
  requestedBy: string;
  status: "Open" | "Assigned" | "Filled" | "Cancelled";
  assignedGuardIds: string[];
  notes?: string;
}

// Information Technology Department Interfaces
export interface ITServer {
  id: string;
  name: string;
  ipAddress: string;
  status: "Operational" | "High Load" | "Maintenance";
  cpuUsage: number;
  memoryUsage: number;
  uptime: string;
}

export interface ITSupportTicket {
  id: string;
  ticketCode: string;
  reportedBy: string;
  subject: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  status: "Open" | "In Progress" | "Resolved";
  createdDate: string;
}

export interface ITAsset {
  id: string;
  assetCode: string; // e.g. IT-HW-2026-01 or IT-SW-2026-04
  name: string; // e.g. Dell Latitude 5540, Hikvision 64-Ch NVR, ZKTeco Biometric Terminal, Kaspersky Endpoint Security
  category: "Workstation / Laptop" | "CCTV & Surveillance" | "Biometric & Access Control" | "Patrol Radio & Communications" | "Server & Networking" | "Software License & SaaS";
  serialNumberOrKey: string;
  assignedToPersonOrStation: string; // e.g. Operations Manager, Kampala Central Station, Armoury Gate
  assignedDepartment: string;
  purchaseDate: string;
  warrantyExpiryDate?: string;
  valueUgx: number;
  condition: "Operational" | "In Repair" | "Upgrade Required" | "Decommissioned";
  softwareVersionOrSpecs?: string;
  ipAddressOrHost?: string;
  notes?: string;
}

export interface PatrolInspectionLog {
  id: string;
  inspectionCode: string;
  siteName: string;
  supervisorName: string;
  guardOnDuty: string;
  inspectionTime: string;
  radioCheckStatus: "Responsive & Clear" | "Delayed Response" | "Unresponsive";
  uniformTurnout: "Compliant" | "Minor Flaw" | "Non-Compliant";
  weaponEquipmentCheck: "Secured & Safe" | "Defect Noted";
  overallRating: "Satisfactory" | "Needs Corrective Action";
  remarks: string;
}

export interface TrainingCohort {
  id: string;
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  leadInstructor: string;
  totalRecruits: number;
  passedOutCount: number;
  status: "In Session" | "Passed Out & Certified" | "Upcoming Intake";
  curriculumModules: string[];
}

export interface RecruitTrainee {
  id: string;
  traineeCode: string;
  fullName: string;
  nationalIdNumber: string;
  age: number;
  cohortId: string;
  cohortName: string;
  assignedRegion: string;
  drillScore: number; // 0-100
  marksmanshipScore: number; // 0-100
  theoryScore: number; // 0-100
  overallStatus: "Graduated & Certified" | "Under Training" | "Deferred" | "Disqualified";
  assignedForceNumber?: string;
  dateGraduated?: string;
}

export interface Region {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
}

export interface WorkflowDefinition {
  id: string;
  code: string;
  name: string;
  description?: string;
  module: string;
  isActive: boolean;
  steps: WorkflowStepDefinition[];
}

export interface WorkflowStepDefinition {
  id: string;
  workflowId: string;
  stepOrder: number;
  name: string;
  approverRole: string;
  approverRoles?: string[];
  optional?: boolean;
  regionScoped?: boolean;
  condition?: string;
  escalationHours?: number;
}

export interface Approval {
  id: string;
  workflowId: string;
  workflowCode: string;
  referenceType: string;
  referenceId: string;
  currentStep: number;
  totalSteps: number;
  status: "Pending" | "Approved" | "Rejected";
  requestedBy: string;
  requestedByName: string;
  regionScope?: string;
  decidedBy?: string;
  decidedAt?: string;
  meta?: { excludeOptional?: boolean; skipOptionalStepOrders?: number[] };
  actions: ApprovalAction[];
}

export interface ApprovalAction {
  id: string;
  approvalId: string;
  stepOrder: number;
  actorRole: string;
  actorName?: string;
  action?: "Approved" | "Rejected";
  comment?: string;
  actedAt?: string;
}

export interface DocumentRecord {
  id: string;
  code: string;
  name: string;
  category: string;
  referenceType: string;
  referenceId: string;
  mimeType: string;
  fileSize: number;
  filePath: string;
  uploadedBy: string;
  notes?: string;
  createdAt: string;
}

export interface JobPosting {
  id: string;
  code: string;
  title: string;
  department: string;
  location: string;
  description: string;
  requirements: string;
  positionsCount: number;
  salaryRange?: string;
  status: "Open" | "Closed" | "On Hold";
  postedDate: string;
  closesDate?: string;
  candidates?: Candidate[];
}

export interface Candidate {
  id: string;
  jobPostingId: string;
  fullName: string;
  email: string;
  phone: string;
  resumePath?: string;
  source?: string;
  roleType?: "Security Guard" | "Driver" | "Rider" | "Office / Admin";
  licenceNumber?: string;
  licenceClass?: "Class B & DL (Light/Heavy)" | "Class A (Motorcycles)" | "Class CM (Armored/Heavy)";
  licenceExpiryDate?: string;
  nationalId?: string;
  status: "New" | "Screening" | "Interviewed" | "Shortlisted" | "Offered" | "Hired" | "Rejected";
  appliedDate: string;
  interviewDate?: string;
  interviewScore?: number;
  notes?: string;
  gender?: "Male" | "Female";
  age?: string;
  address?: string;
  expectedSalary?: number;
  availability?: string;
  education?: string;
  certifications?: string;
  yearsExperience?: number;
  employerHistory?: string;
  reasonForLeaving?: string;
  interviewScores?: Record<string, number>;
}

export interface PerformanceReviewRecord {
  id: string;
  guardId: string;
  guardName: string;
  forceNumber: string;
  reviewPeriod: string;
  reviewType: string;
  evaluatorName: string;
  evaluationDate: string;
  disciplineScore: number;
  punctualityScore: number;
  clientRatingScore: number;
  appearanceScore: number;
  incidentHandlingScore: number;
  overallRating: string;
  recommendation: string;
  comments?: string;
  keyStrengths?: string;
  growthAreas?: string;
  developmentGoals?: string;
  status: "Draft" | "Pending Approval" | "Approved & Archived";
}

export interface AppNotification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  module?: string;
  timestamp: string;
  read: boolean;
}

/** DB-persisted notification row (Phase 5). */
export interface NotificationRecord {
  id: string;
  userId?: string | null;
  targetRole?: string | null;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  module?: string | null;
  readAt?: string | null;
  createdAt: string;
}

export interface AnalyticsSummary {
  totalGuards: number;
  activeGuards: number;
  totalSites: number;
  openIncidents: number;
  totalVehicles: number;
  activeK9s: number;
  pendingLeave: number;
  totalUsers: number;
}

// Architecture Document Types (kept for full specification documentation tab)
export interface Section {
  id: string;
  title: string;
  subtitle?: string;
  iconName?: string;
  content: SectionContent[];
}

export type SectionContent =
  | { type: "paragraph"; text: string; boldLabel?: string }
  | { type: "list"; items: string[]; title?: string }
  | { type: "modules"; modules: SystemModule[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "callout"; title: string; text: string; variant: "info" | "warning" | "success" };

export interface SystemModule {
  name: string;
  category: string;
  items: string[];
  description?: string;
}
