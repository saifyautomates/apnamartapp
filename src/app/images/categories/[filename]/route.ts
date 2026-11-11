import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

const CAT_DIR = path.join(process.cwd(), "public", "images", "categories");
const DEFAULT_CAT_JPG = path.join(CAT_DIR, "atta-rice-dal.jpg");

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  const filename = decodeURIComponent(params.filename || "").toLowerCase();

  // 1. Direct file on disk
  const exactPath = path.join(CAT_DIR, filename);
  if (fs.existsSync(exactPath) && fs.statSync(exactPath).isFile()) {
    const buffer = fs.readFileSync(exactPath);
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  // 2. Keyword fallback matching
  let matchedFile: string | null = null;
  if (fs.existsSync(CAT_DIR)) {
    const diskFiles = fs.readdirSync(CAT_DIR).filter((f) => f.endsWith(".jpg"));
    const words = filename.replace(/\.jpg$/i, "").split(/[-_]+/);
    for (const w of words) {
      if (w.length < 3) continue;
      const found = diskFiles.find((f) => f.includes(w));
      if (found) {
        matchedFile = found;
        break;
      }
    }
  }

  const targetPath = matchedFile ? path.join(CAT_DIR, matchedFile) : DEFAULT_CAT_JPG;

  if (fs.existsSync(targetPath)) {
    const buffer = fs.readFileSync(targetPath);
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  }

  return new NextResponse(null, { status: 404 });
}
