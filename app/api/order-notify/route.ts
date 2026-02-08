import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { order, items, totals, kind, recipientEmail } = body || {};

    const host = process.env.BREVO_SMTP_HOST;
    const port = Number(process.env.BREVO_SMTP_PORT || 587);
    const user = process.env.BREVO_SMTP_USER;
    const pass = process.env.BREVO_SMTP_KEY;
    const fromEmail = process.env.FROM_EMAIL || "";
    const adminEmail = process.env.ADMIN_EMAIL || "";

    if (!host || !user || !pass || !fromEmail || !adminEmail) {
      return new Response(
        JSON.stringify({ error: "Missing email configuration." }),
        { status: 500 }
      );
    }

    if (kind === "receipt" && !recipientEmail) {
      return new Response(
        JSON.stringify({ error: "Missing receipt email." }),
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: false,
      auth: { user, pass },
    });

    const itemsText = Array.isArray(items)
      ? items
          .map((item: any) => {
            const size = item.size || "Regular";
            return `- ${item.flavour} (${size}) x${item.quantity}`;
          })
          .join("\n")
      : "(No items)";

    const isReceipt = kind === "receipt";
    const subject = isReceipt
      ? `Ray's Cookies order confirmation`
      : `New order from ${order?.buyer || "Unknown"}`;
    const text = [
      isReceipt ? "Thanks for your order! Ray will reach out to you on Instagram to confirm your order. " : "New order placed:",
      "",
      `Buyer: ${order?.buyer || ""}`,
      `Instagram: ${order?.instagram_handle || ""}`,
      `Created: ${order?.date_order_created || ""}`,
      `Due: ${order?.date_order_due || ""}`,
      `Status: ${order?.status || "Pending"}`,
      `Total cookies: ${totals?.totalCookies ?? ""}`,
      `Total revenue: $${Number(totals?.totalCost || 0).toFixed(2)}`,
      `Customization: ${order?.customization || "(none)"}`,
      "",
      "Items:",
      itemsText,
    ].join("\n");

    const htmlItems = Array.isArray(items)
      ? items
          .map((item: any) => {
            const size = item.size || "Regular";
            return `<tr>
              <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;">${item.flavour}</td>
              <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;">${size}</td>
              <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;">${item.quantity}</td>
            </tr>`;
          })
          .join("")
      : "";

    const html = `
      <div style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; background:#eaf6ff; padding:24px; color:#0f172a;">
        <div style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:16px;box-shadow:0 10px 30px rgba(2,6,23,0.08);overflow:hidden;">
          <div style="background:#56baf2;padding:18px 24px;">
            <h2 style="margin:0;font-size:20px;color:#0f172a;">🍪 ${isReceipt ? "Order Pending" : "New order"} 🍪</h2>
            <p style="margin:6px 0 0;color:#0f172a;">${isReceipt ? "Thanks for your order!" : `${order?.buyer || "Unknown"} placed a new order.`}</p>
          </div>
          <div style="padding:20px 24px;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
              <div><strong>Buyer:</strong> ${order?.buyer || ""}</div>
              <div><strong>Instagram:</strong> ${order?.instagram_handle || ""}</div>
              <div><strong>Created:</strong> ${order?.date_order_created || ""}</div>
              <div><strong>Due:</strong> ${order?.date_order_due || ""}</div>
              <div><strong>Status:</strong> ${order?.status || "Pending"}</div>
              <div><strong>Total cookies:</strong> ${totals?.totalCookies ?? ""}</div>
              <div><strong>Total revenue:</strong> $${Number(totals?.totalCost || 0).toFixed(2)}</div>
            </div>
            <div style="margin:12px 0 18px;padding:12px 14px;background:#eaf6ff;border:1px solid rgba(86,186,242,0.4);border-radius:12px;">
              <strong>Customization:</strong>
              <div style="margin-top:6px;color:#334155;white-space:pre-wrap;">${order?.customization || "(none)"}</div>
            </div>
            <h3 style="margin:0 0 10px;font-size:16px;color:#0f172a;">Items</h3>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <thead>
                <tr style="background:#f1f9ff;color:#0f172a;">
                  <th style="text-align:left;padding:8px;">Flavour</th>
                  <th style="text-align:left;padding:8px;">Size</th>
                  <th style="text-align:right;padding:8px;">Qty</th>
                </tr>
              </thead>
              <tbody>
                ${htmlItems || "<tr><td colspan='3' style='padding:8px;color:#64748b;'>No items</td></tr>"}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: fromEmail,
      to: isReceipt ? recipientEmail : adminEmail,
      replyTo: adminEmail,
      subject,
      text,
      html,
    });

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to send email." }), {
      status: 500,
    });
  }
}
