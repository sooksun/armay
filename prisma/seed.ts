import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // wipe (children -> parents) for a clean, idempotent dev seed
  await prisma.auditLog.deleteMany();
  await prisma.payoutItem.deleteMany();
  await prisma.ownerPayout.deleteMany();
  await prisma.incomeTransaction.deleteMany();
  await prisma.expenseTransaction.deleteMany();
  await prisma.rentalContract.deleteMany();
  await prisma.room.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.property.deleteMany();
  await prisma.owner.deleteMany();
  await prisma.paymentAccount.deleteMany();
  await prisma.user.deleteMany();
  await prisma.codeSequence.deleteMany();

  // ---------- users ----------
  const hash = (pw: string) => bcrypt.hashSync(pw, 10);
  await prisma.user.createMany({
    data: [
      { email: "admin@armay.local", passwordHash: hash("owner123!"), fullName: "นายหน้า แอดมิน", role: "ADMIN", status: "ACTIVE" },
      { email: "somying@armay.local", passwordHash: hash("staff123!"), fullName: "คุณสมหญิง ผู้ช่วย", role: "STAFF", status: "ACTIVE" },
      { email: "wichai@armay.local", passwordHash: hash("staff123!"), fullName: "คุณวิชัย บันทึกข้อมูล", role: "STAFF", status: "ACTIVE" },
      { email: "viewer@armay.local", passwordHash: hash("view123!"), fullName: "คุณเจ้าของ ดูรายงาน", role: "VIEWER", status: "ACTIVE" },
    ],
  });

  // ---------- owners ----------
  const ownerData = [
    { ownerCode: "OWN-0001", fullName: "คุณสมชาย วัฒนโสภณ", phone: "081-111-2222", email: "somchai.w@email.com", lineId: "somchai_w", bankName: "KBank", bankAccountNumber: "123-4-56789", bankAccountName: "สมชาย วัฒนโสภณ", promptpayId: "081-111-2222" },
    { ownerCode: "OWN-0002", fullName: "คุณพิมพ์ใจ ธีรกุล", phone: "082-222-3333", email: "pimjai.t@email.com", lineId: "pimjai_t", bankName: "SCB", bankAccountNumber: "234-5-67890", bankAccountName: "พิมพ์ใจ ธีรกุล", promptpayId: "082-222-3333" },
    { ownerCode: "OWN-0003", fullName: "คุณอนุชา เดชา", phone: "083-333-4444", email: "anucha.d@email.com", lineId: "anucha_d", bankName: "BBL", bankAccountNumber: "345-6-78901", bankAccountName: "อนุชา เดชา", promptpayId: "083-333-4444" },
    { ownerCode: "OWN-0004", fullName: "คุณวีระ สุขสันต์", phone: "084-444-5555", email: "weera.s@email.com", lineId: "weera_s", bankName: "KTB", bankAccountNumber: "456-7-89012", bankAccountName: "วีระ สุขสันต์", promptpayId: "084-444-5555" },
  ];
  for (const o of ownerData) await prisma.owner.create({ data: o });
  const owners = await prisma.owner.findMany();
  const ownerId = (name: string) => owners.find((o) => o.fullName === name)!.id;

  // ---------- properties ----------
  const propData = [
    { propertyCode: "PPT-0001", propertyName: "เดอะ เครสท์", propertyType: "CONDO" as const, address: "88 ถ.สุขุมวิท", province: "กรุงเทพมหานคร", district: "วัฒนา", subdistrict: "คลองตันเหนือ", latitude: "13.7398000", longitude: "100.5804000", contactName: "ฝ่ายนิติบุคคล เดอะ เครสท์", contactPhone: "02-111-2222" },
    { propertyCode: "PPT-0002", propertyName: "บ้านสวน พัทยา", propertyType: "HOUSE" as const, address: "12 หมู่ 4", province: "ชลบุรี", district: "บางละมุง", subdistrict: "หนองปรือ", latitude: "12.9276000", longitude: "100.8770000", contactName: "คุณอนุชา เดชา", contactPhone: "083-333-4444" },
    { propertyCode: "PPT-0003", propertyName: "แฟลตรุ่งเรือง", propertyType: "APARTMENT" as const, address: "23 ถ.รุ่งเรือง", province: "กรุงเทพมหานคร", district: "บางกะปิ", subdistrict: "คลองจั่น", latitude: "13.7659000", longitude: "100.6434000", contactName: "คุณวีระ สุขสันต์", contactPhone: "084-444-5555" },
    { propertyCode: "PPT-0004", propertyName: "ศุภาลัย เรส", propertyType: "CONDO" as const, address: "56 ถ.ศรีนครินทร์", province: "กรุงเทพมหานคร", district: "สวนหลวง", subdistrict: "สวนหลวง", latitude: "13.7255000", longitude: "100.6465000", contactName: "ฝ่ายนิติบุคคล ศุภาลัย", contactPhone: "02-222-3333" },
  ];
  for (const p of propData) await prisma.property.create({ data: p });
  const props = await prisma.property.findMany();
  const propId = (name: string) => props.find((p) => p.propertyName === name)!.id;

  // ---------- rooms ----------
  const roomData = [
    ["ROOM-0001", "A-1105", "เดอะ เครสท์", "คุณสมชาย วัฒนโสภณ", "OCCUPIED", 12500],
    ["ROOM-0002", "A-1204", "เดอะ เครสท์", "คุณสมชาย วัฒนโสภณ", "OCCUPIED", 14000],
    ["ROOM-0003", "A-902", "เดอะ เครสท์", "คุณพิมพ์ใจ ธีรกุล", "OCCUPIED", 12500],
    ["ROOM-0004", "B-802", "บ้านสวน พัทยา", "คุณอนุชา เดชา", "OCCUPIED", 16000],
    ["ROOM-0005", "B-1105", "บ้านสวน พัทยา", "คุณอนุชา เดชา", "OCCUPIED", 16000],
    ["ROOM-0006", "B-410", "ศุภาลัย เรส", "คุณพิมพ์ใจ ธีรกุล", "AVAILABLE", 9800],
    ["ROOM-0007", "C-305", "แฟลตรุ่งเรือง", "คุณวีระ สุขสันต์", "OCCUPIED", 7500],
    ["ROOM-0008", "C-208", "แฟลตรุ่งเรือง", "คุณวีระ สุขสันต์", "MAINTENANCE", 7500],
    ["ROOM-0009", "A-701", "เดอะ เครสท์", "คุณพิมพ์ใจ ธีรกุล", "AVAILABLE", 12500],
  ] as const;
  for (const [code, no, building, owner, status, rent] of roomData) {
    await prisma.room.create({
      data: {
        roomCode: code,
        roomNumber: no,
        propertyId: propId(building),
        ownerId: ownerId(owner),
        status: status,
        roomType: "สตูดิโอ 28 ตร.ม.",
        defaultRentPrice: rent,
        defaultDeposit: 24000,
        defaultCleaningFee: 800,
        defaultCommission: rent * 0.1,
      },
    });
  }
  const rooms = await prisma.room.findMany();
  const room = (no: string) => rooms.find((r) => r.roomNumber === no)!;

  // ---------- tenants ----------
  const tenantData = [
    { tenantCode: "TNT-0001", fullName: "คุณกิตติพงษ์ ใจดี", phone: "081-234-5678", email: "kitti@email.com", idCardOrPassport: "1-2345-67890-12-3", nationality: "ไทย" },
    { tenantCode: "TNT-0002", fullName: "คุณศิริพร มงคล", phone: "082-345-6789", email: "siriporn@email.com", idCardOrPassport: "1-3456-78901-23-4", nationality: "ไทย" },
    { tenantCode: "TNT-0003", fullName: "คุณมณีรัตน์ ทองดี", phone: "083-456-7890", email: "maneerat@email.com", idCardOrPassport: "1-4567-89012-34-5", nationality: "ไทย" },
    { tenantCode: "TNT-0004", fullName: "คุณสุดา แสงทอง", phone: "084-567-8901", email: "suda@email.com", idCardOrPassport: "1-5678-90123-45-6", nationality: "ไทย", blacklist: true, note: "ค้างชำระเกิน 15 วัน" },
    { tenantCode: "TNT-0005", fullName: "คุณธนา รุ่งเรือง", phone: "085-678-9012", email: "thana@email.com", idCardOrPassport: "1-6789-01234-56-7", nationality: "ไทย" },
    { tenantCode: "TNT-0006", fullName: "คุณสมพงษ์ เจริญสุข", phone: "086-789-0123", email: "sompong@email.com", idCardOrPassport: "1-7890-12345-67-8", nationality: "ไทย" },
    { tenantCode: "TNT-0007", fullName: "คุณกาญจนา ศรีสุข", phone: "087-890-1234", email: "kanjana@email.com", idCardOrPassport: "1-8901-23456-78-9", nationality: "ไทย" },
  ];
  for (const t of tenantData) await prisma.tenant.create({ data: t });
  const tenants = await prisma.tenant.findMany();
  const tenantId = (name: string) => tenants.find((t) => t.fullName === name)!.id;

  // ---------- payment accounts ----------
  await prisma.paymentAccount.createMany({
    data: [
      { accountName: "บัญชีรับเงินผู้เช่า", bankName: "KBank", accountNumber: "123-4-56789", accountHolderName: "บจ. คริสตัล เลดเจอร์", promptpayId: "088-123-4567", accountType: "RECEIVE_TENANT" },
      { accountName: "บัญชีจ่ายเจ้าของ", bankName: "KBank", accountNumber: "123-4-56789", accountHolderName: "บจ. คริสตัล เลดเจอร์", accountType: "PAY_OWNER" },
      { accountName: "PromptPay ธุรกิจ", accountHolderName: "บจ. คริสตัล เลดเจอร์", promptpayId: "088-123-4567", accountType: "RECEIVE_TENANT" },
      { accountName: "เงินสดสำนักงาน", accountType: "CASH" },
    ],
  });
  const accounts = await prisma.paymentAccount.findMany();
  const recvAccId = accounts.find((a) => a.accountType === "RECEIVE_TENANT")!.id;

  // ---------- contracts ----------
  const admin = (await prisma.user.findFirst({ where: { role: "ADMIN" } }))!;
  const d = (s: string) => new Date(s + "T00:00:00Z");

  async function contract(code: string, tenant: string, roomNo: string, start: string, end: string, rent: number, status: "PAID" | "UNPAID" | "OVERDUE" | "PARTIAL") {
    const r = room(roomNo);
    const total = rent + 24000 + 800;
    return prisma.rentalContract.create({
      data: {
        contractCode: code,
        tenantId: tenantId(tenant),
        roomId: r.id,
        ownerId: r.ownerId,
        propertyId: r.propertyId,
        startDate: d(start),
        endDate: d(end),
        rentAmount: rent,
        depositAmount: 24000,
        cleaningFee: 800,
        totalAmount: total,
        rentalStatus: "CHECKED_IN",
        paymentStatus: status,
      },
    });
  }
  const c1 = await contract("RN-2568-0142", "คุณกิตติพงษ์ ใจดี", "A-1105", "2025-07-01", "2025-07-31", 12500, "PAID");
  const c2 = await contract("RN-2568-0141", "คุณศิริพร มงคล", "A-1204", "2025-07-01", "2025-12-31", 14000, "PAID");
  const c3 = await contract("RN-2568-0138", "คุณสุดา แสงทอง", "C-305", "2025-06-20", "2025-07-19", 7500, "OVERDUE");

  // ---------- incomes ----------
  await prisma.incomeTransaction.create({
    data: { incomeCode: "INC-2568-0001", contractId: c1.id, tenantId: c1.tenantId, roomId: c1.roomId, ownerId: c1.ownerId, propertyId: c1.propertyId, incomeDate: d("2025-07-06"), incomeType: "RENT", amount: 12500, paymentMethod: "PROMPTPAY", receivingAccountId: recvAccId, transactionReference: "TXN0706-001", verificationStatus: "VERIFIED", recordedBy: admin.id, approvedBy: admin.id, approvedAt: new Date() },
  });
  await prisma.incomeTransaction.create({
    data: { incomeCode: "INC-2568-0002", contractId: c2.id, tenantId: c2.tenantId, roomId: c2.roomId, ownerId: c2.ownerId, propertyId: c2.propertyId, incomeDate: d("2025-07-06"), incomeType: "RENT", amount: 14000, paymentMethod: "BANK_TRANSFER", receivingAccountId: recvAccId, transactionReference: "TXN0706-002", verificationStatus: "VERIFIED", recordedBy: admin.id, approvedBy: admin.id, approvedAt: new Date() },
  });

  // ---------- expenses ----------
  await prisma.expenseTransaction.create({
    data: { expenseCode: "EXP-2568-0091", expenseDate: d("2025-07-06"), roomId: room("A-1105").id, ownerId: room("A-1105").ownerId, propertyId: room("A-1105").propertyId, expenseType: "REPAIR", description: "เปลี่ยนก๊อกน้ำห้องน้ำ", payeeName: "คุณช่างเอก", amount: 1300, paymentMethod: "CASH", responsibilityType: "OWNER", verificationStatus: "VERIFIED", recordedBy: admin.id },
  });
  await prisma.expenseTransaction.create({
    data: { expenseCode: "EXP-2568-0088", expenseDate: d("2025-07-05"), roomId: room("C-208").id, ownerId: room("C-208").ownerId, propertyId: room("C-208").propertyId, expenseType: "REPAIR", description: "รีโนเวทห้องน้ำ", payeeName: "คุณช่างสมพร", amount: 8400, paymentMethod: "BANK_TRANSFER", responsibilityType: "OWNER", verificationStatus: "PENDING", recordedBy: admin.id },
  });

  // ---------- payout (with breakdown items) ----------
  const payout = await prisma.ownerPayout.create({
    data: {
      payoutCode: "PO-2568-0001",
      ownerId: ownerId("คุณสมชาย วัฒนโสภณ"),
      roomId: room("A-1105").id,
      propertyId: room("A-1105").propertyId,
      contractId: c1.id,
      payoutDate: d("2025-07-06"),
      grossIncomeAmount: 12500,
      deductionAmount: 3365,
      netPayoutAmount: 9135,
      payoutStatus: "PENDING",
      verificationStatus: "PENDING",
    },
  });
  await prisma.payoutItem.createMany({
    data: [
      { payoutId: payout.id, sourceType: "INCOME", sourceId: null, label: "รายรับรวมของห้อง A-1105", amount: 12500 },
      { payoutId: payout.id, sourceType: "COMMISSION", sourceId: null, label: "หัก ค่านายหน้า (10%)", amount: -1250 },
      { payoutId: payout.id, sourceType: "EXPENSE", sourceId: null, label: "หัก ค่าซ่อมก๊อกน้ำ", amount: -1300 },
      { payoutId: payout.id, sourceType: "EXPENSE", sourceId: 999, label: "หัก ค่าแม่บ้าน", amount: -800 },
      { payoutId: payout.id, sourceType: "OTHER", sourceId: null, label: "หัก ค่าธรรมเนียมโอน", amount: -15 },
    ],
  });

  // ---------- code sequences (so codegen continues correctly) ----------
  await prisma.codeSequence.createMany({
    data: [
      { entity: "OWNER", period: "", lastNo: 4 },
      { entity: "PROPERTY", period: "", lastNo: 4 },
      { entity: "ROOM", period: "", lastNo: 9 },
      { entity: "TENANT", period: "", lastNo: 7 },
    ],
  });

  const counts = {
    users: await prisma.user.count(),
    owners: await prisma.owner.count(),
    properties: await prisma.property.count(),
    rooms: await prisma.room.count(),
    tenants: await prisma.tenant.count(),
    accounts: await prisma.paymentAccount.count(),
    contracts: await prisma.rentalContract.count(),
    incomes: await prisma.incomeTransaction.count(),
    expenses: await prisma.expenseTransaction.count(),
    payouts: await prisma.ownerPayout.count(),
  };
  console.log("Seeded:", counts);
  console.log("Admin login: admin@armay.local / owner123!");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
