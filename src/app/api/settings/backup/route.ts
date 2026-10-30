import { NextResponse } from "next/server";
import { getFullSystemBackup, restoreSystemBackup } from "@/lib/server-storage";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const backup = await getFullSystemBackup();
    return NextResponse.json(backup);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { backup, mode = "merge" } = body;

    if (!backup || typeof backup !== "object") {
      return NextResponse.json({ error: "Invalid backup data" }, { status: 400 });
    }

    const result = await restoreSystemBackup(backup, mode);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

