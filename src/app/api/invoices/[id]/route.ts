import { NextResponse } from "next/server";
import { getServerInvoiceById, deleteServerInvoice, saveServerInvoice } from "@/lib/server-storage";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rawParams = await params;
    const id = decodeURIComponent(rawParams.id);
    const invoice = await getServerInvoiceById(id);
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }
    return NextResponse.json(invoice);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rawParams = await params;
    const id = decodeURIComponent(rawParams.id);
    const deleted = await deleteServerInvoice(id);
    return NextResponse.json({ success: deleted, id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const rawParams = await params;
    const id = decodeURIComponent(rawParams.id);
    const saved = await saveServerInvoice({ ...body, id });
    return NextResponse.json(saved);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
