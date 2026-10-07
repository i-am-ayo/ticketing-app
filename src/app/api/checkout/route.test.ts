import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";
import { prisma } from "@/lib/prisma";

describe("POST /api/checkout", () => {
  let testEventId: string;
  let testTicketTypeId: string;

  beforeAll(async () => {
    // Warm up the Neon connection pool safely
    await prisma.$connect();
    await prisma.organizer.findFirst().catch(() => null);
  }, 30000);

  beforeEach(async () => {
    // Sequential cleanups
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.ticketType.deleteMany();
    await prisma.event.deleteMany();
    await prisma.organizer.deleteMany();

    const organizer = await prisma.organizer.create({
      data: { name: "API Test Organizer" },
    });

    const event = await prisma.event.create({
      data: {
        organizerId: organizer.id,
        title: "API Test Event",
        venue: "Harare Sports Club",
        city: "Harare",
        startsAt: new Date(Date.now() + 86400000),
        endsAt: new Date(Date.now() + 172800000),
      },
    });

    const ticketType = await prisma.ticketType.create({
      data: {
        eventId: event.id,
        name: "Standard",
        priceAmount: 500,
        currency: "USD",
        quantityTotal: 3,
        quantitySold: 0,
        quantityReserved: 0,
      },
    });

    testEventId = event.id;
    testTicketTypeId = ticketType.id;
  });

  it("returns 201 and creates order for valid request", async () => {
    const req = new NextRequest("http://localhost:3000/api/checkout", {
      method: "POST",
      body: JSON.stringify({
        eventId: testEventId,
        buyerName: "Kudzai",
        buyerPhone: "+263770000000",
        currency: "USD",
        items: [{ ticketTypeId: testTicketTypeId, quantity: 2 }],
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.order.status).toBe("PENDING");
  });

  it("returns 400 when missing required fields", async () => {
    const req = new NextRequest("http://localhost:3000/api/checkout", {
      method: "POST",
      body: JSON.stringify({
        eventId: testEventId,
        buyerName: "",
        buyerPhone: "+263770000000",
        currency: "USD",
        items: [],
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it("returns 409 when stock is insufficient", async () => {
    const req = new NextRequest("http://localhost:3000/api/checkout", {
      method: "POST",
      body: JSON.stringify({
        eventId: testEventId,
        buyerName: "Kudzai",
        buyerPhone: "+263770000000",
        currency: "USD",
        items: [{ ticketTypeId: testTicketTypeId, quantity: 5 }],
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(409);
    expect(data.error).toBe("Requested quantity is no longer available");
  });
});
