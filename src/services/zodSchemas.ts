import { z } from "zod/v4";

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const GUARD_DESIGNATIONS = ["Guard", "K9 Handler", "Armorer", "Site In-Charge", "Inspector"] as const;

export const SITE_ZONES = [
  "Central Business",
  "North District",
  "Northern District",
  "South Extension",
  "Western District",
  "Industrial Zone",
] as const;

export const createGuardSchema = z.object({
  fullName: z.string().min(1),
  guardCode: z.string().min(1),
  designation: z.enum(GUARD_DESIGNATIONS),
  phone: z.string().min(1),
  nationalId: z.string().min(1),
  assignedSite: z.string().min(1),
  status: z.enum(["On Duty", "Off Duty", "On Leave", "Suspended", "Deserted"]).optional(),
  location: z.string().optional(),
  region: z.string().optional(),
  zone: z.string().optional(),
  bankAccount: z.string().optional(),
  bankName: z.string().optional(),
  medicalCleared: z.boolean().optional(),
  armedQualified: z.boolean().optional(),
  k9Qualified: z.boolean().optional(),
  lifecycleStage: z.enum(["ENROLLED", "HANDED_TO_OPERATIONS", "IN_TRAINING", "PASSED_OUT", "DEPLOYED"]).optional(),
  joinDate: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["Male", "Female"]).optional(),
});

export const createSiteSchema = z.object({
  clientName: z.string().min(1),
  siteName: z.string().min(1),
  location: z.string().min(1),
  zone: z.enum(SITE_ZONES),
  region: z.string().optional(),
  dayShiftGuards: z.number().int().nonnegative().optional(),
  nightShiftGuards: z.number().int().nonnegative().optional(),
  dayShiftArmed: z.number().int().nonnegative().optional(),
  nightShiftArmed: z.number().int().nonnegative().optional(),
  armedGuardsRequired: z.number().int().nonnegative().optional(),
  k9Required: z.boolean().optional(),
  contactPerson: z.string().min(1),
  contactPhone: z.string().min(1),
  slaStatus: z.string().optional(),
  satisfactionRating: z.number().int().min(1).max(5).optional(),
  deploymentStatus: z.string().optional(),
  wonBy: z.string().optional(),
});

export const createIncidentSchema = z.object({
  title: z.string().min(1),
  siteName: z.string().min(1),
  reportedByGuard: z.string().min(1),
  category: z.enum(["Security Breach", "Theft Attempt", "Weapon Discharge", "K9 Alert", "Unauthorized Entry", "Medical Emergency"]),
  severity: z.enum(["Low", "Medium", "High", "Critical"]),
  description: z.string().min(1),
  incidentDate: z.string().optional(),
  evidenceAttached: z.boolean().optional(),
});

export const createVehicleSchema = z.object({
  plateNumber: z.string().min(1),
  vehicleType: z.enum(["Patrol SUV", "Motorcycle", "Armored Escort", "Crew Van"]),
  makeModel: z.string().min(1),
  driverAssigned: z.string().optional(),
  fuelLevelPercentage: z.number().min(0).max(100).optional(),
  mileageKm: z.number().optional(),
  status: z.enum(["Operational", "In Service", "Fueling Needed", "Grounded"]).optional(),
});

export const createInvoiceSchema = z.object({
  clientName: z.string().min(1),
  siteName: z.string().min(1),
  amount: z.number().positive(),
  dueDate: z.string().min(1),
});

export const createExpenseSchema = z.object({
  category: z.enum(["Fuel & Patrol", "Armoury Maintenance", "K9 Vet & Feeding", "Uniforms & Gear", "Administrative"]),
  description: z.string().min(1),
  amount: z.number().positive(),
  date: z.string().optional(),
});
