const prisma = require("../lib/prisma");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError } = require("../middleware/errorHandler");
const { wholesaleInquirySchema } = require("../utils/validators");
const { sendEmail } = require("../services/notifications/email");

// POST /api/wholesale
const submitInquiry = asyncHandler(async (req, res) => {
  const parsed = wholesaleInquirySchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, "Invalid inquiry", parsed.error.flatten());
  const data = parsed.data;

  const inquiry = await prisma.wholesaleInquiry.create({
    data: {
      name: data.name,
      businessName: data.businessName || null,
      email: data.email,
      phone: data.phone,
      message: data.message,
    },
  });

  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL || process.env.ADMIN_EMAIL;
  if (adminEmail) {
    sendEmail({
      to: adminEmail,
      subject: `New wholesale inquiry from ${data.name}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #2A1E1B;">
          <h2 style="color: #6E1423;">New wholesale/bulk inquiry</h2>
          <p style="font-size: 14px;">
            Name: ${escapeHtml(data.name)}<br/>
            Business: ${escapeHtml(data.businessName || "—")}<br/>
            Email: ${escapeHtml(data.email)}<br/>
            Phone: ${escapeHtml(data.phone)}
          </p>
          <p style="font-size: 14px; white-space: pre-wrap;">${escapeHtml(data.message)}</p>
        </div>
      `,
    }).catch((err) => console.error("[wholesale] Failed to email admin:", err.message || err));
  }

  res.status(201).json({ success: true, data: { id: inquiry.id } });
});

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// GET /api/admin/wholesale-inquiries
const listInquiries = asyncHandler(async (req, res) => {
  const inquiries = await prisma.wholesaleInquiry.findMany({ orderBy: { createdAt: "desc" } });
  res.json({ success: true, data: inquiries });
});

module.exports = { submitInquiry, listInquiries };
