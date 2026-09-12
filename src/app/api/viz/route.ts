import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { IDLE_VIZ } from "@/lib/viz";

export const dynamic = "force-dynamic";

export async function GET() {
  const path = join(process.cwd(), "models", "viz.json");
  try {
    const text = await readFile(path, "utf8");
    const payload = JSON.parse(text) as unknown;
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(IDLE_VIZ, {
      headers: { "Cache-Control": "no-store" },
    });
  }
}
