const PDFDocument = require("pdfkit");

const BRAND = "Ovee Collection";
const MAROON = "#6E1423";
const GOLD = "#C89B3C";
const INK = "#2A1E1B";
const MUTED = "#8A7D78";

function formatINR(amount) {
  return `Rs. ${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(Number(amount))}`;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * Streams a one-page invoice PDF for the given order directly to `res`.
 * `order` must include its `items`. Caller is responsible for auth/
 * ownership checks before calling this — this function itself doesn't
 * check who's asking, it just renders whatever order it's given.
 */
function streamInvoicePdf(order, res) {
  const doc = new PDFDocument({ size: "A4", margin: 50 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="invoice-${order.orderNumber}.pdf"`);
  doc.pipe(res);

  // Header
  doc.fillColor(MAROON).fontSize(22).font("Helvetica-Bold").text(BRAND, 50, 50);
  doc.fillColor(MUTED).fontSize(9).font("Helvetica").text("Handloom & Silk Sarees", 50, 76);

  doc.fillColor(INK).fontSize(16).font("Helvetica-Bold").text("INVOICE", 400, 50, { align: "right" });
  doc.fillColor(MUTED).fontSize(9).font("Helvetica");
  doc.text(`Invoice #: ${order.orderNumber}`, 400, 72, { align: "right" });
  doc.text(`Date: ${formatDate(order.createdAt)}`, 400, 86, { align: "right" });
  doc.text(`Status: ${order.status}`, 400, 100, { align: "right" });

  // Gold divider
  doc.moveTo(50, 125).lineTo(545, 125).lineWidth(1.5).strokeColor(GOLD).stroke();

  // Bill To
  doc.fillColor(INK).fontSize(11).font("Helvetica-Bold").text("Bill To", 50, 145);
  doc.font("Helvetica").fontSize(10).fillColor(INK);
  doc.text(order.customerName, 50, 162);
  doc.fillColor(MUTED);
  doc.text(order.addressLine, 50, 177, { width: 250 });
  doc.text(`${order.city}, ${order.state} - ${order.pincode}`, 50, 205);
  doc.text(order.phone, 50, 220);
  doc.text(order.email, 50, 235);

  if (order.giftWrap) {
    doc.fillColor(MAROON).font("Helvetica-Bold").fontSize(9).text("GIFT WRAPPED ORDER", 350, 145);
    if (order.giftNote) {
      doc.fillColor(MUTED).font("Helvetica").fontSize(9).text(`Note: "${order.giftNote}"`, 350, 160, { width: 195 });
    }
  }

  // Items table
  let y = 270;
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(10);
  doc.text("Item", 50, y);
  doc.text("Qty", 350, y, { width: 50, align: "right" });
  doc.text("Price", 410, y, { width: 60, align: "right" });
  doc.text("Total", 480, y, { width: 65, align: "right" });
  y += 15;
  doc.moveTo(50, y).lineTo(545, y).lineWidth(0.5).strokeColor("#DDD").stroke();
  y += 10;

  doc.font("Helvetica").fontSize(10).fillColor(INK);
  for (const item of order.items) {
    const lineTotal = Number(item.price) * item.quantity;
    doc.text(item.productName, 50, y, { width: 280 });
    doc.text(String(item.quantity), 350, y, { width: 50, align: "right" });
    doc.text(formatINR(item.price), 410, y, { width: 60, align: "right" });
    doc.text(formatINR(lineTotal), 480, y, { width: 65, align: "right" });
    y += 22;
  }

  y += 5;
  doc.moveTo(50, y).lineTo(545, y).lineWidth(0.5).strokeColor("#DDD").stroke();
  y += 15;

  // Totals block
  const totalsX = 380;
  const valueX = 480;
  const addTotalRow = (label, value, opts = {}) => {
    doc.font(opts.bold ? "Helvetica-Bold" : "Helvetica").fontSize(opts.bold ? 11 : 10);
    doc.fillColor(opts.color || INK);
    doc.text(label, totalsX, y, { width: 90 });
    doc.text(value, valueX, y, { width: 65, align: "right" });
    y += opts.bold ? 20 : 16;
  };

  addTotalRow("Subtotal", formatINR(order.subtotal));
  addTotalRow("Shipping", Number(order.shippingFee) === 0 ? "Free" : formatINR(order.shippingFee));
  if (order.giftWrap && Number(order.giftWrapFee) > 0) {
    addTotalRow("Gift wrap", formatINR(order.giftWrapFee));
  }
  if (Number(order.discountAmount) > 0) {
    addTotalRow(`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`, `-${formatINR(order.discountAmount)}`, {
      color: "#1F4032",
    });
  }
  doc.moveTo(totalsX, y).lineTo(545, y).lineWidth(0.5).strokeColor("#DDD").stroke();
  y += 8;
  addTotalRow("Total", formatINR(order.totalAmount), { bold: true });

  // Footer
  doc
    .fontSize(8)
    .fillColor(MUTED)
    .font("Helvetica")
    .text(
      "This is a computer-generated invoice and does not require a signature. For support, contact us with your invoice number.",
      50,
      740,
      { width: 495, align: "center" }
    );

  doc.end();
}

module.exports = { streamInvoicePdf };
