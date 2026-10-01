# Project Spec: Online Ticketing Platform (Zimbabwe)

> Read this file fully before writing any code. Follow it for every task.
> If something here conflicts with a task I give you, ask me before proceeding.

## 1. Overview

A website where people in Zimbabwe can buy tickets for shows, parties, and other events online. Organizers list events and sell tickets. Buyers pay with mobile money or card and receive QR code tickets. Door staff scan the QR codes to let people in.

**Working name:** TBD (use `ticketing-app` as a placeholder)

## 2. Users

1. **Buyer**: browses events and buys tickets. Mostly on a phone, often on a slow or expensive data connection. Should NOT need an account to buy.
2. **Organizer**: creates events, sets ticket types and prices, views sales and attendee lists, receives payouts.
3. **Door staff**: scans tickets at the venue using a basic Android phone, sometimes with poor internet.
4. **Admin** (me): manages organizers, events, fees, and refunds.

## 3. Tech Stack (do not change without asking)

- **Framework:** Next.js (App Router) with TypeScript
- **Database:** PostgreSQL (hosted on Neon or Supabase) using Prisma as the ORM
- **Styling:** Tailwind CSS
- **Hosting:** Vercel (app) + managed Postgres
- **Auth (organizers/admin/staff only):** email + password or magic link, via a well-known library (e.g. Auth.js). No login required for buyers.
- **Payments:** Paynow Zimbabwe (supports EcoCash, OneMoney, InnBucks, and cards). Keep the payment code behind an interface so another provider (e.g. Pesepay) can be added later.
- **Notifications:** SMS, WhatsApp, and email (provider TBD; abstract behind a `notify` module)
- **Testing:** Vitest (unit) and Playwright (basic end-to-end)

## 4. Core Rules

- **Mobile-first.** Design for a 360px-wide Android screen first. Pages must be light: compress and lazy-load images, avoid heavy libraries, keep JS small.
- **Low bandwidth friendly.** Test with network throttling. Show clear loading and error states.
- **Currencies:** Support USD and ZiG. Each ticket type has a price and a currency. Never use floating point for money; store amounts as integers in the smallest unit (cents).
- **No account needed to buy.** Buyer provides name, phone number, and optionally email.
- **Short checkout:** choose tickets, enter phone number, approve payment on phone, receive ticket. Keep it to as few steps as possible.
- **Tickets are retrievable by phone number** (with a one-time code sent by SMS to verify) so buyers can find lost tickets.
- **Simple language.** Plain English UI. Structure the code so Shona and Ndebele translations can be added later (use an i18n library from the start).
- All times shown in **Africa/Harare** timezone (CAT, UTC+2). Store timestamps in UTC.

## 5. Payment Flow (critical, follow exactly)

1. Buyer selects tickets and submits their details.
2. Server creates an **Order** with status `PENDING` and **reserves** the ticket quantity for a limited time (e.g. 10 minutes).
3. Server initiates a payment with Paynow (mobile-money push prompt or card redirect).
4. Buyer approves on their phone.
5. Paynow notifies our **webhook/result URL**. The server must **verify** the notification (validate the hash/signature and/or re-check status directly with Paynow's status URL). Never trust the browser or the frontend to say a payment succeeded.
6. Only after verified payment: mark the Order `PAID`, create the **Ticket** records with QR codes, and send them to the buyer.
7. If payment fails or the reservation expires, mark the Order `FAILED`/`EXPIRED` and release the reserved tickets.

Requirements:
- The webhook must be **idempotent**. If Paynow sends it twice, do not create duplicate tickets.
- Prevent **overselling**. Use database transactions/row locking when reserving tickets so two buyers cannot get the last ticket.
- Keep a **payments log** table of every payment event received, for debugging and disputes.
- Use Paynow **test mode** during development. Never put real credentials in code.

## 6. Data Model (starting point; refine as needed)

- **Organizer**: id, name, contact details, payout details, status
- **User**: id, email, password hash, role (`ADMIN`, `ORGANIZER`, `STAFF`), organizerId
- **Event**: id, organizerId, title, description, venue, city, startsAt, endsAt, imageUrl, status (`DRAFT`, `PUBLISHED`, `CANCELLED`, `ENDED`)
- **TicketType**: id, eventId, name (e.g. Early Bird, Regular, VIP), priceAmount (integer), currency (`USD`/`ZIG`), quantityTotal, quantitySold, saleStartsAt, saleEndsAt, maxPerOrder
- **Order**: id, buyerName, buyerPhone, buyerEmail, totalAmount, currency, status (`PENDING`, `PAID`, `FAILED`, `EXPIRED`, `REFUNDED`), paymentProvider, paymentReference, expiresAt, createdAt
- **OrderItem**: id, orderId, ticketTypeId, quantity, unitPrice
- **Ticket**: id, orderId, ticketTypeId, code (random, unguessable), status (`VALID`, `USED`, `CANCELLED`), usedAt, scannedBy
- **PaymentEvent**: id, orderId, provider, rawPayload, receivedAt
- **Payout**: id, organizerId, amount, currency, status, createdAt

## 7. Tickets and QR Codes

- Each ticket has a **random, unguessable code** (use a cryptographically secure generator, at least 128 bits of randomness). Never use sequential IDs in QR codes.
- QR codes encode the ticket code only (or a URL containing it). Validation always happens on the server against the database.
- First valid scan marks the ticket `USED` with a timestamp. A second scan shows "Already used" with the time of first scan.
- Tickets are shown on a web page (works on phone, can be screenshotted) and sent by SMS/WhatsApp link and email.

## 8. Scanner App (for door staff)

- A mobile web page (PWA) at `/scan`, login required (STAFF role, scoped to specific events).
- Uses the phone camera to scan QR codes. Also allows manual code entry as a fallback.
- Big, clear result screen: green = valid, red = invalid, yellow = already used.
- Should keep working on a weak connection: cache the event's ticket list for offline checking where possible and sync scan results when back online. If offline support is too complex for the first version, say so and propose an approach.

## 9. Organizer Dashboard

- Create and edit events, ticket types, and pricing
- Live view of sales per ticket type and total revenue
- Attendee list (name, phone, ticket type, checked in or not), exportable to CSV
- Payout history and balance
- **Permissions:** an organizer can only ever see and edit their own events, orders, and attendees. Enforce this on the server for every query, not just in the UI.

## 10. Fees and Payouts (initial assumptions, to be confirmed)

- Platform charges a percentage fee per ticket (configurable, default 8%) plus the payment provider's fees.
- Make the fee configurable per organizer and per event, and show a clear breakdown to the organizer.
- Payouts to organizers are processed manually by the admin at first, with a ledger in the database. Do not build automated payouts yet.

## 11. Security Requirements

- All secrets (Paynow keys, database URL, SMS keys) in environment variables. Provide a `.env.example` with placeholder values. Never commit real secrets.
- Validate and sanitize all input on the server. Use parameterized queries (the ORM handles this).
- Rate-limit ticket lookup, SMS code requests, and checkout endpoints to prevent abuse.
- Hash passwords with a modern algorithm (bcrypt or argon2).
- Role checks on every protected route and API endpoint.
- HTTPS only. Set secure cookie flags.
- Do not log full phone numbers or payment secrets in plain text application logs.

## 12. Build Order

Work on ONE stage at a time. After each stage, make sure it runs, tests pass, and commit before moving on.

1. Project setup: Next.js, TypeScript, Tailwind, Prisma, `.env.example`, lint/format config
2. Database schema and seed data (a few sample events and ticket types)
3. Public pages: home / event list, event detail (mobile-first)
4. Checkout and order creation with ticket reservation
5. Paynow integration in test mode, including webhook verification and idempotency
6. Ticket generation with QR codes and the ticket page
7. Notifications: SMS, WhatsApp, email
8. Scanner PWA
9. Organizer auth and dashboard
10. Admin tools: organizer approval, refunds, fee settings, payouts ledger
11. Performance pass, accessibility pass, security review, and deployment

## 13. Testing Expectations

- Unit tests for: price calculation, fee calculation, ticket reservation (including concurrent purchase of the last ticket), webhook idempotency, QR code validation and double-scan handling.
- At least one end-to-end test of the full purchase flow using Paynow test mode or a mock.
- Do not mark a stage complete if its tests fail.

## 14. How I Want You to Work

- Before starting a stage, briefly state your plan and any assumptions.
- Keep changes small and focused. Do not refactor unrelated code.
- Do not add new major dependencies without telling me why.
- Do not change the tech stack or data model significantly without asking me first.
- Write clear commit messages, one logical change per commit.
- If you are unsure about Paynow's API behaviour, read their official documentation rather than guessing, and tell me what you could not verify.
- Never invent API credentials or hardcode secrets. Use placeholders and tell me what I need to fill in.
- Keep a `CHANGELOG.md` or short notes of what was done and what remains.

## 15. Out of Scope for Now

- Native mobile apps
- Automated organizer payouts
- Ticket resale or transfer marketplace
- Seat maps / assigned seating
- Multi-country support beyond Zimbabwe

## 16. Open Questions (I will decide later)

- Final project name and domain
- Exact fee percentage and who pays it (buyer or organizer)
- SMS/WhatsApp provider choice
- Refund policy
- Whether to support cash/agent sales
