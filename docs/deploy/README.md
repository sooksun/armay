# Deploy — Docker บน Linux server

ระบบ **armay** เป็น Next.js 16 full-stack service เดียว (API + web อยู่ในตัวเดียวกัน)
รันหลัง **nginx-proxy-manager (NPM)** และต่อ **MariaDB ภายนอก** บน LAN ของเซิร์ฟเวอร์

| หัวข้อ | ค่า |
|---|---|
| Deploy path | `/DATA/AppData/www/armay` |
| Host port (LAN เท่านั้น) | `9960` → container `3000` |
| Database | `mysql://root:<pw>@192.168.1.4:3306/armay` |
| Attachments volume | `./uploads` → `/app/uploads` |
| Reverse proxy | nginx-proxy-manager (นอก compose) |

> **ห้าม** เพิ่ม service `db`/`nginx` ใน compose — ชนกับ MariaDB (`:3306`) และ NPM (`:80/:443`) ที่รันบนโฮสต์อยู่แล้ว
> **ห้าม** port-forward `9960` ที่ router — เปิดแค่ `80/443` ให้ NPM; เข้าถึง `9960` ผ่าน LAN IP เท่านั้น

---

## 1. เตรียมฐานข้อมูล (ครั้งเดียว)

MariaDB ต้อง bind `0.0.0.0:3306` และมี database `armay` อยู่ก่อน (Prisma สร้างแค่ตาราง ไม่สร้าง DB):

```sql
CREATE DATABASE IF NOT EXISTS armay CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

ตรวจว่า container ต่อ DB ได้ (จาก LAN IP `192.168.1.4`) — root ต้องมีสิทธิ์เข้าจาก host ของ container

## 2. วางโค้ด + ตั้งค่า env

```bash
sudo mkdir -p /DATA/AppData/www/armay
cd /DATA/AppData/www/armay
git clone https://github.com/sooksun/armay.git .

cp .env.production.example .env.production
# แก้ .env.production ให้เป็นค่าจริง:
#   DATABASE_URL="mysql://root:l6-lyo9N@192.168.1.4:3306/armay"
#   JWT_SECRET=$(openssl rand -base64 48)
#   UPLOAD_DIR="/app/uploads"
```

`.env.production` ถูก gitignored (มีรหัสผ่าน DB + JWT secret) — **ห้าม** commit

## 3. Build + start

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

ตอน `up` service `migrate` จะรัน `prisma migrate deploy` ให้ก่อน (จาก build image ที่มี prisma CLI + deps ครบ) แล้ว `web` ถึงจะ start เสิร์ฟที่ `:3000` (map เป็น `9960` บนโฮสต์)
ถ้า migrate ล้มเหลว (เช่น DB ต่อไม่ได้/รหัสผิด) `web` จะไม่ start — ดู log ด้วย `docker compose -f docker-compose.prod.yml logs migrate`

## 4. Seed ข้อมูลเริ่มต้น (ครั้งเดียว บน DB ว่าง)

สร้าง admin + demo data (`admin@armay.local` / `owner123!`):

```bash
docker compose -f docker-compose.prod.yml --profile seed run --rm seed
```

> **เปลี่ยนรหัส admin ทันที** หลัง login ครั้งแรก

## 5. ตั้ง NPM Proxy Host (ต่อ 1 โดเมน)

| Tab | Field | Value |
|---|---|---|
| Details | Domain Names | `<โดเมนของคุณ>` |
| Details | Forward Hostname/IP | LAN IP ของโฮสต์ (`hostname -I`) — ไม่ใช่ container name |
| Details | Forward Port | `9960` |
| Details | Block Common Exploits / Websockets | ✓ |
| Details | Custom Nginx Configuration | `client_max_body_size 25M; proxy_read_timeout 300s;` |
| SSL | SSL Certificate | Request a new SSL Certificate (Let's Encrypt) |
| SSL | Force SSL / HTTP/2 | ✓ |
| SSL | HSTS | ปิดไว้ก่อนจน HTTPS นิ่ง 24 ชม.+ |

API เป็น same-origin (`/api/...`) จึง **ไม่ต้อง** ตั้ง custom location แยกสำหรับ `/api`

---

## คำสั่งที่ใช้บ่อย

```bash
# อัปเดตเวอร์ชันใหม่
git pull && docker compose -f docker-compose.prod.yml up -d --build

# ดู log
docker compose -f docker-compose.prod.yml logs -f web

# recreate เฉพาะ web
docker compose -f docker-compose.prod.yml up -d --force-recreate web

# รัน migration เอง (ปกติ auto ตอน up อยู่แล้ว)
docker compose -f docker-compose.prod.yml run --rm migrate

# หยุด
docker compose -f docker-compose.prod.yml down
```

## Security checklist

- [ ] `.env.production` gitignored — `git check-ignore .env.production`
- [ ] `9960` ไม่ถูก port-forward ที่ router — เปิดแค่ `80/443` ให้ NPM
- [ ] รหัส admin (`owner123!`) เปลี่ยนหลัง login แรก
- [ ] `JWT_SECRET` เป็นค่าสุ่มจริง (ไม่ใช่ค่า dev)
- [ ] Backup DB นอกเครื่อง (mariadb-dump → S3/B2/เครื่องสำรอง)

## Troubleshooting

- **`P1001 can't reach database`** → เช็ก MariaDB bind `0.0.0.0:3306`, firewall, และ root เข้าจาก IP ของ container ได้; ลองใช้ `host.docker.internal` (มี `extra_hosts` ให้แล้ว) แทน `192.168.1.4` ใน `DATABASE_URL`
- **`Prisma engine ... not found / GLIBC`** → image ใช้ `node:20-bookworm-slim` (OpenSSL 3.0.x) ตรงกับ `binaryTargets = ["...","debian-openssl-3.0.x"]` ใน `prisma/schema.prisma` — ถ้าเปลี่ยน base image ต้องปรับ target ให้ตรง
- **build ช้า/ค้างที่ `apt-get tzdata`** → ไม่มีในภาพนี้ (ติดตั้งแค่ `openssl ca-certificates` แบบ noninteractive)
- **ไฟล์แนบหาย หลัง redeploy** → ตรวจว่า volume `./uploads:/app/uploads` mount อยู่
