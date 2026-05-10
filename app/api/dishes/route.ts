import { NextResponse } from "next/server";
import axios from "axios";
import { createStrapiServerClient } from "@/lib/server/strapi-server-client";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { search } = new URL(request.url);
    const client = createStrapiServerClient(false);
    const response = await client.get(`/api/dishes${search}`);
    return NextResponse.json(response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status ?? 500
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.message
      return NextResponse.json({ message }, { status })
    }
    const message = error instanceof Error ? error.message : "Không thể lấy danh sách món ăn.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const client = createStrapiServerClient(true);
    const response = await client.post("/api/dishes", body);
    return NextResponse.json(response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status ?? 500
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.message
      return NextResponse.json({ message }, { status })
    }
    const message = error instanceof Error ? error.message : "Không thể tạo món ăn.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
