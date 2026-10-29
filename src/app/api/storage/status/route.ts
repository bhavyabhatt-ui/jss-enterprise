import { NextResponse } from "next/server";
import { getActiveStorageProvider } from "@/lib/server-storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const provider = getActiveStorageProvider();
  return NextResponse.json({
    type: provider.type,
    isCloud: provider.isCloud,
    name: provider.name,
  });
}
