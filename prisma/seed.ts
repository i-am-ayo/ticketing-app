// Stage 2 seed script.
// - Safe to re-run: uses upsert on fixed ids.
// - Refuses to run in NODE_ENV=production.
// - Uses clearly fake data: no real names, no real phone numbers, no real password hashes.

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import {
  Currency,
  EventStatus,
  OrganizerStatus,
  UserRole,
} from "@/generated/prisma/client";

function createPrisma(): PrismaClient {
  // Seed uses the same @prisma/adapter-pg pattern as src/lib/prisma.ts.
  // Prefer DIRECT_DATABASE_URL (Neon direct/non-pooler URL for CLI/DDL-like
  // writes); fall back to DATABASE_URL. Explicit connectionTimeoutMillis
  // of 30s handles cold-start / wakeup latency of idle Neon instances.
  const connectionString =
    process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "seed: set DIRECT_DATABASE_URL (or DATABASE_URL) in your .env file.",
    );
  }
  const adapter = new PrismaPg({
    connectionString,
    connectionTimeoutMillis: 30_000,
  });
  return new PrismaClient({ adapter });
}

// ---------- Fixed seed ids (deterministic; enables re-runnable upserts) ----------

const SEED_ORGANIZER_ID = "seed-organizer-1";
const SEED_USER_ID = "seed-user-organizer-1";
const SEED_EVENT_IDS = [
  "seed-event-1",
  "seed-event-2",
  "seed-event-3",
] as const;
const SEED_TICKET_TYPE_IDS = {
  e1_early: "seed-tt-e1-early",
  e1_regular: "seed-tt-e1-regular",
  e1_vip: "seed-tt-e1-vip",
  e2_regular: "seed-tt-e2-regular",
  e2_vip: "seed-tt-e2-vip",
  e3_standard: "seed-tt-e3-standard",
  e3_premium: "seed-tt-e3-premium",
  e3_group: "seed-tt-e3-group",
} as const;

// ---------- Fake constants ----------

// Intentionally NOT a real bcrypt/argon2 hash. This seed entry must never be
// used for login in any environment. Replace via real sign-up / Auth.js flow.
const FAKE_PASSWORD_HASH =
  "FAKE_PASSWORD_HASH_FOR_SEED_ONLY_DO_NOT_USE_IN_PRODUCTION_000000000000";

function assertNotProduction() {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "seed: refusing to run in NODE_ENV=production. Set NODE_ENV=development locally.",
    );
  }
}

async function runSeed() {
  assertNotProduction();
  const prisma = createPrisma();

  try {
    // --- 1. Organizer ---
    await prisma.organizer.upsert({
      where: { id: SEED_ORGANIZER_ID },
      update: {
        name: "Harare Live Promotions",
        contactEmail: "hello@example.com",
        contactPhone: "+263771000001",
        payoutDetails:
          "Seed placeholder: payout details to be confirmed with organizer.",
        status: OrganizerStatus.ACTIVE,
      },
      create: {
        id: SEED_ORGANIZER_ID,
        name: "Harare Live Promotions",
        contactEmail: "hello@example.com",
        contactPhone: "+263771000001",
        payoutDetails:
          "Seed placeholder: payout details to be confirmed with organizer.",
        status: OrganizerStatus.ACTIVE,
      },
    });

    // --- 2. Organizer user ---
    await prisma.user.upsert({
      where: { id: SEED_USER_ID },
      update: {
        email: "organizer@example.com",
        passwordHash: FAKE_PASSWORD_HASH,
        role: UserRole.ORGANIZER,
        organizerId: SEED_ORGANIZER_ID,
      },
      create: {
        id: SEED_USER_ID,
        email: "organizer@example.com",
        passwordHash: FAKE_PASSWORD_HASH,
        role: UserRole.ORGANIZER,
        organizerId: SEED_ORGANIZER_ID,
      },
    });

    // --- 3. Events (3 published) ---
    type EventSeed = {
      id: string;
      title: string;
      description: string;
      venue: string;
      city: string;
      startsAt: Date;
      endsAt: Date;
      imageUrl: string | null;
      status: EventStatus;
      ticketTypes: Array<{
        id: string;
        name: string;
        priceAmount: number;
        currency: Currency;
        quantityTotal: number;
        quantitySold?: number;
        quantityReserved?: number;
        saleStartsAt?: Date;
        saleEndsAt?: Date;
        maxPerOrder?: number;
      }>;
    };

    const events: EventSeed[] = [
      {
        id: SEED_EVENT_IDS[0],
        title: "Harare Summer Music Festival",
        description:
          "One-day outdoor music festival featuring top Zimdancehall, Afro-pop, and jazz artists.",
        venue: "Harare Gardens",
        city: "Harare",
        startsAt: new Date("2026-11-21T10:00:00Z"),
        endsAt: new Date("2026-11-21T22:00:00Z"),
        imageUrl: null,
        status: EventStatus.PUBLISHED,
        ticketTypes: [
          {
            id: SEED_TICKET_TYPE_IDS.e1_early,
            name: "Early Bird",
            priceAmount: 1000,
            currency: Currency.USD,
            quantityTotal: 200,
            quantitySold: 50,
            saleStartsAt: new Date("2026-10-01T00:00:00Z"),
            saleEndsAt: new Date("2026-11-01T00:00:00Z"),
            maxPerOrder: 8,
          },
          {
            id: SEED_TICKET_TYPE_IDS.e1_regular,
            name: "Regular",
            priceAmount: 1500,
            currency: Currency.USD,
            quantityTotal: 500,
            quantitySold: 0,
            saleStartsAt: new Date("2026-11-01T00:00:00Z"),
            saleEndsAt: new Date("2026-11-21T08:00:00Z"),
            maxPerOrder: 10,
          },
          {
            id: SEED_TICKET_TYPE_IDS.e1_vip,
            name: "VIP",
            priceAmount: 3000,
            currency: Currency.USD,
            quantityTotal: 100,
            quantitySold: 12,
            saleStartsAt: new Date("2026-10-01T00:00:00Z"),
            saleEndsAt: new Date("2026-11-21T08:00:00Z"),
            maxPerOrder: 4,
          },
        ],
      },
      {
        id: SEED_EVENT_IDS[1],
        title: "Bulawayo Comedy Night",
        description:
          "Stand-up comedy night featuring Zimbabwe's funniest comedians, with two sets and an open-mic finale.",
        venue: "Large City Hall",
        city: "Bulawayo",
        startsAt: new Date("2026-12-05T17:00:00Z"),
        endsAt: new Date("2026-12-05T21:30:00Z"),
        imageUrl: null,
        status: EventStatus.PUBLISHED,
        ticketTypes: [
          {
            id: SEED_TICKET_TYPE_IDS.e2_regular,
            name: "Regular",
            priceAmount: 50000,
            currency: Currency.ZIG,
            quantityTotal: 300,
            quantitySold: 0,
            saleStartsAt: new Date("2026-10-15T00:00:00Z"),
            saleEndsAt: new Date("2026-12-05T15:00:00Z"),
            maxPerOrder: 6,
          },
          {
            id: SEED_TICKET_TYPE_IDS.e2_vip,
            name: "VIP (front row + drink)",
            priceAmount: 150000,
            currency: Currency.ZIG,
            quantityTotal: 50,
            quantitySold: 0,
            saleStartsAt: new Date("2026-10-15T00:00:00Z"),
            saleEndsAt: new Date("2026-12-05T15:00:00Z"),
            maxPerOrder: 4,
          },
        ],
      },
      {
        id: SEED_EVENT_IDS[2],
        title: "Mutare Business Expo 2026",
        description:
          "Annual business networking expo with keynote speakers, exhibitor stalls, and a B2B matchmaking lounge.",
        venue: "Mutare Showgrounds",
        city: "Mutare",
        startsAt: new Date("2026-11-28T06:00:00Z"),
        endsAt: new Date("2026-11-28T16:00:00Z"),
        imageUrl: null,
        status: EventStatus.PUBLISHED,
        ticketTypes: [
          {
            id: SEED_TICKET_TYPE_IDS.e3_standard,
            name: "Standard Entry",
            priceAmount: 2000,
            currency: Currency.USD,
            quantityTotal: 400,
            quantitySold: 0,
            saleStartsAt: new Date("2026-10-01T00:00:00Z"),
            saleEndsAt: new Date("2026-11-28T04:00:00Z"),
            maxPerOrder: 10,
          },
          {
            id: SEED_TICKET_TYPE_IDS.e3_premium,
            name: "Premium (lunch + lounge access)",
            priceAmount: 4000,
            currency: Currency.USD,
            quantityTotal: 100,
            quantitySold: 5,
            saleStartsAt: new Date("2026-10-01T00:00:00Z"),
            saleEndsAt: new Date("2026-11-28T04:00:00Z"),
            maxPerOrder: 5,
          },
          {
            id: SEED_TICKET_TYPE_IDS.e3_group,
            name: "Company Group (5 people)",
            priceAmount: 9000,
            currency: Currency.USD,
            quantityTotal: 30,
            quantitySold: 0,
            saleStartsAt: new Date("2026-10-01T00:00:00Z"),
            saleEndsAt: new Date("2026-11-21T00:00:00Z"),
            maxPerOrder: 2,
          },
        ],
      },
    ];

    for (const ev of events) {
      await prisma.event.upsert({
        where: { id: ev.id },
        update: {
          organizerId: SEED_ORGANIZER_ID,
          title: ev.title,
          description: ev.description,
          venue: ev.venue,
          city: ev.city,
          startsAt: ev.startsAt,
          endsAt: ev.endsAt,
          imageUrl: ev.imageUrl,
          status: ev.status,
        },
        create: {
          id: ev.id,
          organizerId: SEED_ORGANIZER_ID,
          title: ev.title,
          description: ev.description,
          venue: ev.venue,
          city: ev.city,
          startsAt: ev.startsAt,
          endsAt: ev.endsAt,
          imageUrl: ev.imageUrl,
          status: ev.status,
        },
      });

      for (const tt of ev.ticketTypes) {
        await prisma.ticketType.upsert({
          where: { id: tt.id },
          update: {
            eventId: ev.id,
            name: tt.name,
            priceAmount: tt.priceAmount,
            currency: tt.currency,
            quantityTotal: tt.quantityTotal,
            // NOTE: quantitySold and quantityReserved are intentionally NOT
            // updated on re-seed, so re-running the seed never overwrites
            // real sales or reservations.
            saleStartsAt: tt.saleStartsAt ?? null,
            saleEndsAt: tt.saleEndsAt ?? null,
            maxPerOrder: tt.maxPerOrder ?? null,
          },
          create: {
            id: tt.id,
            eventId: ev.id,
            name: tt.name,
            priceAmount: tt.priceAmount,
            currency: tt.currency,
            quantityTotal: tt.quantityTotal,
            quantitySold: tt.quantitySold ?? 0,
            quantityReserved: tt.quantityReserved ?? 0,
            saleStartsAt: tt.saleStartsAt ?? null,
            saleEndsAt: tt.saleEndsAt ?? null,
            maxPerOrder: tt.maxPerOrder ?? null,
          },
        });
      }
    }

    const counts = {
      organizers: 1,
      users: 1,
      events: events.length,
      ticketTypes: events.reduce((n, e) => n + e.ticketTypes.length, 0),
    };

    console.log("seed: complete.", counts);
  } finally {
    await prisma.$disconnect();
  }
}

runSeed().catch((err) => {
  console.error("seed: failed.");
  console.error(err);
  process.exit(1);
});
