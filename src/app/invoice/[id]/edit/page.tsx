"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getInvoiceById } from "@/lib/storage";
import { Invoice } from "@/types/invoice";
import InvoiceForm from "@/components/InvoiceForm";
import { Loader2 } from "lucide-react";

export default function EditInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const inv = getInvoiceById(id);
      if (!inv) router.push("/");
      else {
        setInvoice(inv);
        setLoading(false);
      }
    }
  }, [id, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
      </div>
    );
  }

  if (!invoice) return null;

  return <InvoiceForm mode="edit" initialData={invoice} />;
}
