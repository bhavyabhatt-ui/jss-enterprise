import { Invoice, DEFAULT_COMPANY_HEADER } from "@/types/invoice";
import { HEADER_IMAGE_BASE64 } from "@/lib/assets";

/**
 * Capture DOM element as PNG data URL using html-to-image
 * (Natively supported by browser SVG foreignObject, avoiding all "lab" color parser errors)
 */
async function captureElementToPng(elementId: string): Promise<string> {
  const { toPng } = await import("html-to-image");

  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error("Invoice preview element not found");
  }

  // Pre-decode and ensure all images (e.g. logo) are fully loaded before capturing
  const images = Array.from(element.getElementsByTagName("img"));
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalHeight > 0) {
            resolve();
          } else {
            img.onload = () => resolve();
            img.onerror = () => resolve();
            setTimeout(resolve, 300);
          }
        })
    )
  );

  // Generate high-resolution image at fixed 800px width (pixelRatio: 2 gives 300 DPI sharpness)
  const dataUrl = await toPng(element, {
    quality: 1,
    pixelRatio: 2,
    backgroundColor: "#ffffff",
    cacheBust: false,
    width: 800,
    style: {
      transform: "none",
      boxShadow: "none",
      margin: "0",
      opacity: "1",
      visibility: "visible",
      width: "800px",
      minWidth: "800px",
      maxWidth: "800px",
    },
  });

  return dataUrl;
}

/**
 * Shared helper to create a calibrated, single-page A4 PDF from captured DOM element
 */
async function createInvoicePDF(elementId: string) {
  const { default: jsPDF } = await import("jspdf");
  const dataUrl = await captureElementToPng(elementId);

  const img = new Image();
  img.src = dataUrl;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Failed to load captured invoice image"));
  });

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 4; // 4mm edge margin
  const printableWidth = pageWidth - margin * 2; // 202mm
  const printableHeight = pageHeight - margin * 2; // 289mm

  const calculatedHeight = (img.height * printableWidth) / img.width;

  if (calculatedHeight <= printableHeight) {
    // Fits nicely on a single A4 page
    pdf.addImage(dataUrl, "PNG", margin, margin, printableWidth, calculatedHeight, undefined, "FAST");
  } else {
    // If slight overflow, scale smoothly to keep on 1 clean A4 page without clipping or second page
    const scale = printableHeight / calculatedHeight;
    if (scale >= 0.78) {
      const finalWidth = printableWidth * scale;
      const xOffset = (pageWidth - finalWidth) / 2;
      pdf.addImage(dataUrl, "PNG", xOffset, margin, finalWidth, printableHeight, undefined, "FAST");
    } else {
      // Very long list: split onto multiple pages
      let heightLeft = calculatedHeight;
      let position = margin;
      pdf.addImage(dataUrl, "PNG", margin, position, printableWidth, calculatedHeight, undefined, "FAST");
      heightLeft -= printableHeight;

      while (heightLeft > 0) {
        position = margin - (calculatedHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(dataUrl, "PNG", margin, position, printableWidth, calculatedHeight, undefined, "FAST");
        heightLeft -= printableHeight;
      }
    }
  }

  return pdf;
}

/**
 * Robust export to PDF using html-to-image + jsPDF
 */
export async function exportToPDF(elementId: string, filename: string): Promise<void> {
  const pdf = await createInvoicePDF(elementId);
  pdf.save(`${filename}.pdf`);
}

/**
 * Generate PDF as Blob for Web Share API
 */
export async function generatePDFBlob(elementId: string): Promise<Blob> {
  const pdf = await createInvoicePDF(elementId);
  return pdf.output("blob");
}

/**
 * Print Invoice using native browser print dialog (calibrated via @media print to fit A4 cleanly)
 */
export async function printInvoice(elementId: string, filename: string): Promise<void> {
  if (typeof window !== "undefined") {
    // If the print area is hidden (e.g. on mobile card view), ensure it is visible to print styles
    window.print();
  }
}

/**
 * Robust export to PNG image
 */
export async function exportToImage(elementId: string, filename: string): Promise<void> {
  const dataUrl = await captureElementToPng(elementId);

  // Direct download
  const link = document.createElement("a");
  link.download = `${filename}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export to Word (.docx) with Top Header Image matching PDF layout
 */
export async function exportToWord(invoice: Invoice): Promise<void> {
  const {
    Document,
    Packer,
    Paragraph,
    Table,
    TableRow,
    TableCell,
    TextRun,
    AlignmentType,
    WidthType,
    ShadingType,
    ImageRun,
    BorderStyle,
  } = await import("docx");
  const { saveAs } = await import("file-saver");

  const header = invoice.header || DEFAULT_COMPANY_HEADER;
  const {
    invoiceInfo,
    buyerDetails,
    items,
    bankDetails,
    taxDetails,
    subTotal,
    cgstAmount,
    sgstAmount,
    igstAmount,
    grandTotal,
    amountInWords,
    termsAndConditions,
  } = invoice;

  const tableBorder = {
    top: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
    left: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
    right: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
  };

  const headerShading = {
    type: ShadingType.SOLID,
    color: "243342",
    fill: "243342",
  };

  const darkHeaderShading = {
    type: ShadingType.SOLID,
    color: "1E2329",
    fill: "1E2329",
  };

  const sectionHeader = (title: string) =>
    new TableCell({
      children: [
        new Paragraph({
          children: [new TextRun({ text: title, bold: true, size: 19, color: "FFFFFF" })],
          alignment: AlignmentType.LEFT,
        }),
      ],
      shading: headerShading,
      margins: { top: 100, bottom: 100, left: 120, right: 120 },
      borders: tableBorder,
    });

  const labelCell = (text: string) =>
    new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 17, color: "1E293B" })] })],
      margins: { top: 80, bottom: 80, left: 100, right: 100 },
      borders: tableBorder,
      width: { size: 35, type: WidthType.PERCENTAGE },
    });

  const valueCell = (text: string, align: any = AlignmentType.LEFT) =>
    new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text, size: 17, color: "0F172A" })], alignment: align })],
      margins: { top: 80, bottom: 80, left: 100, right: 100 },
      borders: tableBorder,
    });

  const children: any[] = [];

  // Top Dynamic Company Header Table
  const companyHeaderTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          // Left: Company details
          new TableCell({
            width: { size: 70, type: WidthType.PERCENTAGE },
            shading: darkHeaderShading,
            margins: { top: 120, bottom: 120, left: 140, right: 140 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: header.companyName, bold: true, size: 26, color: "F59E0B" })],
              }),
              new Paragraph({
                children: [new TextRun({ text: header.tagline, size: 16, color: "CBD5E1" })],
              }),
              new Paragraph({
                children: [new TextRun({ text: header.address, size: 16, color: "E2E8F0" })],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Mobile: ", bold: true, color: "F59E0B", size: 16 }),
                  new TextRun({ text: `${header.phone} | `, color: "FFFFFF", size: 16 }),
                  new TextRun({ text: "Email: ", bold: true, color: "F59E0B", size: 16 }),
                  new TextRun({ text: header.email, color: "FFFFFF", size: 16 }),
                ],
              }),
            ],
          }),
          // Right: Document Title & GSTIN
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            shading: darkHeaderShading,
            margins: { top: 120, bottom: 120, left: 140, right: 140 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: header.invoiceTitle, bold: true, size: 24, color: "F59E0B" })],
                alignment: AlignmentType.RIGHT,
              }),
              new Paragraph({
                children: [new TextRun({ text: `GSTIN: ${header.gstin}`, bold: true, size: 16, color: "FFFFFF" })],
                alignment: AlignmentType.RIGHT,
              }),
              new Paragraph({
                children: [new TextRun({ text: `State Code: ${header.stateCode}`, size: 15, color: "94A3B8" })],
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
        ],
      }),
    ],
  });

  children.push(companyHeaderTable);

  children.push(new Paragraph({ text: "" }));

  // Two Column Table: Invoice Information & Buyer Details
  const infoTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [sectionHeader("INVOICE INFORMATION"), sectionHeader("BILLED TO / BUYER DETAILS")],
      }),
      new TableRow({
        children: [
          new TableCell({
            borders: tableBorder,
            children: [
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({ children: [labelCell("Invoice No:"), valueCell(invoiceInfo.invoiceNo)] }),
                  new TableRow({ children: [labelCell("Invoice Date:"), valueCell(invoiceInfo.invoiceDate)] }),
                  new TableRow({ children: [labelCell("Challan No:"), valueCell(invoiceInfo.challanNo)] }),
                  new TableRow({ children: [labelCell("P.O. Date / No:"), valueCell(invoiceInfo.poDateNo)] }),
                  new TableRow({ children: [labelCell("Place of Supply:"), valueCell(invoiceInfo.placeOfSupply)] }),
                ],
              }),
            ],
          }),
          new TableCell({
            borders: tableBorder,
            children: [
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({ children: [labelCell("Customer Name:"), valueCell(buyerDetails.customerName)] }),
                  new TableRow({ children: [labelCell("Address:"), valueCell(buyerDetails.address)] }),
                  new TableRow({ children: [labelCell("City / State:"), valueCell(buyerDetails.cityState)] }),
                  new TableRow({ children: [labelCell("GSTIN / PAN:"), valueCell(buyerDetails.gstinPan)] }),
                  new TableRow({ children: [labelCell("Contact No:"), valueCell(buyerDetails.contactNo)] }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
  children.push(infoTable);
  children.push(new Paragraph({ text: "" }));

  // Items Table
  const itemHeaderCell = (text: string, widthPct: number, align: any = AlignmentType.CENTER) =>
    new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 17, color: "FFFFFF" })], alignment: align })],
      shading: headerShading,
      margins: { top: 90, bottom: 90, left: 80, right: 80 },
      borders: tableBorder,
      width: { size: widthPct, type: WidthType.PERCENTAGE },
    });

  const itemRows = [
    new TableRow({
      children: [
        itemHeaderCell("#", 6),
        itemHeaderCell("Item Description & Specifications", 38, AlignmentType.LEFT),
        itemHeaderCell("HSN/SAC", 14),
        itemHeaderCell("Qty", 8),
        itemHeaderCell("Unit", 10),
        itemHeaderCell("Rate (₹)", 12, AlignmentType.RIGHT),
        itemHeaderCell("Amount (₹)", 12, AlignmentType.RIGHT),
      ],
    }),
    ...items.map((item, idx) => {
      const isAlt = idx % 2 === 1;
      const cellShading = isAlt
        ? { type: ShadingType.SOLID, color: "F8FAFC", fill: "F8FAFC" }
        : undefined;

      return new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: String(idx + 1), size: 16 })], alignment: AlignmentType.CENTER })],
            shading: cellShading,
            borders: tableBorder,
            margins: { top: 70, bottom: 70, left: 60, right: 60 },
          }),
          new TableCell({
            children: [
              new Paragraph({ children: [new TextRun({ text: item.description, bold: true, size: 17, color: "0F172A" })] }),
              ...(item.specifications
                ? [new Paragraph({ children: [new TextRun({ text: item.specifications, size: 15, color: "64748B" })] })]
                : []),
            ],
            shading: cellShading,
            borders: tableBorder,
            margins: { top: 70, bottom: 70, left: 80, right: 80 },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: item.hsnSac || "-", size: 16 })], alignment: AlignmentType.CENTER })],
            shading: cellShading,
            borders: tableBorder,
            margins: { top: 70, bottom: 70, left: 60, right: 60 },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: String(item.qty), size: 16 })], alignment: AlignmentType.CENTER })],
            shading: cellShading,
            borders: tableBorder,
            margins: { top: 70, bottom: 70, left: 60, right: 60 },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: item.unit, size: 16 })], alignment: AlignmentType.CENTER })],
            shading: cellShading,
            borders: tableBorder,
            margins: { top: 70, bottom: 70, left: 60, right: 60 },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: Number(item.rate).toLocaleString("en-IN", { minimumFractionDigits: 2 }), size: 16 })],
                alignment: AlignmentType.RIGHT,
              }),
            ],
            shading: cellShading,
            borders: tableBorder,
            margins: { top: 70, bottom: 70, left: 60, right: 60 },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: Number(item.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 }),
                    bold: true,
                    size: 16,
                  }),
                ],
                alignment: AlignmentType.RIGHT,
              }),
            ],
            shading: cellShading,
            borders: tableBorder,
            margins: { top: 70, bottom: 70, left: 60, right: 60 },
          }),
        ],
      });
    }),
  ];

  children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: itemRows }));
  children.push(new Paragraph({ text: "" }));

  // Bottom Section: Bank Details (Left) and Totals (Right)
  const bottomTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [sectionHeader("BANK PAYMENT DETAILS"), sectionHeader("CALCULATION & TOTALS")],
      }),
      new TableRow({
        children: [
          new TableCell({
            borders: tableBorder,
            children: [
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({ children: [labelCell("Bank Name:"), valueCell(bankDetails.bankName)] }),
                  new TableRow({ children: [labelCell("Account Holder:"), valueCell(bankDetails.accountHolder)] }),
                  new TableRow({ children: [labelCell("Account No:"), valueCell(bankDetails.accountNo)] }),
                  new TableRow({ children: [labelCell("IFSC Code:"), valueCell(bankDetails.ifscCode)] }),
                  new TableRow({ children: [labelCell("Branch:"), valueCell(bankDetails.branch)] }),
                ],
              }),
            ],
          }),
          new TableCell({
            borders: tableBorder,
            children: [
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    children: [
                      labelCell("Sub-Total (Excl. Tax)"),
                      valueCell(`₹ ${subTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, AlignmentType.RIGHT),
                    ],
                  }),
                  new TableRow({
                    children: [
                      labelCell(`CGST @ ${taxDetails.cgst}%`),
                      valueCell(`₹ ${cgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, AlignmentType.RIGHT),
                    ],
                  }),
                  new TableRow({
                    children: [
                      labelCell(`SGST @ ${taxDetails.sgst}%`),
                      valueCell(`₹ ${sgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, AlignmentType.RIGHT),
                    ],
                  }),
                  new TableRow({
                    children: [
                      labelCell(`IGST @ ${taxDetails.igst}%`),
                      valueCell(`₹ ${igstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, AlignmentType.RIGHT),
                    ],
                  }),
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: "GRAND TOTAL", bold: true, size: 20, color: "F5A623" })] })],
                        shading: headerShading,
                        margins: { top: 90, bottom: 90, left: 100, right: 100 },
                        borders: tableBorder,
                      }),
                      new TableCell({
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: `₹ ${grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
                                bold: true,
                                size: 21,
                                color: "F5A623",
                              }),
                            ],
                            alignment: AlignmentType.RIGHT,
                          }),
                        ],
                        shading: headerShading,
                        margins: { top: 90, bottom: 90, left: 100, right: 100 },
                        borders: tableBorder,
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
  children.push(bottomTable);
  children.push(new Paragraph({ text: "" }));

  // Amount in Words Box
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: "Amount in Words: ", bold: true, size: 17, color: "1E293B" }),
                    new TextRun({ text: amountInWords, italics: true, size: 17, color: "0F172A" }),
                  ],
                }),
              ],
              shading: { type: ShadingType.SOLID, color: "F1F5F9", fill: "F1F5F9" },
              borders: tableBorder,
              margins: { top: 100, bottom: 100, left: 120, right: 120 },
            }),
          ],
        }),
      ],
    })
  );
  children.push(new Paragraph({ text: "" }));

  // Terms and Conditions + Signatory
  const termsList = termsAndConditions
    .split("\n")
    .filter(Boolean)
    .map((line) => new Paragraph({ children: [new TextRun({ text: line, size: 15, color: "475569" })] }));

  const termsAndSignTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 60, type: WidthType.PERCENTAGE },
            borders: tableBorder,
            margins: { top: 100, bottom: 100, left: 120, right: 120 },
            children: [
              new Paragraph({ children: [new TextRun({ text: "TERMS & CONDITIONS", bold: true, size: 16, color: "1E293B" })] }),
              ...termsList,
            ],
          }),
          new TableCell({
            width: { size: 40, type: WidthType.PERCENTAGE },
            borders: tableBorder,
            margins: { top: 100, bottom: 100, left: 120, right: 120 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: "For, JSS ENTERPRISE", bold: true, size: 18, color: "0F172A" })],
                alignment: AlignmentType.RIGHT,
              }),
              new Paragraph({ text: "" }),
              new Paragraph({ text: "" }),
              new Paragraph({
                children: [new TextRun({ text: "____________________________", color: "94A3B8" })],
                alignment: AlignmentType.RIGHT,
              }),
              new Paragraph({
                children: [new TextRun({ text: "Authorized Signatory", bold: true, size: 16, color: "334155" })],
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
        ],
      }),
    ],
  });
  children.push(termsAndSignTable);

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              bottom: 720,
              left: 720,
              right: 720,
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const cleanNo = (invoice.invoiceInfo.invoiceNo || invoice.id).replace(/[/\\?%*:|"<>]/g, "-");
  saveAs(blob, `Invoice-${cleanNo}.docx`);
}

/**
 * Format invoice data as clean text for WhatsApp
 */
export function formatInvoiceForWhatsApp(invoice: Invoice): string {
  const header = invoice.header || DEFAULT_COMPANY_HEADER;
  const { invoiceInfo, buyerDetails, items, bankDetails, grandTotal, amountInWords, subTotal, cgstAmount, sgstAmount, igstAmount } = invoice;

  const itemLines = items
    .map(
      (it, idx) =>
        `${idx + 1}. *${it.description}*${it.specifications ? ` (${it.specifications})` : ""}\n   Qty: ${it.qty} ${it.unit} @ ₹${Number(it.rate).toLocaleString("en-IN")} = *₹${Number(it.amount).toLocaleString("en-IN")}*`
    )
    .join("\n");

  const text = `*${(header.invoiceTitle || "TAX INVOICE").toUpperCase()} — ${(header.companyName || "JSS ENTERPRISE").toUpperCase()}*
_${(header.tagline || "PRECISION | POWER | PROGRESS").toUpperCase()}_
📍 ${header.address}
📞 Mobile: ${header.phone} | ✉️ Email: ${header.email}
GSTIN: *${header.gstin}* (State Code: ${header.stateCode})

━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 *INVOICE DETAILS*
• *Invoice No:* ${invoiceInfo.invoiceNo || "INV-DRAFT"}
• *Date:* ${invoiceInfo.invoiceDate}
• *Challan No:* ${invoiceInfo.challanNo || "N/A"}
• *P.O. Date / No:* ${invoiceInfo.poDateNo || "N/A"}
• *Place of Supply:* ${invoiceInfo.placeOfSupply}

🏢 *BILLED TO (BUYER)*
• *Customer:* ${buyerDetails.customerName}
• *Address:* ${buyerDetails.address}
• *City / State:* ${buyerDetails.cityState}
• *GSTIN / PAN:* ${buyerDetails.gstinPan || "N/A"}
• *Contact:* ${buyerDetails.contactNo || "N/A"}

📦 *ITEMS & SPECIFICATIONS*
${itemLines}

━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 *PAYMENT SUMMARY*
• *Sub-Total (Excl. Tax):* ₹${subTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
• *CGST:* ₹${cgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
• *SGST:* ₹${sgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}${igstAmount > 0 ? `\n• *IGST:* ₹${igstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : ""}
• *GRAND TOTAL:* *₹${grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}*
• *Amount in Words:* _${amountInWords}_

🏦 *BANK PAYMENT DETAILS*
• *Bank:* ${bankDetails.bankName}
• *A/C Holder:* ${bankDetails.accountHolder}
• *A/C No:* ${bankDetails.accountNo}
• *IFSC Code:* ${bankDetails.ifscCode}
• *Branch:* ${bankDetails.branch}

━━━━━━━━━━━━━━━━━━━━━━━━━━
_Thank you for doing business with ${header.companyName || "JSS ENTERPRISE"}!_`;

  return text;
}

/**
 * Share invoice with PDF attached (via Web Share API) and full caption details
 */
export async function shareInvoiceToWhatsApp(
  invoice: Invoice,
  elementId?: string
): Promise<void> {
  const text = formatInvoiceForWhatsApp(invoice);
  const cleanNo = (invoice.invoiceInfo?.invoiceNo || invoice.id || "Invoice").replace(/[/\\?%*:|"<>]/g, "-");

  let phone = (invoice.buyerDetails?.contactNo || "").replace(/\D/g, "");
  if (phone.length === 10) {
    phone = "91" + phone;
  }

  const encoded = encodeURIComponent(text);
  const waUrl = phone.length >= 10
    ? `https://api.whatsapp.com/send?phone=${phone}&text=${encoded}`
    : `https://api.whatsapp.com/send?text=${encoded}`;

  // 1. Try native Web Share API with PDF attached (works on Android, iOS, tablets, and supported browsers)
  if (typeof navigator !== "undefined" && navigator.canShare) {
    try {
      let pdfBlob: Blob | null = null;
      if (elementId && document.getElementById(elementId)) {
        pdfBlob = await generatePDFBlob(elementId);
      }

      if (pdfBlob) {
        const file = new File([pdfBlob], `Invoice-${cleanNo}.pdf`, { type: "application/pdf" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Invoice ${invoice.invoiceInfo?.invoiceNo || ""} - ${invoice.header?.companyName || "JSS ENTERPRISE"}`,
            text: text,
            files: [file],
          });
          return;
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        return; // User cancelled share sheet
      }
      console.warn("Native file share fallback:", err);
    }
  }

  // 2. If element is available, auto-download the PDF so user has it ready
  if (elementId && document.getElementById(elementId)) {
    try {
      await exportToPDF(elementId, `Invoice-${cleanNo}`);
    } catch {}
  }

  // 3. Open WhatsApp - use window.location.href on mobile to prevent popup blocker suppression
  const isMobile = typeof window !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile) {
    window.location.href = waUrl;
  } else {
    window.open(waUrl, "_blank");
  }
}

/**
 * Export single invoice to Microsoft Excel (.xlsx) spreadsheet
 * (Professional layout with merged header, clean columns, and no dummy blank rows)
 */
export async function exportInvoiceToExcel(invoice: Invoice): Promise<void> {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();

  const cleanNo = (invoice.invoiceInfo?.invoiceNo || "Invoice").replace(/[/\\?%*:|"<>]/g, "-");
  const header = invoice.header || DEFAULT_COMPANY_HEADER;

  // Filter out any empty dummy rows (only genuine items)
  const validItems = (invoice.items || []).filter(
    (item) =>
      (item.description && item.description.trim() !== "" && item.description.trim() !== "-") ||
      Number(item.rate) > 0 ||
      Number(item.amount) > 0
  );
  const itemsToExport = validItems.length > 0 ? validItems : (invoice.items || []).slice(0, 1);

  const headerRows: any[][] = [
    [(header.companyName || "JSS ENTERPRISE").toUpperCase() + " - TAX INVOICE"],
    [header.tagline || "PRECISION | POWER | PROGRESS"],
    [header.address || ""],
    [`GSTIN: ${header.gstin || "-"}    State Code: ${header.stateCode || "-"}    Mobile: ${header.phone || "-"}    Email: ${header.email || "-"}`],
    [""],
    ["INVOICE INFORMATION", "", "BILLED TO / BUYER DETAILS", "", "", "", ""],
    ["Invoice No:", invoice.invoiceInfo?.invoiceNo || "-", "Customer Name:", invoice.buyerDetails?.customerName || "-", "", "", ""],
    ["Invoice Date:", invoice.invoiceInfo?.invoiceDate || "-", "Full Address:", invoice.buyerDetails?.address || "-", "", "", ""],
    ["Place of Supply:", invoice.invoiceInfo?.placeOfSupply || "-", "City / State:", invoice.buyerDetails?.cityState || "-", "", "", ""],
    ["Challan No:", invoice.invoiceInfo?.challanNo || "-", "GSTIN / PAN:", invoice.buyerDetails?.gstinPan || "-", "", "", ""],
    ["PO Date & No:", invoice.invoiceInfo?.poDateNo || "-", "Contact No:", invoice.buyerDetails?.contactNo || "-", "", "", ""],
    [""],
    ["S.No", "Product / Service Description & Specifications", "HSN/SAC", "Qty", "Unit", "Rate (₹)", "Amount (₹)"],
  ];

  // Items rows
  itemsToExport.forEach((item, idx) => {
    const fullDesc = item.description + (item.specifications ? ` (${item.specifications})` : "");
    headerRows.push([
      idx + 1,
      fullDesc,
      item.hsnSac || "-",
      Number(item.qty) || 1,
      item.unit || "Nos",
      Number(item.rate) || 0,
      Number(item.amount) || 0,
    ]);
  });

  // Totals Summary
  headerRows.push(
    [""],
    ["", "", "", "", "", "Taxable Subtotal (₹):", Number(invoice.subTotal) || 0],
    ["", "", "", "", "", `CGST @ ${invoice.taxDetails?.cgst || 0}% (₹):`, Number(invoice.cgstAmount) || 0],
    ["", "", "", "", "", `SGST @ ${invoice.taxDetails?.sgst || 0}% (₹):`, Number(invoice.sgstAmount) || 0],
    ["", "", "", "", "", `IGST @ ${invoice.taxDetails?.igst || 0}% (₹):`, Number(invoice.igstAmount) || 0],
    ["", "", "", "", "", "GRAND TOTAL (₹):", Number(invoice.grandTotal) || 0],
    ["", "", "", "", "", "Amount in Words:", invoice.amountInWords || ""],
    [""],
    ["BANK PAYMENT DETAILS", "", "", "TERMS & CONDITIONS", "", "", ""],
    ["Bank Name:", invoice.bankDetails?.bankName || "-", "", invoice.termsAndConditions || "", "", "", ""],
    ["Account Holder:", invoice.bankDetails?.accountHolder || "-", "", "", "", "", ""],
    ["Account No:", invoice.bankDetails?.accountNo || "-", "", "", "", "", ""],
    ["IFSC Code:", invoice.bankDetails?.ifscCode || "-", "", "", "", "", ""],
    ["Branch:", invoice.bankDetails?.branch || "-", "", "", "", "", ""]
  );

  const ws = XLSX.utils.aoa_to_sheet(headerRows);

  // Set Merges for title banners & section blocks
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // Company Title
    { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }, // Tagline
    { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } }, // Address
    { s: { r: 3, c: 0 }, e: { r: 3, c: 6 } }, // GSTIN / Phone / Email
    { s: { r: 5, c: 0 }, e: { r: 5, c: 1 } }, // Section Header: Invoice Info
    { s: { r: 5, c: 2 }, e: { r: 5, c: 6 } }, // Section Header: Buyer Details
    { s: { r: 6, c: 3 }, e: { r: 6, c: 6 } }, // Customer Name
    { s: { r: 7, c: 3 }, e: { r: 7, c: 6 } }, // Address
    { s: { r: 8, c: 3 }, e: { r: 8, c: 6 } }, // City / State
    { s: { r: 9, c: 3 }, e: { r: 9, c: 6 } }, // GSTIN
    { s: { r: 10, c: 3 }, e: { r: 10, c: 6 } }, // Contact
  ];

  // Set generous column widths so no text is truncated or clipped
  ws["!cols"] = [
    { wch: 18 }, // Col A (S.No / Labels)
    { wch: 48 }, // Col B (Description / Values)
    { wch: 18 }, // Col C (HSN/SAC / Labels)
    { wch: 12 }, // Col D (Qty)
    { wch: 12 }, // Col E (Unit)
    { wch: 24 }, // Col F (Rate / Totals Label)
    { wch: 26 }, // Col G (Amount / Values)
  ];

  XLSX.utils.book_append_sheet(wb, ws, `Tax Invoice`);
  XLSX.writeFile(wb, `Invoice-${cleanNo}.xlsx`);
}

/**
 * Export multiple selected invoices to Microsoft Excel (.xlsx) report
 * (Includes ALL bill data, master ledger, and itemized GST breakdowns)
 */
export async function exportMultipleInvoicesToExcel(invoices: Invoice[]): Promise<void> {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();

  // 1. Comprehensive Master Ledger (ALL DATA of every bill)
  const masterRows = invoices.map((inv, idx) => {
    // Generate summary of products billed
    const validItems = (inv.items || []).filter(
      (item) => (item.description && item.description.trim() !== "" && item.description.trim() !== "-") || Number(item.amount) > 0
    );
    const productListSummary = validItems
      .map((it) => `${it.description || "Item"}${it.qty ? ` (${it.qty} ${it.unit || "Nos"})` : ""}`)
      .join(", ");

    return {
      "S.No": idx + 1,
      "Invoice No": inv.invoiceInfo?.invoiceNo || "DRAFT",
      "Invoice Date": inv.invoiceInfo?.invoiceDate || "",
      "Customer / Buyer": inv.buyerDetails?.customerName || "",
      "Buyer Full Address": inv.buyerDetails?.address || "",
      "Buyer City / State": inv.buyerDetails?.cityState || "",
      "Buyer GSTIN / PAN": inv.buyerDetails?.gstinPan || "",
      "Buyer Contact No": inv.buyerDetails?.contactNo || "",
      "Place of Supply": inv.invoiceInfo?.placeOfSupply || "",
      "Challan No": inv.invoiceInfo?.challanNo || "",
      "PO Date & No": inv.invoiceInfo?.poDateNo || "",
      "Products Summary": productListSummary || "-",
      "Total Items Count": validItems.length,
      "Taxable Subtotal (₹)": Number(inv.subTotal) || 0,
      "CGST Rate (%)": Number(inv.taxDetails?.cgst) || 0,
      "CGST Amount (₹)": Number(inv.cgstAmount) || 0,
      "SGST Rate (%)": Number(inv.taxDetails?.sgst) || 0,
      "SGST Amount (₹)": Number(inv.sgstAmount) || 0,
      "IGST Rate (%)": Number(inv.taxDetails?.igst) || 0,
      "IGST Amount (₹)": Number(inv.igstAmount) || 0,
      "Grand Total (₹)": Number(inv.grandTotal) || 0,
      "Amount in Words": inv.amountInWords || "",
      "Bank Name": inv.bankDetails?.bankName || "",
      "Account Holder": inv.bankDetails?.accountHolder || "",
      "Account No": inv.bankDetails?.accountNo || "",
      "IFSC Code": inv.bankDetails?.ifscCode || "",
      "Branch": inv.bankDetails?.branch || "",
      "Terms & Conditions": inv.termsAndConditions || "",
      "Created Date": inv.createdAt ? new Date(inv.createdAt).toLocaleDateString("en-IN") : "",
    };
  });

  const wsMaster = XLSX.utils.json_to_sheet(masterRows);
  wsMaster["!cols"] = [
    { wch: 6 },  // S.No
    { wch: 18 }, // Invoice No
    { wch: 14 }, // Date
    { wch: 30 }, // Customer
    { wch: 36 }, // Address
    { wch: 22 }, // City/State
    { wch: 20 }, // GSTIN
    { wch: 16 }, // Contact
    { wch: 18 }, // Place of Supply
    { wch: 14 }, // Challan No
    { wch: 16 }, // PO Date/No
    { wch: 42 }, // Products Summary
    { wch: 18 }, // Items Count
    { wch: 20 }, // Taxable Subtotal
    { wch: 14 }, // CGST %
    { wch: 18 }, // CGST Amt
    { wch: 14 }, // SGST %
    { wch: 18 }, // SGST Amt
    { wch: 14 }, // IGST %
    { wch: 18 }, // IGST Amt
    { wch: 22 }, // Grand Total
    { wch: 45 }, // In Words
    { wch: 26 }, // Bank
    { wch: 22 }, // Holder
    { wch: 22 }, // Account No
    { wch: 16 }, // IFSC
    { wch: 28 }, // Branch
    { wch: 45 }, // Terms
    { wch: 16 }, // Created
  ];
  XLSX.utils.book_append_sheet(wb, wsMaster, "All Invoices (Full Data)");

  // 2. Line Items Detail Sheet (Itemized GST breakdown)
  const itemRows: any[] = [];
  invoices.forEach((inv) => {
    const validItems = (inv.items || []).filter(
      (item) => (item.description && item.description.trim() !== "" && item.description.trim() !== "-") || Number(item.amount) > 0
    );

    validItems.forEach((item, itemIdx) => {
      itemRows.push({
        "Invoice No": inv.invoiceInfo?.invoiceNo || "DRAFT",
        "Invoice Date": inv.invoiceInfo?.invoiceDate || "",
        "Customer / Buyer": inv.buyerDetails?.customerName || "",
        "Buyer GSTIN": inv.buyerDetails?.gstinPan || "",
        "Item #": itemIdx + 1,
        "Product Name / Description": item.description,
        "Specifications": item.specifications || "",
        "HSN / SAC Code": item.hsnSac || "-",
        "Quantity": Number(item.qty) || 1,
        "Unit": item.unit || "Nos",
        "Rate (₹)": Number(item.rate) || 0,
        "Line Amount (₹)": Number(item.amount) || 0,
        "CGST (%)": Number(inv.taxDetails?.cgst) || 0,
        "SGST (%)": Number(inv.taxDetails?.sgst) || 0,
        "IGST (%)": Number(inv.taxDetails?.igst) || 0,
        "Place of Supply": inv.invoiceInfo?.placeOfSupply || "",
      });
    });
  });

  const wsItems = XLSX.utils.json_to_sheet(itemRows);
  wsItems["!cols"] = [
    { wch: 18 }, // Invoice No
    { wch: 14 }, // Date
    { wch: 30 }, // Customer
    { wch: 20 }, // GSTIN
    { wch: 8 },  // Item #
    { wch: 36 }, // Product Description
    { wch: 26 }, // Specs
    { wch: 16 }, // HSN/SAC
    { wch: 12 }, // Qty
    { wch: 12 }, // Unit
    { wch: 16 }, // Rate
    { wch: 18 }, // Amount
    { wch: 12 }, // CGST %
    { wch: 12 }, // SGST %
    { wch: 12 }, // IGST %
    { wch: 18 }, // Place of Supply
  ];
  XLSX.utils.book_append_sheet(wb, wsItems, "Itemized GST Breakdown");

  const todayStr = new Date().toISOString().split("T")[0];
  XLSX.writeFile(wb, `JSS-Invoices-Report-${todayStr}.xlsx`);
}

