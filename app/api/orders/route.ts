import { NextResponse } from "next/server";
import {
  filterOrders,
  sortAndPaginate,
  toBackendOrderPayload,
  toLegacyOrder,
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

    const response = await client.get("/api/orders", {
      params: { page: 1, pageSize: 10000 },
    });

    const rawItems = Array.isArray(response.data?.data) ? response.data.data : [];
    const items = rawItems.map(toLegacyOrder);
    const filtered = filterOrders(items, searchParams);
    const { data, total } = sortAndPaginate(filtered, searchParams);

    return NextResponse.json(wrapListResponse(data, total));
  } catch (error) {
    const { message, status } = toRouteErrorResponse(
      error,
      "Không thể lấy danh sách hóa đơn.",
    );
    return NextResponse.json({ message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = toBackendOrderPayload(unwrapPayload(body));
    const client = createBackendServerClient();
    const response = await client.post("/api/orders", { data: payload });

    return NextResponse.json(wrapSingleResponse(toLegacyOrder(response.data?.data)));
  } catch (error) {
    const { message, status } = toRouteErrorResponse(
      error,
      "Không thể tạo hóa đơn.",
    );
    return NextResponse.json({ message }, { status });
  }
}
