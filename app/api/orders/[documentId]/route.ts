import { NextResponse } from "next/server";
import {
  toBackendOrderPayload,
  toLegacyOrder,
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
    const response = await client.get(`/api/orders/${documentId}`);

    return NextResponse.json(wrapSingleResponse(toLegacyOrder(response.data?.data)));
  } catch (error) {
    const { message, status } = toRouteErrorResponse(
      error,
      "Không thể lấy chi tiết hóa đơn.",
    );
    return NextResponse.json({ message }, { status });
  }
}

export async function PUT(request: Request, context: RouteParams) {
  try {
    const { documentId } = await context.params;
    const body = await request.json();
    const payload = toBackendOrderPayload(unwrapPayload(body));
    const client = createBackendServerClient();
    const response = await client.put(`/api/orders/${documentId}`, { data: payload });

    return NextResponse.json(wrapSingleResponse(toLegacyOrder(response.data?.data)));
  } catch (error) {
    const { message, status } = toRouteErrorResponse(
      error,
      "Không thể cập nhật hóa đơn.",
    );
    return NextResponse.json({ message }, { status });
  }
}

export async function PATCH(request: Request, context: RouteParams) {
  return PUT(request, context);
}

export async function DELETE(_: Request, context: RouteParams) {
  try {
    const { documentId } = await context.params;
    const client = createBackendServerClient();
    const response = await client.delete(`/api/orders/${documentId}`);

    return NextResponse.json(wrapSingleResponse(toLegacyOrder(response.data?.data)));
  } catch (error) {
    const { message, status } = toRouteErrorResponse(
      error,
      "Không thể xóa hóa đơn.",
    );
    return NextResponse.json({ message }, { status });
  }
}
