import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateCode } from "@/lib/codegen";
import { writeAudit } from "@/lib/services/audit.service";
import { decToNumber, fmtTHB } from "@/lib/money";
import { ROOM_STATUS, ROOM_STATUS_BADGE } from "@/lib/labels";
import { ApiError } from "@/lib/api/response";
import type { BadgeKind } from "@/lib/theme";
import type { Session } from "@/lib/auth/session";
import type { RoomDTO } from "@/lib/api-types";
import type { RoomCreateInput, RoomUpdateInput } from "@/lib/validation/room.schema";

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
  const size = r.roomSize == null ? "" : String(decToNumber(r.roomSize));
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
    propertyId: r.propertyId,
    ownerId: r.ownerId,
    floor: r.floor ?? "",
    roomType: r.roomType ?? "",
    roomSize: size,
    rentValue: decToNumber(r.defaultRentPrice),
    depositValue: decToNumber(r.defaultDeposit),
    cleaningValue: decToNumber(r.defaultCleaningFee),
    commissionValue: decToNumber(r.defaultCommission),
    statusValue: r.status,
    note: r.note ?? "",
    imageUrl: r.imageUrl,
  };
}

export async function listRooms(): Promise<RoomDTO[]> {
  const rooms = await prisma.room.findMany({ orderBy: { id: "asc" }, include: INCLUDE });
  return rooms.map(toDTO);
}

/** Confirm the selected property + owner exist before writing a room. */
async function assertRefs(propertyId: number, ownerId: number) {
  const [property, owner] = await Promise.all([
    prisma.property.findUnique({ where: { id: propertyId } }),
    prisma.owner.findUnique({ where: { id: ownerId } }),
  ]);
  if (!property) throw new ApiError("PROPERTY_NOT_FOUND", "ไม่พบอาคาร/โครงการที่เลือก", 400);
  if (!owner) throw new ApiError("OWNER_NOT_FOUND", "ไม่พบเจ้าของที่เลือก", 400);
}

function writeData(input: RoomCreateInput) {
  return {
    propertyId: input.propertyId,
    ownerId: input.ownerId,
    roomNumber: input.roomNumber,
    floor: input.floor || null,
    roomType: input.roomType || null,
    roomSize: input.roomSize,
    defaultRentPrice: input.defaultRentPrice,
    defaultDeposit: input.defaultDeposit,
    defaultCleaningFee: input.defaultCleaningFee,
    defaultCommission: input.defaultCommission,
    status: input.status,
    imageUrl: input.imageUrl,
    note: input.note || null,
  } satisfies Prisma.RoomUncheckedUpdateInput;
}

export async function createRoom(input: RoomCreateInput, session: Session): Promise<number> {
  await assertRefs(input.propertyId, input.ownerId);
  const roomCode = await generateCode("ROOM", "RM");
  const created = await prisma.room.create({ data: { roomCode, ...writeData(input) } });
  await writeAudit({ userId: session.userId, action: "CREATE", tableName: "rooms", recordId: created.id, newValue: input });
  return created.id;
}

/**
 * Merge-patch a room: only keys present in `input` are written; absent keys keep
 * their current value. Both the full edit form (all keys present) and a lightweight
 * patch (e.g. only `imageUrl`) go through here — the update schema carries NO field
 * defaults, so absence is meaningful. Each FK is validated only when it is being changed.
 */
export async function patchRoom(id: number, input: RoomUpdateInput, session: Session): Promise<number> {
  const existing = await prisma.room.findUnique({ where: { id } });
  if (!existing) throw new ApiError("NOT_FOUND", "ไม่พบห้องนี้", 404);
  if (input.propertyId != null) {
    const property = await prisma.property.findUnique({ where: { id: input.propertyId } });
    if (!property) throw new ApiError("PROPERTY_NOT_FOUND", "ไม่พบอาคาร/โครงการที่เลือก", 400);
  }
  if (input.ownerId != null) {
    const owner = await prisma.owner.findUnique({ where: { id: input.ownerId } });
    if (!owner) throw new ApiError("OWNER_NOT_FOUND", "ไม่พบเจ้าของที่เลือก", 400);
  }
  const data: Prisma.RoomUncheckedUpdateInput = {};
  if (input.propertyId != null) data.propertyId = input.propertyId;
  if (input.ownerId != null) data.ownerId = input.ownerId;
  if (input.roomNumber != null) data.roomNumber = input.roomNumber;
  if (input.floor != null) data.floor = input.floor || null;
  if (input.roomType != null) data.roomType = input.roomType || null;
  if (input.roomSize !== undefined) data.roomSize = input.roomSize;
  if (input.defaultRentPrice != null) data.defaultRentPrice = input.defaultRentPrice;
  if (input.defaultDeposit != null) data.defaultDeposit = input.defaultDeposit;
  if (input.defaultCleaningFee != null) data.defaultCleaningFee = input.defaultCleaningFee;
  if (input.defaultCommission != null) data.defaultCommission = input.defaultCommission;
  if (input.status != null) data.status = input.status;
  if (input.imageUrl !== undefined) data.imageUrl = input.imageUrl;
  if (input.note != null) data.note = input.note || null;
  await prisma.room.update({ where: { id }, data });
  await writeAudit({ userId: session.userId, action: "UPDATE", tableName: "rooms", recordId: id, oldValue: existing, newValue: input });
  return id;
}

export async function deleteRoom(id: number, session: Session): Promise<boolean> {
  const [contracts, incomes, expenses] = await Promise.all([
    prisma.rentalContract.count({ where: { roomId: id } }),
    prisma.incomeTransaction.count({ where: { roomId: id } }),
    prisma.expenseTransaction.count({ where: { roomId: id } }),
  ]);
  if (contracts > 0) throw new ApiError("HAS_DEPENDENTS", `ลบไม่ได้ — ห้องนี้มีรายการเช่าผูกอยู่ ${contracts} รายการ`, 409);
  if (incomes > 0 || expenses > 0) throw new ApiError("HAS_DEPENDENTS", "ลบไม่ได้ — ห้องนี้มีรายรับ/รายจ่ายผูกอยู่", 409);
  await prisma.room.delete({ where: { id } });
  await writeAudit({ userId: session.userId, action: "DELETE", tableName: "rooms", recordId: id });
  return true;
}
