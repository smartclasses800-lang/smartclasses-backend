const Order = require('../models/Order')
const Book = require('../models/Book')
const { sendEmail } = require('../services/emailService')
const { paymentReceivedUserTemplate, paymentReceivedAdminTemplate } = require('../services/emailTemplates')
const { ensureBookSeeded } = require('../services/bookSeed')

function getPrimaryBookImage(book) {
  return [book?.images?.[0], book?.uri, book?.cover]
    .map((value) => String(value || '').trim())
    .find(Boolean) || ''
}

function toBookSnapshot(book) {
  const primaryImage = getPrimaryBookImage(book)

  return {
    sku: book.sku,
    title: book.title,
    author: book.author,
    cover: primaryImage,
    uri: primaryImage,
    pages: book.pages,
    pricePaise: book.pricePaise,
    bilangual: Boolean(book.bilangual),
    onlyEnglish: Boolean(book.onlyEnglish),
    onpunjabi: Boolean(book.onpunjabi),
  }
}

function buildOrderReference() {
  return `IEP-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

async function createManualOrder(req, res) {
  const { customer, shippingAddress, product, notes = '' } = req.body || {}

  if (!customer?.fullName || !customer?.email || !customer?.phone || !customer?.medium) {
    return res.status(400).json({ message: 'Customer details are incomplete' })
  }

  if (!shippingAddress?.addressLine1 || !shippingAddress?.addressLine2 || !shippingAddress?.district || !shippingAddress?.city || !shippingAddress?.state || !shippingAddress?.pincode) {
    return res.status(400).json({ message: 'Shipping address is incomplete' })
  }

  if (!product?.sku) {
    return res.status(400).json({ message: 'Product SKU is required' })
  }

  await ensureBookSeeded()
  const book = await Book.findOne({ sku: product.sku })
  if (!book) {
    return res.status(404).json({ message: 'Book not found' })
  }

  const amount = Number(book.pricePaise)
  if (!amount || amount <= 0) {
    return res.status(400).json({ message: 'Invalid book price' })
  }

  const orderReference = buildOrderReference()
  const razorpayOrderId = `manual_${Date.now()}`
  const quantity = Number(product.quantity || 1)
  const order = await Order.create({
    orderReference,
    razorpayOrderId,
    receipt: orderReference,
    amount,
    currency: 'INR',
    quantity,
    product: {
      ...toBookSnapshot(book),
      title: book.title,
    },
    customer: {
      fullName: customer.fullName,
      email: customer.email,
      phone: customer.phone,
      medium: customer.medium,
    },
    shippingAddress: {
      addressLine1: shippingAddress.addressLine1,
      addressLine2: shippingAddress.addressLine2,
      landmark: shippingAddress.landmark || '',
      district: shippingAddress.district,
      city: shippingAddress.city,
      state: shippingAddress.state,
      pincode: shippingAddress.pincode,
      country: shippingAddress.country || 'India',
    },
    payment: {
      razorpayOrderId,
      razorpayPaymentId: 'MANUAL',
      razorpaySignature: 'MANUAL',
      status: 'manual',
      verifiedAt: new Date(),
      method: 'manual',
    },
    status: 'paid',
    paymentConfirmationSentAt: new Date(),
    notes: String(notes || '').trim(),
  })

  await Promise.allSettled([
    sendEmail({
      to: order.customer.email,
      subject: 'Payment Confirmed - Smart Book Store',
      html: paymentReceivedUserTemplate(order),
    }),
    sendEmail({
      to: process.env.ADMIN_NOTIFY_EMAIL || process.env.ADMIN_EMAIL,
      subject: `New Paid Order - ${order.customer.fullName}`,
      html: paymentReceivedAdminTemplate(order),
    }),
  ])

  return res.status(201).json({
    message: 'Manual order created',
    order,
  })
}

module.exports = {
  createManualOrder,
}