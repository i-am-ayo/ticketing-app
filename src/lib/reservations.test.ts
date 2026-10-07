import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { createReservation } from "@/lib/reservations";

describe("Reservation Service", () => {
  let testEventId: string;
  let testTicketTypeId: string;

  beforeEach(async () => {
    // Clean up test data
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.ticketType.deleteMany();
    await prisma.event.deleteMany();
    await prisma.organizer.deleteMany();

    const organizer = await prisma.organizer.create({
      data: { name: "Test Organizer" },
    });

    const event = await prisma.event.create({
      data: {
        organizerId: organizer.id,
        title: "Test Concert",
        venue: "Harare International Conference Centre",
        city: "Harare",
        startsAt: new Date(Date.now() + 86400000),
        endsAt: new Date(Date.now() + 172800000),
      },
    });

    const ticketType = await prisma.ticketType.create({
      data: {
        eventId: event.id,
        name: "VIP",
        priceAmount: 1000, // $10.00
        currency: "USD",
        quantityTotal: 5, // Only 5 available
        quantitySold: 0,
        quantityReserved: 0,
      },
    });

    testEventId = event.id;
    testTicketTypeId = ticketType.id;
  });

  it("reserves tickets successfully when stock is available", async () => {
    const order = await createReservation({
      eventId: testEventId,
      buyerName: "Tinashe",
      buyerPhone: "+263771234567",
      currency: "USD",
      items: [{ ticketTypeId: testTicketTypeId, quantity: 2 }],
    });

    expect(order.status).toBe("PENDING");
    expect(order.totalAmount).toBe(2000);

    const updatedTicketType = await prisma.ticketType.findUnique({
      where: { id: testTicketTypeId },
    });
    expect(updatedTicketType?.quantityReserved).toBe(2);
  });

  it("prevents overselling when requested quantity exceeds available stock", async () => {
    await expect(
      createReservation({
        eventId: testEventId,
        buyerName: "Farai",
        buyerPhone: "+263772345678",
        currency: "USD",
        items: [{ ticketTypeId: testTicketTypeId, quantity: 6 }],
      }),
    ).rejects.toThrow("INSUFFICIENT_QUANTITY");

    const updatedTicketType = await prisma.ticketType.findUnique({
      where: { id: testTicketTypeId },
    });
    expect(updatedTicketType?.quantityReserved).toBe(0);
  });

  it("is idempotent when the same idempotency key is submitted twice", async () => {
    const input = {
      eventId: testEventId,
      buyerName: "Chipo",
      buyerPhone: "+263773456789",
      currency: "USD" as const,
      items: [{ ticketTypeId: testTicketTypeId, quantity: 1 }],
      idempotencyKey: "unique-key-123",
    };

    const order1 = await createReservation(input);
    const order2 = await createReservation(input);

    expect(order1.id).toBe(order2.id);

    const updatedTicketType = await prisma.ticketType.findUnique({
      where: { id: testTicketTypeId },
    });
    expect(updatedTicketType?.quantityReserved).toBe(1);
  });
});
