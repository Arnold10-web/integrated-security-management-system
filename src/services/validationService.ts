import { z } from "zod/v4";
import type { Guard, User, Vehicle } from "../types";

export const guardSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  forceNumber: z.string().min(1, "Force number is required"),
  designation: z.enum(["Guard", "K9 Handler", "Armorer"]),
  phone: z.string().min(1, "Phone is required"),
  nationalId: z.string().min(1, "National ID is required"),
  assignedSite: z.string().min(1, "Assigned site is required"),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["Male", "Female"]).optional(),
  maritalStatus: z.enum(["Single", "Married", "Widowed", "Divorced"]).optional(),
});

export function validateGuard(data: Omit<Guard, "id">): { valid: boolean; errors: Record<string, string> } {
  const result = guardSchema.safeParse(data);
  if (result.success) return { valid: true, errors: {} };
  const errors: Record<string, string> = {};
  for (const issue of (result as any).error?.issues ?? []) {
    const path = issue.path?.join(".") || "form";
    errors[path] = issue.message;
  }
  return { valid: false, errors };
}

export const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  role: z.string().min(1, "Role is required"),
  department: z.string().min(1, "Department is required"),
});

export function validateUser(data: Omit<User, "id">): { valid: boolean; errors: Record<string, string> } {
  const result = userSchema.safeParse(data);
  if (result.success) return { valid: true, errors: {} };
  const errors: Record<string, string> = {};
  for (const issue of (result as any).error?.issues ?? []) {
    const path = issue.path?.join(".") || "form";
    errors[path] = issue.message;
  }
  return { valid: false, errors };
}

export const vehicleSchema = z.object({
  plateNumber: z.string().min(1, "Plate number is required"),
  makeModel: z.string().min(1, "Make/Model is required"),
  vehicleType: z.enum(["Patrol SUV", "Motorcycle", "Armored Escort", "Crew Van"]),
});

export function validateVehicle(data: Omit<Vehicle, "id">): { valid: boolean; errors: Record<string, string> } {
  const result = vehicleSchema.safeParse(data);
  if (result.success) return { valid: true, errors: {} };
  const errors: Record<string, string> = {};
  for (const issue of (result as any).error?.issues ?? []) {
    const path = issue.path?.join(".") || "form";
    errors[path] = issue.message;
  }
  return { valid: false, errors };
}

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export function validateLogin(data: { email: string; password: string }): { valid: boolean; errors: Record<string, string> } {
  const result = loginSchema.safeParse(data);
  if (result.success) return { valid: true, errors: {} };
  const errors: Record<string, string> = {};
  for (const issue of (result as any).error?.issues ?? []) {
    const path = issue.path?.join(".") || "form";
    errors[path] = issue.message;
  }
  return { valid: false, errors };
}
