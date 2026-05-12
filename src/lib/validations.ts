/**
 * Server-side Zod validation schemas for all CRM entities.
 * Import and use in server actions BEFORE touching the database.
 */

import { z } from "zod"

// ─── COMMON ───────────────────────────────────

export const idSchema = z.string().cuid({ message: "Invalid ID format" })

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(20),
})

export const emailSchema = z
  .string()
  .email("Invalid email address")
  .max(254, "Email is too long")
  .toLowerCase()

export const phoneSchema = z
  .string()
  .max(30, "Phone number is too long")
  .regex(/^[+\d\s\-().]+$/, "Invalid phone number format")
  .optional()

export const urlSchema = z
  .string()
  .url("Must be a valid URL")
  .max(2048, "URL is too long")
  .optional()

// ─── PASSWORD ─────────────────────────────────

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

// ─── USER ─────────────────────────────────────

export const userCreateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(["ADMIN", "MANAGER", "AGENT"]).default("AGENT"),
  phone: phoneSchema,
  department: z.string().max(100).optional(),
})

export const userUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: phoneSchema,
  department: z.string().max(100).optional(),
  role: z.enum(["ADMIN", "MANAGER", "AGENT"]).optional(),
  isActive: z.boolean().optional(),
})

// ─── CONTACT ──────────────────────────────────

export const contactCreateSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100).trim(),
  lastName: z.string().max(100).trim().default(""),
  email: emailSchema.optional(),
  phone: phoneSchema,
  mobile: phoneSchema,
  jobTitle: z.string().max(150).trim().optional(),
  department: z.string().max(100).trim().optional(),
  country: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  address: z.string().max(500).optional(),
  leadSource: z
    .enum([
      "WEBSITE", "REFERRAL", "SOCIAL_MEDIA", "COLD_CALL",
      "EMAIL_CAMPAIGN", "TRADE_SHOW", "PARTNER", "ADVERTISEMENT", "OTHER",
    ])
    .optional(),
  leadStatus: z
    .enum([
      "NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT",
      "NEGOTIATION", "CONVERTED", "LOST", "UNQUALIFIED",
    ])
    .optional(),
  tags: z.array(z.string().max(50)).max(20).default([]),
  notes: z.string().max(5000).optional(),
  companyId: idSchema.optional(),
  ownerId: idSchema.optional(),
})

export const contactUpdateSchema = contactCreateSchema.partial()

// ─── DEAL ─────────────────────────────────────

export const dealCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200).trim(),
  value: z.coerce.number().min(0).max(999_999_999),
  currency: z.string().length(3, "Currency must be a 3-letter code").toUpperCase(),
  probability: z.coerce.number().min(0).max(100).default(0),
  expectedClose: z.string().datetime().optional().or(z.literal("").transform(() => undefined)),
  status: z.enum(["OPEN", "WON", "LOST", "ON_HOLD"]).default("OPEN"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  description: z.string().max(5000).optional(),
  tags: z.array(z.string().max(50)).max(20).default([]),
  pipelineId: idSchema.optional(),
  stageId: idSchema.optional(),
  contactId: idSchema.optional(),
  companyId: idSchema.optional(),
  ownerId: idSchema.optional(),
  packageId: idSchema.optional(),
})

export const dealUpdateSchema = dealCreateSchema.partial()

// ─── BOOKING ──────────────────────────────────

export const bookingCreateSchema = z.object({
  contactId: idSchema.optional(),
  packageId: idSchema.optional(),
  dealId: idSchema.optional(),
  agentId: idSchema.optional(),
  startDate: z.string().datetime({ message: "Invalid start date" }),
  endDate: z.string().datetime({ message: "Invalid end date" }),
  adults: z.coerce.number().int().min(1).max(99),
  children: z.coerce.number().int().min(0).max(99).default(0),
  infants: z.coerce.number().int().min(0).max(99).default(0),
  totalAmount: z.coerce.number().min(0).max(999_999_999),
  currency: z.string().length(3).toUpperCase(),
  destinations: z.array(z.string().max(200)).max(20).default([]),
  specialRequests: z.string().max(2000).optional(),
  internalNotes: z.string().max(5000).optional(),
}).refine((d) => new Date(d.endDate) >= new Date(d.startDate), {
  message: "End date must be on or after start date",
  path: ["endDate"],
})

export const bookingUpdateSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "REFUNDED"]).optional(),
  paymentStatus: z.enum(["UNPAID", "PARTIAL", "PAID", "REFUNDED", "OVERDUE"]).optional(),
  paidAmount: z.coerce.number().min(0).max(999_999_999).optional(),
  internalNotes: z.string().max(5000).optional(),
  specialRequests: z.string().max(2000).optional(),
  agentId: idSchema.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  totalAmount: z.coerce.number().min(0).optional(),
})

// ─── TASK ─────────────────────────────────────

export const taskCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(300).trim(),
  description: z.string().max(5000).optional(),
  dueDate: z.string().datetime().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  assigneeId: idSchema.optional(),
  contactId: idSchema.optional(),
  dealId: idSchema.optional(),
  bookingId: idSchema.optional(),
})

export const taskUpdateSchema = taskCreateSchema.partial().extend({
  status: z.enum(["TODO", "IN_PROGRESS", "DONE", "CANCELLED"]).optional(),
})

// ─── SOCIAL POST ──────────────────────────────

export const socialPostCreateSchema = z.object({
  caption: z.string().min(1, "Caption is required").max(63206),
  mediaUrls: z.array(z.string().url("Invalid media URL")).max(10).default([]),
  mediaType: z.enum(["TEXT", "IMAGE", "CAROUSEL", "VIDEO", "REEL", "STORY"]).default("TEXT"),
  accountIds: z.array(idSchema).min(1, "Select at least one account").max(20),
  scheduledAt: z.string().datetime().optional(),
  firstComment: z.string().max(2200).optional(),
  tags: z.array(z.string().max(100)).max(30).default([]),
})

// ─── CAMPAIGN ─────────────────────────────────

export const campaignCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(200).trim(),
  subject: z.string().min(1, "Subject is required").max(500).trim(),
  fromName: z.string().min(1, "From name is required").max(100).trim(),
  fromEmail: emailSchema,
  replyTo: emailSchema.optional(),
  body: z.string().min(1, "Email body is required").max(100_000),
  segmentId: idSchema.optional(),
  scheduledAt: z.string().datetime().optional(),
})

// ─── SUPPORT TICKET ───────────────────────────

export const ticketCreateSchema = z.object({
  subject: z.string().min(1, "Subject is required").max(300).trim(),
  description: z.string().min(1, "Description is required").max(10_000).trim(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  contactId: idSchema.optional(),
  dealId: idSchema.optional(),
  bookingId: idSchema.optional(),
})

export const ticketReplySchema = z.object({
  body: z.string().min(1, "Reply is required").max(10_000).trim(),
  isInternal: z.boolean().default(false),
})

// ─── HELPERS ──────────────────────────────────

/**
 * Throws a formatted error if validation fails.
 * Use in server actions: const data = validate(schema, input)
 */
export function validate<T>(schema: z.ZodSchema<T>, input: unknown): T {
  const result = schema.safeParse(input)
  if (!result.success) {
    const messages = result.error.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join("; ")
    throw new Error(`Validation failed: ${messages}`)
  }
  return result.data
}
