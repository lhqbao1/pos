import { NextResponse } from "next/server";
import { createStrapiServerClient } from "@/lib/server/strapi-server-client";
import { toRouteErrorResponse } from "@/lib/server/strapi-route-error";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { search } = new URL(request.url);
    const client = createStrapiServerClient(false);
    const response = await client.get(`/api/orders${search}`);
    return NextResponse.json(response.data);
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
    const client = createStrapiServerClient(true);
    const response = await client.post("/api/orders", body);
    return NextResponse.json(response.data);
  } catch (error) {
    const { message, status } = toRouteErrorResponse(
      error,
      "Không thể tạo hóa đơn.",
    );
    return NextResponse.json({ message }, { status });
  }
}

