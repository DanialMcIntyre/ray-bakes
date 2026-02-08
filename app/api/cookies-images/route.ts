import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

export const runtime = "nodejs";

const COOKIES_DIR = path.join(process.cwd(), "public", "cookies");
const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

const isSafeFileName = (name: string) => {
  const base = path.basename(name);
  if (base !== name) return false;
  const ext = path.extname(base).toLowerCase();
  return ALLOWED_EXTENSIONS.has(ext);
};

export async function GET() {
  try {
    await fs.mkdir(COOKIES_DIR, { recursive: true });
    const entries = await fs.readdir(COOKIES_DIR, { withFileTypes: true });
    const images = entries
      .filter((e) => e.isFile())
      .map((e) => e.name)
      .filter((name) => ALLOWED_EXTENSIONS.has(path.extname(name).toLowerCase()))
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ name, path: `/cookies/${name}` }));

    return NextResponse.json({ images });
  } catch {
    return NextResponse.json({ images: [], error: "Failed to read cookies folder." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const name = url.searchParams.get("name");
    if (!name || !isSafeFileName(name)) {
      return NextResponse.json({ error: "Invalid file name." }, { status: 400 });
    }
    const target = path.join(COOKIES_DIR, name);
    await fs.unlink(target);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete image." }, { status: 500 });
  }
}
