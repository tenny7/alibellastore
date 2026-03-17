import nodemailer from "nodemailer";

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM;
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME;

let transporter: nodemailer.Transporter | null = null;

if (EMAIL_USER && EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });
} else {
  console.warn("[Email] EMAIL_USER or EMAIL_PASS not set — email sending disabled");
}

export async function sendMail({
  to,
  subject,
  text,
  html,
}: {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
}) {
  if (!transporter) {
    console.warn("[Email] Mailer not configured, skipping sendMail");
    return;
  }

  const fromName = EMAIL_FROM_NAME || "ShopWithAlicey";

  await transporter.sendMail({
    from: `${fromName} <${EMAIL_FROM || EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
}

// ─── Email Templates ───────────────────────────────────

function emailWrapper(title: string, body: string, primaryColor = "#1A73E8", hoverColor = "#1557B0"): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,${primaryColor},${hoverColor});padding:32px 24px;border-radius:12px 12px 0 0;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;">${title}</h1>
    </div>
    <!-- Body -->
    <div style="background:#fff;padding:32px 24px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
      ${body}
    </div>
    <!-- Footer -->
    <div style="background:#1E293B;padding:24px;border-radius:0 0 12px 12px;text-align:center;">
      <p style="color:#94a3b8;margin:0;font-size:13px;">
        Thank you for shopping with us!
      </p>
      <p style="color:#64748b;margin:8px 0 0;font-size:12px;">
        This is an automated email. Please do not reply directly.
      </p>
    </div>
  </div>
</body>
</html>`;
}

interface OrderItem {
  name: string;
  quantity: number;
  unit_price: number;
}

export async function sendOrderConfirmation({
  to,
  customerName,
  orderNumber,
  items,
  subtotal,
  discountAmount,
  deliveryFee = 0,
  taxAmount = 0,
  total,
  shippingAddress,
  currencyCode = "RWF",
  primaryColor = "#1A73E8",
  hoverColor = "#1557B0",
}: {
  to: string;
  customerName: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  deliveryFee?: number;
  taxAmount?: number;
  total: number;
  shippingAddress: string;
  currencyCode?: string;
  primaryColor?: string;
  hoverColor?: string;
}) {
  const itemRows = items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;">${item.name}</td>
          <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;text-align:center;">${item.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;text-align:right;">${currencyCode} ${item.unit_price.toLocaleString()}</td>
        </tr>`
    )
    .join("");

  const html = emailWrapper(
    "Order Confirmed!",
    `
    <p style="color:#334155;font-size:15px;line-height:1.6;">
      Hi ${customerName},
    </p>
    <p style="color:#334155;font-size:15px;line-height:1.6;">
      Your order <strong>#${orderNumber}</strong> has been placed successfully. We'll notify you when it's on its way!
    </p>

    <div style="background:#f8fafc;border-radius:8px;padding:16px;margin:20px 0;">
      <h3 style="margin:0 0 12px;color:#1E293B;font-size:14px;">Order Items</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#475569;">
        <thead>
          <tr style="border-bottom:2px solid #e2e8f0;">
            <th style="text-align:left;padding:8px 0;font-weight:600;">Item</th>
            <th style="text-align:center;padding:8px 0;font-weight:600;">Qty</th>
            <th style="text-align:right;padding:8px 0;font-weight:600;">Price</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>

      <div style="margin-top:12px;padding-top:12px;border-top:2px solid #e2e8f0;">
        <div style="display:flex;justify-content:space-between;font-size:14px;color:#475569;margin-bottom:4px;">
          <span>Subtotal</span><span>${currencyCode} ${subtotal.toLocaleString()}</span>
        </div>
        ${
          deliveryFee > 0
            ? `<div style="display:flex;justify-content:space-between;font-size:14px;color:#475569;margin-bottom:4px;">
                <span>Delivery</span><span>${currencyCode} ${deliveryFee.toLocaleString()}</span>
              </div>`
            : ""
        }
        ${
          taxAmount > 0
            ? `<div style="display:flex;justify-content:space-between;font-size:14px;color:#475569;margin-bottom:4px;">
                <span>Tax</span><span>${currencyCode} ${taxAmount.toLocaleString()}</span>
              </div>`
            : ""
        }
        ${
          discountAmount > 0
            ? `<div style="display:flex;justify-content:space-between;font-size:14px;color:#16a34a;margin-bottom:4px;">
                <span>Discount</span><span>-${currencyCode} ${discountAmount.toLocaleString()}</span>
              </div>`
            : ""
        }
        <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:700;color:#1E293B;margin-top:8px;">
          <span>Total</span><span>${currencyCode} ${total.toLocaleString()}</span>
        </div>
      </div>
    </div>

    <div style="background:#f8fafc;border-radius:8px;padding:16px;margin:20px 0;">
      <h3 style="margin:0 0 8px;color:#1E293B;font-size:14px;">Delivery Address</h3>
      <p style="color:#475569;font-size:14px;margin:0;">${shippingAddress}</p>
    </div>
    `,
    primaryColor,
    hoverColor
  );

  const text = `Hi ${customerName},\n\nYour order #${orderNumber} has been placed successfully!\n\nTotal: ${currencyCode} ${total.toLocaleString()}\nDelivery to: ${shippingAddress}\n\nWe'll notify you when it ships. Thank you!`;

  await sendMail({
    to,
    subject: `Order Confirmed - #${orderNumber}`,
    text,
    html,
  });
}

export async function sendOrderStatusUpdate({
  to,
  customerName,
  orderNumber,
  status,
  primaryColor = "#1A73E8",
  hoverColor = "#1557B0",
}: {
  to: string;
  customerName: string;
  orderNumber: string;
  status: string;
  primaryColor?: string;
  hoverColor?: string;
}) {
  const statusMessages: Record<string, { title: string; message: string }> = {
    paid: {
      title: "Payment Received",
      message: "Your payment has been confirmed. We're preparing your order!",
    },
    processing: {
      title: "Order Processing",
      message: "Your order is being prepared and will be shipped soon.",
    },
    shipped: {
      title: "Order Shipped",
      message: "Your order is on its way! You'll receive it within 1-5 business days.",
    },
    delivered: {
      title: "Order Delivered",
      message: "Your order has been delivered. We hope you love your purchase!",
    },
    cancelled: {
      title: "Order Cancelled",
      message: "Your order has been cancelled. If you have questions, please contact us.",
    },
  };

  const info = statusMessages[status] || {
    title: `Order Updated`,
    message: `Your order status has been updated to: ${status}.`,
  };

  const html = emailWrapper(
    info.title,
    `
    <p style="color:#334155;font-size:15px;line-height:1.6;">
      Hi ${customerName},
    </p>
    <p style="color:#334155;font-size:15px;line-height:1.6;">
      ${info.message}
    </p>
    <div style="background:#f8fafc;border-radius:8px;padding:16px;margin:20px 0;text-align:center;">
      <p style="color:#475569;font-size:13px;margin:0 0 4px;">Order Number</p>
      <p style="color:#1E293B;font-size:18px;font-weight:700;margin:0;">#${orderNumber}</p>
    </div>
    `,
    primaryColor,
    hoverColor
  );

  const text = `Hi ${customerName},\n\n${info.message}\n\nOrder: #${orderNumber}\n\nThank you!`;

  await sendMail({
    to,
    subject: `${info.title} - #${orderNumber}`,
    text,
    html,
  });
}

export async function sendPaymentConfirmation({
  to,
  customerName,
  orderNumber,
  amount,
  transactionId,
  currencyCode = "RWF",
  primaryColor = "#1A73E8",
  hoverColor = "#1557B0",
}: {
  to: string;
  customerName: string;
  orderNumber: string;
  amount: number;
  transactionId: string;
  currencyCode?: string;
  primaryColor?: string;
  hoverColor?: string;
}) {
  const html = emailWrapper(
    "Payment Successful",
    `
    <p style="color:#334155;font-size:15px;line-height:1.6;">
      Hi ${customerName},
    </p>
    <p style="color:#334155;font-size:15px;line-height:1.6;">
      Your MoMo payment of <strong>${currencyCode} ${amount.toLocaleString()}</strong> for order <strong>#${orderNumber}</strong> was successful.
    </p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:20px 0;">
      <p style="color:#166534;font-size:14px;margin:0 0 8px;font-weight:600;">Payment Details</p>
      <p style="color:#475569;font-size:13px;margin:0;">Transaction ID: ${transactionId}</p>
      <p style="color:#475569;font-size:13px;margin:4px 0 0;">Amount: ${currencyCode} ${amount.toLocaleString()}</p>
    </div>
    `,
    primaryColor,
    hoverColor
  );

  const text = `Hi ${customerName},\n\nYour MoMo payment of ${currencyCode} ${amount.toLocaleString()} for order #${orderNumber} was successful.\n\nTransaction ID: ${transactionId}\n\nThank you!`;

  await sendMail({
    to,
    subject: `Payment Confirmed - #${orderNumber}`,
    text,
    html,
  });
}
