const nodemailer = require('nodemailer')

let transporter

function getTransporter() {
  if (transporter) {
    return transporter
  }

  const host = process.env.EMAIL_HOST
  const port = Number(process.env.EMAIL_PORT || 587)
  const user = process.env.EMAIL_USER
  const pass = process.env.EMAIL_PASS

  if (!host || !user || !pass) {
    return null
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  })

  return transporter
}

async function sendEmail({ to, subject, html }) {
  const mailer = getTransporter()
  if (!mailer) {
    console.warn('Email not sent because SMTP settings are missing.')
    return { skipped: true }
  }

  return mailer.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    html,
  })
}

module.exports = {
  sendEmail,
}
