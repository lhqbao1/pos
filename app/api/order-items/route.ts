import { NextResponse } from "next/server";
import {
  filterOrderItems,
  sortAndPaginate,
  toBackendOrderItemPayload,
  toLegacyOrderItem,
  unwrapPayload,
  wrapListResponse,
  wrapSingleResponse,
} from "@/lib/server/backend-adapter";
import { createBackendServerClient } from "@/lib/server/backend-server-client";
import { toRouteErrorResponse } from "@/lib/server/route-error";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const client = createBackendServerClient();

    const response = await client.get("/api/order-items", {
      params: { page: 1, pageSize: 10000 },
    });

    const rawItems = Array.isArray(response.data?.data) ? response.data.data : [];
    const items = rawItems.map(toLegacyOrderItem);
    const filtered = filterOrderItems(items, searchParams);
    const { data, total } = sortAndPaginate(filtered, searchParams);

    return NextResponse.json(wrapListResponse(data, total));
  } catch (error) {
    const { message, status } = toRouteErrorResponse(
      error,
      "Không thể lấy danh sách món trong đơn.",
    );
    return NextResponse.json({ message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = toBackendOrderItemPayload(unwrapPayload(body));
    const client = createBackendServerClient();
    const response = await client.post("/api/order-items", { data: payload });

    return NextResponse.json(wrapSingleResponse(toLegacyOrderItem(response.data?.data)));
  } catch (error) {
    const { message, status } = toRouteErrorResponse(
      error,
      "Không thể tạo món trong đơn.",
    );
    return NextResponse.json({ message }, { status });
  }
}
