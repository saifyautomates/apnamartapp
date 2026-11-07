import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  try {
    const filePath = path.join(process.cwd(), "public", "scripts", "busy-bridge-agent.js");
    const scriptContent = fs.readFileSync(filePath, "utf8");

    return new NextResponse(scriptContent, {
      status: 200,
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Content-Disposition": 'attachment; filename="busy-bridge-agent.js"',
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: { message: "Could not read agent script" } },
      { status: 500 }
    );
  }
}

