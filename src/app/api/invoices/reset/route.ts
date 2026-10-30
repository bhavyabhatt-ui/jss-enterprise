import { NextResponse } from "next/server";
import { resetServerDatabase } from "@/lib/server-storage";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = await resetServerDatabase();
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
