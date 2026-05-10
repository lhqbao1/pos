import { NextResponse } from "next/server";
import axios from "axios";
import { createStrapiServerClient } from "@/lib/server/strapi-server-client";

export const runtime = "nodejs";

type RouteParams = {
  params: Promise<{ documentId: string }>;
};

export async function GET(request: Request, context: RouteParams) {
  try {
    const { documentId } = await context.params;
    const { search } = new URL(request.url);
    const client = createStrapiServerClient(false);
    const response = await client.get(`/api/dishes/${documentId}${search}`);
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
    const message = error instanceof Error ? error.message : "Không thể lấy món ăn.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PUT(request: Request, context: RouteParams) {
  try {
    const { documentId } = await context.params;
    const body = await request.json();
    const client = createStrapiServerClient(true);
    const response = await client.put(`/api/dishes/${documentId}`, body);
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
    const message = error instanceof Error ? error.message : "Không thể cập nhật món ăn.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE(_: Request, context: RouteParams) {
  try {
    const { documentId } = await context.params;
    const client = createStrapiServerClient(true);
    const response = await client.delete(`/api/dishes/${documentId}`);
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
    const message = error instanceof Error ? error.message : "Không thể xóa món ăn.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
