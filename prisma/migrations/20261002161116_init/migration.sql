-- Retroactively add anti-oversell CHECK constraint to TicketType.
-- The first init migration (20261002160818_init) was already applied on the
-- development Neon database before this CHECK was appended to it. A fresh
-- database that runs both migrations from scratch will receive the CHECK
-- once in the init migration and then this second migration will attempt
-- to add the same constraint again -- PostgreSQL handles that safely below
-- by checking for existence first (DO NOTHING on duplicate).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_constraint
    WHERE  conname = 'TicketType_quantity_bounds'
    AND    conrelid = '"TicketType"'::regclass
  ) THEN
    ALTER TABLE "TicketType"
      ADD CONSTRAINT "TicketType_quantity_bounds"
      CHECK (
        "quantitySold" >= 0
        AND "quantityReserved" >= 0
        AND "quantitySold" + "quantityReserved" <= "quantityTotal"
      );
  END IF;
END $$;
