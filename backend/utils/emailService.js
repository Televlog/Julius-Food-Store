const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async ({ to, subject, html, text }) => {
  const mailOptions = {
    from: `"Store" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    text,
  };
  await transporter.sendMail(mailOptions);
};

exports.sendWelcomeEmail = async (user) => {
  await sendEmail({
    to: user.email,
    subject: 'Welcome to Our Store!',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#f97316">Welcome, ${user.name}!</h2>
        <p>Thank you for creating an account. Start shopping today!</p>
        <a href="${process.env.CLIENT_URL}"
           style="background:#f97316;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:16px">
          Start Shopping
        </a>
      </div>
    `,
  });
};

exports.sendEmailVerification = async (user, token) => {
  const url = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: 'Verify Your Email',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#f97316">Verify Your Email</h2>
        <p>Click the button below to verify your email address.</p>
        <a href="${url}"
           style="background:#f97316;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">
          Verify Email
        </a>
        <p style="color:#666;margin-top:16px">Link expires in 24 hours.</p>
      </div>
    `,
  });
};

exports.sendPasswordReset = async (user, token) => {
  const url = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: 'Reset Your Password',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#f97316">Password Reset</h2>
        <p>You requested a password reset. Click the link below:</p>
        <a href="${url}"
           style="background:#f97316;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">
          Reset Password
        </a>
        <p style="color:#666;margin-top:16px">Link expires in 15 minutes. If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
};

exports.sendOrderConfirmation = async (user, order) => {
  const itemsHtml = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee">${item.name}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">$${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
      `
    )
    .join('');

  await sendEmail({
    to: user.email,
    subject: `Order Confirmed #${order.orderNumber}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#f97316">Order Confirmed!</h2>
        <p>Hi ${user.name}, your order <strong>#${order.orderNumber}</strong> has been confirmed.</p>
        <table style="width:100%;border-collapse:collapse;margin-top:16px">
          <thead>
            <tr style="background:#f3f4f6">
              <th style="padding:8px;text-align:left">Product</th>
              <th style="padding:8px;text-align:center">Qty</th>
              <th style="padding:8px;text-align:right">Total</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div style="margin-top:16px;text-align:right">
          <p>Shipping: $${order.shippingPrice.toFixed(2)}</p>
          <p>Tax: $${order.taxPrice.toFixed(2)}</p>
          <h3>Total: $${order.totalPrice.toFixed(2)}</h3>
        </div>
        <a href="${process.env.CLIENT_URL}/orders/${order._id}"
           style="background:#f97316;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:16px">
          Track Order
        </a>
      </div>
    `,
  });
};

exports.sendOrderStatusUpdate = async (user, order) => {
  const statusLabels = {
    confirmed: 'Confirmed',
    processing: 'Processing',
    shipped: 'Shipped',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };

  await sendEmail({
    to: user.email,
    subject: `Order #${order.orderNumber} - ${statusLabels[order.status] || order.status}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#f97316">Order Update</h2>
        <p>Hi ${user.name}, your order <strong>#${order.orderNumber}</strong> status has been updated to
           <strong>${statusLabels[order.status] || order.status}</strong>.</p>
        ${order.trackingNumber ? `<p>Tracking Number: <strong>${order.trackingNumber}</strong></p>` : ''}
        <a href="${process.env.CLIENT_URL}/orders/${order._id}"
           style="background:#f97316;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:16px">
          View Order
        </a>
      </div>
    `,
  });
};
