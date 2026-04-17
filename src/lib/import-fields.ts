export type ImportRow = Record<string, string>;
export type FieldMapping = Record<string, string>; // spreadsheetHeader -> crmField
export type ImportRowError = { row: number; field: string; message: string };
export type ImportResult = {
  importLogId: string;
  totalRows: number;
  successRows: number;
  errorRows: number;
  duplicates: number;
  errors: ImportRowError[];
};

export const CRM_CONTACT_FIELDS = [
  { key: "firstName", label: "First Name", required: true },
  { key: "lastName", label: "Last Name", required: true },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "mobile", label: "Mobile" },
  { key: "jobTitle", label: "Job Title" },
  { key: "department", label: "Department" },
  { key: "country", label: "Country" },
  { key: "city", label: "City" },
  { key: "address", label: "Address" },
  { key: "nationality", label: "Nationality" },
  { key: "passportNumber", label: "Passport Number" },
  { key: "passportExpiry", label: "Passport Expiry (YYYY-MM-DD)" },
  { key: "dateOfBirth", label: "Date of Birth (YYYY-MM-DD)" },
  { key: "leadSource", label: "Lead Source" },
  { key: "leadStatus", label: "Lead Status" },
  { key: "preferredContact", label: "Preferred Contact" },
  { key: "tags", label: "Tags (comma-separated)" },
  { key: "notes", label: "Notes" },
] as const;
