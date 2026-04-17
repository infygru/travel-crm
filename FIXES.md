# Travel CRM — Outstanding Fixes & Features

> Resume prompt: "Read FIXES.md and continue implementing the pending items in order."

---

## STATUS KEY
- [ ] Not started
- [~] In progress
- [x] Done

---

## 1. Campaign Sending  [x]

**Problem:** Campaigns can be created but never sent. No `sendCampaign` server action exists.

**What to build:**
- `sendCampaign(campaignId)` server action in `src/lib/actions/marketing.ts`
  - Fetches campaign + audience (all contacts / new leads / qualified / converted — based on `segmentId`)
  - Loops contacts, calls `sendEmail()` from `src/lib/email.ts` for each
  - Updates `Campaign.status = "SENT"`, sets `Campaign.sentAt`, increments `Campaign.totalSent`
  - On failure per-contact: log and continue (don't abort entire send)
- Campaign detail page: `src/app/(crm)/marketing/campaigns/[id]/page.tsx`
  - Shows campaign info, recipient count, stats (sent/opened/clicked)
  - "Send Now" button — calls `sendCampaign` (only if status is DRAFT or SCHEDULED)
  - "Edit" button — inline edit form for name/subject/body
- Make campaign name in list table a link to `/marketing/campaigns/[id]`
- Add `updateCampaignStats(campaignId, { opened?, clicked? })` helper for future webhook tracking

---

## 2. Automations Actually Fire  [x]

**Problem:** Automation rules exist in DB but nothing triggers them when CRM events happen.

**What to build:**
- `src/lib/actions/automations.ts` — `triggerAutomations(event: string, payload: object)` server function
  - Fetches all active `AutomationRule` records where `triggerType === event`
  - For each rule, evaluates `conditions` JSON against `payload`
  - Executes `actions` array in order:
    - `SEND_EMAIL` → calls `sendEmail()` from `src/lib/email.ts`
    - `CREATE_TASK` → creates a Task record
    - `UPDATE_LEAD_STATUS` → updates Contact.leadStatus
    - `ADD_TAG` → pushes to Contact.tags
    - `ASSIGN_OWNER` → sets ownerId
- Hook `triggerAutomations` into existing server actions:
  - `src/lib/actions/contacts.ts` → `createContact()` fires `CONTACT_CREATED`
  - `src/lib/actions/deals.ts` → `createDeal()` fires `DEAL_CREATED`, `updateDealStage()` fires `DEAL_STAGE_CHANGED`, mark won/lost fires `DEAL_WON` / `DEAL_LOST`
  - `src/lib/actions/bookings.ts` → `createBooking()` fires `BOOKING_CREATED`, status change to CONFIRMED fires `BOOKING_CONFIRMED`
  - `src/lib/actions/contacts.ts` → `updateContact()` when leadStatus changes fires `LEAD_STATUS_CHANGED`

---

## 3. Sequence Enrollment  [x]

**Problem:** Sequence steps exist but contacts can't be enrolled. No enrollment mechanism anywhere.

**What to build:**
- `enrollContactInSequence(contactId, sequenceId)` server action in `src/lib/actions/marketing.ts`
  - Creates `SequenceEnrollment` record (check schema — may need migration)
  - Sets `enrolledAt`, `currentStep = 0`, `status = ACTIVE`
- `processSequenceEnrollments()` in `src/lib/jobs/sequences.ts`
  - Called by daily cron (`src/lib/jobs/index.ts`)
  - For each ACTIVE enrollment, checks if `currentStep`'s `delayDays` has elapsed since last step
  - Sends message (email/SMS/WhatsApp) for the step
  - Advances to next step or marks COMPLETED
- UI: Add "Enroll in Sequence" button on:
  - Contact detail page (`src/app/(crm)/contacts/[id]/page.tsx`) — dropdown to pick sequence
  - Deal detail page (`src/app/(crm)/deals/[id]/page.tsx`) — enroll linked contact
- Show active enrollments on contact detail page (which sequence, which step, next send date)
- Add enrollment count to sequences list (already has `_count.enrollments` in query)

---

## 4. Settings → Pipeline Editor  [x]

**Problem:** Pipeline stages are read-only in Settings. Can't add/edit/delete stages.

**What to build:**
- Server actions in `src/lib/actions/settings.ts` (create if not exists):
  - `createStage(pipelineId, { name, color, probability, order })`
  - `updateStage(stageId, { name, color, probability })`
  - `deleteStage(stageId)` — block if deals exist in stage
  - `reorderStages(pipelineId, stageIds[])` — update `order` field
  - `createPipeline({ name })` — creates pipeline with default stages
- Replace read-only stage list in `src/app/(crm)/settings/page.tsx` pipeline tab with:
  - Inline editable stage rows (click name to edit, color picker, probability input)
  - "Add Stage" button → inline form at bottom
  - Delete button (with confirmation if deals exist)
  - Drag handles for reorder (use `@hello-pangea/dnd` or simple up/down arrows)
  - "Add Pipeline" button to create additional pipelines

---

## 5. Business / Company Settings  [x]

**Problem:** No place to configure agency name, logo, address — hardcoded in env vars. Invoices/emails use generic values.

**What to build:**
- Prisma model (check schema — may already have `OrganizationSettings` or similar):
  - If missing: add `CompanySettings` model with fields: `companyName`, `logoUrl`, `address`, `city`, `state`, `pincode`, `phone`, `email`, `gstin`, `website`, `invoicePrefix`, `invoiceFooter`
  - Run `npx prisma db push` after schema change
- `src/lib/actions/settings.ts`:
  - `getCompanySettings()` — fetches or returns defaults
  - `updateCompanySettings(data)` — upsert
- New "Company" tab in `src/app/(crm)/settings/page.tsx`:
  - Form: company name, logo URL, address block, GST number, invoice prefix, footer text
  - Save button → calls `updateCompanySettings`
- Update `src/lib/pdf/booking-invoice-pdf.tsx` and `src/lib/pdf/itinerary-pdf.tsx` to use `getCompanySettings()` instead of hardcoded strings
- Update `src/lib/email.ts` `COMPANY_NAME` / `APP_DOMAIN` to pull from DB settings

---

## 6. Campaign Detail / Edit Page  [x]

**Problem:** No `/marketing/campaigns/[id]` page. Can't view or edit a campaign after creation.

**What to build:**
- `src/app/(crm)/marketing/campaigns/[id]/page.tsx` (server component):
  - Header: campaign name, status badge, channel icon, created date
  - Stats row: Total Sent, Open Rate, Click Rate, Clicks
  - "Send Now" button (visible if DRAFT) → calls `sendCampaign(id)`
  - "Duplicate" button → creates copy as DRAFT
  - Campaign content section: shows subject, body, from/reply-to
  - Edit form (inline, toggled by "Edit" button) — updates name/subject/body/schedule
  - Recipient preview: shows first 20 contacts who will receive based on segment
- Make campaign rows in list table clickable → links to `/marketing/campaigns/[id]`

---

## IMPLEMENTATION ORDER

1. **#5 Company Settings** — needed by PDFs and emails, do first
2. **#4 Pipeline Editor** — pure UI + server actions, self-contained
3. **#1 Campaign Sending + #6 Campaign Detail** — do together (detail page hosts Send button)
4. **#2 Automations** — hook triggers into existing actions
5. **#3 Sequence Enrollment** — needs cron job + UI additions

---

## NOTES

- Stack: Next.js App Router, Prisma 7 + Neon PostgreSQL, NextAuth v5, Tailwind CSS 4, React 19
- All server actions use `"use server"` — never export non-async values from these files
- Email sending: `src/lib/email.ts` → `sendEmail({ to, subject, html })`
- Cron jobs: `src/lib/jobs/index.ts` → `runAllJobs()` called by `/api/cron/run`
- Currency: always use `₹` symbol and `toLocaleString("en-IN")` — never `$` or `"en-US"`
- Seed credentials: admin@travel.com / Admin@123
- Read `node_modules/next/dist/docs/` before writing Next.js code (breaking changes in this version)
