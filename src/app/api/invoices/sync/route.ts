import { NextResponse } from "next/server";
import { syncInvoicesWithCloud } from "@/lib/server-storage";
import { Invoice } from "@/types/invoice";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const clientInvoices: Invoice[] = Array.isArray(body?.invoices) ? body.invoices : [];
    const synced = await syncInvoicesWithCloud(clientInvoices);
    return NextResponse.json({
      success: true,
      invoices: synced,
      count: synced.length,
    });
  } catch (err: any) {
    console.error("API /api/invoices/sync failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
