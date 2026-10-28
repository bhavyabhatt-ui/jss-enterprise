import { Invoice } from "@/types/invoice";
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

  // Generate high-resolution image at fixed 800px width (pixelRatio: 2 gives 300 DPI sharpness)
  const dataUrl = await toPng(element, {
    quality: 1,
    pixelRatio: 2,
    backgroundColor: "#ffffff",
    cacheBust: true,
    width: 800,
    style: {
      transform: "none",
      boxShadow: "none",
      margin: "0",
      width: "800px",
      minWidth: "800px",
      maxWidth: "800px",
    },
  });

  return dataUrl;
}

/**
 * Robust export to PDF using html-to-image + jsPDF
 */
export async function exportToPDF(elementId: string, filename: string): Promise<void> {
  const { default: jsPDF } = await import("jspdf");

  const dataUrl = await captureElementToPng(elementId);

  // Load image to determine exact aspect ratio
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
  const imgWidth = pageWidth;
  const imgHeight = (img.height * pageWidth) / img.width;

  if (imgHeight <= pageHeight) {
    // Fits on a single A4 page
    pdf.addImage(dataUrl, "PNG", 0, 0, imgWidth, imgHeight, undefined, "FAST");
  } else {
    // Multi-page handling
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(dataUrl, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(dataUrl, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= pageHeight;
    }
  }

  pdf.save(`${filename}.pdf`);
}

/**
 * Generate PDF as Blob for Web Share API
 */
export async function generatePDFBlob(elementId: string): Promise<Blob> {
  const { default: jsPDF } = await import("jspdf");

  const dataUrl = await captureElementToPng(elementId);

  const img = new Image();
  img.src = dataUrl;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Failed to load invoice image"));
  });

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const imgWidth = pageWidth;
  const imgHeight = (img.height * pageWidth) / img.width;

  pdf.addImage(dataUrl, "PNG", 0, 0, imgWidth, imgHeight, undefined, "FAST");
  return pdf.output("blob");
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

  // Convert Base64 image to Uint8Array for docx ImageRun
  let headerImageRun: any = null;
  try {
    const base64Data = HEADER_IMAGE_BASE64.replace(/^data:image\/\w+;base64,/, "");
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    headerImageRun = new ImageRun({
      data: bytes,
      transformation: {
        width: 600,
        height: 122,
      },
      type: "png",
    });
  } catch (err) {
    console.error("Failed to convert header image for Word:", err);
  }

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

  // Top header image
  if (headerImageRun) {
    children.push(
      new Paragraph({
        children: [headerImageRun],
        alignment: AlignmentType.CENTER,
      })
    );
  } else {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: "JSS ENTERPRISE — TAX INVOICE", bold: true, size: 28, color: "243342" })],
        alignment: AlignmentType.CENTER,
      })
    );
  }

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
  const { invoiceInfo, buyerDetails, items, bankDetails, grandTotal, amountInWords, subTotal, cgstAmount, sgstAmount } = invoice;

  const itemLines = items
    .map(
      (it, idx) =>
        `${idx + 1}. *${it.description}*${it.specifications ? ` (${it.specifications})` : ""}\n   Qty: ${it.qty} ${it.unit} @ ₹${Number(it.rate).toLocaleString("en-IN")} = *₹${Number(it.amount).toLocaleString("en-IN")}*`
    )
    .join("\n");

  const text = `*TAX INVOICE — JSS ENTERPRISE*
_PRECISION | POWER | PROGRESS_
Pushpak Co-Op Hsg Soc., Kathwada Road, Ahmedabad - 382430
Mobile: +91 8905605092 | Email: jssenterprise0411@gmail.com
GSTIN: 24LRHPS9541P1ZN

━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 *INVOICE DETAILS*
• *Invoice No:* ${invoiceInfo.invoiceNo}
• *Date:* ${invoiceInfo.invoiceDate}
• *Challan No:* ${invoiceInfo.challanNo || "N/A"}
• *P.O. No:* ${invoiceInfo.poDateNo || "N/A"}
• *Place of Supply:* ${invoiceInfo.placeOfSupply}

🏢 *BILLED TO (BUYER)*
• *Customer:* ${buyerDetails.customerName}
• *Address:* ${buyerDetails.address}
• *City/State:* ${buyerDetails.cityState}
• *GSTIN/PAN:* ${buyerDetails.gstinPan || "N/A"}
• *Contact:* ${buyerDetails.contactNo || "N/A"}

📦 *ITEMS & SPECIFICATIONS*
${itemLines}

━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 *PAYMENT SUMMARY*
• *Sub-Total (Excl. Tax):* ₹${subTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
• *Taxes (CGST + SGST):* ₹${(cgstAmount + sgstAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
• *GRAND TOTAL:* *₹${grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}*
• *Amount in Words:* _${amountInWords}_

🏦 *BANK PAYMENT DETAILS*
• *Bank:* ${bankDetails.bankName}
• *A/C Holder:* ${bankDetails.accountHolder}
• *A/C No:* ${bankDetails.accountNo}
• *IFSC:* ${bankDetails.ifscCode}
• *Branch:* ${bankDetails.branch}

━━━━━━━━━━━━━━━━━━━━━━━━━━
_Thank you for doing business with JSS ENTERPRISE!_`;

  return text;
}

/**
 * Open WhatsApp directly with formatted invoice text, or native share with PDF
 */
export async function shareInvoiceToWhatsApp(
  invoice: Invoice,
  elementId?: string
): Promise<void> {
  const text = formatInvoiceForWhatsApp(invoice);

  // Try native share with PDF file first if available (e.g. mobile or supported desktop browsers)
  if (elementId && typeof navigator !== "undefined" && navigator.canShare) {
    try {
      const pdfBlob = await generatePDFBlob(elementId);
      const cleanNo = (invoice.invoiceInfo.invoiceNo || invoice.id).replace(/[/\\?%*:|"<>]/g, "-");
      const file = new File([pdfBlob], `Invoice-${cleanNo}.pdf`, { type: "application/pdf" });

      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Invoice ${invoice.invoiceInfo.invoiceNo} - JSS ENTERPRISE`,
          text: text,
          files: [file],
        });
        return;
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.warn("Native file share fallback to URL:", err);
      } else {
        return;
      }
    }
  }

  // Direct WhatsApp Web / App link
  let phone = invoice.buyerDetails.contactNo.replace(/\D/g, "");
  if (phone.length === 10) {
    phone = "91" + phone;
  }

  const encoded = encodeURIComponent(text);
  const url = phone.length >= 10
    ? `https://api.whatsapp.com/send?phone=${phone}&text=${encoded}`
    : `https://api.whatsapp.com/send?text=${encoded}`;

  window.open(url, "_blank");
}
