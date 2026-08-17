/**
 * Zod schemas for domain validation.
 * Use on both client forms and future Express API payloads.
 */

import { z } from "zod";
import { UGANDA_REGIONS } from "../constants/regions";

export const companyRegionSchema = z.enum(UGANDA_REGIONS);

export const emailSchema = z
  .string()
  .trim()
  .email("Invalid email address")
  .max(254);

export const phoneSchema = z
  .string()
  .trim()
  .min(7, "Phone number too short")
  .max(20, "Phone number too long");

export const forceNumberSchema = z
  .string()
  .trim()
  .min(3)
  .max(32)
  .regex(/^[A-Za-z0-9\-\/]+$/, "Force number may only contain letters, numbers, - and /");

export const loginSchema = z.object({
  userId: z.string().min(1, "Select a user account"),
});

export const guardCreateSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  forceNumber: forceNumberSchema,
  nationalId: z.string().trim().min(5).max(30),
  phone: phoneSchema,
  designation: z.enum(["Guard", "K9 Handler", "Armorer"]),
  assignedSite: z.string().trim().min(1),
  location: z.string().trim().optional(),
  bankAccount: z.string().trim().optional(),
  bankName: z.string().trim().optional(),
});

export const userCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: emailSchema,
  role: z.string().min(1),
  department: z.string().min(1),
  region: companyRegionSchema.optional(),
  phone: phoneSchema.optional(),
  forceNumber: forceNumberSchema.optional(),
  status: z.enum(["Active", "Suspended", "Inactive"]).default("Active"),
});

export const armouryIssueSchema = z.object({
  assetId: z.string().min(1),
  guardId: z.string().min(1),
  locationName: z.string().trim().min(1).max(200),
  ammoRoundsOut: z.number().int().min(0).max(500),
  dateOut: z.string().min(1),
  timeOut: z.string().min(1),
  signOutConfirmed: z.boolean(),
  armourerInCharge: z.string().trim().min(1),
  notes: z.string().max(2000).optional(),
});

export const incidentCreateSchema = z.object({
  siteName: z.string().trim().min(1),
  category: z.string().trim().min(1),
  severity: z.enum(["Low", "Medium", "High", "Critical"]).or(z.string()),
  description: z.string().trim().min(5).max(4000),
});

export type GuardCreateInput = z.infer<typeof guardCreateSchema>;
export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type ArmouryIssueInput = z.infer<typeof armouryIssueSchema>;
