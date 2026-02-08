import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

export const runtime = "nodejs";

const COOKIES_DIR = path.join(process.cwd(), "public", "cookies");
const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

const sanitizeFileName = (name: string) => {
  const base = path.basename(name).replace(/\s+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "");
  return base || `upload-${Date.now()}.jpg`;
};

const ensureUniqueName = async (baseName: string) => {
  let name = baseName;
  const ext = path.extname(baseName);
  const stem = baseName.replace(ext, "");
  let counter = 1;
  while (true) {
    try {
      await fs.access(path.join(COOKIES_DIR, name));
      name = `${stem}-${counter}${ext}`;
      counter += 1;
    } catch {
      return name;
    }
  }
};

export async function POST(request: Request) {
  try {
    await fs.mkdir(COOKIES_DIR, { recursive: true });
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const originalName = sanitizeFileName(file.name);
    const ext = path.extname(originalName).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json({ error: "Unsupported file type." }, { status: 400 });
    }

    const uniqueName = await ensureUniqueName(originalName);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const target = path.join(COOKIES_DIR, uniqueName);
    await fs.writeFile(target, buffer);

    return NextResponse.json({ name: uniqueName, path: `/cookies/${uniqueName}` });
  } catch {
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
