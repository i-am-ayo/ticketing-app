-- Integrity rules. Prisma schema syntax cannot express CHECK constraints.
ALTER TABLE "Order" ADD CONSTRAINT "Order_totalAmount_nonnegative" CHECK ("totalAmount" >= 0);
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_quantity_positive" CHECK ("quantity" > 0);
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_unitPrice_nonnegative" CHECK ("unitPrice" >= 0);
ALTER TABLE "TicketType" ADD CONSTRAINT "TicketType_priceAmount_nonnegative" CHECK ("priceAmount" >= 0);