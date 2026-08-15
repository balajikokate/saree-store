const { sendEmail } = require("./email");
const { sendTwilioMessage } = require("./twilio");

function formatINR(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

// Order fields (name, address, etc.) are customer-supplied at checkout and
// get embedded into HTML email bodies below. Without escaping, a malicious
// "customer" could put something like <img src=x onerror=alert(1)> as their
// name and have it render as live HTML in the emails sent to you and them.
// Escape every user-supplied value before it goes into an HTML template.
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Order phone numbers are stored as plain 10-digit Indian numbers
// (validated at checkout). Twilio needs E.164 format (+91XXXXXXXXXX).
function toE164India(phone) {
  if (!phone) return phone;
  return phone.startsWith("+") ? phone : `+91${phone}`;
}

function itemsListHtml(items) {
  return items
    .map(
      (item) =>
        `<tr>
          <td style="padding:6px 0;">${escapeHtml(item.productName)} × ${item.quantity}</td>
          <td style="padding:6px 0; text-align:right;">${formatINR(item.price * item.quantity)}</td>
        </tr>`
    )
    .join("");
}

function customerEmailHtml(order) {
  return `
    <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #2A1E1B;">
      <h2 style="color: #6E1423;">Thank you for your order!</h2>
      <p>Hi ${escapeHtml(order.customerName)}, your order has been confirmed.</p>
      <p style="font-size: 14px; color: #666;">Order Number: <strong>${escapeHtml(order.orderNumber)}</strong></p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
        ${itemsListHtml(order.items)}
        <tr style="border-top: 1px solid #ddd;">
          <td style="padding-top: 10px; font-weight: bold;">Total Paid</td>
          <td style="padding-top: 10px; text-align: right; font-weight: bold;">${formatINR(order.totalAmount)}</td>
        </tr>
      </table>
      <p style="margin-top: 20px; font-size: 14px;">
        Shipping to: ${escapeHtml(order.addressLine)}, ${escapeHtml(order.city)}, ${escapeHtml(order.state)} - ${escapeHtml(order.pincode)}
      </p>
      <p style="margin-top: 24px; font-size: 13px; color: #888;">— Ovee Collection</p>
    </div>
  `;
}

function adminEmailHtml(order) {
  return `
    <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #2A1E1B;">
      <h2 style="color: #6E1423;">New order received</h2>
      <p style="font-size: 14px;">Order <strong>${escapeHtml(order.orderNumber)}</strong> — ${formatINR(order.totalAmount)}</p>
      <p style="font-size: 14px;">
        Customer: ${escapeHtml(order.customerName)}<br/>
        Phone: ${escapeHtml(order.phone)}<br/>
        Email: ${escapeHtml(order.email)}
      </p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
        ${itemsListHtml(order.items)}
      </table>
      <p style="margin-top: 16px; font-size: 14px;">
        Ship to: ${escapeHtml(order.addressLine)}, ${escapeHtml(order.city)}, ${escapeHtml(order.state)} - ${escapeHtml(order.pincode)}
      </p>
    </div>
  `;
}

/**
 * Sends order-confirmed notifications to the customer AND the admin, across
 * email, SMS, and WhatsApp. Every channel that isn't configured (missing
 * env vars) is silently skipped. Every channel failure is caught and logged
 * individually — one bad channel never blocks the others or throws.
 */
async function sendOrderNotifications(order) {
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL || process.env.ADMIN_EMAIL;
  const adminPhone = process.env.ADMIN_NOTIFY_PHONE;

  const customerPhone = toE164India(order.phone);
  const adminPhoneE164 = adminPhone ? toE164India(adminPhone) : null;

  const customerSmsBody = `Hi ${order.customerName}, your Ovee Collection order ${order.orderNumber} (${formatINR(order.totalAmount)}) is confirmed! We'll notify you when it ships.`;
  const adminSmsBody = `New order ${order.orderNumber} — ${formatINR(order.totalAmount)} from ${order.customerName} (${order.phone}).`;

  const tasks = [
    sendEmail({
      to: order.email,
      subject: `Order Confirmed — ${order.orderNumber}`,
      html: customerEmailHtml(order),
    }),
    sendTwilioMessage({ to: customerPhone, body: customerSmsBody }),
    sendTwilioMessage({ to: customerPhone, body: customerSmsBody, whatsapp: true }),
  ];

  if (adminEmail) {
    tasks.push(
      sendEmail({
        to: adminEmail,
        subject: `New Order Received — ${order.orderNumber}`,
        html: adminEmailHtml(order),
      })
    );
  }
  if (adminPhoneE164) {
    tasks.push(sendTwilioMessage({ to: adminPhoneE164, body: adminSmsBody }));
    tasks.push(sendTwilioMessage({ to: adminPhoneE164, body: adminSmsBody, whatsapp: true }));
  }

  const results = await Promise.allSettled(tasks);
  results.forEach((r) => {
    if (r.status === "rejected") {
      console.error("[notifications] A channel failed:", r.reason?.message || r.reason);
    }
  });
}

module.exports = { sendOrderNotifications };
