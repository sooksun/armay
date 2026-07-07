import type { Prisma, PropertyType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateCode } from "@/lib/codegen";
import { writeAudit } from "@/lib/services/audit.service";
import { decToNumber } from "@/lib/money";
import { PROPERTY_TYPE, ROOM_STATUS, ROOM_STATUS_BADGE } from "@/lib/labels";
import { ApiError } from "@/lib/api/response";
import type { Session } from "@/lib/auth/session";
import type { PropertyDTO } from "@/lib/api-types";
import type { PropertyCreateInput, PropertyUpdateInput } from "@/lib/validation/property.schema";

const TYPE_ENUM: Record<string, PropertyType> = {
  "คอนโด": "CONDO",
  "แฟลต": "APARTMENT",
  "บ้านพัก": "HOUSE",
  "ทาวน์เฮาส์": "TOWNHOUSE",
  "อาคารพาณิชย์": "COMMERCIAL",
  "หอพัก": "DORMITORY",
  "อื่นๆ": "OTHER",
};

const INCLUDE = {
  rooms: { select: { roomNumber: true, status: true } },
  incomes: { select: { amount: true } },
  expenses: { select: { amount: true } },
} satisfies Prisma.PropertyInclude;

type PropertyWithRelations = Prisma.PropertyGetPayload<{ include: typeof INCLUDE }>;

function toDTO(p: PropertyWithRelations): PropertyDTO {
  return {
    id: p.id,
    propertyCode: p.propertyCode,
    propertyName: p.propertyName,
    propertyType: PROPERTY_TYPE[p.propertyType] ?? p.propertyType,
    address: p.address ?? "",
    province: p.province ?? "",
    district: p.district ?? "",
    subdistrict: p.subdistrict ?? "",
    latitude: p.latitude?.toString() ?? "",
    longitude: p.longitude?.toString() ?? "",
    contactName: p.contactName ?? "",
    contactPhone: p.contactPhone ?? "",
    note: p.note ?? "",
    imageUrl: p.imageUrl,
    status: p.status,
    monthlyIncome: p.incomes.reduce((s, i) => s + decToNumber(i.amount), 0),
    totalExpense: p.expenses.reduce((s, e) => s + decToNumber(e.amount), 0),
    roomCount: p.rooms.length,
    occupied: p.rooms.filter((r) => r.status === "OCCUPIED").length,
    vacant: p.rooms.filter((r) => r.status === "AVAILABLE").length,
    rooms: p.rooms.map((r) => ({
      no: r.roomNumber,
      building: p.propertyName,
      status: ROOM_STATUS[r.status] ?? r.status,
      badge: ROOM_STATUS_BADGE[r.status] ?? "gray",
    })),
  };
}

export async function listProperties(): Promise<PropertyDTO[]> {
  const properties = await prisma.property.findMany({ orderBy: { id: "asc" }, include: INCLUDE });
  return properties.map(toDTO);
}

export async function createProperty(input: PropertyCreateInput, session: Session): Promise<number> {
  const propertyCode = await generateCode("PROPERTY", "PPT");
  const created = await prisma.property.create({
    data: {
      propertyCode,
      propertyName: input.propertyName,
      propertyType: TYPE_ENUM[input.propertyType],
      address: input.address,
      province: input.province,
      district: input.district,
      subdistrict: input.subdistrict,
      latitude: input.latitude ? input.latitude : null,
      longitude: input.longitude ? input.longitude : null,
      contactName: input.contactName,
      contactPhone: input.contactPhone,
      note: input.note,
      imageUrl: input.imageUrl,
      status: input.status,
    },
  });
  await writeAudit({ userId: session.userId, action: "CREATE", tableName: "properties", recordId: created.id, newValue: input });
  return created.id;
}

export async function updateProperty(id: number, input: PropertyUpdateInput, session: Session): Promise<number> {
  const existing = await prisma.property.findUnique({ where: { id } });
  if (!existing) throw new ApiError("NOT_FOUND", "ไม่พบอาคารนี้", 404);
  const data: Prisma.PropertyUncheckedUpdateInput = {};
  if (input.propertyName !== undefined) data.propertyName = input.propertyName;
  if (input.propertyType !== undefined) data.propertyType = TYPE_ENUM[input.propertyType];
  if (input.address !== undefined) data.address = input.address;
  if (input.province !== undefined) data.province = input.province;
  if (input.district !== undefined) data.district = input.district;
  if (input.subdistrict !== undefined) data.subdistrict = input.subdistrict;
  if (input.latitude !== undefined) data.latitude = input.latitude ? input.latitude : null;
  if (input.longitude !== undefined) data.longitude = input.longitude ? input.longitude : null;
  if (input.contactName !== undefined) data.contactName = input.contactName;
  if (input.contactPhone !== undefined) data.contactPhone = input.contactPhone;
  if (input.note !== undefined) data.note = input.note;
  if (input.imageUrl !== undefined) data.imageUrl = input.imageUrl;
  if (input.status !== undefined) data.status = input.status;
  await prisma.property.update({ where: { id }, data });
  await writeAudit({ userId: session.userId, action: "UPDATE", tableName: "properties", recordId: id, oldValue: existing, newValue: input });
  return id;
}

export async function deleteProperty(id: number, session: Session): Promise<boolean> {
  const roomCount = await prisma.room.count({ where: { propertyId: id } });
  if (roomCount > 0) throw new ApiError("HAS_DEPENDENTS", `ลบไม่ได้ — อาคารนี้ยังมีห้องอยู่ ${roomCount} ห้อง`, 409);
  await prisma.property.delete({ where: { id } });
  await writeAudit({ userId: session.userId, action: "DELETE", tableName: "properties", recordId: id });
  return true;
}
