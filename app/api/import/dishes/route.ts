import axios, { type AxiosInstance } from "axios";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export const runtime = "nodejs";

type RawInputRow = Record<string, unknown>;

type ParsedDishRow = {
  rowNumber: number;
  name: string;
  price: number;
  categoryName?: string;
  vipPrice?: number;
  costPrice?: number;
  sku?: string;
  description?: string;
  rating?: number;
  sold?: number;
  isActive?: boolean;
  sortOrder?: number;
};

type ImportSummary = {
  totalRows: number;
  created: number;
  updated: number;
  skipped: number;
  categoriesCreated: number;
  errors: Array<{ rowNumber: number; message: string }>;
};

const HEADER_ALIASES: Record<string, keyof Omit<ParsedDishRow, "rowNumber">> = {
  name: "name",
  ten: "name",
  tenmon: "name",
  tennon: "name",
  dishname: "name",
  monan: "name",
  price: "price",
  gia: "price",
  giaban: "price",
  vipprice: "vipPrice",
  giavip: "vipPrice",
  costprice: "costPrice",
  gianhap: "costPrice",
  sku: "sku",
  masp: "sku",
  mamon: "sku",
  description: "description",
  mota: "description",
  category: "categoryName",
  categoryname: "categoryName",
  danhmuc: "categoryName",
  rating: "rating",
  sold: "sold",
  daban: "sold",
  soluongban: "sold",
  isactive: "isActive",
  active: "isActive",
  trangthai: "isActive",
  sortorder: "sortOrder",
  thutu: "sortOrder",
};

const MAX_IMPORT_ROWS = 500;

const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const responseMessage =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.response?.statusText;
    return responseMessage || error.message;
  }

  return error instanceof Error ? error.message : "Lỗi không xác định.";
};

const normalizeHeader = (value: string) =>
  value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();

const slugify = (value: string) =>
  value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[,\s]/g, ""));
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
};

const toBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "y", "active", "on", "co", "có"].includes(normalized)) return true;
    if (["false", "0", "no", "n", "inactive", "off", "khong", "không"].includes(normalized)) return false;
  }
  return undefined;
};

const toStringValue = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized ? normalized : undefined;
};

const parseRowsFromJson = (input: unknown): RawInputRow[] => {
  if (Array.isArray(input)) return input as RawInputRow[];
  if (input && typeof input === "object" && Array.isArray((input as { data?: unknown[] }).data)) {
    return (input as { data: RawInputRow[] }).data;
  }
  throw new Error("JSON phải là mảng hoặc object có key `data` là mảng.");
};

const parseFileRows = async (file: File): Promise<RawInputRow[]> => {
  const fileName = file.name.toLowerCase();
  const bytes = Buffer.from(await file.arrayBuffer());

  if (fileName.endsWith(".json")) {
    return parseRowsFromJson(JSON.parse(bytes.toString("utf8")));
  }

  if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
    const workbook = XLSX.read(bytes, { type: "buffer" });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new Error("File Excel không có sheet.");
    }
    const sheet = workbook.Sheets[firstSheetName];
    return XLSX.utils.sheet_to_json<RawInputRow>(sheet, {
      defval: "",
      raw: false,
    });
  }

  throw new Error("Chỉ hỗ trợ file .xlsx, .xls hoặc .json.");
};

const normalizeRow = (row: RawInputRow, rowNumber: number): ParsedDishRow | null => {
  const mapped: Partial<ParsedDishRow> = {};

  for (const [rawKey, rawValue] of Object.entries(row)) {
    const normalizedKey = normalizeHeader(rawKey);
    const target = HEADER_ALIASES[normalizedKey];
    if (!target) continue;
    (mapped as Record<string, unknown>)[target] = rawValue;
  }

  const name = toStringValue(mapped.name);
  const price = toNumber(mapped.price);
  const categoryName = toStringValue(mapped.categoryName);

  const isBlankRow = !name && price === undefined && !categoryName;
  if (isBlankRow) {
    return null;
  }

  if (!name) {
    throw new Error("Thiếu tên món (`name`).");
  }

  if (price === undefined) {
    throw new Error("Thiếu giá món (`price`) hoặc giá không hợp lệ.");
  }

  if (price < 0) {
    throw new Error("`price` phải >= 0.");
  }

  const parsed: ParsedDishRow = {
    rowNumber,
    name,
    price,
  };

  const vipPrice = toNumber(mapped.vipPrice);
  const costPrice = toNumber(mapped.costPrice);
  const rating = toNumber(mapped.rating);
  const sold = toNumber(mapped.sold);
  const sortOrder = toNumber(mapped.sortOrder);
  const isActive = toBoolean(mapped.isActive);

  if (categoryName) parsed.categoryName = categoryName;
  if (vipPrice !== undefined) parsed.vipPrice = vipPrice;
  if (costPrice !== undefined) parsed.costPrice = costPrice;
  if (rating !== undefined) parsed.rating = rating;
  if (sold !== undefined) parsed.sold = sold;
  if (sortOrder !== undefined) parsed.sortOrder = sortOrder;
  if (isActive !== undefined) parsed.isActive = isActive;

  const sku = toStringValue(mapped.sku);
  const description = toStringValue(mapped.description);
  if (sku) parsed.sku = sku;
  if (description) parsed.description = description;

  return parsed;
};

const createStrapiClient = () => {
  const baseURL = (process.env.STRAPI_URL || process.env.NEXT_PUBLIC_STRAPI_URL || "").replace(/\/$/, "");
  const token = process.env.STRAPI_API_TOKEN || "";

  if (!baseURL) {
    throw new Error("Thiếu STRAPI_URL hoặc NEXT_PUBLIC_STRAPI_URL trong môi trường.");
  }

  if (!token) {
    throw new Error("Thiếu STRAPI_API_TOKEN trong môi trường.");
  }

  return axios.create({
    baseURL,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};

const resolveCategory = async (
  client: AxiosInstance,
  categoryName: string,
  cache: Map<string, string>
): Promise<{ documentId: string; created: boolean }> => {
  const cacheKey = categoryName.trim().toLowerCase();
  const cached = cache.get(cacheKey);
  if (cached) return { documentId: cached, created: false };

  const found = await client.get("/api/categories", {
    params: {
      "filters[name][$eqi]": categoryName,
      "pagination[pageSize]": 1,
    },
  });

  const existing = found.data?.data?.[0];
  if (existing?.documentId) {
    cache.set(cacheKey, existing.documentId);
    return { documentId: existing.documentId, created: false };
  }

  let created;
  try {
    created = await client.post("/api/categories", {
      data: {
        name: categoryName,
        slug: slugify(categoryName),
        isActive: true,
      },
    });
  } catch (error) {
    throw new Error(`Không thể tạo category '${categoryName}': ${getErrorMessage(error)}`);
  }

  const documentId = created.data?.data?.documentId;
  if (!documentId) {
    throw new Error(`Không thể tạo category '${categoryName}'.`);
  }

  cache.set(cacheKey, documentId);
  return { documentId, created: true };
};

const findDishByUniqueKeys = async (
  client: AxiosInstance,
  row: ParsedDishRow,
  categoryDocumentId?: string
): Promise<string | undefined> => {
  if (row.sku) {
    const bySku = await client.get("/api/dishes", {
      params: {
        "filters[sku][$eqi]": row.sku,
        "pagination[pageSize]": 1,
      },
    });
    const existingBySku = bySku.data?.data?.[0]?.documentId;
    if (existingBySku) return existingBySku;
  }

  const params: Record<string, string | number> = {
    "filters[name][$eqi]": row.name,
    "pagination[pageSize]": 1,
  };

  if (categoryDocumentId) {
    params["filters[category][documentId][$eq]"] = categoryDocumentId;
  }

  const byName = await client.get("/api/dishes", { params });
  return byName.data?.data?.[0]?.documentId;
};

const buildDishPayload = (row: ParsedDishRow, categoryDocumentId?: string) => {
  const payload: Record<string, unknown> = {
    name: row.name,
    slug: slugify(row.name),
    price: Math.round(row.price),
  };

  if (row.sku) payload.sku = row.sku;
  if (row.description) payload.description = row.description;
  if (row.vipPrice !== undefined) payload.vipPrice = Math.round(row.vipPrice);
  if (row.costPrice !== undefined) payload.costPrice = Math.round(row.costPrice);
  if (row.rating !== undefined) payload.rating = row.rating;
  if (row.sold !== undefined) payload.sold = Math.max(0, Math.round(row.sold));
  if (row.isActive !== undefined) payload.isActive = row.isActive;
  if (row.sortOrder !== undefined) payload.sortOrder = Math.max(0, Math.round(row.sortOrder));

  if (categoryDocumentId) {
    payload.category = categoryDocumentId;
  }

  return payload;
};

const upsertDish = async (
  client: AxiosInstance,
  row: ParsedDishRow,
  categoryDocumentId?: string
): Promise<"created" | "updated"> => {
  const payload = buildDishPayload(row, categoryDocumentId);
  const existingDocumentId = await findDishByUniqueKeys(client, row, categoryDocumentId);

  if (existingDocumentId) {
    try {
      await client.put(`/api/dishes/${existingDocumentId}`, {
        data: payload,
      });
    } catch (error) {
      throw new Error(`Cập nhật món thất bại: ${getErrorMessage(error)}`);
    }
    return "updated";
  }

  try {
    await client.post("/api/dishes", {
      data: payload,
    });
  } catch (error) {
    throw new Error(`Tạo món thất bại: ${getErrorMessage(error)}`);
  }
  return "created";
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const uploadedFile = formData.get("file");

    if (!(uploadedFile instanceof File)) {
      return NextResponse.json({ message: "Thiếu file import." }, { status: 400 });
    }

    const rawRows = await parseFileRows(uploadedFile);

    if (rawRows.length === 0) {
      return NextResponse.json({ message: "File không có dữ liệu." }, { status: 400 });
    }

    if (rawRows.length > MAX_IMPORT_ROWS) {
      return NextResponse.json(
        { message: `Số dòng vượt quá giới hạn ${MAX_IMPORT_ROWS}.` },
        { status: 400 }
      );
    }

    const parsedRows: ParsedDishRow[] = [];
    const summary: ImportSummary = {
      totalRows: rawRows.length,
      created: 0,
      updated: 0,
      skipped: 0,
      categoriesCreated: 0,
      errors: [],
    };

    rawRows.forEach((row, index) => {
      const rowNumber = index + 2;
      try {
        const parsed = normalizeRow(row, rowNumber);
        if (!parsed) {
          summary.skipped += 1;
          return;
        }
        parsedRows.push(parsed);
      } catch (error) {
        summary.errors.push({
          rowNumber,
          message: error instanceof Error ? error.message : "Dữ liệu không hợp lệ.",
        });
      }
    });

    const client = createStrapiClient();
    const categoryCache = new Map<string, string>();

    for (const row of parsedRows) {
      try {
        let categoryDocumentId: string | undefined;

        if (row.categoryName) {
          const resolved = await resolveCategory(client, row.categoryName, categoryCache);
          categoryDocumentId = resolved.documentId;
          if (resolved.created) {
            summary.categoriesCreated += 1;
          }
        }

        const action = await upsertDish(client, row, categoryDocumentId);
        if (action === "created") summary.created += 1;
        if (action === "updated") summary.updated += 1;
      } catch (error) {
        summary.errors.push({
          rowNumber: row.rowNumber,
          message: error instanceof Error ? error.message : "Không thể import dòng này.",
        });
      }
    }

    return NextResponse.json({
      message: "Import hoàn tất.",
      summary,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Import thất bại.",
      },
      { status: 500 }
    );
  }
}
