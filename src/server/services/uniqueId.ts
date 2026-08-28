// Unique staff/user identifier generator for accounts that have no Security
// Officer force number, no biodata and no ID card yet — e.g. newly provisioned
// Directors and non-operations staff. Format: <PREFIX>-<SEQ> where the prefix
// derives from the role (DIR for Director, ADM for admin, USR for others).
// The sequence is global so identifiers never collide across roles.

const ROLE_PREFIX: Record<string, string> = {
  "General Manager": "GM",
  Director: "DIR",
  "HR Manager": "HRM",
  "HR Assistant": "HRA",
  "Records Officer": "REC",
  "Business Development Manager": "BDM",
  "Sales and Marketing Supervisor": "SMS",
  "Operations Manager": "OPS",
  "Regional Manager": "RM",
  "Fleet Manager": "FLT",
  "Training Officer": "TRN",
  Armorer: "ARM",
  "Investigations Officer": "INV",
  "K9 Supervisor": "K9S",
  "K9 Handler": "K9H",
  "Finance Manager": "FIN",
  Accountant: "ACC",
  "Assistant Accountant": "AAC",
  "Internal Auditor": "AUD",
  Cashier: "CSH",
  "Administrative Officer": "ADM",
  "IT Officer": "IT",
};

export function rolePrefix(role: string): string {
  return ROLE_PREFIX[role] ?? "USR";
}

export function uniqueIdFor(role: string, seq: number): string {
  return `${rolePrefix(role)}-${String(seq).padStart(4, "0")}`;
}
