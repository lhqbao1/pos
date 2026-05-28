# POS Project

Project gồm 2 phần chính:

- `.`: Next.js frontend (repo hiện tại)
- `./nest-backend`: NestJS + Prisma + SQLite backend chạy local

## Chạy local

### 1) Chạy backend (NestJS)

```bash
cd /Users/bao/websites/pos/nest-backend
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run start:dev
```

Backend mặc định chạy tại `http://localhost:3002`.

### 2) Chạy frontend (Next.js)

```bash
cd /Users/bao/websites/pos
npm install
npm run dev
```

Frontend dùng các API nội bộ `app/api/*`, và các route này proxy sang backend NestJS local.

## Biến môi trường frontend

Tạo `.env.local` từ `.env.local.example`:

```env
NEST_API_URL=http://localhost:3002
NEXT_PUBLIC_NEST_API_URL=http://localhost:3002
NEXT_PUBLIC_API_BASE_URL=http://localhost:3002
# Optional: NEXT_PUBLIC_MEDIA_BASE_URL=https://your-media-host.com
```

## Import món ăn

Xem hướng dẫn tại [docs/dishes-import.md](./docs/dishes-import.md).
