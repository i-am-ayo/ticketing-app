import {
  EventCategory,
  EventStatus,
  type Prisma,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const CATEGORY_OPTIONS = [
  { value: "ALL", label: "All" },
  { value: EventCategory.CONCERT, label: "Concerts" },
  { value: EventCategory.PARTY, label: "Parties" },
  { value: EventCategory.COMEDY, label: "Comedy" },
  { value: EventCategory.CONFERENCE, label: "Conferences" },
  { value: EventCategory.SPORT, label: "Sport" },
] as const;

export function isValidCategory(value: string): value is EventCategory {
  return Object.values(EventCategory).includes(value as EventCategory);
}

export function normalizeEventListParams(searchParams?: {
  category?: string | string[];
  q?: string | string[];
}) {
  const query = Array.isArray(searchParams?.q)
    ? searchParams.q[0]
    : searchParams?.q;
  const categoryParam = Array.isArray(searchParams?.category)
    ? searchParams.category[0]
    : searchParams?.category;

  return {
    search: typeof query === "string" ? query.trim().slice(0, 80) : "",
    category:
      typeof categoryParam === "string" && isValidCategory(categoryParam)
        ? categoryParam
        : undefined,
  };
}

export function buildEventQueryString(
  category: string | undefined,
  search: string,
) {
  const params = new URLSearchParams();

  if (search) {
    params.set("q", search.slice(0, 80));
  }

  if (category && category !== "ALL") {
    params.set("category", category);
  }

  const query = params.toString();
  return query ? `/?${query}` : "/";
}

export async function getPublicEventList(searchParams?: {
  category?: string | string[];
  q?: string | string[];
}) {
  const { category, search } = normalizeEventListParams(searchParams);

  const where: Prisma.EventWhereInput = {
    status: EventStatus.PUBLISHED,
    endsAt: { gt: new Date() },
    ...(category ? { category } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { venue: { contains: search, mode: "insensitive" } },
            { city: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  return prisma.event.findMany({
    where,
    include: { ticketTypes: true },
    orderBy: { startsAt: "asc" },
    take: 24,
  });
}

export async function getUpcomingEvents(limit = 3) {
  return prisma.event.findMany({
    where: {
      status: EventStatus.PUBLISHED,
      endsAt: { gt: new Date() },
    },
    orderBy: { startsAt: "asc" },
    take: limit,
    include: {
      ticketTypes: {
        orderBy: { priceAmount: "asc" },
      },
    },
  });
}
