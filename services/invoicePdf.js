import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export async function generateInvoicePDF(data) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const margin = 50;
  let y = height - margin;
  const lineHeight = 16;
  const sectionGap = 25;
  const colGap = 30;

  const drawText = (text, x, y, { font: f = font, size = 12 } = {}) => {
    page.drawText(String(text), { x, y, font: f, size, color: rgb(0, 0, 0) });
  };

  drawText("INVOICE", margin, y, { font: boldFont, size: 28 });
  drawText(`#${data.invoiceNumber}`, width - margin - 100, y, { font: boldFont, size: 18 });
  y -= lineHeight * 2;

  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 1.5,
    color: rgb(0, 0, 0)
  });
  y -= sectionGap;

  drawText("FROM", margin, y, { font: boldFont, size: 14 }); y -= lineHeight;
  drawText(data.companyName, margin, y, { font: boldFont }); y -= lineHeight;
  drawText(data.companyAddress1, margin, y); y -= lineHeight;
  if (data.companyAddress2) { drawText(data.companyAddress2, margin, y); y -= lineHeight; }
  drawText(`Phone: ${data.companyPhone}`, margin, y);
  y -= sectionGap;

  let clientY = height - margin - lineHeight * 2 - sectionGap;
  const clientX = margin + ((width - 3 * margin) / 2) + colGap;
  drawText("TO", clientX, clientY, { font: boldFont, size: 14 }); clientY -= lineHeight;
  drawText(data.clientName, clientX, clientY, { font: boldFont }); clientY -= lineHeight;
  drawText(data.clientAddress1, clientX, clientY); clientY -= lineHeight;
  if (data.clientAddress2) { drawText(data.clientAddress2, clientX, clientY); clientY -= lineHeight; }
  drawText(`Email: ${data.clientEmail}`, clientX, clientY); clientY -= lineHeight;
  drawText(`Phone: ${data.clientPhone}`, clientX, clientY);

  const detailsY = clientY - sectionGap;
  drawText(`Invoice Date: ${new Date(data.sendDate).toLocaleDateString()}`, margin, detailsY);
  drawText(`Due Date: ${new Date(data.dueDate).toLocaleDateString()}`, clientX, detailsY);

  const tableTopY = detailsY - sectionGap * 1.5;
  page.drawLine({
    start: { x: margin, y: tableTopY + 10 },
    end: { x: width - margin, y: tableTopY + 10 },
    thickness: 1
  });

  drawText("DESCRIPTION", margin, tableTopY - 10, { font: boldFont });
  drawText("QTY", width - margin - 190, tableTopY - 10, { font: boldFont });
  drawText("RATE", width - margin - 120, tableTopY - 10, { font: boldFont });
  drawText("AMOUNT", width - margin - 50, tableTopY - 10, { font: boldFont });

  page.drawLine({
    start: { x: margin, y: tableTopY - 20 },
    end: { x: width - margin, y: tableTopY - 20 },
    thickness: 1
  });

  const itemY = tableTopY - lineHeight - 20;
  drawText(data.serviceDescription, margin, itemY);
  drawText(data.qty.toString(), width - margin - 190, itemY);
  drawText(`${data.currency} ${parseFloat(data.rate).toFixed(2)}`, width - margin - 120, itemY);
  drawText(`${data.currency} ${(parseFloat(data.qty) * parseFloat(data.rate)).toFixed(2)}`, width - margin - 50, itemY);

  const summaryY = itemY - sectionGap * 2;
  drawText("SUMMARY", margin, summaryY, { font: boldFont, size: 14 });
  page.drawLine({
    start: { x: margin, y: summaryY - 10 },
    end: { x: width - margin, y: summaryY - 10 },
    thickness: 1
  });

  let summaryLineY = summaryY - lineHeight - 10;
  const labelX = width - margin - 190;
  const valueX = width - margin - 90;

  drawText("Subtotal:", labelX, summaryLineY);
  drawText(`${data.currency} ${parseFloat(data.subtotalValue).toFixed(2)}`, valueX, summaryLineY);

  summaryLineY -= lineHeight;
  drawText(`Tax (${getPercentage(data.subtotalValue, data.taxAmountValue)}%):`, labelX, summaryLineY);
  drawText(`${data.currency} ${parseFloat(data.taxAmountValue).toFixed(2)}`, valueX, summaryLineY);

  summaryLineY -= lineHeight;
  drawText(`Discount (${getPercentage(data.subtotalValue, data.discountAmountValue)}%):`, labelX, summaryLineY);
  drawText(`${data.currency} ${parseFloat(data.discountAmountValue).toFixed(2)}`, valueX, summaryLineY);

  const totalY = summaryLineY - lineHeight - 10;
  page.drawLine({
    start: { x: labelX, y: totalY + 5 },
    end: { x: width - margin - 10, y: totalY + 5 },
    thickness: 1
  });

  drawText("TOTAL:", labelX, totalY - lineHeight, { font: boldFont, size: 14 });
  drawText(`${data.currency} ${parseFloat(data.totalAmountValue).toFixed(2)}`, valueX, totalY - lineHeight, {
    font: boldFont,
    size: 14
  });

  if (data.extraNotes?.trim()) {
    const notesY = totalY - lineHeight * 2;
    drawText("NOTES:", margin, notesY, { font: boldFont });
    drawText(data.extraNotes, margin, notesY - lineHeight);
  }

  const footerY = 50;
  page.drawLine({
    start: { x: margin, y: footerY + 20 },
    end: { x: width - margin, y: footerY + 20 },
    thickness: 1
  });

  drawText("Thank you for your business!", margin, footerY);
  drawText(
    `${data.companyName} - ${data.companyAddress1}, ${data.companyAddress2} | Phone: ${data.companyPhone}`,
    margin,
    footerY - lineHeight,
    { size: 10 }
  );

  return await pdfDoc.save();
}

function getPercentage(base, portion) {
  const b = parseFloat(base), p = parseFloat(portion);
  if (!b || !p) return "0.0";
  return ((p / b) * 100).toFixed(1);
}
