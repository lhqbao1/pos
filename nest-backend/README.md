# Nest Backend (Local)

Backend NestJS + Prisma (SQLite) cho dự án POS local.

## Tech

- NestJS 11
- Prisma 6 (engine binary)
- SQLite (`prisma/dev.db`)

## Run local

1. Cài dependencies:

```bash
npm install
```

2. Tạo DB theo migration:

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
```

3. Chạy backend:

```bash
npm run start:dev
```

Mặc định server chạy ở `http://localhost:3002`.

## Quick check

```bash
curl http://localhost:3002/health
curl http://localhost:3002/api/categories
```

## API base

- `GET/POST /api/categories`
- `GET/PUT/PATCH/DELETE /api/categories/:documentId`
- `GET/POST /api/dishes`
- `GET/PUT/PATCH/DELETE /api/dishes/:documentId`
- `GET/POST /api/tables`
- `GET/PUT/PATCH/DELETE /api/tables/:documentId`
- `GET/POST /api/orders`
- `GET/PUT/PATCH/DELETE /api/orders/:documentId`
- `GET/POST /api/order-items`
- `GET/PUT/PATCH/DELETE /api/order-items/:documentId`
- `GET/POST /api/payments`
- `GET/PUT/PATCH/DELETE /api/payments/:documentId`

Response format theo chuẩn API hiện tại của frontend:

- List: `{ data: [...], meta: { total } }`
- Item: `{ data: {...} }`
