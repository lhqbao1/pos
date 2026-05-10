import { NextResponse } from "next/server";
import { createStrapiServerClient } from "@/lib/server/strapi-server-client";
import { toRouteErrorResponse } from "@/lib/server/strapi-route-error";

export const runtime = "nodejs";

type RouteParams = {
  params: Promise<{ documentId: string }>;
};

export async function GET(request: Request, context: RouteParams) {
  try {
    const { documentId } = await context.params;
    const { search } = new URL(request.url);
    const client = createStrapiServerClient(false);
    const response = await client.get(`/api/order-items/${documentId}${search}`);
    return NextResponse.json(response.data);
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
    const client = createStrapiServerClient(true);
    const response = await client.put(`/api/order-items/${documentId}`, body);
    return NextResponse.json(response.data);
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
    const client = createStrapiServerClient(true);
    const response = await client.delete(`/api/order-items/${documentId}`);
    return NextResponse.json(response.data);
  } catch (error) {
    const { message, status } = toRouteErrorResponse(
      error,
      "Không thể xóa món trong đơn.",
    );
    return NextResponse.json({ message }, { status });
  }
}

