-- CreateTable
CREATE TABLE "Category" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "documentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Dish" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "documentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sku" TEXT,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "vipPrice" INTEGER NOT NULL DEFAULT 0,
    "costPrice" INTEGER NOT NULL DEFAULT 0,
    "image" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "sold" INTEGER NOT NULL DEFAULT 0,
    "rating" REAL NOT NULL DEFAULT 0,
    "categoryId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Dish_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Table" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "documentId" TEXT NOT NULL,
    "tableNumber" TEXT NOT NULL,
    "displayName" TEXT,
    "type" TEXT NOT NULL DEFAULT 'Normal',
    "tableStatus" TEXT NOT NULL DEFAULT 'Empty',
    "capacity" INTEGER NOT NULL DEFAULT 4,
    "zone" TEXT,
    "note" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "occupiedSince" DATETIME,
    "lastClearedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Order" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "documentId" TEXT NOT NULL,
    "orderNo" TEXT,
    "tableId" INTEGER,
    "orderStatus" TEXT NOT NULL DEFAULT 'active',
    "source" TEXT NOT NULL DEFAULT 'dine_in',
    "guestCount" INTEGER NOT NULL DEFAULT 1,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "openedAt" DATETIME,
    "paidTime" DATETIME,
    "closedAt" DATETIME,
    "subtotal" INTEGER NOT NULL DEFAULT 0,
    "discountAmount" INTEGER NOT NULL DEFAULT 0,
    "taxAmount" INTEGER NOT NULL DEFAULT 0,
    "serviceCharge" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL DEFAULT 0,
    "paidAmount" INTEGER NOT NULL DEFAULT 0,
    "changeAmount" INTEGER NOT NULL DEFAULT 0,
    "cashierName" TEXT,
    "customerName" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "documentId" TEXT NOT NULL,
    "dishId" INTEGER NOT NULL,
    "orderId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "priceAtOrder" INTEGER NOT NULL,
    "lineTotal" INTEGER NOT NULL DEFAULT 0,
    "discountAmount" INTEGER NOT NULL DEFAULT 0,
    "dishNameSnapshot" TEXT,
    "dishSkuSnapshot" TEXT,
    "note" TEXT,
    "kitchenStatus" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OrderItem_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "Dish" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "documentId" TEXT NOT NULL,
    "orderId" INTEGER NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'cash',
    "status" TEXT NOT NULL DEFAULT 'success',
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "paidAt" DATETIME,
    "reference" TEXT,
    "note" TEXT,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_documentId_key" ON "Category"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_name_idx" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Dish_documentId_key" ON "Dish"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "Dish_slug_key" ON "Dish"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Dish_sku_key" ON "Dish"("sku");

-- CreateIndex
CREATE INDEX "Dish_name_idx" ON "Dish"("name");

-- CreateIndex
CREATE INDEX "Dish_categoryId_idx" ON "Dish"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Table_documentId_key" ON "Table"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "Table_tableNumber_key" ON "Table"("tableNumber");

-- CreateIndex
CREATE INDEX "Table_tableStatus_idx" ON "Table"("tableStatus");

-- CreateIndex
CREATE UNIQUE INDEX "Order_documentId_key" ON "Order"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNo_key" ON "Order"("orderNo");

-- CreateIndex
CREATE INDEX "Order_orderStatus_idx" ON "Order"("orderStatus");

-- CreateIndex
CREATE INDEX "Order_tableId_idx" ON "Order"("tableId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderItem_documentId_key" ON "OrderItem"("documentId");

-- CreateIndex
CREATE INDEX "OrderItem_dishId_idx" ON "OrderItem"("dishId");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_documentId_key" ON "Payment"("documentId");

-- CreateIndex
CREATE INDEX "Payment_orderId_idx" ON "Payment"("orderId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");
