import { NextRequest, NextResponse } from "next/server";
import { createReservation, CreateReservationInput } from "@/lib/reservations";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateReservationInput;

    // 1. Basic validation
    if (!body.eventId) {
      return NextResponse.json(
        { error: "eventId is required" },
        { status: 400 },
      );
    }

    if (
      !body.buyerName ||
      typeof body.buyerName !== "string" ||
      !body.buyerName.trim()
    ) {
      return NextResponse.json(
        { error: "buyerName is required" },
        { status: 400 },
      );
    }

    if (
      !body.buyerPhone ||
      typeof body.buyerPhone !== "string" ||
      !body.buyerPhone.trim()
    ) {
      return NextResponse.json(
        { error: "buyerPhone is required" },
        { status: 400 },
      );
    }

    if (!body.currency || !["USD", "ZIG"].includes(body.currency)) {
      return NextResponse.json(
        { error: "Invalid or missing currency. Must be 'USD' or 'ZIG'" },
        { status: 400 },
      );
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: "At least one ticket item is required" },
        { status: 400 },
      );
    }

    for (const item of body.items) {
      if (
        !item.ticketTypeId ||
        typeof item.quantity !== "number" ||
        item.quantity <= 0
      ) {
        return NextResponse.json(
          {
            error:
              "Each item must have a valid ticketTypeId and a positive integer quantity",
          },
          { status: 400 },
        );
      }
    }

    // 2. Invoke reservation service
    const order = await createReservation({
      eventId: body.eventId,
      buyerName: body.buyerName.trim(),
      buyerPhone: body.buyerPhone.trim(),
      buyerEmail: body.buyerEmail?.trim() || undefined,
      currency: body.currency,
      items: body.items,
      idempotencyKey: body.idempotencyKey?.trim() || undefined,
    });

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (error: any) {
    if (error.message === "INSUFFICIENT_QUANTITY") {
      return NextResponse.json(
        { error: "Requested quantity is no longer available" },
        { status: 409 },
      );
    }

    if (
      error.message.startsWith("Invalid ticket type") ||
      error.message.startsWith("Currency mismatch")
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Checkout API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during checkout" },
      { status: 500 },
    );
  }
}
