import { NextResponse } from "next/server";
import { createStrapiServerClient } from "@/lib/server/strapi-server-client";
import { toRouteErrorResponse } from "@/lib/server/strapi-route-error";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { search } = new URL(request.url);
    const client = createStrapiServerClient(false);
    const response = await client.get(`/api/tables${search}`);
    return NextResponse.json(response.data);
  } catch (error) {
    const { message, status } = toRouteErrorResponse(
      error,
      "Không thể lấy danh sách bàn.",
    );
    return NextResponse.json({ message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const client = createStrapiServerClient(true);
    const response = await client.post("/api/tables", body);
    return NextResponse.json(response.data);
  } catch (error) {
    const { message, status } = toRouteErrorResponse(error, "Không thể tạo bàn.");
    return NextResponse.json({ message }, { status });
  }
}

