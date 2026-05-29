type AnyRecord = Record<string, any>;

export const unwrapPayload = <T = AnyRecord>(payload: any): T => {
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    (payload as AnyRecord).data !== undefined
  ) {
    return (payload as AnyRecord).data as T;
  }

  return payload as T;
};

export const wrapSingleResponse = <T>(data: T) => ({ data });

export const wrapListResponse = <T>(data: T[], total: number) => ({
  data,
  meta: { total },
});

const toInt = (value: string | null | undefined) => {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const toDate = (value: unknown) => {
  if (!value) return undefined;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const toLower = (value: unknown) => String(value ?? "").toLowerCase();

const createLegacyImage = (raw: unknown) => {
  if (!raw) return undefined;

  if (typeof raw === "object" && raw !== null && "url" in (raw as AnyRecord)) {
    const image = raw as AnyRecord;
    return {
      id: typeof image.id === "number" ? image.id : 0,
      name: image.name ?? "image",
      alternativeText: image.alternativeText ?? null,
      caption: image.caption ?? null,
      width: image.width ?? 0,
      height: image.height ?? 0,
      formats: image.formats ?? {},
      hash: image.hash ?? "",
      ext: image.ext ?? "",
      mime: image.mime ?? "",
      size: image.size ?? 0,
      url: image.url,
      previewUrl: image.previewUrl ?? null,
      provider: image.provider ?? "local",
      provider_metadata: image.provider_metadata ?? null,
      createdAt: image.createdAt ?? new Date().toISOString(),
      updatedAt: image.updatedAt ?? new Date().toISOString(),
    };
  }

  if (typeof raw !== "string") {
    return undefined;
  }

  return {
    id: 0,
    name: raw.split("/").pop() || "image",
    alternativeText: null,
    caption: null,
    width: 0,
    height: 0,
    formats: {},
    hash: "",
    ext: "",
    mime: "",
    size: 0,
    url: raw,
    previewUrl: null,
    provider: "local",
    provider_metadata: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

const getPagination = (searchParams: URLSearchParams) => {
  const page =
    toInt(searchParams.get("pagination[page]")) ??
    toInt(searchParams.get("page")) ??
    1;

  const pageSize =
    toInt(searchParams.get("pagination[pageSize]")) ??
    toInt(searchParams.get("pageSize")) ??
    100;

  return {
    page: Math.max(1, page),
    pageSize: Math.max(1, pageSize),
  };
};

const applyPagination = <T>(items: T[], searchParams: URLSearchParams) => {
  const { page, pageSize } = getPagination(searchParams);
  const start = (page - 1) * pageSize;
  return {
    data: items.slice(start, start + pageSize),
    total: items.length,
  };
};

const getSortConfig = (searchParams: URLSearchParams) => {
  const sortValue = searchParams.get("sort");
  if (!sortValue) return null;

  const [field, direction] = sortValue.split(":");
  if (!field) return null;

  return {
    field,
    direction: direction === "desc" ? "desc" : "asc",
  } as const;
};

const compareValue = (a: unknown, b: unknown) => {
  if (a === b) return 0;

  if (a === undefined || a === null) return -1;
  if (b === undefined || b === null) return 1;

  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }

  const dateA = toDate(a);
  const dateB = toDate(b);
  if (dateA && dateB) {
    return dateA.getTime() - dateB.getTime();
  }

  return String(a).localeCompare(String(b));
};

const applySort = <T extends AnyRecord>(items: T[], searchParams: URLSearchParams) => {
  const sort = getSortConfig(searchParams);
  if (!sort) return items;

  return [...items].sort((left, right) => {
    const compare = compareValue(left[sort.field], right[sort.field]);
    return sort.direction === "desc" ? -compare : compare;
  });
};

const pickRelationRef = (value: unknown) => {
  if (!value) return undefined;

  if (typeof value === "string" || typeof value === "number") {
    return value;
  }

  if (typeof value === "object") {
    const relation = value as AnyRecord;
    return relation.documentId ?? relation.id;
  }

  return undefined;
};

const incomingImageValue = (value: unknown) => {
  if (value === null) return null;
  if (typeof value === "string") return value;

  if (value && typeof value === "object" && "url" in (value as AnyRecord)) {
    return (value as AnyRecord).url;
  }

  return undefined;
};

export const toBackendCategoryPayload = (input: AnyRecord) => ({
  name: input.name,
  slug: input.slug,
  description: input.description,
  image: incomingImageValue(input.image),
  sortOrder: input.sortOrder,
  isActive: input.isActive,
});

export const toBackendDishPayload = (input: AnyRecord) => ({
  name: input.name,
  slug: input.slug,
  sku: input.sku,
  description: input.description,
  price: input.price,
  vipPrice: input.vipPrice ?? input.vip_price,
  costPrice: input.costPrice ?? input.cost_price,
  image: incomingImageValue(input.image),
  isActive: input.isActive ?? input.is_active,
  sortOrder: input.sortOrder ?? input.sort_order,
  sold: input.sold,
  rating: input.rating,
  category: pickRelationRef(input.category ?? input.category_id),
});

export const toBackendTablePayload = (input: AnyRecord) => ({
  tableNumber: input.tableNumber ?? input.table_number,
  displayName: input.displayName ?? input.display_name,
  type: input.type,
  tableStatus: input.tableStatus ?? input.table_status,
  capacity: input.capacity,
  zone: input.zone,
  note: input.note,
  isActive: input.isActive ?? input.is_active,
  occupiedSince: input.occupiedSince ?? input.occupied_since,
  lastClearedAt: input.lastClearedAt ?? input.last_cleared_at,
});

export const toBackendOrderPayload = (input: AnyRecord) => ({
  orderNo: input.orderNo ?? input.order_no,
  table: pickRelationRef(input.table ?? input.table_id),
  orderStatus: input.orderStatus ?? input.order_status,
  source: input.source,
  guestCount: input.guestCount ?? input.guest_count,
  isPaid: input.isPaid ?? input.is_paid,
  openedAt: input.openedAt ?? input.opened_at,
  paidTime: input.paidTime ?? input.paid_time,
  closedAt: input.closedAt ?? input.closed_at,
  subtotal: input.subtotal,
  discountAmount: input.discountAmount ?? input.discount_amount,
  taxAmount: input.taxAmount ?? input.tax_amount,
  serviceCharge: input.serviceCharge ?? input.service_charge,
  totalAmount: input.totalAmount ?? input.total_amount,
  paidAmount: input.paidAmount ?? input.paid_amount,
  changeAmount: input.changeAmount ?? input.change_amount,
  cashierName: input.cashierName ?? input.cashier_name,
  customerName: input.customerName ?? input.customer_name,
  note: input.note,
});

export const toBackendOrderItemPayload = (input: AnyRecord) => ({
  dish: pickRelationRef(input.dish ?? input.dish_id),
  order: pickRelationRef(input.order ?? input.order_id),
  quantity: input.quantity,
  priceAtOrder: input.priceAtOrder ?? input.price_at_order,
  lineTotal: input.lineTotal ?? input.line_total,
  discountAmount: input.discountAmount ?? input.discount_amount,
  dishNameSnapshot: input.dishNameSnapshot ?? input.dish_name_snapshot,
  dishSkuSnapshot: input.dishSkuSnapshot ?? input.dish_sku_snapshot,
  note: input.note,
  kitchenStatus: input.kitchenStatus ?? input.kitchen_status,
});

export const toBackendPaymentPayload = (input: AnyRecord) => ({
  order: pickRelationRef(input.order ?? input.order_id),
  method: input.method,
  status: input.status,
  amount: input.amount,
  currency: input.currency,
  paidAt: input.paidAt ?? input.paid_at,
  reference: input.reference,
  note: input.note,
  metadata: input.metadata,
});

const mapCategoryLight = (item: AnyRecord | null | undefined) => {
  if (!item) return undefined;

  return {
    id: item.id,
    documentId: item.documentId,
    name: item.name,
    slug: item.slug,
    description: item.description,
    image: createLegacyImage(item.image),
    sortOrder: item.sortOrder,
    isActive: item.isActive,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    publishedAt: item.publishedAt,
  };
};

const mapDishLight = (item: AnyRecord | null | undefined) => {
  if (!item) return undefined;

  return {
    id: item.id,
    documentId: item.documentId,
    name: item.name,
    slug: item.slug,
    sku: item.sku,
    description: item.description,
    image: createLegacyImage(item.image),
    rating: item.rating,
    sold: item.sold,
    price: item.price,
    vipPrice: item.vipPrice,
    costPrice: item.costPrice,
    isActive: item.isActive,
    sortOrder: item.sortOrder,
    category: mapCategoryLight(item.category),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    publishedAt: item.publishedAt,
  };
};

const mapTableLight = (item: AnyRecord | null | undefined) => {
  if (!item) return undefined;

  return {
    id: item.id,
    documentId: item.documentId,
    tableNumber: item.tableNumber,
    displayName: item.displayName,
    type: item.type,
    table_status: item.tableStatus,
    capacity: item.capacity,
    zone: item.zone,
    note: item.note,
    is_active: item.isActive,
    occupied_since: item.occupiedSince,
    last_cleared_at: item.lastClearedAt,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    publishedAt: item.publishedAt,
  };
};

const mapOrderLight = (item: AnyRecord | null | undefined) => {
  if (!item) return undefined;

  return {
    id: item.id,
    documentId: item.documentId,
    order_no: item.orderNo,
    table_id: mapTableLight(item.table),
    order_status: item.orderStatus,
    source: item.source,
    guest_count: item.guestCount,
    is_paid: item.isPaid,
    opened_at: item.openedAt,
    paid_time: item.paidTime,
    closed_at: item.closedAt,
    subtotal: item.subtotal,
    discount_amount: item.discountAmount,
    tax_amount: item.taxAmount,
    service_charge: item.serviceCharge,
    total_amount: item.totalAmount,
    paid_amount: item.paidAmount,
    change_amount: item.changeAmount,
    cashier_name: item.cashierName,
    customer_name: item.customerName,
    note: item.note,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    publishedAt: item.publishedAt,
  };
};

const mapOrderItemLight = (item: AnyRecord | null | undefined) => {
  if (!item) return undefined;

  return {
    id: item.id,
    documentId: item.documentId,
    dish_id: mapDishLight(item.dish),
    order_id: mapOrderLight(item.order),
    quantity: item.quantity,
    price_at_order: item.priceAtOrder,
    line_total: item.lineTotal,
    discount_amount: item.discountAmount,
    dish_name_snapshot: item.dishNameSnapshot,
    dish_sku_snapshot: item.dishSkuSnapshot,
    note: item.note,
    kitchen_status: item.kitchenStatus,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    publishedAt: item.publishedAt,
  };
};

const mapPaymentLight = (item: AnyRecord | null | undefined) => {
  if (!item) return undefined;

  return {
    id: item.id,
    documentId: item.documentId,
    order_id: mapOrderLight(item.order),
    method: item.method,
    status: item.status,
    amount: item.amount,
    currency: item.currency,
    paid_at: item.paidAt,
    reference: item.reference,
    note: item.note,
    metadata: item.metadata,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    publishedAt: item.publishedAt,
  };
};

export const toLegacyCategory = (item: AnyRecord) => ({
  ...mapCategoryLight(item),
  dishes: Array.isArray(item.dishes) ? item.dishes.map(mapDishLight) : undefined,
});

export const toLegacyDish = (item: AnyRecord) => ({
  ...mapDishLight(item),
  category: mapCategoryLight(item.category),
});

export const toLegacyTable = (item: AnyRecord) => ({
  ...mapTableLight(item),
  orders: Array.isArray(item.orders) ? item.orders.map(mapOrderLight) : undefined,
});

export const toLegacyOrder = (item: AnyRecord) => ({
  ...mapOrderLight(item),
  table_id: mapTableLight(item.table),
  items: Array.isArray(item.items) ? item.items.map(mapOrderItemLight) : undefined,
  payments: Array.isArray(item.payments)
    ? item.payments.map(mapPaymentLight)
    : undefined,
});

export const toLegacyOrderItem = (item: AnyRecord) => ({
  ...mapOrderItemLight(item),
  dish_id: mapDishLight(item.dish),
  order_id: mapOrderLight(item.order),
});

export const toLegacyPayment = (item: AnyRecord) => ({
  ...mapPaymentLight(item),
  order_id: mapOrderLight(item.order),
});

export const filterCategories = (items: AnyRecord[], searchParams: URLSearchParams) => {
  const nameEqual = searchParams.get("filters[name][$eqi]");

  if (!nameEqual) return items;

  return items.filter((item) => toLower(item.name) === toLower(nameEqual));
};

export const filterDishes = (items: AnyRecord[], searchParams: URLSearchParams) => {
  const nameContains = searchParams.get("filters[name][$containsi]");
  const nameEqual = searchParams.get("filters[name][$eqi]");
  const skuEqual = searchParams.get("filters[sku][$eqi]");
  const categoryNameEqual = searchParams.get("filters[category][name][$eq]");
  const categoryDocumentIdEqual = searchParams.get("filters[category][documentId][$eq]");
  const minPrice = toInt(searchParams.get("filters[price][$gte]"));
  const maxPrice = toInt(searchParams.get("filters[price][$lte]"));

  const categoryInNames = [...searchParams.entries()]
    .filter(([key]) => /^filters\[category\]\[name\]\[\$in\]\[\d+\]$/.test(key))
    .map(([, value]) => value)
    .map((value) => toLower(value));

  return items.filter((item) => {
    const name = String(item.name ?? "");
    const sku = String(item.sku ?? "");
    const categoryName = String(item.category?.name ?? "");
    const categoryDocumentId = String(item.category?.documentId ?? "");
    const price = Number(item.price ?? 0);

    if (nameContains && !toLower(name).includes(toLower(nameContains))) return false;
    if (nameEqual && toLower(name) !== toLower(nameEqual)) return false;
    if (skuEqual && toLower(sku) !== toLower(skuEqual)) return false;
    if (categoryNameEqual && toLower(categoryName) !== toLower(categoryNameEqual)) return false;
    if (categoryDocumentIdEqual && categoryDocumentId !== categoryDocumentIdEqual) return false;
    if (categoryInNames.length > 0 && !categoryInNames.includes(toLower(categoryName))) return false;
    if (minPrice !== undefined && price < minPrice) return false;
    if (maxPrice !== undefined && price > maxPrice) return false;

    return true;
  });
};

export const filterTables = (items: AnyRecord[], searchParams: URLSearchParams) => {
  const tableNumber = searchParams.get("filters[tableNumber][$eq]");

  if (!tableNumber) return items;

  return items.filter(
    (item) => toLower(item.tableNumber) === toLower(tableNumber),
  );
};

export const filterOrders = (items: AnyRecord[], searchParams: URLSearchParams) => {
  const tableDocumentId = searchParams.get("filters[table_id][documentId][$eq]");
  const status = searchParams.get("filters[order_status]");
  const updatedAtMin = toDate(searchParams.get("filters[updatedAt][$gte]"));
  const updatedAtMax = toDate(searchParams.get("filters[updatedAt][$lte]"));

  return items.filter((item) => {
    if (tableDocumentId && item.table_id?.documentId !== tableDocumentId) return false;
    if (status && item.order_status !== status) return false;

    const updatedAt = toDate(item.updatedAt);
    if (updatedAtMin && updatedAt && updatedAt < updatedAtMin) return false;
    if (updatedAtMax && updatedAt && updatedAt > updatedAtMax) return false;

    return true;
  });
};

export const filterOrderItems = (items: AnyRecord[], searchParams: URLSearchParams) => {
  const tableNumber = searchParams.get("filters[order_id][table_id][tableNumber][$eq]");
  const orderDocumentId = searchParams.get("filters[order_id][documentId][$eq]");

  return items.filter((item) => {
    if (tableNumber) {
      const itemTableNumber = item.order_id?.table_id?.tableNumber;
      if (toLower(itemTableNumber) !== toLower(tableNumber)) return false;
    }

    if (orderDocumentId) {
      const itemOrderId = item.order_id?.documentId;
      if (itemOrderId !== orderDocumentId) return false;
    }

    return true;
  });
};

export const sortAndPaginate = <T extends AnyRecord>(
  items: T[],
  searchParams: URLSearchParams,
) => {
  const sorted = applySort(items, searchParams);
  return applyPagination(sorted, searchParams);
};
