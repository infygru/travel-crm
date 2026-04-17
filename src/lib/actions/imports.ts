"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { CRM_CONTACT_FIELDS, type ImportRow, type FieldMapping, type ImportRowError, type ImportResult } from "@/lib/import-fields";

const VALID_LEAD_SOURCES = ["WEBSITE", "REFERRAL", "SOCIAL_MEDIA", "COLD_CALL", "EMAIL_CAMPAIGN", "TRADE_SHOW", "PARTNER", "ADVERTISEMENT", "OTHER"];
const VALID_LEAD_STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "NEGOTIATION", "CONVERTED", "LOST", "UNQUALIFIED"];

export async function bulkImportContacts(
  rows: ImportRow[],
  fieldMapping: FieldMapping,
  fileName: string
): Promise<ImportResult> {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  // Create import log
  const importLog = await db.importLog.create({
    data: {
      fileName,
      fileType: fileName.endsWith(".csv") ? "csv" : "xlsx",
      entityType: "CONTACT",
      totalRows: rows.length,
      status: "PROCESSING",
      createdById: session.user.id,
    },
  });

  const errors: ImportRowError[] = [];
  const validContacts: Array<{
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    mobile?: string;
    jobTitle?: string;
    department?: string;
    country?: string;
    city?: string;
    address?: string;
    nationality?: string;
    passportNumber?: string;
    passportExpiry?: Date;
    dateOfBirth?: Date;
    leadSource?: string;
    leadStatus: string;
    preferredContact: string;
    tags: string[];
    notes?: string;
    ownerId: string;
  }> = [];

  // Reverse the mapping: crmField -> spreadsheetHeader
  const reverseMap: Record<string, string> = {};
  for (const [sheetCol, crmField] of Object.entries(fieldMapping)) {
    if (crmField) reverseMap[crmField] = sheetCol;
  }

  function get(row: ImportRow, crmField: string): string {
    const sheetCol = reverseMap[crmField];
    if (!sheetCol) return "";
    return (row[sheetCol] ?? "").toString().trim();
  }

  // Pre-fetch existing emails for deduplication
  const potentialEmails = rows
    .map((r) => get(r, "email").toLowerCase())
    .filter(Boolean);

  const existingEmailSet = new Set<string>();
  if (potentialEmails.length > 0) {
    const existing = await db.contact.findMany({
      where: { email: { in: potentialEmails } },
      select: { email: true },
    });
    for (const c of existing) {
      if (c.email) existingEmailSet.add(c.email.toLowerCase());
    }
  }

  let duplicates = 0;
  const seenEmails = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 1;
    const rowErrors: ImportRowError[] = [];

    const firstName = get(row, "firstName");
    const lastName = get(row, "lastName");
    const email = get(row, "email").toLowerCase() || undefined;

    if (!firstName) rowErrors.push({ row: rowNum, field: "firstName", message: "First name is required" });
    if (!lastName) rowErrors.push({ row: rowNum, field: "lastName", message: "Last name is required" });

    // Dedup check
    if (email) {
      if (existingEmailSet.has(email) || seenEmails.has(email)) {
        duplicates++;
        errors.push({ row: rowNum, field: "email", message: `Duplicate email: ${email}` });
        continue;
      }
      seenEmails.add(email);
    }

    // Validate lead source
    const leadSource = get(row, "leadSource").toUpperCase() || undefined;
    if (leadSource && !VALID_LEAD_SOURCES.includes(leadSource)) {
      rowErrors.push({ row: rowNum, field: "leadSource", message: `Invalid lead source: ${leadSource}. Valid values: ${VALID_LEAD_SOURCES.join(", ")}` });
    }

    // Validate lead status
    const rawLeadStatus = get(row, "leadStatus").toUpperCase();
    const leadStatus = VALID_LEAD_STATUSES.includes(rawLeadStatus) ? rawLeadStatus : "NEW";

    // Parse dates
    let passportExpiry: Date | undefined;
    let dateOfBirth: Date | undefined;

    const passportExpiryStr = get(row, "passportExpiry");
    if (passportExpiryStr) {
      const d = new Date(passportExpiryStr);
      if (isNaN(d.getTime())) {
        rowErrors.push({ row: rowNum, field: "passportExpiry", message: `Invalid date format for passportExpiry: ${passportExpiryStr}` });
      } else {
        passportExpiry = d;
      }
    }

    const dobStr = get(row, "dateOfBirth");
    if (dobStr) {
      const d = new Date(dobStr);
      if (isNaN(d.getTime())) {
        rowErrors.push({ row: rowNum, field: "dateOfBirth", message: `Invalid date format for dateOfBirth: ${dobStr}` });
      } else {
        dateOfBirth = d;
      }
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
      continue;
    }

    // Parse tags
    const tagsStr = get(row, "tags");
    const tags = tagsStr ? tagsStr.split(",").map((t) => t.trim()).filter(Boolean) : [];

    const preferredContactRaw = get(row, "preferredContact").toUpperCase();
    const VALID_PREFERRED = ["EMAIL", "PHONE", "WHATSAPP", "SMS"];
    const preferredContact = VALID_PREFERRED.includes(preferredContactRaw) ? preferredContactRaw : "EMAIL";

    validContacts.push({
      firstName,
      lastName,
      email,
      phone: get(row, "phone") || undefined,
      mobile: get(row, "mobile") || undefined,
      jobTitle: get(row, "jobTitle") || undefined,
      department: get(row, "department") || undefined,
      country: get(row, "country") || undefined,
      city: get(row, "city") || undefined,
      address: get(row, "address") || undefined,
      nationality: get(row, "nationality") || undefined,
      passportNumber: get(row, "passportNumber") || undefined,
      passportExpiry,
      dateOfBirth,
      leadSource: leadSource && VALID_LEAD_SOURCES.includes(leadSource) ? leadSource : undefined,
      leadStatus,
      preferredContact,
      tags,
      notes: get(row, "notes") || undefined,
      ownerId: session.user.id,
    });
  }

  // Bulk insert
  let successRows = 0;
  if (validContacts.length > 0) {
    // Prisma createMany with skipDuplicates
    const result = await db.contact.createMany({
      data: validContacts.map((c) => ({
        ...c,
        leadSource: c.leadSource as never,
        leadStatus: c.leadStatus as never,
        preferredContact: c.preferredContact as never,
      })),
      skipDuplicates: true,
    });
    successRows = result.count;

    // Create a single activity for the bulk import
    await db.activity.create({
      data: {
        type: "CONTACT_CREATED",
        title: `Bulk import: ${successRows} contacts added from ${fileName}`,
        userId: session.user.id,
        metadata: { importLogId: importLog.id, count: successRows },
      },
    });
  }

  const errorRows = rows.length - successRows - duplicates;

  // Update import log
  await db.importLog.update({
    where: { id: importLog.id },
    data: {
      successRows,
      errorRows: errors.length,
      duplicates,
      status: "COMPLETED",
      errors: errors as never,
      completedAt: new Date(),
    },
  });

  revalidatePath("/contacts");
  revalidatePath("/contacts/import");

  return {
    importLogId: importLog.id,
    totalRows: rows.length,
    successRows,
    errorRows,
    duplicates,
    errors,
  };
}

export async function getImportLogs(params?: { page?: number; limit?: number }) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    db.importLog.findMany({
      orderBy: { createdAt: "desc" },
      include: { createdBy: { select: { name: true } } },
      skip,
      take: limit,
    }),
    db.importLog.count(),
  ]);

  return { logs, total, page, totalPages: Math.ceil(total / limit) };
}
