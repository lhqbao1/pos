import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const sanitizeFileName = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/(^-|-$)/g, "");

const getFileExtension = (file: File) => {
  const originalName = file.name || "";
  const extFromName = path.extname(originalName).replace(".", "").toLowerCase();

  if (extFromName) return extFromName;

  const mime = file.type.toLowerCase();
  if (mime.includes("png")) return "png";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";

  return "bin";
};

export async function POST(request: Request) {
  try {
    const inboundFormData = await request.formData();
    const file = inboundFormData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "Thiếu file ảnh." }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ message: "File upload phải là ảnh." }, { status: 400 });
    }

    const extension = getFileExtension(file);
    const baseName = sanitizeFileName(path.basename(file.name, path.extname(file.name))) || "image";
    const fileName = `${Date.now()}-${randomUUID()}-${baseName}.${extension}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const bytes = Buffer.from(await file.arrayBuffer());
    const targetPath = path.join(uploadDir, fileName);
    await writeFile(targetPath, bytes);

    const publicUrl = `/uploads/${fileName}`;

    return NextResponse.json([
      {
        id: Date.now(),
        name: fileName,
        alternativeText: null,
        caption: null,
        width: null,
        height: null,
        formats: null,
        hash: fileName,
        ext: `.${extension}`,
        mime: file.type || "application/octet-stream",
        size: Number((file.size / 1024).toFixed(2)),
        url: publicUrl,
        previewUrl: null,
        provider: "local",
        provider_metadata: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload ảnh thất bại.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
