const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");

const BRAND = "Ovee Collection";
const MAROON = "#6E1423";
const GOLD = "#C89B3C";
const INK = "#2A1E1B";
const MUTED = "#8A7D78";
const IVORY = "#FBF6EE";
const PAGE_WIDTH = 595.28; // A4 at 72dpi
const MARGIN = 50;
const CONTENT_RIGHT = PAGE_WIDTH - MARGIN;
const LOGO_PATH = path.join(__dirname, "..", "assets", "logo.png");

const STORE_INFO = {
  address: "Shop No. 1, Savali Apartment, Opposite Adiraj Cluster, Behind Dualat Petrol Pump, Pirangut Road, Bhugaon - 412115",
  email: "oveecollection1103@gmail.com",
  instagram: "@ovee_collection_pune",
};

function formatINR(amount) {
  return `Rs. ${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(Number(amount))}`;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

// A simple, good-enough number-to-words converter for INR amounts — Indian
// invoices conventionally include this ("Rupees Twelve Thousand Only") so
// the total can't be silently altered by editing a single digit.
function numberToWords(num) {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function twoDigits(n) {
    if (n < 20) return ones[n];
    return `${tens[Math.floor(n / 10)]}${n % 10 ? " " + ones[n % 10] : ""}`;
  }
  function threeDigits(n) {
    if (n < 100) return twoDigits(n);
    return `${ones[Math.floor(n / 100)]} Hundred${n % 100 ? " " + twoDigits(n % 100) : ""}`;
  }

  let n = Math.round(Number(num));
  if (n === 0) return "Zero";
  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const hundred = n;

  const parts = [];
  if (crore) parts.push(`${threeDigits(crore)} Crore`);
  if (lakh) parts.push(`${threeDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${threeDigits(thousand)} Thousand`);
  if (hundred) parts.push(threeDigits(hundred));
  return parts.join(" ");
}

/**
 * Streams a one-page invoice PDF for the given order directly to `res`.
 * `order` must include its `items`. Caller is responsible for auth/
 * ownership checks before calling this — this function itself doesn't
 * check who's asking, it just renders whatever order it's given.
 */
function streamInvoicePdf(order, res) {
  const doc = new PDFDocument({ size: "A4", margin: MARGIN });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="invoice-${order.orderNumber}.pdf"`);
  doc.pipe(res);

  // --- Header band (generously tall — plenty of room so nothing here
  //     can ever visually collide, even with a long order number) ---
  const HEADER_HEIGHT = 125;
  doc.rect(0, 0, PAGE_WIDTH, HEADER_HEIGHT).fill(MAROON);

  const hasLogo = fs.existsSync(LOGO_PATH);
  let brandTextX = MARGIN;
  if (hasLogo) {
    try {
      doc.image(LOGO_PATH, MARGIN, 28, { width: 44, height: 44 });
      brandTextX = MARGIN + 54;
    } catch {
      // If the logo file exists but isn't a valid image for any reason,
      // just fall back to text-only — never let a bad logo file break
      // invoice generation.
      brandTextX = MARGIN;
    }
  }
  doc.fillColor(IVORY).fontSize(20).font("Helvetica-Bold").text(BRAND, brandTextX, 32, { width: 260 });
  doc.fontSize(9).font("Helvetica").fillColor(GOLD).text("Handloom & Silk Sarees", brandTextX, 56, { width: 260 });
  doc.fontSize(7.5).font("Helvetica").fillColor(IVORY).opacity(0.75).text(STORE_INFO.address, brandTextX, 72, { width: 260 });
  doc.opacity(1);

  // Right column — its own fixed width, well clear of the left column, and
  // each line on its own generously-spaced row so a long invoice number
  // can never run into "TAX INVOICE" or the date/status lines above/below.
  const rightColWidth = 220;
  const rightColX = PAGE_WIDTH - MARGIN - rightColWidth;
  doc.fontSize(15).font("Helvetica-Bold").fillColor(IVORY).text("TAX INVOICE", rightColX, 30, {
    width: rightColWidth,
    align: "right",
  });
  doc.fontSize(8.5).font("Helvetica").fillColor(IVORY);
  doc.text(`Invoice #: ${order.orderNumber}`, rightColX, 54, { width: rightColWidth, align: "right" });
  doc.text(`Date: ${formatDate(order.createdAt)}`, rightColX, 68, { width: rightColWidth, align: "right" });
  doc.text(`Status: ${order.status}`, rightColX, 82, { width: rightColWidth, align: "right" });

  // Thin gold seam under the header band
  doc.rect(0, HEADER_HEIGHT, PAGE_WIDTH, 3).fill(GOLD);

  // --- Bill To / Payment Details (two columns) ---
  let y = HEADER_HEIGHT + 25;
  doc.fillColor(INK).fontSize(11).font("Helvetica-Bold").text("Bill To", MARGIN, y);
  doc.font("Helvetica").fontSize(10).fillColor(INK).text(order.customerName, MARGIN, y + 17, { width: 260 });
  doc.fillColor(MUTED);
  doc.text(order.addressLine, MARGIN, y + 32, { width: 260 });
  const addressLines = doc.heightOfString(order.addressLine, { width: 260 });
  const afterAddressY = y + 32 + addressLines + 4;
  doc.text(`${order.city}, ${order.state} - ${order.pincode}`, MARGIN, afterAddressY, { width: 260 });
  doc.text(order.phone, MARGIN, afterAddressY + 15);
  doc.text(order.email, MARGIN, afterAddressY + 30);

  const rightColX2 = 340;
  doc.fillColor(INK).fontSize(11).font("Helvetica-Bold").text("Payment Details", rightColX2, y);
  doc.font("Helvetica").fontSize(9.5).fillColor(MUTED);
  let py = y + 17;
  const paymentLine = (text) => {
    doc.text(text, rightColX2, py, { width: 205 });
    py += doc.heightOfString(text, { width: 205 }) + 4;
  };
  paymentLine("Method: Razorpay (UPI/Card/Netbanking)");
  if (order.razorpayPaymentId) paymentLine(`Transaction ID: ${order.razorpayPaymentId}`);
  if (order.couponCode) paymentLine(`Coupon applied: ${order.couponCode}`);
  if (order.giftWrap) {
    doc.fillColor(MAROON).font("Helvetica-Bold").fontSize(9);
    doc.text("Gift wrapped order", rightColX2, py, { width: 205 });
    py += 13;
    if (order.giftNote) {
      doc.fillColor(MUTED).font("Helvetica").fontSize(8.5);
      const note = `Note: "${order.giftNote}"`;
      doc.text(note, rightColX2, py, { width: 205 });
      py += doc.heightOfString(note, { width: 205 }) + 4;
    }
  }

  // --- Items table (always starts well below both columns above,
  //     regardless of how many lines the address/payment details needed) ---
  y = Math.max(afterAddressY + 50, py + 15, HEADER_HEIGHT + 140);
  doc.rect(MARGIN, y, CONTENT_RIGHT - MARGIN, 20).fill("#F4E3D7");
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(9.5);
  doc.text("Item", MARGIN + 8, y + 6);
  doc.text("Qty", 340, y + 6, { width: 40, align: "right" });
  doc.text("Price", 390, y + 6, { width: 65, align: "right" });
  doc.text("Total", 465, y + 6, { width: 80, align: "right" });
  y += 28;

  doc.font("Helvetica").fontSize(9.5).fillColor(INK);
  let rowIndex = 0;
  for (const item of order.items) {
    const lineTotal = Number(item.price) * item.quantity;
    const nameHeight = doc.heightOfString(item.productName, { width: 280 });
    const rowHeight = Math.max(nameHeight, 12) + (item.variantColor ? 20 : 10);

    if (rowIndex % 2 === 1) {
      doc.rect(MARGIN, y - 4, CONTENT_RIGHT - MARGIN, rowHeight).fill("#FAF7F3");
      doc.fillColor(INK);
    }

    doc.font("Helvetica").fontSize(9.5).fillColor(INK).text(item.productName, MARGIN + 8, y, { width: 280 });
    if (item.variantColor) {
      doc.font("Helvetica").fontSize(8).fillColor(MUTED).text(`Color: ${item.variantColor}`, MARGIN + 8, y + nameHeight + 2);
    }
    doc.font("Helvetica").fontSize(9.5).fillColor(INK);
    doc.text(String(item.quantity), 340, y, { width: 40, align: "right" });
    doc.text(formatINR(item.price), 390, y, { width: 65, align: "right" });
    doc.text(formatINR(lineTotal), 465, y, { width: 80, align: "right" });
    y += rowHeight;
    rowIndex++;
  }

  y += 6;
  doc.moveTo(MARGIN, y).lineTo(CONTENT_RIGHT, y).lineWidth(0.75).strokeColor(GOLD).stroke();
  y += 14;

  // --- Totals block ---
  const totalsLabelX = 350;
  const totalsLabelWidth = 105;
  const totalsValueX = 465;
  const addTotalRow = (label, value, opts = {}) => {
    doc.font(opts.bold ? "Helvetica-Bold" : "Helvetica").fontSize(opts.bold ? 11 : 9.5);
    doc.fillColor(opts.color || INK);
    doc.text(label, totalsLabelX, y, { width: totalsLabelWidth });
    doc.text(value, totalsValueX, y, { width: 80, align: "right" });
    // Advance by however tall the label actually rendered (accounts for a
    // long coupon code wrapping to 2 lines) rather than a fixed amount —
    // a fixed advance here is exactly what let a wrapped "Discount
    // (LONGCODE)" label collide with the divider line drawn right after it.
    const labelHeight = doc.heightOfString(label, { width: totalsLabelWidth });
    y += Math.max(labelHeight, opts.bold ? 20 : 15) + (opts.bold ? 5 : 0);
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
  doc.moveTo(totalsLabelX, y).lineTo(CONTENT_RIGHT, y).lineWidth(0.5).strokeColor("#DDD").stroke();
  y += 8;
  addTotalRow("Grand Total", formatINR(order.totalAmount), { bold: true });

  // Amount in words — a standard convention on Indian invoices, and a
  // simple integrity check (the number can't be silently edited without
  // also having to change this line to match).
  y += 6;
  doc.font("Helvetica-Oblique").fontSize(8.5).fillColor(MUTED).text(
    `Amount in words: Rupees ${numberToWords(order.totalAmount)} Only`,
    MARGIN,
    y,
    { width: CONTENT_RIGHT - MARGIN }
  );

  // --- Footer ---
  const footerY = 745;
  doc.moveTo(MARGIN, footerY - 16).lineTo(CONTENT_RIGHT, footerY - 16).lineWidth(0.5).strokeColor("#DDD").stroke();
  doc
    .fontSize(8)
    .fillColor(MUTED)
    .font("Helvetica")
    .text(
      "This is a computer-generated invoice and does not require a signature.",
      MARGIN,
      footerY - 6,
      { width: CONTENT_RIGHT - MARGIN, align: "center" }
    )
    .text(
      `${BRAND} - ${STORE_INFO.address}`,
      MARGIN,
      footerY + 6,
      { width: CONTENT_RIGHT - MARGIN, align: "center" }
    )
    .text(
      `${STORE_INFO.email} - Instagram: ${STORE_INFO.instagram} - Quote your invoice number for support`,
      MARGIN,
      footerY + 18,
      { width: CONTENT_RIGHT - MARGIN, align: "center" }
    );

  doc.end();
}

module.exports = { streamInvoicePdf };
