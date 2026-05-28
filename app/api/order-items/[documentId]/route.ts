import { NextResponse } from "next/server";
import {
  toBackendOrderItemPayload,
  toLegacyOrderItem,
  unwrapPayload,
  wrapSingleResponse,
} from "@/lib/server/backend-adapter";
import { createBackendServerClient } from "@/lib/server/backend-server-client";
import { toRouteErrorResponse } from "@/lib/server/route-error";

export const runtime = "nodejs";

type RouteParams = {
  params: Promise<{ documentId: string }>;
};

export async function GET(_: Request, context: RouteParams) {
  try {
    const { documentId } = await context.params;
    const client = createBackendServerClient();
    const response = await client.get(`/api/order-items/${documentId}`);

    return NextResponse.json(wrapSingleResponse(toLegacyOrderItem(response.data?.data)));
  } catch (error) {
    const { message, status } = toRouteErrorResponse(
      error,
      "Không thể lấy chi tiết món trong đơn.",
    );
    return NextResponse.json({ message }, { status });
  }
}

export async function PUT(request: Request, context: RouteParams) {
  try {
    const { documentId } = await context.params;
    const body = await request.json();
    const payload = toBackendOrderItemPayload(unwrapPayload(body));
    const client = createBackendServerClient();
    const response = await client.put(`/api/order-items/${documentId}`, { data: payload });

    return NextResponse.json(wrapSingleResponse(toLegacyOrderItem(response.data?.data)));
  } catch (error) {
    const { message, status } = toRouteErrorResponse(
      error,
      "Không thể cập nhật số lượng món.",
    );
    return NextResponse.json({ message }, { status });
  }
}

export async function DELETE(_: Request, context: RouteParams) {
  try {
    const { documentId } = await context.params;
    const client = createBackendServerClient();
    const response = await client.delete(`/api/order-items/${documentId}`);

    return NextResponse.json(wrapSingleResponse(toLegacyOrderItem(response.data?.data)));
  } catch (error) {
    const { message, status } = toRouteErrorResponse(
      error,
      "Không thể xóa món trong đơn.",
    );
    return NextResponse.json({ message }, { status });
  }
}
