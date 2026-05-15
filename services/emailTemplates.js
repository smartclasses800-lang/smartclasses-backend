const brand = {
  maroon: '#7B181B',
  gold: '#D79F12',
  paper: '#ffffff',
  text: '#1f2328',
  muted: '#6b7280',
}

function emailShell({ title, body }) {
  return `
    <div style="margin:0;padding:0;background:#f7f5f3;font-family:Arial,Helvetica,sans-serif;color:${brand.text};">
      <div style="max-width:680px;margin:0 auto;padding:24px;">
        <div style="background:${brand.paper};border:1px solid #ecdede;border-radius:20px;overflow:hidden;box-shadow:0 20px 40px rgba(123,24,27,0.08);">
          <div style="background:${brand.maroon};padding:28px 32px;color:#fff;">
            <div style="display:inline-block;background:${brand.gold};color:${brand.maroon};padding:6px 12px;border-radius:999px;font-weight:700;font-size:12px;letter-spacing:1px;text-transform:uppercase;">ILLAM-E-PUNJAB</div>
            <h1 style="margin:16px 0 0;font-size:28px;line-height:1.2;">${title}</h1>
          </div>
          <div style="padding:32px;">
            ${body}
          </div>
          <div style="padding:20px 32px;background:#faf7f7;border-top:1px solid #ecdede;font-size:13px;color:${brand.muted};line-height:1.6;">
            <p style="margin:0 0 8px 0;">Support: +91 85588 00797 | smartclasses800@gmail.com</p>
            <p style="margin:0;">This message was sent regarding your ILLAM-E-PUNJAB order.</p>
          </div>
        </div>
      </div>
    </div>
  `
}

function paymentReceivedUserTemplate(order) {
  return emailShell({
    title: 'Payment Confirmed',
    body: `
      <p style="font-size:16px;line-height:1.8;margin:0 0 16px;">Your payment for <strong>ILLAM-E-PUNJAB</strong> has been received successfully.</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0 24px;">
        <tr><td style="padding:10px 0;color:${brand.muted};">Name</td><td style="padding:10px 0;font-weight:700;text-align:right;">${order.customer.fullName}</td></tr>
        <tr><td style="padding:10px 0;color:${brand.muted};">Amount</td><td style="padding:10px 0;font-weight:700;text-align:right;">Rs. ${(Number(order.amount) / 100).toFixed(0)}</td></tr>
        <tr><td style="padding:10px 0;color:${brand.muted};">Order ID</td><td style="padding:10px 0;font-weight:700;text-align:right;">${order.razorpayOrderId}</td></tr>
        <tr><td style="padding:10px 0;color:${brand.muted};">Payment ID</td><td style="padding:10px 0;font-weight:700;text-align:right;">${order.payment?.razorpayPaymentId || 'N/A'}</td></tr>
      </table>
      <div style="background:#fff8e8;border:1px solid #f1d67a;border-radius:14px;padding:16px 18px;margin-bottom:20px;">
        <p style="margin:0;color:${brand.maroon};font-weight:700;">What happens next</p>
        <p style="margin:8px 0 0;line-height:1.8;">We will prepare your book for dispatch. You will receive a second email when your shipment is sent for delivery along with the India Post tracker ID so you can track your parcel.</p>
      </div>
      <p style="margin:0;line-height:1.8;">If you do not receive any confirmation email, contact us immediately at +91 80546 43829 or smartclasses800@gmail.com.</p>
    `,
  })
}

function paymentReceivedAdminTemplate(order) {
  return emailShell({
    title: 'New Paid Order Received',
    body: `
      <p style="font-size:16px;line-height:1.8;margin:0 0 16px;">A new payment has been completed for <strong>ILLAM-E-PUNJAB</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0 24px;">
        <tr><td style="padding:10px 0;color:${brand.muted};">Customer</td><td style="padding:10px 0;font-weight:700;text-align:right;">${order.customer.fullName}</td></tr>
        <tr><td style="padding:10px 0;color:${brand.muted};">Email</td><td style="padding:10px 0;font-weight:700;text-align:right;">${order.customer.email}</td></tr>
        <tr><td style="padding:10px 0;color:${brand.muted};">Amount</td><td style="padding:10px 0;font-weight:700;text-align:right;">Rs. ${(Number(order.amount) / 100).toFixed(0)}</td></tr>
        <tr><td style="padding:10px 0;color:${brand.muted};">Order ID</td><td style="padding:10px 0;font-weight:700;text-align:right;">${order.razorpayOrderId}</td></tr>
      </table>
      <div style="background:#fdf1f1;border:1px solid #f0c8c8;border-radius:14px;padding:16px 18px;">
        <p style="margin:0;color:${brand.maroon};font-weight:700;">Action</p>
        <p style="margin:8px 0 0;line-height:1.8;">Please review the shipping address, send tracker ID after booking through India Post, and mark the order out for delivery.</p>
      </div>
    `,
  })
}

function trackerSentUserTemplate(order, trackerId) {
  return emailShell({
    title: 'Your Shipment Tracker ID',
    body: `
      <p style="font-size:16px;line-height:1.8;margin:0 0 16px;">Your book has been dispatched and the tracker ID is now available.</p>
      <div style="background:#fff8e8;border:1px solid #f1d67a;border-radius:14px;padding:18px 20px;margin:18px 0 24px;">
        <p style="margin:0 0 8px;color:${brand.maroon};font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">Tracker ID</p>
        <p style="margin:0;font-size:24px;font-weight:800;color:${brand.maroon};letter-spacing:0.04em;">${trackerId}</p>
      </div>
      <p style="margin:0 0 12px;line-height:1.8;">Please track your parcel using India Post with the tracker ID above.</p>
      <a href="https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx" target="_blank" style="display:inline-block;background:${brand.maroon};color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:700;margin-bottom:12px;">Track on India Post</a>
      <p style="margin:0;line-height:1.8;">If you do not receive the tracker email, call +91 80546 43829 or email smartclasses800@gmail.com.</p>
    `,
  })
}

module.exports = {
  paymentReceivedUserTemplate,
  paymentReceivedAdminTemplate,
  trackerSentUserTemplate,
}
