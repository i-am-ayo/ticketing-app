# ticketing-app

Online ticketing platform for Zimbabwe. See [SPEC.md](./SPEC.md) for the full product and technical specification.

This is a [Next.js](https://nextjs.org) (App Router) project with TypeScript, Tailwind CSS, and Prisma (PostgreSQL).

## Prerequisites

- Node.js 20.19+ (22.x recommended)
- npm
- A PostgreSQL database (local, Neon, or Supabase) — needed from Stage 2 onward for schema/migrate; Stage 1 only needs `prisma generate`, which works without a live database

## Getting started

1. Install dependencies:

```bash
npm install
```

`postinstall` runs `prisma generate` automatically.

2. Copy the example env file and fill in values locally (do not commit `.env`):

```bash
cp .env.example .env
```

On Windows (PowerShell):

```powershell
Copy-Item .env.example .env
```

3. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

You can edit `src/app/page.tsx`; the page updates as you save.

## Scripts

| Command                | Description                                     |
| ---------------------- | ----------------------------------------------- |
| `npm run dev`          | Start Next.js in development mode               |
| `npm run build`        | Generate Prisma Client and build for production |
| `npm run start`        | Start the production server                     |
| `npm run lint`         | Run ESLint                                      |
| `npm run format`       | Format files with Prettier                      |
| `npm run format:check` | Check Prettier formatting                       |
| `npx prisma generate`  | Regenerate Prisma Client (no live DB required)  |

## Learn more

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma ORM docs](https://www.prisma.io/docs)
- [Learn Next.js](https://nextjs.org/learn)

## Deploy on Vercel

The app is intended to deploy on [Vercel](https://vercel.com) with managed Postgres. See the [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying).
