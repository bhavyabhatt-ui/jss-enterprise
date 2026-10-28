import { Invoice } from "@/types/invoice";

export async function exportToPDF(elementId: string, filename: string) {
  const { default: html2canvas } = await import("html2canvas");
  const { default: jsPDF } = await import("jspdf");

  const element = document.getElementById(elementId);
  if (!element) return;

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    logging: false,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  const ratio = canvasWidth / pdfWidth;
  const scaledHeight = canvasHeight / ratio;

  // Multi-page if needed
  let yPos = 0;
  while (yPos < scaledHeight) {
    if (yPos > 0) pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, -(yPos * ratio) / ratio, pdfWidth, scaledHeight);
    yPos += pdfHeight;
  }

  pdf.save(`${filename}.pdf`);
}

export async function exportToImage(elementId: string, filename: string) {
  const { default: html2canvas } = await import("html2canvas");
  const { saveAs } = await import("file-saver");

  const element = document.getElementById(elementId);
  if (!element) return;

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    logging: false,
  });

  canvas.toBlob((blob) => {
    if (blob) saveAs(blob, `${filename}.png`);
  });
}

export async function exportToWord(invoice: Invoice) {
  const { Document, Packer, Paragraph, Table, TableRow, TableCell,
          TextRun, HeadingLevel, AlignmentType, WidthType, BorderStyle,
          ShadingType } = await import("docx");
  const { saveAs } = await import("file-saver");

  const { invoiceInfo, buyerDetails, items, bankDetails, taxDetails,
          subTotal, cgstAmount, sgstAmount, igstAmount, grandTotal,
          amountInWords, termsAndConditions } = invoice;

  function boldCell(text: string, shade = false) {
    return new TableCell({
      children: [new Paragraph({
        children: [new TextRun({ text, bold: true, size: 20 })],
        alignment: AlignmentType.LEFT,
      })],
      shading: shade ? { type: ShadingType.SOLID, color: "1a1a2e", fill: "1a1a2e" } : undefined,
    });
  }

  function cell(text: string) {
    return new TableCell({
      children: [new Paragraph({
        children: [new TextRun({ text, size: 18 })],
      })],
    });
  }

  const doc = new Document({
    sections: [{
      children: [
        // Title
        new Paragraph({
          children: [new TextRun({ text: "JSS ENTERPRISE — TAX INVOICE", bold: true, size: 28, color: "1a1a2e" })],
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({ text: "" }),

        // Invoice Info
        new Paragraph({ children: [new TextRun({ text: "INVOICE INFORMATION", bold: true, size: 24, color: "ffffff" })], alignment: AlignmentType.LEFT }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [boldCell("Invoice No:"), cell(invoiceInfo.invoiceNo), boldCell("Invoice Date:"), cell(invoiceInfo.invoiceDate)] }),
            new TableRow({ children: [boldCell("Challan No:"), cell(invoiceInfo.challanNo), boldCell("P.O. Date/No:"), cell(invoiceInfo.poDateNo)] }),
            new TableRow({ children: [boldCell("Place of Supply:"), cell(invoiceInfo.placeOfSupply), cell(""), cell("")] }),
          ],
        }),
        new Paragraph({ text: "" }),

        // Buyer Details
        new Paragraph({ children: [new TextRun({ text: "BILLED TO / BUYER DETAILS", bold: true, size: 24 })] }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [boldCell("Customer Name:"), cell(buyerDetails.customerName)] }),
            new TableRow({ children: [boldCell("Address:"), cell(buyerDetails.address)] }),
            new TableRow({ children: [boldCell("City/State:"), cell(buyerDetails.cityState)] }),
            new TableRow({ children: [boldCell("GSTIN/PAN:"), cell(buyerDetails.gstinPan)] }),
            new TableRow({ children: [boldCell("Contact No:"), cell(buyerDetails.contactNo)] }),
          ],
        }),
        new Paragraph({ text: "" }),

        // Items
        new Paragraph({ children: [new TextRun({ text: "ITEM DESCRIPTION & SPECIFICATIONS", bold: true, size: 24 })] }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: ["#", "Description", "HSN/SAC", "Qty", "Unit", "Rate (₹)", "Amount (₹)"].map(h =>
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 18, color: "ffffff" })], alignment: AlignmentType.CENTER })],
                  shading: { type: ShadingType.SOLID, color: "1a1a2e", fill: "1a1a2e" },
                })
              ),
            }),
            ...items.map((item, idx) =>
              new TableRow({
                children: [
                  cell(String(idx + 1)),
                  new TableCell({ children: [
                    new Paragraph({ children: [new TextRun({ text: item.description, bold: true, size: 18 })] }),
                    new Paragraph({ children: [new TextRun({ text: item.specifications, size: 16, color: "888888" })] }),
                  ]}),
                  cell(item.hsnSac),
                  cell(String(item.qty)),
                  cell(item.unit),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: Number(item.rate).toLocaleString("en-IN", { minimumFractionDigits: 2 }), size: 18 })], alignment: AlignmentType.RIGHT })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: Number(item.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 }), bold: true, size: 18 })], alignment: AlignmentType.RIGHT })] }),
                ],
              })
            ),
          ],
        }),
        new Paragraph({ text: "" }),

        // Bank + Totals
        new Paragraph({ children: [new TextRun({ text: "BANK PAYMENT DETAILS", bold: true, size: 24 })] }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [boldCell("Bank Name:"), cell(bankDetails.bankName)] }),
            new TableRow({ children: [boldCell("Account Holder:"), cell(bankDetails.accountHolder)] }),
            new TableRow({ children: [boldCell("Account No:"), cell(bankDetails.accountNo)] }),
            new TableRow({ children: [boldCell("IFSC Code:"), cell(bankDetails.ifscCode)] }),
            new TableRow({ children: [boldCell("Branch:"), cell(bankDetails.branch)] }),
          ],
        }),
        new Paragraph({ text: "" }),

        // Totals
        new Table({
          width: { size: 50, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [boldCell("Sub-Total (Excl. Tax)"), cell(`₹${subTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`)] }),
            new TableRow({ children: [boldCell(`CGST @ ${taxDetails.cgst}%`), cell(`₹${cgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`)] }),
            new TableRow({ children: [boldCell(`SGST @ ${taxDetails.sgst}%`), cell(`₹${sgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`)] }),
            new TableRow({ children: [boldCell(`IGST @ ${taxDetails.igst}%`), cell(`₹${igstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`)] }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "GRAND TOTAL", bold: true, size: 22, color: "f5a623" })], alignment: AlignmentType.LEFT })], shading: { type: ShadingType.SOLID, color: "1a1a2e", fill: "1a1a2e" } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `₹${grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, bold: true, size: 22, color: "f5a623" })], alignment: AlignmentType.RIGHT })], shading: { type: ShadingType.SOLID, color: "1a1a2e", fill: "1a1a2e" } }),
              ],
            }),
          ],
        }),
        new Paragraph({ text: "" }),
        new Paragraph({ children: [new TextRun({ text: `Amount in Words: ${amountInWords}`, italics: true, size: 18 })] }),
        new Paragraph({ text: "" }),

        // Terms
        new Paragraph({ children: [new TextRun({ text: "TERMS & CONDITIONS", bold: true, size: 20 })] }),
        ...termsAndConditions.split("\n").filter(Boolean).map(
          (line) => new Paragraph({ children: [new TextRun({ text: line, size: 18 })] })
        ),
        new Paragraph({ text: "" }),
        new Paragraph({ children: [new TextRun({ text: "For, JSS ENTERPRISE", bold: true, size: 20 })], alignment: AlignmentType.RIGHT }),
        new Paragraph({ text: "" }),
        new Paragraph({ children: [new TextRun({ text: "Authorized Signatory", size: 18 })], alignment: AlignmentType.RIGHT }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Invoice-${invoice.invoiceInfo.invoiceNo || invoice.id}.docx`);
}

