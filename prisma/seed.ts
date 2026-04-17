import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcryptjs from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting seed...");

  // ─── Users ───────────────────────────────────────────────────────────────────
  const adminPassword = await bcryptjs.hash("Admin@123", 12);
  const agentPassword = await bcryptjs.hash("Agent@123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@travel.com" },
    update: {},
    create: {
      name: "Alex Johnson",
      email: "admin@travel.com",
      password: adminPassword,
      role: "ADMIN",
      phone: "+1-555-000-0001",
      department: "Management",
      isActive: true,
    },
  });

  const agent1 = await prisma.user.upsert({
    where: { email: "sarah@travel.com" },
    update: {},
    create: {
      name: "Sarah Mitchell",
      email: "sarah@travel.com",
      password: agentPassword,
      role: "AGENT",
      phone: "+1-555-000-0002",
      department: "Sales",
      isActive: true,
    },
  });

  const agent2 = await prisma.user.upsert({
    where: { email: "michael@travel.com" },
    update: {},
    create: {
      name: "Michael Chen",
      email: "michael@travel.com",
      password: agentPassword,
      role: "MANAGER",
      phone: "+1-555-000-0003",
      department: "Operations",
      isActive: true,
    },
  });

  console.log("✅ Users created");

  // ─── Pipeline & Stages ───────────────────────────────────────────────────────
  const pipeline = await prisma.pipeline.upsert({
    where: { id: "default-pipeline" },
    update: {},
    create: {
      id: "default-pipeline",
      name: "Sales Pipeline",
      description: "Default travel sales pipeline",
      isDefault: true,
    },
  });

  const stageData = [
    { name: "New Lead", order: 1, color: "#6366f1", probability: 10 },
    { name: "Contacted", order: 2, color: "#8b5cf6", probability: 25 },
    { name: "Proposal Sent", order: 3, color: "#ec4899", probability: 50 },
    { name: "Negotiation", order: 4, color: "#f59e0b", probability: 75 },
    { name: "Won", order: 5, color: "#10b981", probability: 100 },
    { name: "Lost", order: 6, color: "#ef4444", probability: 0 },
  ];

  const stages = await Promise.all(
    stageData.map((s) =>
      prisma.pipelineStage.upsert({
        where: { id: `stage-${s.order}` },
        update: {},
        create: {
          id: `stage-${s.order}`,
          name: s.name,
          order: s.order,
          color: s.color,
          probability: s.probability,
          pipelineId: pipeline.id,
        },
      })
    )
  );

  console.log("✅ Pipeline stages created");

  // ─── Travel Packages ─────────────────────────────────────────────────────────
  const packages = await Promise.all([
    prisma.travelPackage.upsert({
      where: { code: "BALI-7D" },
      update: {},
      create: {
        name: "Bali Paradise 7 Days",
        code: "BALI-7D",
        description: "Experience the magic of Bali with temple visits, rice terraces, and pristine beaches.",
        destinations: ["Bali", "Ubud", "Seminyak", "Nusa Dua"],
        duration: 7,
        basePrice: 1999,
        currency: "USD",
        maxPax: 20,
        minPax: 2,
        inclusions: ["Hotel accommodation", "Daily breakfast", "Airport transfers", "Temple tours", "Rice terrace walk"],
        exclusions: ["International flights", "Travel insurance", "Personal expenses"],
        highlights: ["Tanah Lot Temple", "Tegallalang Rice Terrace", "Seminyak Beach", "Ubud Art Market"],
        category: "BEACH",
        difficulty: "Easy",
        isActive: true,
      },
    }),
    prisma.travelPackage.upsert({
      where: { code: "SAFARI-10D" },
      update: {},
      create: {
        name: "Kenya Safari Adventure 10 Days",
        code: "SAFARI-10D",
        description: "Witness the Great Migration and encounter Africa's Big Five in their natural habitat.",
        destinations: ["Nairobi", "Masai Mara", "Amboseli", "Lake Nakuru"],
        duration: 10,
        basePrice: 4999,
        currency: "USD",
        maxPax: 12,
        minPax: 2,
        inclusions: ["Luxury lodge accommodation", "All meals", "Game drives", "Park fees", "Professional guide"],
        exclusions: ["International flights", "Visa fees", "Gratuities"],
        highlights: ["Big Five sightings", "Great Migration", "Maasai village visit", "Hot air balloon option"],
        category: "SAFARI",
        difficulty: "Moderate",
        isActive: true,
      },
    }),
    prisma.travelPackage.upsert({
      where: { code: "MALDIVES-5D" },
      update: {},
      create: {
        name: "Maldives Luxury Escape 5 Days",
        code: "MALDIVES-5D",
        description: "Overwater bungalows, crystal-clear lagoons, and world-class diving in the Maldives.",
        destinations: ["Male", "North Malé Atoll", "South Malé Atoll"],
        duration: 5,
        basePrice: 3499,
        currency: "USD",
        maxPax: 4,
        minPax: 2,
        inclusions: ["Overwater villa", "All-inclusive meals", "Snorkeling equipment", "Seaplane transfers", "Sunset cruise"],
        exclusions: ["International flights", "Diving courses", "Spa treatments"],
        highlights: ["Overwater bungalow", "House reef snorkeling", "Dolphin cruise", "Sandbank picnic"],
        category: "HONEYMOON",
        difficulty: "Easy",
        isActive: true,
      },
    }),
    prisma.travelPackage.upsert({
      where: { code: "EUROPE-14D" },
      update: {},
      create: {
        name: "European Grand Tour 14 Days",
        code: "EUROPE-14D",
        description: "Visit the iconic capitals of Europe from Paris to Rome, with stops in between.",
        destinations: ["Paris", "Amsterdam", "Berlin", "Prague", "Vienna", "Rome"],
        duration: 14,
        basePrice: 3299,
        currency: "USD",
        maxPax: 30,
        minPax: 10,
        inclusions: ["4-star hotels", "Daily breakfast", "Guided tours", "Inter-city train passes", "Airport transfers"],
        exclusions: ["International flights", "Lunches & dinners", "Optional excursions"],
        highlights: ["Eiffel Tower", "Anne Frank House", "Colosseum", "Prague Castle", "Vienna Opera House"],
        category: "CULTURAL",
        difficulty: "Easy",
        isActive: true,
      },
    }),
    prisma.travelPackage.upsert({
      where: { code: "JAPAN-12D" },
      update: {},
      create: {
        name: "Japan Cultural Journey 12 Days",
        code: "JAPAN-12D",
        description: "Explore ancient temples, futuristic cities, and authentic Japanese cuisine.",
        destinations: ["Tokyo", "Kyoto", "Osaka", "Hiroshima", "Hakone"],
        duration: 12,
        basePrice: 3799,
        currency: "USD",
        maxPax: 16,
        minPax: 2,
        inclusions: ["Hotel & ryokan stay", "Daily breakfast", "Bullet train pass (JR Pass)", "City tours", "Tea ceremony"],
        exclusions: ["International flights", "Lunch & dinner", "Museum entries"],
        highlights: ["Mt. Fuji", "Fushimi Inari Shrine", "Shinjuku at night", "Hiroshima Peace Park", "Osaka Street Food"],
        category: "CULTURAL",
        difficulty: "Moderate",
        isActive: true,
      },
    }),
  ]);

  console.log("✅ Travel packages created");

  // ─── Contacts ────────────────────────────────────────────────────────────────
  const contactsData = [
    {
      firstName: "Emma", lastName: "Wilson", email: "emma.wilson@email.com",
      phone: "+1-555-101-0001", country: "USA", city: "New York",
      leadStatus: "CONVERTED" as const, leadSource: "REFERRAL" as const, leadScore: 92,
      nationality: "American", passportNumber: "US1234567",
    },
    {
      firstName: "James", lastName: "Thompson", email: "james.t@business.com",
      phone: "+1-555-101-0002", country: "UK", city: "London",
      leadStatus: "QUALIFIED" as const, leadSource: "WEBSITE" as const, leadScore: 78,
      nationality: "British", passportNumber: "GB8765432",
    },
    {
      firstName: "Sofia", lastName: "Martinez", email: "sofia.m@email.com",
      phone: "+1-555-101-0003", country: "Spain", city: "Madrid",
      leadStatus: "PROPOSAL_SENT" as const, leadSource: "SOCIAL_MEDIA" as const, leadScore: 65,
      nationality: "Spanish",
    },
    {
      firstName: "David", lastName: "Kim", email: "david.kim@corp.com",
      phone: "+1-555-101-0004", country: "South Korea", city: "Seoul",
      leadStatus: "NEGOTIATION" as const, leadSource: "PARTNER" as const, leadScore: 85,
      nationality: "Korean",
    },
    {
      firstName: "Priya", lastName: "Patel", email: "priya.patel@email.com",
      phone: "+91-98765-43210", country: "India", city: "Mumbai",
      leadStatus: "CONTACTED" as const, leadSource: "EMAIL_CAMPAIGN" as const, leadScore: 55,
      nationality: "Indian",
    },
    {
      firstName: "Lucas", lastName: "Müller", email: "l.muller@email.de",
      phone: "+49-555-100-0006", country: "Germany", city: "Berlin",
      leadStatus: "NEW" as const, leadSource: "WEBSITE" as const, leadScore: 40,
      nationality: "German",
    },
    {
      firstName: "Yuki", lastName: "Tanaka", email: "yuki.t@japan.com",
      phone: "+81-90-1234-5678", country: "Japan", city: "Tokyo",
      leadStatus: "CONVERTED" as const, leadSource: "REFERRAL" as const, leadScore: 95,
      nationality: "Japanese", passportNumber: "JP9988776",
    },
    {
      firstName: "Oliver", lastName: "Brown", email: "oliver.b@email.com",
      phone: "+61-4-1234-5678", country: "Australia", city: "Sydney",
      leadStatus: "QUALIFIED" as const, leadSource: "TRADE_SHOW" as const, leadScore: 72,
      nationality: "Australian",
    },
    {
      firstName: "Fatima", lastName: "Al-Hassan", email: "fatima.ah@email.com",
      phone: "+971-50-123-4567", country: "UAE", city: "Dubai",
      leadStatus: "PROPOSAL_SENT" as const, leadSource: "ADVERTISEMENT" as const, leadScore: 68,
      nationality: "Emirati",
    },
    {
      firstName: "Carlos", lastName: "Rodriguez", email: "carlos.r@email.com",
      phone: "+1-555-101-0010", country: "Mexico", city: "Mexico City",
      leadStatus: "CONTACTED" as const, leadSource: "COLD_CALL" as const, leadScore: 48,
      nationality: "Mexican",
    },
  ];

  const contacts = await Promise.all(
    contactsData.map((contact, i) =>
      prisma.contact.upsert({
        where: { email: contact.email },
        update: {},
        create: {
          ...contact,
          ownerId: i % 3 === 0 ? admin.id : i % 3 === 1 ? agent1.id : agent2.id,
          tags: i % 2 === 0 ? ["VIP", "Returning"] : ["New"],
          totalSpent: contact.leadStatus === "CONVERTED" ? Math.floor(Math.random() * 10000) + 2000 : 0,
          loyaltyPoints: contact.leadStatus === "CONVERTED" ? Math.floor(Math.random() * 500) + 100 : 0,
        },
      })
    )
  );

  console.log("✅ Contacts created");

  // ─── Deals ───────────────────────────────────────────────────────────────────
  const dealsData = [
    {
      title: "Bali Family Holiday Package",
      value: 7996, priority: "HIGH" as const, probability: 75,
      contactIdx: 0, stageIdx: 2, packageIdx: 0,
    },
    {
      title: "Kenya Safari for Corporate Team",
      value: 24995, priority: "URGENT" as const, probability: 90,
      contactIdx: 1, stageIdx: 3, packageIdx: 1,
    },
    {
      title: "Maldives Honeymoon Trip",
      value: 6998, priority: "HIGH" as const, probability: 50,
      contactIdx: 2, stageIdx: 2, packageIdx: 2,
    },
    {
      title: "Europe Grand Tour Group",
      value: 32990, priority: "MEDIUM" as const, probability: 25,
      contactIdx: 3, stageIdx: 1, packageIdx: 3,
    },
    {
      title: "Japan Cultural Experience",
      value: 7598, priority: "HIGH" as const, probability: 75,
      contactIdx: 4, stageIdx: 3, packageIdx: 4,
    },
    {
      title: "Luxury Maldives Retreat",
      value: 13996, priority: "HIGH" as const, probability: 100,
      contactIdx: 6, stageIdx: 4, packageIdx: 2,
    },
    {
      title: "Bali Photography Tour",
      value: 3998, priority: "LOW" as const, probability: 10,
      contactIdx: 7, stageIdx: 0, packageIdx: 0,
    },
    {
      title: "Tokyo Business Trip Extension",
      value: 5000, priority: "MEDIUM" as const, probability: 50,
      contactIdx: 8, stageIdx: 2, packageIdx: 4,
    },
    {
      title: "African Safari - Private Group",
      value: 49990, priority: "URGENT" as const, probability: 90,
      contactIdx: 1, stageIdx: 4, packageIdx: 1,
    },
    {
      title: "Europe Backpacking Special",
      value: 2999, priority: "LOW" as const, probability: 10,
      contactIdx: 9, stageIdx: 0, packageIdx: 3,
    },
  ];

  const deals = await Promise.all(
    dealsData.map((deal) =>
      prisma.deal.create({
        data: {
          title: deal.title,
          value: deal.value,
          currency: "USD",
          probability: deal.probability,
          priority: deal.priority,
          status: deal.stageIdx === 4 ? "WON" : deal.stageIdx === 5 ? "LOST" : "OPEN",
          expectedClose: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000),
          pipelineId: pipeline.id,
          stageId: stages[deal.stageIdx].id,
          contactId: contacts[deal.contactIdx].id,
          ownerId: deal.stageIdx % 2 === 0 ? agent1.id : agent2.id,
          packageId: packages[deal.packageIdx].id,
          tags: ["Travel", "Premium"],
        },
      })
    )
  );

  console.log("✅ Deals created");

  // ─── Bookings ────────────────────────────────────────────────────────────────
  const bookingsData = [
    {
      contactIdx: 0, packageIdx: 0, agentId: agent1.id,
      totalAmount: 3998, paidAmount: 3998, status: "CONFIRMED" as const,
      paymentStatus: "PAID" as const,
      startDate: new Date("2026-06-01"), endDate: new Date("2026-06-08"),
      adults: 2, children: 0,
    },
    {
      contactIdx: 6, packageIdx: 2, agentId: agent2.id,
      totalAmount: 6998, paidAmount: 3499, status: "CONFIRMED" as const,
      paymentStatus: "PARTIAL" as const,
      startDate: new Date("2026-07-15"), endDate: new Date("2026-07-20"),
      adults: 2, children: 0,
    },
    {
      contactIdx: 1, packageIdx: 1, agentId: agent1.id,
      totalAmount: 9998, paidAmount: 0, status: "PENDING" as const,
      paymentStatus: "UNPAID" as const,
      startDate: new Date("2026-08-10"), endDate: new Date("2026-08-20"),
      adults: 2, children: 2,
    },
    {
      contactIdx: 3, packageIdx: 3, agentId: agent2.id,
      totalAmount: 32990, paidAmount: 32990, status: "COMPLETED" as const,
      paymentStatus: "PAID" as const,
      startDate: new Date("2026-03-01"), endDate: new Date("2026-03-15"),
      adults: 10, children: 0,
    },
    {
      contactIdx: 4, packageIdx: 4, agentId: admin.id,
      totalAmount: 7598, paidAmount: 2000, status: "PENDING" as const,
      paymentStatus: "PARTIAL" as const,
      startDate: new Date("2026-09-05"), endDate: new Date("2026-09-17"),
      adults: 2, children: 0,
    },
  ];

  const bookings = await Promise.all(
    bookingsData.map((b) =>
      prisma.booking.create({
        data: {
          totalAmount: b.totalAmount,
          paidAmount: b.paidAmount,
          currency: "USD",
          status: b.status,
          paymentStatus: b.paymentStatus,
          startDate: b.startDate,
          endDate: b.endDate,
          adults: b.adults,
          children: b.children,
          infants: 0,
          contactId: contacts[b.contactIdx].id,
          packageId: packages[b.packageIdx].id,
          agentId: b.agentId,
          destinations: packages[b.packageIdx].destinations,
          specialRequests: b.status === "CONFIRMED" ? "Window seat preferred. Vegetarian meals." : "",
        },
      })
    )
  );

  console.log("✅ Bookings created");

  // ─── Payments ────────────────────────────────────────────────────────────────
  await Promise.all([
    prisma.payment.create({
      data: {
        bookingId: bookings[0].id,
        amount: 3998,
        currency: "USD",
        method: "CREDIT_CARD",
        status: "PAID",
        paidAt: new Date("2026-01-15"),
        reference: "CC-001-2026",
      },
    }),
    prisma.payment.create({
      data: {
        bookingId: bookings[1].id,
        amount: 3499,
        currency: "USD",
        method: "BANK_TRANSFER",
        status: "PAID",
        paidAt: new Date("2026-02-01"),
        reference: "BT-002-2026",
      },
    }),
    prisma.payment.create({
      data: {
        bookingId: bookings[3].id,
        amount: 32990,
        currency: "USD",
        method: "BANK_TRANSFER",
        status: "PAID",
        paidAt: new Date("2025-12-20"),
        reference: "BT-003-2025",
      },
    }),
    prisma.payment.create({
      data: {
        bookingId: bookings[4].id,
        amount: 2000,
        currency: "USD",
        method: "CREDIT_CARD",
        status: "PAID",
        paidAt: new Date("2026-03-10"),
        reference: "CC-004-2026",
      },
    }),
  ]);

  console.log("✅ Payments created");

  // ─── Tasks ───────────────────────────────────────────────────────────────────
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  await Promise.all([
    prisma.task.create({
      data: {
        title: "Follow up with Emma Wilson on Bali booking",
        description: "Check passport validity and special meal requests",
        status: "TODO",
        priority: "HIGH",
        type: "FOLLOW_UP",
        dueDate: today,
        assigneeId: agent1.id,
        creatorId: admin.id,
        contactId: contacts[0].id,
        bookingId: bookings[0].id,
      },
    }),
    prisma.task.create({
      data: {
        title: "Send Kenya Safari proposal to James Thompson",
        description: "Include customized itinerary and group pricing",
        status: "IN_PROGRESS",
        priority: "URGENT",
        type: "QUOTE",
        dueDate: today,
        assigneeId: agent2.id,
        creatorId: admin.id,
        contactId: contacts[1].id,
      },
    }),
    prisma.task.create({
      data: {
        title: "Confirm flight details for Maldives booking",
        status: "TODO",
        priority: "HIGH",
        type: "DOCUMENT",
        dueDate: tomorrow,
        assigneeId: agent2.id,
        creatorId: agent2.id,
        contactId: contacts[6].id,
        bookingId: bookings[1].id,
      },
    }),
    prisma.task.create({
      data: {
        title: "Schedule visa consultation call",
        status: "TODO",
        priority: "MEDIUM",
        type: "CALL",
        dueDate: nextWeek,
        assigneeId: agent1.id,
        creatorId: admin.id,
        contactId: contacts[3].id,
      },
    }),
    prisma.task.create({
      data: {
        title: "Prepare Japan tour itinerary",
        status: "DONE",
        priority: "MEDIUM",
        type: "DOCUMENT",
        dueDate: new Date("2026-03-01"),
        completedAt: new Date("2026-03-01"),
        assigneeId: admin.id,
        creatorId: admin.id,
        contactId: contacts[4].id,
        bookingId: bookings[4].id,
      },
    }),
  ]);

  console.log("✅ Tasks created");

  // ─── Activities ──────────────────────────────────────────────────────────────
  await Promise.all([
    prisma.activity.create({
      data: {
        type: "BOOKING_CREATED",
        title: "Booking created for Bali Paradise package",
        contactId: contacts[0].id,
        bookingId: bookings[0].id,
        userId: agent1.id,
      },
    }),
    prisma.activity.create({
      data: {
        type: "BOOKING_CONFIRMED",
        title: "Booking confirmed and documents sent",
        contactId: contacts[0].id,
        bookingId: bookings[0].id,
        userId: agent1.id,
      },
    }),
    prisma.activity.create({
      data: {
        type: "PAYMENT_RECEIVED",
        title: "Full payment received - $3,998",
        contactId: contacts[0].id,
        bookingId: bookings[0].id,
        userId: agent1.id,
        metadata: { amount: 3998, method: "CREDIT_CARD" },
      },
    }),
    prisma.activity.create({
      data: {
        type: "DEAL_CREATED",
        title: "New deal opened: Kenya Safari for Corporate Team",
        contactId: contacts[1].id,
        dealId: deals[1].id,
        userId: agent2.id,
      },
    }),
    prisma.activity.create({
      data: {
        type: "CONTACT_CREATED",
        title: "Contact created",
        contactId: contacts[0].id,
        userId: admin.id,
      },
    }),
  ]);

  console.log("✅ Activities created");

  console.log("\n🎉 Seed completed successfully!");
  console.log("\nLogin Credentials:");
  console.log("  Admin: admin@travel.com / Admin@123");
  console.log("  Agent: sarah@travel.com / Agent@123");
  console.log("  Manager: michael@travel.com / Agent@123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
