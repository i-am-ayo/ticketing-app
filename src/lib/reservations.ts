import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export interface ReservationItemInput {
  ticketTypeId: string;
  quantity: number;
}

export interface CreateReservationInput {
  eventId: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail?: string;
  currency: "USD" | "ZIG";
  items: ReservationItemInput[];
  idempotencyKey?: string;
}

export async function createReservation(input: CreateReservationInput) {
  const {
    eventId,
    buyerName,
    buyerPhone,
    buyerEmail,
    currency,
    items,
    idempotencyKey,
  } = input;

  if (!items || items.length === 0) {
    throw new Error("At least one ticket item is required");
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Check idempotency if key provided
    if (idempotencyKey) {
      const existingOrder = await tx.order.findUnique({
        where: { idempotencyKey },
        include: { items: true },
      });
      if (existingOrder) {
        return existingOrder;
      }
    }

    // 2. Lazy release of expired reservations
    const now = new Date();
    const expiredOrders = await tx.order.findMany({
      where: {
        status: "PENDING",
        expiresAt: { lt: now },
      },
      include: { items: true },
    });

    for (const expiredOrder of expiredOrders) {
      // Mark as expired
      await tx.order.update({
        where: { id: expiredOrder.id },
        data: { status: "EXPIRED" },
      });

      // Release reserved quantities
      for (const item of expiredOrder.items) {
        await tx.ticketType.update({
          where: { id: item.ticketTypeId },
          data: {
            quantityReserved: { decrement: item.quantity },
          },
        });
      }
    }

    // 3. Verify ticket types belong to event & match currency
    let totalAmount = 0;
    const ticketTypesToUpdate: {
      id: string;
      quantity: number;
      unitPrice: number;
    }[] = [];

    for (const item of items) {
      const ticketType = await tx.ticketType.findUnique({
        where: { id: item.ticketTypeId },
      });

      if (!ticketType || ticketType.eventId !== eventId) {
        throw new Error(`Invalid ticket type: ${item.ticketTypeId}`);
      }

      if (ticketType.currency !== currency) {
        throw new Error(`Currency mismatch for ticket type ${ticketType.name}`);
      }

      const itemTotal = ticketType.priceAmount * item.quantity;
      totalAmount += itemTotal;

      ticketTypesToUpdate.push({
        id: ticketType.id,
        quantity: item.quantity,
        unitPrice: ticketType.priceAmount,
      });
    }

    // 4. Atomic conditional update to reserve tickets
    for (const item of ticketTypesToUpdate) {
      const updatedCount = await tx.$executeRaw`
        UPDATE "TicketType"
        SET "quantityReserved" = "quantityReserved" + ${item.quantity},
            "updatedAt" = NOW()
        WHERE "id" = ${item.id}
          AND ("quantitySold" + "quantityReserved" + ${item.quantity}) <= "quantityTotal"
      `;

      if (updatedCount === 0) {
        throw new Error("INSUFFICIENT_QUANTITY");
      }
    }

    // 5. Create Order & OrderItems
    const accessToken = crypto.randomBytes(16).toString("hex");
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes

    const order = await tx.order.create({
      data: {
        eventId,
        buyerName,
        buyerPhone,
        buyerEmail: buyerEmail || null,
        totalAmount,
        currency,
        status: "PENDING",
        accessToken,
        idempotencyKey: idempotencyKey || null,
        expiresAt,
        items: {
          create: ticketTypesToUpdate.map((t) => ({
            ticketTypeId: t.id,
            quantity: t.quantity,
            unitPrice: t.unitPrice,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return order;
  });
}
