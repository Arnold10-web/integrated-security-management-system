import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import {
  initialRoster,
  initialArmouryItems,
  initialArmouryLogs,
  initialK9Dogs,
  initialK9Logs,
  initialK9HealthInspections,
  initialVehicles,
  initialIncidents,
  initialInvoices,
  initialExpenses,
  initialCashierTransactions,
  initialLeads,
  initialCampaigns,
  initialITServers,
  initialITTickets,
  initialITAssets,
  initialPatrolInspections,
  initialTripLogs,
  initialFuelRequisitions,
  initialMaintenanceLogs,
  initialDrivers,
  initialDailyInspections,
  initialBreakdowns,
  initialAdminRequisitions,
  initialTrainingCohorts,
  initialRecruitTrainees,
  initialLeaveRequests,
  initialDeploymentOrders,
} from "../src/data/mockData";
dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function pick<T extends object>(obj: T, keys: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of keys) {
    if (k in obj && (obj as Record<string, unknown>)[k] !== undefined) out[k] = (obj as Record<string, unknown>)[k];
  }
  return out;
}
const toDate = (v: any) => {
  if (!v) return undefined;
  if (v instanceof Date) return v;
  if (typeof v === 'string') {
    // Handle YYYY-MM-DD or ISO strings
    const d = new Date(v);
    if (!isNaN(d.getTime())) return d;
  }
  return v;
};
const mapGuardDesignation = (v: string) => v === 'K9 Handler' ? 'K9_Handler' : v === 'Site In-Charge' ? 'Site_In_Charge' : v;
const mapVehicleStatus = (v: string) => v === 'In Service' ? 'In_Service' : v === 'Fueling Needed' ? 'Fueling_Needed' : v;
const mapArmouryCondition = (v: string) => v === 'Requires Service' ? 'Requires_Service' : v;
const mapSlaStatus = (v: string) => v === 'Attention Needed' ? 'Attention_Needed' : v;
const mapIncidentStatus = (v: string) => v === 'Under Investigation' ? 'UnderInvestigation' : v;

async function seedArray<T extends object>(rows: T[], keys: string[], create: (data: Record<string, unknown>) => Promise<unknown>) {
  const dateKeys = new Set(["joinDate","desertionDate","incidentDate","actingExpiresAt","actingGrantedAt","timestamp"]);
  for (const row of rows) {
    const data = pick(row, keys);
    for (const k of Object.keys(data)) {
      if (dateKeys.has(k) && typeof data[k] === "string") {
        const d = toDate(data[k]);
        if (d) data[k] = d;
      }
    }
    // Map enums with @map
    if (typeof data["designation"] === "string") data["designation"] = mapGuardDesignation(data["designation"] as string);
    if (typeof data["status"] === "string" && (data["status"] === "In Service" || data["status"] === "Fueling Needed")) data["status"] = mapVehicleStatus(data["status"] as string);
    if (typeof data["condition"] === "string") data["condition"] = mapArmouryCondition(data["condition"] as string);
    if (typeof data["slaStatus"] === "string") data["slaStatus"] = mapSlaStatus(data["slaStatus"] as string);
    if (typeof data["status"] === "string" && data["status"] === "Under Investigation") data["status"] = mapIncidentStatus(data["status"] as string);
    await create(data);
  }
}

async function main() {
  const hashedPassword = await bcrypt.hash("password123", 10);

  // Reset transactional/demo data so `npm run seed` always restores a pristine demo state.
  await prisma.auditLog.deleteMany();
  await prisma.document.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.disciplinaryAction.deleteMany();
  await prisma.siteDeployment.deleteMany();
  await prisma.deploymentOrder.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.guard.deleteMany();
  await prisma.clientSite.deleteMany();
  await prisma.vehicleTripLog.deleteMany();
  await prisma.fuelLog.deleteMany();
  await prisma.maintenanceServiceLog.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.dailyVehicleInspection.deleteMany();
  await prisma.fleetBreakdownEmergency.deleteMany();
  await prisma.dutyRoster.deleteMany();
  await prisma.patrolInspectionLog.deleteMany();
  await prisma.adminRequisition.deleteMany();
  await prisma.trainingCohort.deleteMany();
  await prisma.recruitTrainee.deleteMany();
  await prisma.iTServer.deleteMany();
  await prisma.iTSupportTicket.deleteMany();
  await prisma.iTAsset.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.armouryItem.deleteMany();
  await prisma.armouryLog.deleteMany();
  await prisma.k9Dog.deleteMany();
  await prisma.k9Log.deleteMany();
  await prisma.k9HealthInspection.deleteMany();
  await prisma.cashierTransaction.deleteMany();

  const userData = [
    // Directorate (view + approve only)
    { name: "Sarah Akello", email: "sarah.akello@iscms.ug", forceNumber: "PSG026/101", role: "General Manager", department: "Directorate", region: "Kampala Central", phone: "+256 701 000001" },
    { name: "Daniel Mugisha", email: "daniel.mugisha@iscms.ug", forceNumber: "PSG026/102", role: "Director", department: "Directorate", region: "Kampala Central", phone: "+256 701 000002" },
    // Human Resources
    { name: "Grace Nakato", email: "grace.nakato@iscms.ug", forceNumber: "PSG026/103", role: "HR Manager", department: "Human Resources", region: "Kampala Central", phone: "+256 701 000003" },
    { name: "Rebecca Nansubuga", email: "rebecca.nansubuga@iscms.ug", forceNumber: "PSG026/104", role: "HR Assistant", department: "Human Resources", region: "Kampala Central", phone: "+256 701 000004" },
    { name: "Agnes Nantege", email: "agnes.nantege@iscms.ug", forceNumber: "PSG026/105", role: "Records Officer", department: "Human Resources", region: "Kampala Central", phone: "+256 701 000005" },
    // Marketing (Business Development Manager heads the department; per-region Sales & Marketing Supervisors)
    { name: "Ivan Ssebana", email: "ivan.ssebana@iscms.ug", forceNumber: "PSG026/106", role: "Business Development Manager", department: "Marketing", region: "Kampala Central", phone: "+256 701 000006" },
    { name: "Patricia Akello", email: "patricia.akello@iscms.ug", forceNumber: "PSG026/107", role: "Sales and Marketing Supervisor", department: "Marketing", region: "Kampala Central", phone: "+256 701 000007" },
    { name: "Kenneth Tumusiime", email: "kenneth.tumusiime@iscms.ug", forceNumber: "PSG026/108", role: "Sales and Marketing Supervisor", department: "Marketing", region: "Mbarara", phone: "+256 701 000026" },
    // Operations
    { name: "Emma Muwonge", email: "emma.muwonge@iscms.ug", forceNumber: "PSG026/109", role: "Operations Manager", department: "Operations", region: "Kampala Central", phone: "+256 701 000008" },
    { name: "Peter Okello", email: "peter.okello@iscms.ug", forceNumber: "PSG026/110", role: "Regional Manager", department: "Operations", region: "Mbarara", phone: "+256 701 000009" },
    { name: "Betty Auma", email: "betty.auma@iscms.ug", forceNumber: "PSG026/111", role: "Regional Manager", department: "Operations", region: "Gulu", phone: "+256 701 000010" },
    { name: "Francis Ogwang", email: "francis.ogwang@iscms.ug", forceNumber: "PSG026/112", role: "Fleet Manager", department: "Operations", region: "Kampala Central", phone: "+256 701 000011" },
    { name: "James Wamala", email: "james.wamala@iscms.ug", forceNumber: "PSG026/113", role: "Training Officer", department: "Operations", region: "Kampala Central", phone: "+256 701 000012" },
    { name: "Henry Kiyingi", email: "henry.kiyingi@iscms.ug", forceNumber: "PSG026/114", role: "Investigations Officer", department: "Investigations", region: "Kampala Central", phone: "+256 701 000013" },
    { name: "Tom Ssemakula", email: "tom.ssemakula@iscms.ug", forceNumber: "PSG026/115", role: "Guard Officer", department: "Operations", region: "Kampala Central", phone: "+256 701 000014" },
    { name: "Joseph Ochieng", email: "joseph.ochieng@iscms.ug", forceNumber: "PSG026/116", role: "Armorer", department: "Operations", region: "Kampala Central", phone: "+256 701 000015" },
    { name: "Diana Alowo", email: "diana.alowo@iscms.ug", forceNumber: "PSG026/117", role: "K9 Supervisor", department: "Operations", region: "Kampala Central", phone: "+256 701 000016" },
    { name: "Peter Okot", email: "peter.okot@iscms.ug", forceNumber: "PSG026/118", role: "K9 Handler", department: "Operations", region: "Kampala Central", phone: "+256 701 000017" },
    // Finance
    { name: "David Ssenyonga", email: "david.ssenyonga@iscms.ug", forceNumber: "PSG026/119", role: "Finance Manager", department: "Finance", region: "Kampala Central", phone: "+256 701 000018" },
    { name: "Martha Kemigisha", email: "martha.kemigisha@iscms.ug", forceNumber: "PSG026/120", role: "Accountant", department: "Finance", region: "Kampala Central", phone: "+256 701 000019" },
    { name: "Sandra Namutebi", email: "sandra.namutebi@iscms.ug", forceNumber: "PSG026/121", role: "Assistant Accountant", department: "Finance", region: "Kampala Central", phone: "+256 701 000020" },
    { name: "Brian Mugerwa", email: "brian.mugerwa@iscms.ug", forceNumber: "PSG026/122", role: "Assistant Accountant", department: "Finance", region: "Kampala Central", phone: "+256 701 000021" },
    { name: "Agnes Tumusiime", email: "agnes.tumusiime@iscms.ug", forceNumber: "PSG026/123", role: "Internal Auditor", department: "Finance", region: "Kampala Central", phone: "+256 701 000022" },
    { name: "Winnie Nabukenya", email: "winnie.nabukenya@iscms.ug", forceNumber: "PSG026/124", role: "Cashier", department: "Finance", region: "Kampala Central", phone: "+256 701 000023" },
    // Administration
    { name: "Alice Nabatanzi", email: "alice.nabatanzi@iscms.ug", forceNumber: "PSG026/125", role: "Administrative Officer", department: "Administration", region: "Kampala Central", phone: "+256 701 000024" },
    // Information Technology
    { name: "Joseph Kizza", email: "joseph.kizza@iscms.ug", forceNumber: "PSG026/126", role: "IT Officer", department: "Information Technology", region: "Kampala Central", phone: "+256 701 000025" },
  ];
  for (const u of userData) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, department: u.department, region: u.region, phone: u.phone, forceNumber: u.forceNumber },
      create: { ...u, password: hashedPassword, status: "Active", lastActive: new Date() },
    });
  }

  const regionDefs = [
    { name: "Kampala Central", code: "KLC" },
    { name: "Kampala East", code: "KLE" },
    { name: "Kampala West", code: "KLW" },
    { name: "Kampala North", code: "KLN" },
    { name: "Mbarara", code: "MBR" },
    { name: "Masaka", code: "MSK" },
    { name: "Albertine", code: "ALB" },
    { name: "Savannah", code: "SAV" },
    { name: "Gulu", code: "GUL" },
    { name: "Arua", code: "ARA" },
    { name: "Jinja", code: "JIN" },
    { name: "Mukono", code: "MKN" },
    { name: "Outerstations", code: "OUT" },
  ];
  const regions: Record<string, string> = {};
  for (const { name, code } of regionDefs) {
    const r = await prisma.region.upsert({
      where: { name },
      update: {},
      create: { name, code, description: `${name} operational region` },
    });
    regions[name] = r.id;
  }

  const officeData = [
    { code: "KLA-HQ", name: "Kampala Headquarters", locationCity: "Kampala", regionName: "Kampala Central", regionalManagerName: "Emma Muwonge", phone: "+256 700 111001", email: "kampala.hq@iscms.ug", activeGuardsCount: 120, clientSitesCount: 25, armouryVaultStatus: "Main Hub Vault", vehiclesAssigned: 15 },
    { code: "MBA-STN", name: "Mbarara Regional Station", locationCity: "Mbarara City", regionName: "Mbarara", regionalManagerName: "Peter Okello", phone: "+256 700 111002", email: "mbarara.station@iscms.ug", activeGuardsCount: 65, clientSitesCount: 12, armouryVaultStatus: "Fully Operational", vehiclesAssigned: 8 },
    { code: "GLU-STN", name: "Gulu Regional Station", locationCity: "Gulu City", regionName: "Gulu", regionalManagerName: "Sarah Akello", phone: "+256 700 111003", email: "gulu.station@iscms.ug", activeGuardsCount: 45, clientSitesCount: 8, armouryVaultStatus: "Fully Operational", vehiclesAssigned: 6 },
  ];
  for (const o of officeData) {
    const regionId = regions[o.regionName];
    if (!regionId) throw new Error(`Region not found: ${o.regionName}`);
    const { regionName, ...officeFields } = o;
    await prisma.regionalOffice.upsert({
      where: { code: officeFields.code },
      update: { ...officeFields, regionId },
      create: { ...officeFields, regionId },
    });
  }

  const guardData = [
    { forceNumber: "PSG026/001", fullName: "John Bosco Kateregga", designation: "Guard", region: "Kampala Central", phone: "+256 700 123456", nationalId: "CM12345678ABC", assignedSite: "Bank of East Africa Headquarters", location: "Kampala Central (CBD)", bankAccount: "90300188201", bankName: "Stanbic Bank Uganda", finishedProbation: true, status: "On Duty", medicalCleared: true, armedQualified: true, joinDate: "2024-01-15", warningLettersCount: 0, certifications: ["Basic Security Training", "Advanced Firearms Proficiency"], idCardStatus: "Issued & Active", idCardNumber: "IDC-2026-SG001", dateOfBirth: "1990-03-15", gender: "Male", maritalStatus: "Married", educationLevel: "Uganda Advanced Certificate of Education (A-Level)" },
    { forceNumber: "PSG026/002", fullName: "Grace Nambi", designation: "Guard", region: "Kampala Central", phone: "+256 700 234567", nationalId: "CM23456789ABC", assignedSite: "Nakumatt Jubilee Mall", location: "Kampala Central (CBD)", bankAccount: "1002003004", bankName: "Centenary Bank", finishedProbation: true, status: "On Duty", medicalCleared: true, armedQualified: false, joinDate: "2024-03-01", warningLettersCount: 0, certifications: ["Basic Security Training"], idCardStatus: "Issued & Active", dateOfBirth: "1995-08-22", gender: "Female" },
    { forceNumber: "PSG026/003", fullName: "David Ssempijja", designation: "Guard", region: "Kampala West", phone: "+256 700 345678", nationalId: "CM34567890ABC", assignedSite: "Speke Resort Munyonyo", location: "Munyonyo Peninsula", bankAccount: "90300299302", bankName: "Stanbic Bank Uganda", finishedProbation: true, status: "Off Duty", medicalCleared: true, armedQualified: true, joinDate: "2023-11-20", warningLettersCount: 1, certifications: ["Basic Security Training", "Tactical Response Training", "VIP Protection"], idCardStatus: "Issued & Active", dateOfBirth: "1988-12-05", gender: "Male" },
    { forceNumber: "PSG026/004", fullName: "Martha Kemigisha", designation: "K9 Handler", region: "Kampala West", phone: "+256 700 456789", nationalId: "CM45678901ABC", assignedSite: "Entebbe International Airport", location: "Entebbe", bankAccount: "3200187654", bankName: "DFCU Bank", finishedProbation: true, status: "On Duty", medicalCleared: true, armedQualified: true, k9Qualified: true, joinDate: "2024-06-01", warningLettersCount: 0, certifications: ["Basic Security Training", "K9 Handler Certification", "Narcotics Detection"], idCardStatus: "Issued & Active", dateOfBirth: "1992-04-18", gender: "Female" },
    { forceNumber: "PSG026/005", fullName: "Joseph Wasswa", designation: "Guard", region: "Jinja", phone: "+256 700 567890", nationalId: "CM56789012ABC", assignedSite: "Shell Uganda Fuel Depot", location: "Jinja Industrial Area", bankAccount: "4002005678", bankName: "Equity Bank Uganda", finishedProbation: false, status: "Off Duty", medicalCleared: true, armedQualified: false, joinDate: "2025-01-10", warningLettersCount: 0, certifications: ["Basic Security Training"], idCardStatus: "Pending Records Issuance", dateOfBirth: "1998-07-30", gender: "Male" },
    { forceNumber: "PSG026/006", fullName: "Sarah Nakato", designation: "Guard", region: "Kampala Central", phone: "+256 700 678901", nationalId: "CM67890123ABC", assignedSite: "Uganda Telecom Towers", location: "Kampala Central (CBD)", bankAccount: "90300388403", bankName: "Stanbic Bank Uganda", finishedProbation: true, status: "On Duty", medicalCleared: true, armedQualified: true, joinDate: "2022-08-15", warningLettersCount: 0, certifications: ["Basic Security Training", "Supervisory Management", "Incident Command"], idCardStatus: "Issued & Active", dateOfBirth: "1987-11-10", gender: "Female" },
    { forceNumber: "PSG026/007", fullName: "Emmanuel Omondi", designation: "Guard", region: "Kampala West", phone: "+256 700 789012", nationalId: "CM78901234ABC", assignedSite: "Speke Resort Munyonyo", location: "Munyonyo Peninsula", bankAccount: "90300566505", bankName: "Stanbic Bank Uganda", finishedProbation: true, status: "Off Duty", medicalCleared: true, armedQualified: true, k9Qualified: false, joinDate: "2023-11-01", warningLettersCount: 0, certifications: ["Basic Security Training", "Tactical Response Training", "VIP Protection"], idCardStatus: "Issued & Active", dateOfBirth: "1991-02-27", gender: "Male" },
    { forceNumber: "PSG026/008", fullName: "Aisha Namukose", designation: "Guard", region: "Kampala Central", phone: "+256 700 890123", nationalId: "CM89012345ABC", assignedSite: "Nakumatt Jubilee Mall", location: "Kampala Central (CBD)", bankAccount: "3002009012", bankName: "PostBank Uganda", finishedProbation: false, status: "Off Duty", medicalCleared: true, armedQualified: false, k9Qualified: false, joinDate: "2026-07-01", warningLettersCount: 0, certifications: ["Basic Security Training"], idCardStatus: "Pending Records Issuance", dateOfBirth: "2000-09-14", gender: "Female" },
    { forceNumber: "PSG026/009", fullName: "Ronald Kato", designation: "Guard", region: "Jinja", phone: "+256 700 901234", nationalId: "CM90123456ABC", assignedSite: "Shell Uganda Fuel Depot", location: "Jinja Industrial Area", bankAccount: "4003012345", bankName: "Equity Bank Uganda", finishedProbation: false, status: "Suspended", medicalCleared: true, armedQualified: false, k9Qualified: false, joinDate: "2025-02-01", warningLettersCount: 2, certifications: ["Basic Security Training"], idCardStatus: "Revoked - Disciplinary", dateOfBirth: "1997-05-03", gender: "Male" },
    { forceNumber: "PSG026/010", fullName: "Joy Adong", designation: "K9 Handler", region: "Kampala West", phone: "+256 700 012345", nationalId: "CM01234567ABC", assignedSite: "Entebbe International Airport", location: "Entebbe", bankAccount: "1002023456", bankName: "Centenary Bank", finishedProbation: true, status: "On Duty", medicalCleared: true, armedQualified: true, k9Qualified: true, joinDate: "2024-09-02", warningLettersCount: 0, certifications: ["Basic Security Training", "K9 Handler Certification", "Explosive Detection"], idCardStatus: "Issued & Active", dateOfBirth: "1993-11-21", gender: "Female" },
    { forceNumber: "PSG026/011", fullName: "Patrick Mugisha", designation: "Guard", region: "Mbarara", phone: "+256 700 123011", nationalId: "CM90123411ABC", assignedSite: "Mbarara Regional Warehouse", location: "Ntare Road, Mbarara City", bankAccount: "90301188411", bankName: "Stanbic Bank Uganda", finishedProbation: true, status: "On Duty", medicalCleared: true, armedQualified: false, joinDate: "2026-01-20", warningLettersCount: 0, certifications: ["Basic Security Training"], idCardStatus: "Issued & Active", dateOfBirth: "1995-06-12", gender: "Male" },
    { forceNumber: "PSG026/012", fullName: "Vera Acen", designation: "Guard", region: "Gulu", phone: "+256 700 123012", nationalId: "CM90123412ABC", assignedSite: "Gulu Sugar Corp Estate", location: "Lokung Road, Gulu City", bankAccount: "4003012346", bankName: "Equity Bank Uganda", finishedProbation: true, status: "On Duty", medicalCleared: true, armedQualified: false, joinDate: "2026-02-10", warningLettersCount: 0, certifications: ["Basic Security Training"], idCardStatus: "Issued & Active", dateOfBirth: "1998-01-25", gender: "Female" },
  ];
  const seedStage = (forceNumber: string): "ENROLLED" | "HANDED_TO_OPERATIONS" | "IN_TRAINING" | "PASSED_OUT" | "DEPLOYED" => {
    if (forceNumber === "PSG026/011" || forceNumber === "PSG026/012") return "PASSED_OUT";
    if (forceNumber === "PSG026/008" || forceNumber === "PSG026/005") return "IN_TRAINING";
    return "DEPLOYED";
  };
  for (const g of guardData) {
    const lifecycleStage = seedStage(g.forceNumber);
    const gMapped = {
      ...g,
      designation: mapGuardDesignation(g.designation),
      joinDate: toDate(g.joinDate),
      desertionDate: toDate((g as any).desertionDate),
    } as any;
    await prisma.guard.upsert({ where: { forceNumber: g.forceNumber }, update: { ...gMapped, lifecycleStage }, create: { ...gMapped, lifecycleStage } });
  }

  const siteData = [
    { clientName: "Bank of East Africa Uganda", region: "Kampala Central", siteName: "Bank of East Africa Headquarters", location: "Plot 45 Kampala Road, Kampala", zone: "Central Business", dayShiftGuards: 6, nightShiftGuards: 4, armedGuardsRequired: 4, k9Required: false, contactPerson: "James Mwangi", contactPhone: "+256-700-989898", slaStatus: "Compliant" },
    { clientName: "Nakumatt Holdings Ltd", region: "Kampala Central", siteName: "Nakumatt Jubilee Mall", location: "Jinja Road, Kampala", zone: "Central Business", dayShiftGuards: 4, nightShiftGuards: 2, armedGuardsRequired: 2, k9Required: false, contactPerson: "Ruth Kemigisha", contactPhone: "+256-700-876543", slaStatus: "Compliant" },
    { clientName: "Speke Resorts & Hotels", region: "Kampala West", siteName: "Speke Resort Munyonyo", location: "Munyonyo Peninsula, Kampala", zone: "South Extension", dayShiftGuards: 8, nightShiftGuards: 6, armedGuardsRequired: 6, k9Required: true, contactPerson: "Andrew Ssekandi", contactPhone: "+256-700-765432", slaStatus: "Compliant" },
    { clientName: "Uganda Civil Aviation Authority", region: "Kampala West", siteName: "Entebbe International Airport", location: "Entebbe International Airport", zone: "South Extension", dayShiftGuards: 12, nightShiftGuards: 10, armedGuardsRequired: 10, k9Required: true, contactPerson: "Peter Okello", contactPhone: "+256-700-654321", slaStatus: "Compliant" },
    { clientName: "Shell Uganda Ltd", region: "Jinja", siteName: "Shell Uganda Fuel Depot - Jinja", location: "Jinja Industrial Area", zone: "North District", dayShiftGuards: 4, nightShiftGuards: 2, armedGuardsRequired: 2, k9Required: false, contactPerson: "Hassan Ssemakula", contactPhone: "+256-700-543210", slaStatus: "Compliant" },
    { clientName: "Uganda Telecommunications Corporation", region: "Kampala Central", siteName: "Uganda Telecom Towers", location: "Plot 37 Kampala Road", zone: "Central Business", dayShiftGuards: 4, nightShiftGuards: 3, armedGuardsRequired: 3, k9Required: false, contactPerson: "Grace Nakiboneka", contactPhone: "+256-700-432109", slaStatus: "Compliant" },
    { clientName: "Lakeview Logistics Ltd", region: "Mbarara", siteName: "Mbarara Regional Warehouse", location: "Ntare Road, Mbarara City", zone: "Western District", dayShiftGuards: 4, nightShiftGuards: 3, armedGuardsRequired: 2, k9Required: false, contactPerson: "Peter Okello", contactPhone: "+256-700-321098", slaStatus: "Compliant" },
    { clientName: "Gulu Sugar Corporation", region: "Gulu", siteName: "Gulu Sugar Corp Estate", location: "Lokung Road, Gulu City", zone: "Northern District", dayShiftGuards: 6, nightShiftGuards: 4, armedGuardsRequired: 3, k9Required: false, contactPerson: "Betty Auma", contactPhone: "+256-700-210987", slaStatus: "Compliant" },
  ];
  for (const s of siteData) {
    const dayShiftArmed = Math.min(s.armedGuardsRequired, Math.round((s.armedGuardsRequired * s.dayShiftGuards) / Math.max(s.dayShiftGuards + s.nightShiftGuards, 1)));
    const nightShiftArmed = s.armedGuardsRequired - dayShiftArmed;
    const payload = { ...s, dayShiftArmed, nightShiftArmed };
    const existing = await prisma.clientSite.findFirst({ where: { siteName: s.siteName } });
    if (existing) {
      await prisma.clientSite.update({ where: { id: existing.id }, data: payload });
    } else {
      await prisma.clientSite.create({ data: payload });
    }
  }

  const contractData = [
    // ── Client Contracts ──
    { contractCode: "CTR-CLI-2024-01", title: "Bank of East Africa Headquarters SLA", contractType: "Client Contract", partyName: "Bank of East Africa Uganda", category: "Corporate Client Service Agreement", startDate: "2024-01-01", endDate: "2026-12-31", valueUgx: 180000000, status: "Active", documentRef: "DOC-SLA-BEA-2024.pdf", managedBy: "Records Officer", region: "Kampala Central", autoRenew: true, paymentTerms: "Monthly in advance, due by 5th of each month", billingCycle: "Monthly", slaTerms: "15 armed static guards (day), 4 night guards, 24/7 CCTV alarm response, supervisor monthly inspections", notes: "Flagship corporate account. Annual value escalates 5% each renewal term.", preparedBy: "Ivan Ssebana", approvedBy: "Sarah Akello", approvalStep: "Done", relatedSiteName: "Bank of East Africa Headquarters", createdBy: "Records Officer" },
    { contractCode: "CTR-CLI-2024-02", title: "Nakumatt Jubilee Mall Retail Guarding", contractType: "Client Contract", partyName: "Nakumatt Holdings Ltd", category: "Retail Site Agreement", startDate: "2024-04-01", endDate: "2026-11-30", valueUgx: 84000000, status: "Active", documentRef: "DOC-SLA-NKT-2024.pdf", managedBy: "Records Officer", region: "Kampala Central", autoRenew: false, paymentTerms: "Monthly, due by 10th", billingCycle: "Monthly", slaTerms: "4 day guards, 2 night guards, retail loss-prevention support", notes: "Mall management requesting additional weekend guards in next renewal.", preparedBy: "Patricia Akello", approvedBy: "Sarah Akello", approvalStep: "Done", relatedSiteName: "Nakumatt Jubilee Mall", createdBy: "Records Officer" },
    { contractCode: "CTR-CLI-2025-03", title: "Speke Resort Munyonyo Perimeter & VIP Protection", contractType: "Client Contract", partyName: "Speke Resorts & Hotels", category: "Corporate Client Service Agreement", startDate: "2025-06-01", endDate: "2026-08-31", valueUgx: 120000000, status: "Expiring Soon", documentRef: "DOC-SLA-SRM-2025.pdf", managedBy: "Records Officer", region: "Kampala West", autoRenew: false, paymentTerms: "Monthly in advance", billingCycle: "Monthly", slaTerms: "8 day guards, 6 night guards, K9 support, VIP protection detail", notes: "Contract expires in under 60 days. Renewal negotiation under review with Marketing (Sales and Marketing Supervisor).", preparedBy: "Patricia Akello", approvedBy: "Sarah Akello", approvalStep: "Done", relatedSiteName: "Speke Resort Munyonyo", createdBy: "Records Officer" },
    { contractCode: "CTR-CLI-2025-05", title: "Entebbe International Airport Aviation Security", contractType: "Client Contract", partyName: "Uganda Civil Aviation Authority", category: "Vendor SLA", startDate: "2025-02-01", endDate: "2027-01-31", valueUgx: 360000000, status: "Active", documentRef: "DOC-SLA-ENT-2025.pdf", managedBy: "Records Officer", region: "Kampala West", autoRenew: true, paymentTerms: "Quarterly in advance", billingCycle: "Quarterly", slaTerms: "12 day guards, 10 night guards, K9 explosive detection teams, airside access protocols", notes: "Highest-value client contract. K9 units co-supervised with K9 Supervisor.", preparedBy: "Ivan Ssebana", approvedBy: "Sarah Akello", approvalStep: "Done", relatedSiteName: "Entebbe International Airport", createdBy: "Records Officer" },
    { contractCode: "CTR-CLI-2023-07", title: "Shell Jinja Fuel Depot Guarding", contractType: "Client Contract", partyName: "Shell Uganda Ltd", category: "Corporate Client Service Agreement", startDate: "2023-07-01", endDate: "2026-06-30", valueUgx: 96000000, status: "Expired", documentRef: "DOC-SLA-SHL-2023.pdf", managedBy: "Records Officer", region: "Jinja", autoRenew: false, paymentTerms: "Monthly, due by 15th", billingCycle: "Monthly", slaTerms: "4 day guards, 2 night guards, fuel depot fire-safety patrols", notes: "Expired contract. Re-bidding in progress — candidate: Lakeview Logistics JV.", preparedBy: "Patricia Akello", approvedBy: "Sarah Akello", approvalStep: "Done", relatedSiteName: "Shell Uganda Fuel Depot - Jinja", createdBy: "Records Officer" },
    { contractCode: "CTR-CLI-2025-06", title: "Uganda Telecom Towers Network Security", contractType: "Client Contract", partyName: "Uganda Telecommunications Corporation", category: "Corporate Client Service Agreement", startDate: "2025-03-15", endDate: "2026-07-31", valueUgx: 72000000, status: "Pending Renewal", documentRef: "DOC-SLA-UTC-2025.pdf", managedBy: "Records Officer", region: "Kampala Central", autoRenew: true, paymentTerms: "Monthly in advance", billingCycle: "Monthly", slaTerms: "4 day guards, 3 night guards, tower sites + office perimeter", notes: "Client raised renewal request; new SLA draft awaiting Finance Manager sign-off.", preparedBy: "Ivan Ssebana", approvedBy: "Sarah Akello", approvalStep: "Done", relatedSiteName: "Uganda Telecom Towers", createdBy: "Records Officer" },
    { contractCode: "CTR-CLI-2024-09", title: "Kajjansi Industrial Park Logistics Guarding", contractType: "Client Contract", partyName: "Kajjansi Logistics Hub", category: "Retail Site Agreement", startDate: "2024-01-01", endDate: "2025-12-31", valueUgx: 65000000, status: "Expired", documentRef: "DOC-SLA-KJH-2024.pdf", managedBy: "Records Officer", region: "Kampala East", autoRenew: false, paymentTerms: "Monthly, due by 5th", billingCycle: "Monthly", slaTerms: "3 day guards, 2 night guards, warehouse perimeter patrols", notes: "Expired contract. Pending re-bidding or official archive transfer.", preparedBy: "Patricia Akello", approvedBy: "Sarah Akello", approvalStep: "Done", relatedSiteName: "Kajjansi Industrial Park", createdBy: "Records Officer" },
    { contractCode: "CTR-CLI-2026-08", title: "Mbarara Regional Warehouse Guarding", contractType: "Client Contract", partyName: "Lakeview Logistics Ltd", category: "Corporate Client Service Agreement", startDate: "2026-01-10", endDate: "2028-01-09", valueUgx: 110000000, status: "Active", documentRef: "DOC-SLA-LKV-2026.pdf", managedBy: "Regional Manager - Mbarara", region: "Mbarara", autoRenew: true, paymentTerms: "Monthly in advance", billingCycle: "Monthly", slaTerms: "4 day guards, 3 night guards, warehouse + yard patrols", notes: "Managed by Mbarara Regional Manager (Peter Okello).", preparedBy: "Ivan Ssebana", approvedBy: "Sarah Akello", approvalStep: "Done", relatedSiteName: "Mbarara Regional Warehouse", createdBy: "Records Officer" },
    { contractCode: "CTR-CLI-2026-10", title: "Gulu Sugar Corp Estate Security", contractType: "Client Contract", partyName: "Gulu Sugar Corporation", category: "Corporate Client Service Agreement", startDate: "2026-04-01", endDate: "2028-03-31", valueUgx: 150000000, status: "Active", documentRef: "DOC-SLA-GSC-2026.pdf", managedBy: "Regional Manager - Gulu", region: "Gulu", autoRenew: true, paymentTerms: "Monthly, due by 7th", billingCycle: "Monthly", slaTerms: "6 day guards, 4 night guards, estate + sugar mill perimeter", notes: "Managed by Gulu Regional Manager (Betty Auma).", preparedBy: "Patricia Akello", approvedBy: "Sarah Akello", approvalStep: "Done", relatedSiteName: "Gulu Sugar Corp Estate", createdBy: "Records Officer" },
    // ── Client Contracts (Workflow Drafts) ──
    { contractCode: "CTR-CLI-2026-11", title: "Kampala Business Park Retail Guarding", contractType: "Client Contract", partyName: "Kampala Business Park Ltd", category: "Retail Site Agreement", startDate: "2026-08-01", endDate: "2028-07-31", valueUgx: 58000000, status: "Draft", documentRef: "DOC-SLA-KBP-2026.pdf", managedBy: "Records Officer", region: "Kampala Central", autoRenew: false, paymentTerms: "Monthly in advance", billingCycle: "Monthly", slaTerms: "2 day guards, 2 night guards, retail arcade patrols", notes: "New deal won by Sales and Marketing Supervisor; awaiting GM approval.", preparedBy: "Patricia Akello", approvalStep: "GM", createdBy: "Patricia Akello" },
    { contractCode: "CTR-CLI-2026-12", title: "Victoria Logistics Cold Chain Warehouse", contractType: "Client Contract", partyName: "Victoria Logistics Group", category: "Corporate Client Service Agreement", startDate: "2026-09-01", endDate: "2028-08-31", valueUgx: 135000000, status: "Draft", documentRef: "DOC-SLA-VLC-2026.pdf", managedBy: "Records Officer", region: "Kampala East", autoRenew: false, paymentTerms: "Monthly in advance", billingCycle: "Monthly", slaTerms: "5 day guards, 3 night guards, cold-chain warehouse perimeter + yard", notes: "Site survey contributed by Operations; awaiting GM approval.", preparedBy: "Ivan Ssebana", approvalStep: "GM", siteSurvey: "Site verified 2026-08-02: perimeter fence sound, 4 access points, existing CCTV; 5 day + 3 night guards sufficient with K9 at peak season.", siteSurveyBy: "Emma Muwonge", siteSurveyAt: "2026-08-02", createdBy: "Ivan Ssebana" },
    // ── Staff Contracts ──
    { contractCode: "CTR-STF-2024-01", title: "Guard Employment & Code of Conduct SLA", contractType: "Staff Contract", partyName: "John Bosco Kateregga", category: "Guard Employment SLA", startDate: "2024-03-15", endDate: "2027-03-14", valueUgx: 14400000, status: "Active", documentRef: "DOC-STF-JBK-2024.pdf", managedBy: "Records Officer", region: "Kampala Central", autoRenew: true, paymentTerms: "Monthly salary, credited on 28th", billingCycle: "Monthly", slaTerms: "Armed Guard. Standard uniform issue + firearms certification", notes: "3-Year renewable contract signed with national ID & guarantor verification.", preparedBy: "Rebecca Nansubuga", issuedBy: "Grace Nakato", relatedForceNumber: "PSG026/001", createdBy: "Records Officer" },
    { contractCode: "CTR-STF-2024-03", title: "Guard Employment Contract - Armed Detail", contractType: "Staff Contract", partyName: "David Ssempijja", category: "Guard Employment SLA", startDate: "2023-11-01", endDate: "2026-10-31", valueUgx: 18000000, status: "Expiring Soon", documentRef: "DOC-STF-DS-2023.pdf", managedBy: "Records Officer", region: "Kampala Central", autoRenew: false, paymentTerms: "Monthly salary, credited on 28th", billingCycle: "Monthly", slaTerms: "Armed Guard, VIP protection certified", notes: "Requires performance appraisal before 3-year extension.", preparedBy: "Rebecca Nansubuga", issuedBy: "Grace Nakato", relatedForceNumber: "PSG026/003", createdBy: "Records Officer" },
    { contractCode: "CTR-STF-2024-05", title: "Guard Employment Contract", contractType: "Staff Contract", partyName: "Grace Nambi", category: "Guard Employment SLA", startDate: "2024-03-01", endDate: "2027-02-28", valueUgx: 9600000, status: "Active", documentRef: "DOC-STF-GN-2024.pdf", managedBy: "Records Officer", region: "Kampala Central", autoRenew: true, paymentTerms: "Monthly salary, credited on 28th", billingCycle: "Monthly", slaTerms: "Unarmed Guard. Standard uniform issue", notes: "", preparedBy: "Rebecca Nansubuga", issuedBy: "Grace Nakato", relatedForceNumber: "PSG026/002", createdBy: "Records Officer" },
    { contractCode: "CTR-STF-2022-02", title: "Guard Supervisor Employment Contract", contractType: "Staff Contract", partyName: "Sarah Nakato", category: "Guard Employment SLA", startDate: "2022-08-15", endDate: "2026-08-14", valueUgx: 21600000, status: "Expiring Soon", documentRef: "DOC-STF-SN-2022.pdf", managedBy: "Records Officer", region: "Kampala Central", autoRenew: false, paymentTerms: "Monthly salary, credited on 28th", billingCycle: "Monthly", slaTerms: "Armed Guard, supervisory + incident command", notes: "Long-serving staff. HR Manager reviewing contract extension terms.", preparedBy: "Rebecca Nansubuga", issuedBy: "Grace Nakato", relatedForceNumber: "PSG026/006", createdBy: "Records Officer" },
    { contractCode: "CTR-STF-2025-04", title: "Probationary Guard Contract", contractType: "Staff Contract", partyName: "Joseph Wasswa", category: "Guard Employment SLA", startDate: "2025-01-10", endDate: "2026-01-09", valueUgx: 7200000, status: "Expired", documentRef: "DOC-STF-JW-2025.pdf", managedBy: "Records Officer", region: "Jinja", autoRenew: false, paymentTerms: "Monthly salary, credited on 28th", billingCycle: "Monthly", slaTerms: "Unarmed Guard, Jinja fuel depot", notes: "1-year probation contract expired; conversion to permanent pending review.", preparedBy: "Rebecca Nansubuga", issuedBy: "Grace Nakato", relatedForceNumber: "PSG026/005", createdBy: "Records Officer" },
    { contractCode: "CTR-STF-2026-12", title: "K9 Handler Employment Contract", contractType: "Staff Contract", partyName: "Martha Kemigisha", category: "Guard Employment SLA", startDate: "2024-06-01", endDate: "2027-05-31", valueUgx: 15600000, status: "Active", documentRef: "DOC-STF-MK-2024.pdf", managedBy: "Records Officer", region: "Kampala West", autoRenew: true, paymentTerms: "Monthly salary, credited on 28th", billingCycle: "Monthly", slaTerms: "K9 Handler (armed), narcotics detection certification", notes: "Includes annual canine-handler allowance.", preparedBy: "Rebecca Nansubuga", issuedBy: "Grace Nakato", relatedForceNumber: "PSG026/004", createdBy: "Records Officer" },
    { contractCode: "CTR-STF-2026-14", title: "Probationary Guard Contract - Aisha Namukose", contractType: "Staff Contract", partyName: "Aisha Namukose", category: "Guard Employment SLA", startDate: "2026-07-01", endDate: "2027-06-30", valueUgx: 9600000, status: "Active", documentRef: "DOC-STF-AN-2026.pdf", managedBy: "Records Officer", region: "Kampala Central", autoRenew: false, paymentTerms: "Monthly salary, credited on 28th", billingCycle: "Monthly", slaTerms: "Unarmed Guard, first-year probation", notes: "Newly enrolled. Lifecycle stage ENROLLED - contract active from joining.", preparedBy: "Rebecca Nansubuga", issuedBy: "Grace Nakato", relatedForceNumber: "PSG026/008", createdBy: "Records Officer" },
    { contractCode: "CTR-STF-2025-15", title: "Guard Employment Contract - Ronald Kato", contractType: "Staff Contract", partyName: "Ronald Kato", category: "Guard Employment SLA", startDate: "2025-02-01", endDate: "2026-01-31", valueUgx: 9600000, status: "Terminated", documentRef: "DOC-STF-RK-2025.pdf", managedBy: "Records Officer", region: "Jinja", autoRenew: false, paymentTerms: "Monthly salary, credited on 28th", billingCycle: "Monthly", slaTerms: "Unarmed Guard", notes: "Terminated for disciplinary reasons after repeat warnings. Guard record suspended.", preparedBy: "Rebecca Nansubuga", issuedBy: "Grace Nakato", relatedForceNumber: "PSG026/009", voidReason: "Terminated for disciplinary reasons after repeat warnings", createdBy: "Records Officer" },
  ];
  for (const c of contractData) {
    const cMapped: any = { ...c, startDate: toDate((c as any).startDate), endDate: toDate((c as any).endDate) };
    await prisma.contract.upsert({
      where: { contractCode: c.contractCode },
      update: cMapped,
      create: cMapped,
    });
  }

  const siteRatings: Array<{ siteName: string; satisfactionRating?: number | null; wonBy?: string | null }> = [
    { siteName: "Bank of East Africa Headquarters", satisfactionRating: 5, wonBy: "Ivan Ssebana" },
    { siteName: "Speke Resort Munyonyo", satisfactionRating: 4, wonBy: "Patricia Akello" },
    { siteName: "Entebbe International Airport", satisfactionRating: 5, wonBy: "Ivan Ssebana" },
    { siteName: "Uganda Telecom Towers", satisfactionRating: 3, wonBy: "Patricia Akello" },
    { siteName: "Gulu Sugar Corp Estate", satisfactionRating: 4, wonBy: "Patricia Akello" },
    { siteName: "Nakumatt Jubilee Mall", satisfactionRating: null, wonBy: "Patricia Akello" },
  ];
  for (const r of siteRatings) {
    const site = await prisma.clientSite.findFirst({ where: { siteName: r.siteName } });
    if (site) await prisma.clientSite.update({ where: { id: site.id }, data: { satisfactionRating: r.satisfactionRating, wonBy: r.wonBy } });
  }

  const complaintData = [
    { complaintCode: "CMPL-2026-01", clientName: "Uganda Telecommunications Corporation", siteName: "Uganda Telecom Towers", category: "SLA Performance", description: "Client reported late post relief at the tower perimeter on the night of 25 Jul; guard relief arrived 45 minutes late.", satisfactionRating: 3, status: "Under Resolution", ownedBy: "Marketing", resolvedBy: "Emma Muwonge", resolutionNotes: "Ops rostered a standby relief pool for tower sites; incident logged for guard behaviour review.", referredForInvestigation: false, reportedDate: "2026-07-26" },
    { complaintCode: "CMPL-2026-02", clientName: "Speke Resorts & Hotels", siteName: "Speke Resort Munyonyo", category: "Guard Conduct", description: "Client alleges unprofessional conduct by a guard at the boat dock gate. Referred to Investigations Officer for a guard-behaviour review feeding the disciplinary chain.", satisfactionRating: 2, status: "Under Investigation", ownedBy: "Marketing", resolvedBy: null, resolutionNotes: null, referredForInvestigation: true, linkedIncidentCode: "INC-2026-0041", reportedDate: "2026-07-28" },
  ];
  for (const c of complaintData) {
    const existing = await prisma.complaint.findUnique({ where: { complaintCode: c.complaintCode } });
    if (existing) await prisma.complaint.update({ where: { complaintCode: c.complaintCode }, data: c });
    else await prisma.complaint.create({ data: c });
  }

  const disciplinaryData = [
    { actionCode: "DISC-2026-01", guardId: "", guardName: "Ronald Kato", forceNumber: "PSG026/009", actionType: "Suspension", reason: "Repeat warning letters for dereliction of duty and missed relief handover.", severity: "High", status: "Finalized", initiatedBy: "Peter Okello", regionalApprovedBy: "Peter Okello", operationsApprovedBy: "Emma Muwonge", hrApprovedBy: "Grace Nakato", approvedAt: "2026-07-15", linkedIncidentCode: null, linkedComplaintCode: null },
    { actionCode: "DISC-2026-02", guardId: "", guardName: "David Ssempijja", forceNumber: "PSG026/003", actionType: "Warning Letter", reason: "Client complaint on conduct at Speke Resort boat dock (CMPL-2026-02); investigated by Investigations Officer.", severity: "Medium", status: "Pending Ops Approval", initiatedBy: "Henry Kiyingi", regionalApprovedBy: null, operationsApprovedBy: null, hrApprovedBy: null, approvedAt: null, linkedIncidentCode: "INC-2026-0041", linkedComplaintCode: "CMPL-2026-02" },
  ];
  for (const d of disciplinaryData) {
    const existing = await prisma.disciplinaryAction.findUnique({ where: { actionCode: d.actionCode } });
    if (existing) await prisma.disciplinaryAction.update({ where: { actionCode: d.actionCode }, data: d });
    else await prisma.disciplinaryAction.create({ data: d });
  }

  const deploymentData = [
    { deploymentCode: "DEP-2026-01", siteId: "", siteName: "Bank of East Africa Headquarters", clientName: "Bank of East Africa Uganda", guardId: "", guardName: "John Bosco Kateregga", shiftType: "Day Shift", deployedBy: "Emma Muwonge", deployedAt: "2026-07-20", status: "Active" },
    { deploymentCode: "DEP-2026-02", siteId: "", siteName: "Bank of East Africa Headquarters", clientName: "Bank of East Africa Uganda", guardId: "", guardName: "Grace Nambi", shiftType: "Night Shift", deployedBy: "Emma Muwonge", deployedAt: "2026-07-20", status: "Active" },
    { deploymentCode: "DEP-2026-03", siteId: "", siteName: "Entebbe International Airport", clientName: "Uganda Civil Aviation Authority", guardId: "", guardName: "Martha Kemigisha", shiftType: "Day Shift", deployedBy: "Emma Muwonge", deployedAt: "2026-07-21", status: "Active" },
    { deploymentCode: "DEP-2026-04", siteId: "", siteName: "Gulu Sugar Corp Estate", clientName: "Gulu Sugar Corporation", guardId: "", guardName: "Joy Adong", shiftType: "Night Shift", deployedBy: "Betty Auma", deployedAt: "2026-07-22", status: "Active" },
  ];
  for (const d of deploymentData) {
    const guard = await prisma.guard.findFirst({ where: { fullName: d.guardName } });
    const site = await prisma.clientSite.findFirst({ where: { siteName: d.siteName } });
    const existing = await prisma.siteDeployment.findUnique({ where: { deploymentCode: d.deploymentCode } });
    const data = { ...d, guardId: guard?.id ?? "", siteId: site?.id ?? "" };
    if (existing) await prisma.siteDeployment.update({ where: { deploymentCode: d.deploymentCode }, data });
    else await prisma.siteDeployment.create({ data });
  }

  // ── Persistence collections: seed all operational data so the UI is DB-driven (no frontend-only mocks). ──
  const VEHICLE_KEYS = ["id", "plateNumber", "vehicleType", "makeModel", "driverAssigned", "fuelLevelPercentage", "mileageKm", "status", "lastServiceDate", "nextServiceDueKm", "chassisNumber", "insuranceExpiryDate", "roadLicenceExpiryDate", "deploymentBranch", "conditionRating", "replacementStatus", "gpsTrackerId", "lifetimeMaintenanceCost", "serviceIntervalKm", "lastOilChangeKm", "lastOilChangeDate", "oilStatus", "lastTyreCheckDate", "tyreTreadDepthMm", "tyreStatus"];
  const TRIP_KEYS = ["id", "tripCode", "vehicleId", "plateNumber", "driverName", "destination", "purpose", "startMileageKm", "endMileageKm", "distanceKm", "departureTime", "arrivalTime", "status", "authorizedBy"];
  const FUEL_KEYS = ["id", "voucherCode", "vehicleId", "plateNumber", "driverName", "fuelLitres", "costUgx", "mileageAtRefillKm", "fuelType", "stationName", "refillDate", "approvedBy", "reconciled"];
  const MAINT_KEYS = ["id", "serviceCode", "vehicleId", "plateNumber", "serviceType", "description", "mileageAtServiceKm", "serviceDate", "nextDueDate", "costUgx", "workshopName", "status"];
  const DRIVER_KEYS = ["id", "driverCode", "fullName", "licenceNumber", "licenceClass", "licenceExpiryDate", "assignedVehiclePlate", "dutyShift", "safetyScorePct", "totalTripsCompleted", "trainingBadges", "status"];
  const INSPECTION_KEYS = ["id", "inspectionCode", "vehicleId", "plateNumber", "inspectorDriver", "inspectionDate", "inspectionTime", "brakesCheck", "tyresCheck", "lightsSirensCheck", "oilLevelCheck", "coolantCheck", "batteryCheck", "overallCondition", "defectsNoted"];
  const BREAKDOWN_KEYS = ["id", "incidentCode", "vehicleId", "plateNumber", "driverName", "location", "issueType", "description", "reportedTime", "recoveryAssigned", "backupVehicleDispatched", "status"];
  const ARMOURY_KEYS = ["id", "assetTag", "serialNumber", "category", "name", "caliberOrSpecs", "totalQuantity", "availableQuantity", "condition", "assignedToGuardId", "assignedToGuardName", "location"];
  const ARMOURY_LOG_KEYS = ["id", "serialNumberLog", "guardId", "guardName", "locationName", "firearmSerialNumber", "assetName", "assetTag", "ammoRoundsOut", "dateOut", "timeOut", "signOutConfirmed", "dateIn", "timeIn", "ammoRoundsIn", "signInConfirmed", "substituteReceiver", "armourerInCharge", "status", "notes"];
  const K9_KEYS = ["id", "code", "name", "breed", "chipNumber", "ageYears", "status", "assignedHandlerId", "assignedHandlerName", "kennelNumber", "rabiesVaccineDate", "lastVetCheck", "specialization", "currentWeightKg", "healthCondition", "vaccinationStatus"];
  const K9_HEALTH_KEYS = ["id", "inspectionCode", "k9Id", "k9Name", "handlerName", "inspectionDate", "weightKg", "vaccinationStatus", "physicalCondition", "coatAndSkinCheck", "appetiteAndHydration", "temperatureCelsius", "inspectingOfficer", "notes"];
  const K9_LOG_KEYS = ["id", "k9Id", "k9Name", "handlerName", "siteName", "deploymentDate", "shiftType", "trainingScore", "vetNotes"];
  const INCIDENT_KEYS = ["id", "incidentCode", "title", "siteName", "reportedByGuard", "incidentDate", "category", "severity", "description", "status", "evidenceAttached"];
  const INVOICE_KEYS = ["id", "invoiceNumber", "clientName", "siteName", "date", "dueDate", "amount", "status", "itemsCount"];
  const EXPENSE_KEYS = ["id", "category", "description", "amount", "date", "status", "approvedBy"];
  const CASHIER_KEYS = ["id", "guardName", "forceNumber", "type", "amount", "date", "status", "processedBy", "guardId"];
  const LEAD_KEYS = ["id", "companyName", "contactPerson", "email", "phone", "estimatedValue", "source", "stage", "assignedTo", "ownerId", "region", "wonBy", "lostReason"];
  const CAMPAIGN_KEYS = ["id", "name", "channel", "leadsGenerated", "budget", "conversions", "proposedBy", "budgetStatus", "budgetApprovedBy", "budgetApprovedAt"];
  const ROSTER_KEYS = ["id", "guardId", "guardName", "siteId", "siteName", "region", "shiftDate", "shiftType", "status", "checkInTime", "checkOutTime"];
  const PATROL_KEYS = ["id", "inspectionCode", "siteName", "supervisorName", "guardOnDuty", "inspectionTime", "radioCheckStatus", "uniformTurnout", "weaponEquipmentCheck", "overallRating", "remarks"];
  const REQ_KEYS = ["id", "reqCode", "department", "requestedBy", "itemDescription", "quantity", "estimatedCostUgx", "priority", "status", "dateRequested"];
  const IT_SERVER_KEYS = ["id", "name", "ipAddress", "status", "cpuUsage", "memoryUsage", "uptime"];
  const IT_TICKET_KEYS = ["id", "ticketCode", "reportedBy", "subject", "priority", "status", "createdDate"];
  const IT_ASSET_KEYS = ["id", "assetCode", "name", "category", "serialNumberOrKey", "assignedToPersonOrStation", "assignedDepartment", "purchaseDate", "warrantyExpiryDate", "valueUgx", "condition", "softwareVersionOrSpecs", "ipAddressOrHost", "notes"];
  const COHORT_KEYS = ["id", "code", "name", "startDate", "endDate", "location", "leadInstructor", "totalRecruits", "passedOutCount", "status", "curriculumModules"];
  const TRAINEE_KEYS = ["id", "traineeCode", "fullName", "nationalIdNumber", "age", "cohortId", "cohortName", "assignedRegion", "drillScore", "marksmanshipScore", "theoryScore", "overallStatus", "assignedForceNumber", "dateGraduated"];
  const LEAVE_KEYS = ["id", "guardId", "guardName", "forceNumber", "leaveType", "startDate", "endDate", "durationDays", "reason", "reliefGuardName", "reliefForceNumber", "appliedDate", "status", "approvedBy", "notes"];
  const DEPLOYMENT_ORDER_KEYS = ["id", "orderCode", "siteId", "siteName", "clientName", "region", "requiredHeadcount", "shiftType", "targetStartDate", "targetEndDate", "requestedBy", "status", "assignedGuardIds", "notes"];

  await seedArray(initialVehicles, VEHICLE_KEYS, (data) => prisma.vehicle.create({ data: data as any }));
  await seedArray(initialTripLogs, TRIP_KEYS, (data) => prisma.vehicleTripLog.create({ data: data as any }));
  await seedArray(initialFuelRequisitions, FUEL_KEYS, (data) =>
    prisma.fuelLog.create({ data: { ...data, status: (data.reconciled as boolean) ? "Approved" : "Pending FM Approval" } as any })
  );
  await seedArray(initialMaintenanceLogs, MAINT_KEYS, (data) =>
    prisma.maintenanceServiceLog.create({ data: { ...data, approvalStatus: (data.status as string) === "Completed" ? "Approved" : "Pending FM Approval" } as any })
  );
  await seedArray(initialDrivers, DRIVER_KEYS, (data) => prisma.driver.create({ data: data as any }));
  await seedArray(initialDailyInspections, INSPECTION_KEYS, (data) => prisma.dailyVehicleInspection.create({ data: data as any }));
  await seedArray(initialBreakdowns, BREAKDOWN_KEYS, (data) => prisma.fleetBreakdownEmergency.create({ data: data as any }));
  await seedArray(initialArmouryItems, ARMOURY_KEYS, (data) => prisma.armouryItem.create({ data: data as any }));
  await seedArray(initialArmouryLogs, ARMOURY_LOG_KEYS, (data) => prisma.armouryLog.create({ data: data as any }));
  await seedArray(initialK9Dogs, K9_KEYS, (data) => prisma.k9Dog.create({ data: data as any }));
  await seedArray(initialK9HealthInspections, K9_HEALTH_KEYS, (data) => prisma.k9HealthInspection.create({ data: data as any }));
  await seedArray(initialK9Logs, K9_LOG_KEYS, (data) => prisma.k9Log.create({ data: data as any }));
  await seedArray(initialIncidents, INCIDENT_KEYS, (data) => prisma.incident.create({ data: data as any }));
  await seedArray(initialInvoices, INVOICE_KEYS, (data) => {
    const mapped: any = { ...data, date: toDate((data as any).date), dueDate: toDate((data as any).dueDate) };
    return prisma.invoice.create({ data: mapped });
  });
  await seedArray(initialExpenses, EXPENSE_KEYS, (data) => prisma.expense.create({ data: data as any }));
  await seedArray(initialCashierTransactions, CASHIER_KEYS, (data) => prisma.cashierTransaction.create({ data: data as any }));
  await seedArray(initialLeads, LEAD_KEYS, (data) => prisma.lead.create({ data: data as any }));
  await seedArray(initialCampaigns, CAMPAIGN_KEYS, (data) => prisma.campaign.create({ data: data as any }));
  await seedArray(initialRoster, ROSTER_KEYS, (data) => prisma.dutyRoster.create({ data: data as any }));
  await seedArray(initialPatrolInspections, PATROL_KEYS, (data) => prisma.patrolInspectionLog.create({ data: data as any }));
  await seedArray(initialAdminRequisitions, REQ_KEYS, (data) => prisma.adminRequisition.create({ data: data as any }));
  await seedArray(initialITServers, IT_SERVER_KEYS, (data) => prisma.iTServer.create({ data: data as any }));
  await seedArray(initialITTickets, IT_TICKET_KEYS, (data) => prisma.iTSupportTicket.create({ data: data as any }));
  await seedArray(initialITAssets, IT_ASSET_KEYS, (data) => prisma.iTAsset.create({ data: data as any }));
  await seedArray(initialTrainingCohorts, COHORT_KEYS, (data) => prisma.trainingCohort.create({ data: data as any }));
  await seedArray(initialRecruitTrainees, TRAINEE_KEYS, (data) => prisma.recruitTrainee.create({ data: data as any }));
  await seedArray(initialLeaveRequests, LEAVE_KEYS, (data) => prisma.leaveRequest.create({ data: data as any }));
  await seedArray(initialDeploymentOrders, DEPLOYMENT_ORDER_KEYS, (data) => prisma.deploymentOrder.create({ data: data as any }));

  // ── Default Workflow Definitions (Workflow Engine v2) ──
  const defaultWorkflows = [
    {
      code: "LEAVE-REQ", name: "Leave Approval", module: "Leave", isActive: true, description: "Guard/staff submits → HR Manager approves → optional GM final for staff leave.",
      steps: [
        { stepOrder: 1, name: "HR Manager Approval", approverRole: "HR Manager", approverRoles: ["HR Manager"], optional: false, regionScoped: false },
        { stepOrder: 2, name: "GM Final Approval (staff)", approverRole: "General Manager", approverRoles: ["General Manager"], optional: true, regionScoped: false },
      ],
    },
    {
      code: "CONTRACT-CLI", name: "Client Contract Approval", module: "Contracts", isActive: true, description: "Marketing drafts from site survey → General Manager sole approval, no threshold, no Finance step.",
      steps: [
        { stepOrder: 1, name: "GM Final Approval", approverRole: "General Manager", approverRoles: ["General Manager"], optional: false, regionScoped: false },
      ],
    },
    {
      code: "DISCIPLINE", name: "Disciplinary Charge Chain", module: "Investigations", isActive: true, description: "IO initiates → Regional → Operations → HR finalize.",
      steps: [
        { stepOrder: 1, name: "Regional Approval", approverRole: "Regional Manager", approverRoles: ["Regional Manager"], optional: false, regionScoped: true },
        { stepOrder: 2, name: "Operations Approval", approverRole: "Operations Manager", approverRoles: ["Operations Manager"], optional: false, regionScoped: false },
        { stepOrder: 3, name: "HR Finalization", approverRole: "HR Manager", approverRoles: ["HR Manager"], optional: false, regionScoped: false },
      ],
    },
    {
      code: "EXPENSE", name: "Expense Approval", module: "Finance", isActive: true, description: "Any staff submits → General Manager sole approval, no threshold, no Finance step.",
      steps: [
        { stepOrder: 1, name: "GM Final Approval", approverRole: "General Manager", approverRoles: ["General Manager"], optional: false, regionScoped: false },
      ],
    },
    {
      code: "CAMPAIGN-BUDGET", name: "Campaign Budget Approval", module: "Marketing", isActive: true, description: "Marketing proposes → General Manager sole approval, no threshold, no Finance step.",
      steps: [
        { stepOrder: 1, name: "GM Final Approval", approverRole: "General Manager", approverRoles: ["General Manager"], optional: false, regionScoped: false },
      ],
    },
    {
      code: "REQUISITION", name: "Requisition Approval", module: "Administration", isActive: true, description: "Any staff submits → General Manager final approval.",
      steps: [
        { stepOrder: 1, name: "GM Final Approval", approverRole: "General Manager", approverRoles: ["General Manager"], optional: false, regionScoped: false },
      ],
    },
    {
      code: "TRANSPORT-REQ", name: "Transport Request", module: "Fleet", isActive: true, description: "Any staff requests transport → Fleet Manager grants/declines.",
      steps: [
        { stepOrder: 1, name: "Fleet Manager Decision", approverRole: "Fleet Manager", approverRoles: ["Fleet Manager"], optional: false, regionScoped: false },
      ],
    },
    {
      code: "SITE-SURVEY", name: "Site Survey", module: "Operations", isActive: true, description: "Marketing requests → Ops/RM (region-scoped) surveys the site and completes with report.",
      steps: [
        { stepOrder: 1, name: "Ops / Regional Survey", approverRole: "Operations Manager", approverRoles: ["Operations Manager", "Regional Manager"], optional: false, regionScoped: true },
      ],
    },
    {
      code: "CONTRACT-INQ", name: "Contract Inquiry", module: "Records", isActive: true, description: "Any staff asks Records Officer to confirm a contract or provide a full copy.",
      steps: [
        { stepOrder: 1, name: "Records Officer Response", approverRole: "Records Officer", approverRoles: ["Records Officer"], optional: false, regionScoped: false },
      ],
    },
  ];
  for (const wf of defaultWorkflows) {
    const existing = await prisma.workflow.findUnique({ where: { code: wf.code } });
    const { steps, ...wfData } = wf;
    if (existing) {
      await prisma.workflow.update({
        where: { code: wf.code },
        data: {
          name: wfData.name,
          module: wfData.module,
          isActive: true,
          description: wfData.description,
          steps: {
            deleteMany: {},
            create: steps.map((s) => ({
              stepOrder: s.stepOrder,
              name: s.name,
              approverRole: s.approverRole,
              approverRoles: s.approverRoles ? JSON.stringify(s.approverRoles) : null,
              optional: s.optional ?? false,
              regionScoped: s.regionScoped ?? false,
              condition: s.condition ?? null,
            })),
          },
        },
      });
    } else {
      await prisma.workflow.create({
        data: {
          ...wfData,
          steps: {
            create: steps.map((s) => ({
              stepOrder: s.stepOrder,
              name: s.name,
              approverRole: s.approverRole,
              approverRoles: s.approverRoles ? JSON.stringify(s.approverRoles) : null,
              optional: s.optional ?? false,
              regionScoped: s.regionScoped ?? false,
              condition: s.condition ?? null,
            })),
          },
        },
      });
    }
  }

  const workflowMap = Object.fromEntries(
    (await prisma.workflow.findMany()).map((w) => [w.code, w.id])
  );

  const leaveWfId = workflowMap["LEAVE-REQ"];
  if (leaveWfId) {
    const leaves = await prisma.leaveRequest.findMany();
    for (const leave of leaves) {
      if (leave.approvalId) continue;
      const isGuardLeave = !!(await prisma.guard.findUnique({ where: { id: leave.guardId } }));
      const status = leave.status;
      const approval = await prisma.approval.create({
        data: {
          workflowId: leaveWfId,
          workflowCode: "LEAVE-REQ",
          referenceType: "LeaveRequest",
          referenceId: leave.id,
          totalSteps: 2,
          currentStep: status === "Approved" ? 3 : status === "Pending GM Approval" ? 2 : 1,
          status: status === "Approved" ? "Approved" : status === "Rejected" ? "Rejected" : "Pending",
          requestedBy: "system",
          requestedByName: "System Seed",
          regionScope: null,
          meta: isGuardLeave ? JSON.stringify({ excludeOptional: true }) : JSON.stringify({ excludeOptional: false }),
        },
      });
      await prisma.leaveRequest.update({ where: { id: leave.id }, data: { approvalId: approval.id } });
    }
  }

  const transportWfId = workflowMap["TRANSPORT-REQ"];
  if (transportWfId) {
    const transports = await prisma.transportRequest.findMany({ where: { approvalId: null } });
    for (const tr of transports) {
      await prisma.approval.create({
        data: {
          workflowId: transportWfId,
          workflowCode: "TRANSPORT-REQ",
          referenceType: "TransportRequest",
          referenceId: tr.id,
          totalSteps: 1,
          currentStep: 1,
          status: tr.status === "Approved" || tr.status === "Declined" ? tr.status : "Pending",
          requestedBy: tr.requestedBy,
          requestedByName: tr.requestedByName,
          regionScope: null,
        },
      });
    }
  }

  const surveyWfId = workflowMap["SITE-SURVEY"];
  if (surveyWfId) {
    const surveys = await prisma.siteSurvey.findMany({ where: { status: { not: "Cancelled" } } });
    for (const s of surveys) {
      await prisma.approval.create({
        data: {
          workflowId: surveyWfId,
          workflowCode: "SITE-SURVEY",
          referenceType: "SiteSurvey",
          referenceId: s.id,
          totalSteps: 1,
          currentStep: s.status === "Completed" ? 2 : 1,
          status: s.status === "Completed" ? "Approved" : "Pending",
          requestedBy: s.requestedBy,
          requestedByName: s.requestedByName,
          regionScope: s.region ?? undefined,
        },
      });
    }
  }

  const inquiryWfId = workflowMap["CONTRACT-INQ"];
  if (inquiryWfId) {
    const inquiries = await prisma.contractInquiry.findMany();
    for (const ci of inquiries) {
      await prisma.approval.create({
        data: {
          workflowId: inquiryWfId,
          workflowCode: "CONTRACT-INQ",
          referenceType: "ContractInquiry",
          referenceId: ci.id,
          totalSteps: 1,
          currentStep: ci.status === "Answered" ? 2 : 1,
          status: ci.status === "Answered" ? "Approved" : "Pending",
          requestedBy: ci.requestedBy,
          requestedByName: ci.requestedByName,
          regionScope: null,
        },
      });
    }
  }

  console.log(`Database seeded successfully. Users: ${userData.length}, Guards: ${guardData.length}, Sites: ${siteData.length}, Contracts: ${contractData.length}.`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
