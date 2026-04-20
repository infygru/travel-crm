"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { sendBookingConfirmation, sendBookingStatusUpdate } from "@/lib/email";
import { triggerAutomations } from "@/lib/automations";
import { nanoid } from "nanoid";

export async function getBookings(params?: {
  search?: string;
  status?: string;
  paymentStatus?: string;
  agentId?: string;
  page?: number;
  limit?: number;
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (params?.status) where.status = params.status;
  if (params?.paymentStatus) where.paymentStatus = params.paymentStatus;
  if (params?.agentId) where.agentId = params.agentId;
  if (params?.search) {
    where.OR = [
      { bookingRef: { contains: params.search, mode: "insensitive" } },
      { contact: { firstName: { contains: params.search, mode: "insensitive" } } },
      { contact: { lastName: { contains: params.search, mode: "insensitive" } } },
    ];
  }

  const [bookings, total] = await Promise.all([
    db.booking.findMany({
      where,
      include: {
        contact: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
        package: { select: { id: true, name: true } },
        agent: { select: { id: true, name: true, image: true } },
        _count: { select: { passengers: true, payments: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.booking.count({ where }),
  ]);

  return { bookings, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getBookingById(id: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  return db.booking.findUnique({
    where: { id },
    include: {
      contact: {
        include: {
          company: { select: { id: true, name: true } },
        },
      },
      package: true,
      deal: { select: { id: true, title: true, value: true } },
      agent: { select: { id: true, name: true, email: true, image: true } },
      passengers: {
        include: {
          contact: { select: { id: true, firstName: true, lastName: true } },
        },
      },
      payments: { orderBy: { createdAt: "desc" } },
      documents: { orderBy: { createdAt: "desc" } },
      tasks: {
        include: {
          assignee: { select: { id: true, name: true } },
        },
        orderBy: { dueDate: "asc" },
      },
      notes: {
        include: {
          author: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      activities: {
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function createBooking(data: {
  startDate: string;
  endDate: string;
  adults?: number;
  children?: number;
  infants?: number;
  totalAmount: number;
  currency?: string;
  specialRequests?: string;
  internalNotes?: string;
  destinations?: string[];
  contactId?: string;
  packageId?: string;
  dealId?: string;
  agentId?: string;
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const booking = await db.booking.create({
    data: {
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      adults: data.adults ?? 1,
      children: data.children ?? 0,
      infants: data.infants ?? 0,
      totalAmount: data.totalAmount,
      currency: data.currency ?? "INR",
      specialRequests: data.specialRequests,
      internalNotes: data.internalNotes,
      destinations: data.destinations ?? [],
      contactId: data.contactId,
      packageId: data.packageId,
      dealId: data.dealId,
      agentId: data.agentId ?? session.user.id,
    },
  });

  await db.activity.create({
    data: {
      type: "BOOKING_CREATED",
      title: `Booking ${booking.bookingRef} created`,
      bookingId: booking.id,
      contactId: data.contactId,
      userId: session.user.id,
    },
  });

  revalidatePath("/bookings");

  // Send confirmation email non-blocking
  if (data.contactId) {
    const [contact, pkg] = await Promise.all([
      db.contact.findUnique({ where: { id: data.contactId }, select: { firstName: true, lastName: true, email: true } }),
      data.packageId ? db.travelPackage.findUnique({ where: { id: data.packageId }, select: { name: true } }) : Promise.resolve(null),
    ]);
    if (contact?.email) {
      sendBookingConfirmation({
        bookingRef: booking.bookingRef,
        contactName: `${contact.firstName} ${contact.lastName}`,
        contactEmail: contact.email,
        startDate: booking.startDate,
        endDate: booking.endDate,
        packageName: pkg?.name ?? null,
        totalAmount: booking.totalAmount,
        currency: booking.currency,
        paidAmount: booking.paidAmount,
        bookingId: booking.id,
      }).catch(() => {});
    }
  }

  triggerAutomations("BOOKING_CREATED", {
    bookingId: booking.id,
    bookingRef: booking.bookingRef,
    contactId: data.contactId,
    userId: session.user.id,
  }).catch(() => {});

  return booking;
}

export async function updateBookingStatus(id: string, status: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const booking = await db.booking.update({
    where: { id },
    data: { status: status as never },
  });

  const activityType =
    status === "CONFIRMED" ? "BOOKING_CONFIRMED" :
    status === "CANCELLED" ? "BOOKING_CANCELLED" : "BOOKING_CREATED";

  await db.activity.create({
    data: {
      type: activityType,
      title: `Booking status changed to ${status}`,
      bookingId: id,
      userId: session.user.id,
    },
  });

  revalidatePath(`/bookings/${id}`);
  revalidatePath("/bookings");

  if (status === "CONFIRMED") {
    triggerAutomations("BOOKING_CONFIRMED", {
      bookingId: id,
      bookingRef: booking.bookingRef,
      contactId: booking.contactId ?? undefined,
      userId: session.user.id,
    }).catch(() => {});
  }

  // Send status email + auto-create tasks on CONFIRMED
  if (status === "CONFIRMED" || status === "CANCELLED" || status === "COMPLETED") {
    const full = await db.booking.findUnique({
      where: { id },
      include: { contact: { select: { firstName: true, lastName: true, email: true } } },
    });
    if (full?.contact?.email) {
      sendBookingStatusUpdate({
        bookingRef: full.bookingRef,
        contactName: `${full.contact.firstName} ${full.contact.lastName}`,
        contactEmail: full.contact.email,
        status,
        startDate: full.startDate,
        bookingId: id,
      }).catch(() => {});
    }

    // Auto-create operations checklist when booking is CONFIRMED
    if (status === "CONFIRMED" && full) {
      const dep = full.startDate;
      const daysBeforeDep = (days: number) => new Date(dep.getTime() - days * 86400000);
      await db.task.createMany({
        data: [
          {
            title: "Collect passport copies from all travelers",
            type: "DOCUMENT",
            priority: "HIGH",
            dueDate: daysBeforeDep(60),
            bookingId: id,
            contactId: full.contactId ?? undefined,
            creatorId: session.user.id,
            assigneeId: session.user.id,
          },
          {
            title: "Check visa requirements and submit applications",
            type: "DOCUMENT",
            priority: "HIGH",
            dueDate: daysBeforeDep(45),
            bookingId: id,
            contactId: full.contactId ?? undefined,
            creatorId: session.user.id,
            assigneeId: session.user.id,
          },
          {
            title: "Send final payment reminder to client",
            type: "FOLLOW_UP",
            priority: "MEDIUM",
            dueDate: daysBeforeDep(30),
            bookingId: id,
            contactId: full.contactId ?? undefined,
            creatorId: session.user.id,
            assigneeId: session.user.id,
          },
          {
            title: "Pre-departure call — confirm all details with client",
            type: "CALL",
            priority: "MEDIUM",
            dueDate: daysBeforeDep(7),
            bookingId: id,
            contactId: full.contactId ?? undefined,
            creatorId: session.user.id,
            assigneeId: session.user.id,
          },
        ],
      });
    }
  }

  return booking;
}

export async function addPayment(data: {
  bookingId: string;
  amount: number;
  currency?: string;
  method: string;
  reference?: string;
  notes?: string;
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const payment = await db.payment.create({
    data: {
      bookingId: data.bookingId,
      amount: data.amount,
      currency: data.currency ?? "INR",
      method: data.method as never,
      status: "PAID",
      paidAt: new Date(),
      reference: data.reference,
      notes: data.notes,
    },
  });

  // Update booking paid amount and payment status
  const booking = await db.booking.findUnique({
    where: { id: data.bookingId },
    include: { payments: true },
  });

  if (booking) {
    const totalPaid = booking.payments.reduce((sum, p) => sum + p.amount, 0) + data.amount;
    const paymentStatus =
      totalPaid >= booking.totalAmount ? "PAID" :
      totalPaid > 0 ? "PARTIAL" : "UNPAID";

    await db.booking.update({
      where: { id: data.bookingId },
      data: { paidAmount: totalPaid, paymentStatus: paymentStatus as never },
    });

    // Keep contact.totalSpent in sync
    if (booking.contactId) {
      const contactBookings = await db.booking.findMany({
        where: { contactId: booking.contactId },
        select: { id: true, paidAmount: true },
      });
      const newTotal = contactBookings.reduce(
        (sum, b) => sum + (b.id === data.bookingId ? totalPaid : b.paidAmount),
        0
      );
      await db.contact.update({
        where: { id: booking.contactId },
        data: { totalSpent: newTotal },
      });
    }
  }

  await db.activity.create({
    data: {
      type: "PAYMENT_RECEIVED",
      title: `Payment of ${data.amount} ${data.currency ?? "INR"} received`,
      bookingId: data.bookingId,
      userId: session.user.id,
      metadata: { amount: data.amount, method: data.method },
    },
  });

  revalidatePath(`/bookings/${data.bookingId}`);
  return payment;
}

export async function updateBooking(id: string, data: Partial<{
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
  infants: number;
  totalAmount: number;
  costPrice: number;
  currency: string;
  specialRequests: string;
  internalNotes: string;
  destinations: string[];
  contactId: string;
  packageId: string;
  agentId: string;
}>) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const booking = await db.booking.update({
    where: { id },
    data: {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    },
  });

  await db.activity.create({
    data: {
      type: "BOOKING_CREATED",
      title: "Booking details updated",
      bookingId: id,
      userId: session.user.id,
    },
  });

  revalidatePath(`/bookings/${id}`);
  revalidatePath("/bookings");
  return booking;
}

export async function addPassenger(bookingId: string, data: {
  firstName: string;
  lastName: string;
  type: string;
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  passportNumber?: string;
  passportExpiry?: string;
  seatPreference?: string;
  mealPreference?: string;
  specialNeeds?: string;
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const passenger = await db.passenger.create({
    data: {
      bookingId,
      firstName: data.firstName,
      lastName: data.lastName,
      type: data.type as never,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      gender: data.gender as never ?? undefined,
      nationality: data.nationality,
      passportNumber: data.passportNumber,
      passportExpiry: data.passportExpiry ? new Date(data.passportExpiry) : undefined,
      seatPreference: data.seatPreference,
      mealPreference: data.mealPreference,
      specialNeeds: data.specialNeeds,
    },
  });

  await db.activity.create({
    data: {
      type: "BOOKING_CREATED",
      title: `Passenger ${data.firstName} ${data.lastName} added`,
      bookingId,
      userId: session.user.id,
    },
  });

  revalidatePath(`/bookings/${bookingId}`);
  return passenger;
}

export async function removePassenger(passengerId: string, bookingId: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  await db.passenger.delete({ where: { id: passengerId } });
  revalidatePath(`/bookings/${bookingId}`);
  return { success: true };
}

export async function addBookingNote(bookingId: string, content: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const note = await db.note.create({
    data: {
      content,
      bookingId,
      authorId: session.user.id,
    },
  });

  revalidatePath(`/bookings/${bookingId}`);
  return note;
}

export async function getBookingsCursor(params?: {
  cursor?: string;
  limit?: number;
  search?: string;
  status?: string;
  paymentStatus?: string;
  agentId?: string;
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const limit = params?.limit ?? 50;
  const where: Record<string, unknown> = {};

  if (params?.status) where.status = params.status;
  if (params?.paymentStatus) where.paymentStatus = params.paymentStatus;
  if (params?.agentId) where.agentId = params.agentId;
  if (params?.search) {
    where.OR = [
      { bookingRef: { contains: params.search, mode: "insensitive" } },
      { contact: { firstName: { contains: params.search, mode: "insensitive" } } },
      { contact: { lastName: { contains: params.search, mode: "insensitive" } } },
    ];
  }

  const bookings = await db.booking.findMany({
    where,
    include: {
      contact: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
      package: { select: { id: true, name: true } },
      agent: { select: { id: true, name: true, image: true } },
      _count: { select: { passengers: true, payments: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(params?.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
  });

  const hasMore = bookings.length > limit;
  const data = hasMore ? bookings.slice(0, limit) : bookings;
  const nextCursor = hasMore ? data[data.length - 1]?.id : null;

  return { bookings: data, nextCursor, hasMore };
}

export async function getBookingStats() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const [total, confirmed, pending, revenue] = await Promise.all([
    db.booking.count(),
    db.booking.count({ where: { status: "CONFIRMED" } }),
    db.booking.count({ where: { status: "PENDING" } }),
    db.booking.aggregate({ _sum: { paidAmount: true } }),
  ]);

  return {
    total,
    confirmed,
    pending,
    revenue: revenue._sum.paidAmount ?? 0,
  };
}

export async function addPassengersBulk(
  bookingId: string,
  passengers: Array<{
    firstName: string;
    lastName: string;
    type: string;
    dateOfBirth?: string;
    gender?: string;
    nationality?: string;
    passportNumber?: string;
    passportExpiry?: string;
    issuingCountry?: string;
    seatPreference?: string;
    mealPreference?: string;
    specialNeeds?: string;
    email?: string;
    phone?: string;
    individualCost?: number;
  }>
) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const validTypes = ["ADULT", "CHILD", "INFANT"];

  await db.passenger.createMany({
    data: passengers.map((p) => ({
      bookingId,
      firstName: p.firstName,
      lastName: p.lastName,
      type: (validTypes.includes((p.type ?? "").toUpperCase()) ? p.type.toUpperCase() : "ADULT") as never,
      dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth) : undefined,
      gender: p.gender ?? undefined,
      nationality: p.nationality ?? undefined,
      passportNumber: p.passportNumber ?? undefined,
      passportExpiry: p.passportExpiry ? new Date(p.passportExpiry) : undefined,
      issuingCountry: p.issuingCountry ?? undefined,
      seatPreference: p.seatPreference ?? undefined,
      mealPreference: p.mealPreference ?? undefined,
      specialNeeds: p.specialNeeds ?? undefined,
      email: p.email ?? undefined,
      phone: p.phone ?? undefined,
      individualCost: p.individualCost ?? 0,
    })),
  });

  // Update booking adult/child/infant counts
  const allPassengers = await db.passenger.findMany({
    where: { bookingId },
    select: { type: true },
  });
  const adults = allPassengers.filter((p) => p.type === "ADULT").length;
  const children = allPassengers.filter((p) => p.type === "CHILD").length;
  const infants = allPassengers.filter((p) => p.type === "INFANT").length;

  await db.booking.update({
    where: { id: bookingId },
    data: { adults, children, infants },
  });

  await db.activity.create({
    data: {
      type: "BOOKING_CREATED",
      title: `${passengers.length} passenger${passengers.length !== 1 ? "s" : ""} added in bulk`,
      bookingId,
      userId: session.user.id,
    },
  });

  revalidatePath(`/bookings/${bookingId}`);
  return { count: passengers.length };
}

export async function updatePassengerCost(passengerId: string, individualCost: number) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const passenger = await db.passenger.update({
    where: { id: passengerId },
    data: { individualCost },
  });

  revalidatePath(`/bookings/${passenger.bookingId}`);
  return passenger;
}

export async function resendBookingConfirmation(bookingId: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      contact: { select: { firstName: true, lastName: true, email: true } },
      package: { select: { name: true } },
    },
  });

  if (!booking) throw new Error("Booking not found");
  if (!booking.contact?.email) throw new Error("Contact has no email address");

  await sendBookingConfirmation({
    bookingRef: booking.bookingRef,
    contactName: `${booking.contact.firstName} ${booking.contact.lastName}`,
    contactEmail: booking.contact.email,
    startDate: booking.startDate,
    endDate: booking.endDate,
    packageName: booking.package?.name ?? null,
    totalAmount: booking.totalAmount,
    currency: booking.currency,
    paidAmount: booking.paidAmount,
    bookingId: booking.id,
  });

  revalidatePath(`/bookings/${bookingId}`);
}

export async function generateBookingShareLink(bookingId: string): Promise<string> {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const token = nanoid(16);

  await db.booking.update({
    where: { id: bookingId },
    data: {
      shareToken: token,
      sharedAt: new Date(),
    },
  });

  revalidatePath(`/bookings/${bookingId}`);

  const baseUrl = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
  return `${baseUrl}/b/${token}`;
}
