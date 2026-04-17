"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function getSuppliers(params?: {
  search?: string;
  category?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (params?.category) where.category = params.category;
  if (params?.isActive !== undefined) where.isActive = params.isActive;
  if (params?.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { contactName: { contains: params.search, mode: "insensitive" } },
      { email: { contains: params.search, mode: "insensitive" } },
      { city: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const [suppliers, total] = await Promise.all([
    db.supplier.findMany({
      where,
      include: {
        _count: { select: { payments: true } },
      },
      orderBy: { name: "asc" },
      skip,
      take: limit,
    }),
    db.supplier.count({ where }),
  ]);

  return { suppliers, total, page, limit };
}

export async function getSupplier(id: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  return db.supplier.findUnique({
    where: { id },
    include: {
      payments: {
        include: {
          booking: { select: { id: true, bookingRef: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function createSupplier(data: {
  name: string;
  category: string;
  email?: string;
  phone?: string;
  website?: string;
  country?: string;
  city?: string;
  address?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  paymentTerms?: string;
  rating?: number;
  notes?: string;
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const supplier = await db.supplier.create({
    data: {
      name: data.name,
      category: data.category as never,
      email: data.email || undefined,
      phone: data.phone || undefined,
      website: data.website || undefined,
      country: data.country || undefined,
      city: data.city || undefined,
      address: data.address || undefined,
      contactName: data.contactName || undefined,
      contactEmail: data.contactEmail || undefined,
      contactPhone: data.contactPhone || undefined,
      paymentTerms: data.paymentTerms || undefined,
      rating: data.rating || undefined,
      notes: data.notes || undefined,
    },
  });

  revalidatePath("/suppliers");
  return supplier;
}

export async function updateSupplier(
  id: string,
  data: Partial<{
    name: string;
    category: string;
    email: string;
    phone: string;
    website: string;
    country: string;
    city: string;
    address: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    paymentTerms: string;
    rating: number;
    notes: string;
    isActive: boolean;
    bankDetails: Record<string, string>;
  }>
) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const supplier = await db.supplier.update({
    where: { id },
    data: data as never,
  });

  revalidatePath(`/suppliers/${id}`);
  revalidatePath("/suppliers");
  return supplier;
}

export async function deleteSupplier(id: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  await db.supplier.delete({ where: { id } });
  revalidatePath("/suppliers");
}

export async function addSupplierPayment(data: {
  supplierId: string;
  bookingId?: string;
  amount: number;
  currency?: string;
  dueDate?: string;
  paidDate?: string;
  status?: string;
  reference?: string;
  notes?: string;
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const payment = await db.supplierPayment.create({
    data: {
      supplierId: data.supplierId,
      bookingId: data.bookingId || undefined,
      amount: data.amount,
      currency: data.currency ?? "INR",
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      paidDate: data.paidDate ? new Date(data.paidDate) : undefined,
      status: (data.status ?? "PENDING") as never,
      reference: data.reference || undefined,
      notes: data.notes || undefined,
    },
  });

  revalidatePath(`/suppliers/${data.supplierId}`);
  return payment;
}

export async function updateSupplierPaymentStatus(
  paymentId: string,
  status: string,
  supplierId: string
) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const payment = await db.supplierPayment.update({
    where: { id: paymentId },
    data: {
      status: status as never,
      paidDate: status === "PAID" ? new Date() : undefined,
    },
  });

  revalidatePath(`/suppliers/${supplierId}`);
  return payment;
}
