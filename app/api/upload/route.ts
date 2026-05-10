import { NextResponse } from "next/server";
import { STRAPI_SERVER_BASE_URL, getStrapiToken } from "@/lib/server/strapi-server-client";

export const runtime = "nodejs";

const parseErrorMessage = (payload: unknown) => {
  if (!payload || typeof payload !== "object") return "Upload ảnh thất bại."
  const maybePayload = payload as { error?: { message?: string }, message?: string }
  return maybePayload.error?.message || maybePayload.message || "Upload ảnh thất bại."
}

export async function POST(request: Request) {
  try {
    const token = getStrapiToken();

    if (!token) {
      return NextResponse.json(
        { message: "Thiếu STRAPI_API_TOKEN để upload ảnh." },
        { status: 500 }
      );
    }

    const inboundFormData = await request.formData();
    const file = inboundFormData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "Thiếu file ảnh." }, { status: 400 });
    }

    const outboundFormData = new FormData();
    outboundFormData.append("files", file, file.name);

    const uploadResponse = await fetch(`${STRAPI_SERVER_BASE_URL}/api/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: outboundFormData,
    });

    const responseBody = await uploadResponse.json();

    if (!uploadResponse.ok) {
      return NextResponse.json(
        { message: parseErrorMessage(responseBody) },
        { status: uploadResponse.status }
      );
    }

    return NextResponse.json(responseBody);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload ảnh thất bại.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
