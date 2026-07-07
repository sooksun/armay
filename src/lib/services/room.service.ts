import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { decToNumber, fmtTHB } from "@/lib/money";
import { ROOM_STATUS, ROOM_STATUS_BADGE } from "@/lib/labels";
import type { BadgeKind } from "@/lib/theme";
import type { RoomDTO } from "@/lib/api-types";

const STATUS_COLOR: Record<BadgeKind, string> = {
  green: "#34D399",
  blue: "#38BDF8",
  orange: "#FB923C",
  gold: "#FBBF24",
  red: "#FB7185",
  gray: "#94A3B8",
  purple: "#A855F7",
};

const INCLUDE = {
  property: true,
  owner: true,
  contracts: { include: { tenant: true }, where: { rentalStatus: { in: ["BOOKED", "CHECKED_IN"] } }, orderBy: { startDate: "desc" } },
  incomes: { select: { amount: true } },
  expenses: { select: { amount: true } },
} satisfies Prisma.RoomInclude;

type RoomWithRelations = Prisma.RoomGetPayload<{ include: typeof INCLUDE }>;

function tenantLine(r: RoomWithRelations): string {
  const active = r.contracts[0];
  if (active) return `ผู้เช่า: ${active.tenant.fullName}`;
  if (r.status === "AVAILABLE") return "ห้องว่าง · พร้อมปล่อยเช่า";
  if (r.status === "MAINTENANCE") return "กำลังปรับปรุง";
  return "—";
}

function toDTO(r: RoomWithRelations): RoomDTO {
  const badge = ROOM_STATUS_BADGE[r.status] ?? "gray";
  return {
    id: r.id,
    roomCode: r.roomCode,
    no: r.roomNumber,
    building: r.property.propertyName,
    owner: r.owner.fullName,
    status: ROOM_STATUS[r.status] ?? r.status,
    badge,
    statusColor: STATUS_COLOR[badge],
    income: fmtTHB(r.incomes.reduce((s, i) => s + decToNumber(i.amount), 0)),
    expense: fmtTHB(r.expenses.reduce((s, e) => s + decToNumber(e.amount), 0)),
    rent: fmtTHB(decToNumber(r.defaultRentPrice)),
    tenantLine: tenantLine(r),
  };
}

export async function listRooms(): Promise<RoomDTO[]> {
  const rooms = await prisma.room.findMany({ orderBy: { id: "asc" }, include: INCLUDE });
  return rooms.map(toDTO);
}
