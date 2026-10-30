import { NextResponse } from "next/server";
import { getServerSettings, saveServerSettings } from "@/lib/server-storage";
import { SystemSettings } from "@/types/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getServerSettings();
    return NextResponse.json(settings);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: SystemSettings = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid settings payload" }, { status: 400 });
    }
    const saved = await saveServerSettings(body);
    return NextResponse.json(saved);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
