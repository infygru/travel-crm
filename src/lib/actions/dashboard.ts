"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { subMonths, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";

export async function getDashboardStats() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const today = new Date();
  const startOfToday = startOfDay(today);
  const endOfToday = endOfDay(today);
  const thirtyDaysAgo = subMonths(today, 1);

  const [
    totalRevenue,
    prevMonthRevenue,
    activeBookings,
    prevActiveBookings,
    newLeads,
    prevNewLeads,
    wonDeals,
    totalDeals,
  ] = await Promise.all([
    db.booking.aggregate({
      _sum: { paidAmount: true },
      where: { status: { in: ["CONFIRMED", "COMPLETED"] } },
    }),
    db.booking.aggregate({
      _sum: { paidAmount: true },
      where: {
        status: { in: ["CONFIRMED", "COMPLETED"] },
        createdAt: { lt: thirtyDaysAgo },
      },
    }),
    db.booking.count({ where: { status: { in: ["CONFIRMED", "IN_PROGRESS"] } } }),
    db.booking.count({
      where: {
        status: { in: ["CONFIRMED", "IN_PROGRESS"] },
        createdAt: { lt: thirtyDaysAgo },
      },
    }),
    db.contact.count({
      where: { leadStatus: "NEW", createdAt: { gte: thirtyDaysAgo } },
    }),
    db.contact.count({
      where: {
        leadStatus: "NEW",
        createdAt: { gte: subMonths(thirtyDaysAgo, 1), lt: thirtyDaysAgo },
      },
    }),
    db.deal.count({ where: { status: "WON" } }),
    db.deal.count({ where: { status: { in: ["WON", "LOST"] } } }),
  ]);

  const conversionRate = totalDeals > 0 ? (wonDeals / totalDeals) * 100 : 0;

  return {
    totalRevenue: totalRevenue._sum.paidAmount ?? 0,
    prevMonthRevenue: prevMonthRevenue._sum.paidAmount ?? 0,
    activeBookings,
    prevActiveBookings,
    newLeads,
    prevNewLeads,
    conversionRate,
  };
}

export async function getRevenueByMonth() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const today = new Date();
  const rangeStart = startOfMonth(subMonths(today, 11));
  const rangeEnd = endOfMonth(today);

  // Single query for all bookings in the 12-month window
  const bookingsRaw = await db.booking.findMany({
    where: { createdAt: { gte: rangeStart, lte: rangeEnd } },
    select: { createdAt: true, paidAmount: true, status: true },
  });

  // Group client-side by month
  const monthMap: Record<string, { revenue: number; bookings: number }> = {};
  for (let i = 11; i >= 0; i--) {
    const date = subMonths(today, i);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    monthMap[key] = { revenue: 0, bookings: 0 };
  }

  for (const b of bookingsRaw) {
    const key = `${b.createdAt.getFullYear()}-${b.createdAt.getMonth()}`;
    if (monthMap[key]) {
      monthMap[key].bookings++;
      if (b.status === "CONFIRMED" || b.status === "COMPLETED") {
        monthMap[key].revenue += b.paidAmount;
      }
    }
  }

  return Object.entries(monthMap).map(([key, val]) => {
    const [year, month] = key.split("-").map(Number);
    const date = new Date(year, month, 1);
    return {
      month: date.toLocaleString("default", { month: "short" }),
      year,
      revenue: val.revenue,
      bookings: val.bookings,
    };
  });
}

export async function getPipelineFunnel() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const pipeline = await db.pipeline.findFirst({
    where: { isDefault: true },
    include: {
      stages: {
        orderBy: { order: "asc" },
        include: {
          _count: { select: { deals: true } },
          deals: {
            where: { status: "OPEN" },
            select: { value: true },
          },
        },
      },
    },
  });

  if (!pipeline) return [];

  return pipeline.stages.map((stage) => ({
    name: stage.name,
    count: stage._count.deals,
    value: stage.deals.reduce((sum, d) => sum + d.value, 0),
    color: stage.color,
  }));
}

export async function getRecentBookings(limit = 5) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  return db.booking.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      contact: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      package: { select: { id: true, name: true } },
      agent: { select: { id: true, name: true } },
    },
  });
}

export async function getTopAgents(limit = 5) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const agents = await db.user.findMany({
    where: { role: { in: ["AGENT", "MANAGER"] }, isActive: true },
    include: {
      assignedBookings: {
        select: { totalAmount: true, paidAmount: true, status: true },
        where: { status: { in: ["CONFIRMED", "COMPLETED"] } },
      },
      _count: { select: { assignedBookings: true, assignedDeals: true } },
    },
    take: limit,
  });

  return agents
    .map((agent) => ({
      id: agent.id,
      name: agent.name ?? "Unknown",
      email: agent.email,
      image: agent.image,
      bookingCount: agent._count.assignedBookings,
      dealCount: agent._count.assignedDeals,
      revenue: agent.assignedBookings.reduce((sum, b) => sum + b.paidAmount, 0),
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

export async function getTasksDueToday() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const today = new Date();
  const start = startOfDay(today);
  const end = endOfDay(today);

  return db.task.findMany({
    where: {
      dueDate: { gte: start, lte: end },
      status: { in: ["TODO", "IN_PROGRESS"] },
    },
    include: {
      assignee: { select: { id: true, name: true, image: true } },
      contact: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { priority: "desc" },
    take: 10,
  });
}

export async function getUpcomingDepartures(days = 14) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const now = new Date();
  const future = new Date(now);
  future.setDate(future.getDate() + days);

  return db.booking.findMany({
    where: {
      startDate: { gte: now, lte: future },
      status: { in: ["CONFIRMED", "IN_PROGRESS"] },
    },
    include: {
      contact: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
      package: { select: { id: true, name: true } },
      passengers: { select: { id: true, firstName: true, lastName: true, type: true } },
    },
    orderBy: { startDate: "asc" },
    take: 10,
  });
}

export async function getPaymentAlerts() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const now = new Date();
  const thirtyDaysOut = new Date(now);
  thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30);

  // Bookings with unpaid balance, departing in next 30 days or already overdue
  return db.booking.findMany({
    where: {
      status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] },
      paymentStatus: { in: ["UNPAID", "PARTIAL", "OVERDUE"] },
      startDate: { lte: thirtyDaysOut },
    },
    include: {
      contact: { select: { id: true, firstName: true, lastName: true, phone: true } },
    },
    orderBy: { startDate: "asc" },
    take: 10,
  });
}

export async function getPendingBookings() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  return db.booking.findMany({
    where: { status: "PENDING" },
    include: {
      contact: { select: { id: true, firstName: true, lastName: true } },
      package: { select: { id: true, name: true } },
      agent: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
}

export async function getPassportExpiryAlerts(days = 90) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const now = new Date();
  const future = new Date(now);
  future.setDate(future.getDate() + days);

  return db.passenger.findMany({
    where: {
      passportExpiry: { gte: now, lte: future },
      booking: { status: { in: ["CONFIRMED", "IN_PROGRESS", "PENDING"] } },
    },
    include: {
      booking: {
        select: { id: true, bookingRef: true, startDate: true, status: true },
      },
    },
    orderBy: { passportExpiry: "asc" },
    take: 10,
  });
}

export async function getBookingsByStatus() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const statuses = ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "REFUNDED"];
  const results = await Promise.all(
    statuses.map(async (status) => ({
      status,
      count: await db.booking.count({ where: { status: status as never } }),
    }))
  );

  return results.filter((r) => r.count > 0);
}

export async function getLeadSourceBreakdown() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const sources = await db.contact.groupBy({
    by: ["leadSource"],
    _count: { leadSource: true },
    where: { leadSource: { not: null } },
  });

  return sources.map((s) => ({
    source: s.leadSource ?? "OTHER",
    count: s._count.leadSource,
  }));
}
