import { NextResponse } from "next/server";
import { getServerInvoices } from "@/lib/server-storage";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const invoices = await getServerInvoices();
    return NextResponse.json({
      success: true,
      invoices,
      count: invoices.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const invoices = await getServerInvoices();
    return NextResponse.json(invoices);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
