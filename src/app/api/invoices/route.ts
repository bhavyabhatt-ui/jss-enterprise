import { NextResponse } from "next/server";
import { getServerInvoices, saveServerInvoice } from "@/lib/server-storage";
import { Invoice } from "@/types/invoice";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const invoices = getServerInvoices();
    return NextResponse.json(invoices);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: Invoice = await request.json();
    if (!body || !body.id) {
      return NextResponse.json({ error: "Invalid invoice data" }, { status: 400 });
    }
    const saved = saveServerInvoice(body);
    return NextResponse.json(saved);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

