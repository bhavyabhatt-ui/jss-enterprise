"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getInvoiceById, fetchInvoiceById } from "@/lib/storage";
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
      const local = getInvoiceById(id);
      if (local) {
        setInvoice(local);
        setLoading(false);
      }

      fetchInvoiceById(id).then((serverInv) => {
        if (serverInv) {
          setInvoice(serverInv);
        } else if (!local) {
          router.push("/");
        }
        setLoading(false);
      });
    }
  }, [id, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (!invoice) return null;

  return <InvoiceForm mode="edit" initialData={invoice} />;
}
