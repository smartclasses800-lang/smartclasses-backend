const crypto = require('crypto')
const Order = require('../models/Order')
const { getRazorpayClient } = require('../services/razorpayService')
const { sendEmail } = require('../services/emailService')
const {
  paymentReceivedUserTemplate,
  paymentReceivedAdminTemplate,
} = require('../services/emailTemplates')

function buildOrderReference() {
  return `IEP-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

async function createOrder(req, res) {
  const { customer, shippingAddress, product } = req.body || {}
  if (!customer?.fullName || !customer?.email || !customer?.phone || !customer?.medium) {
    return res.status(400).json({ message: 'Customer details are incomplete' })
  }

  if (!shippingAddress?.addressLine1 || !shippingAddress?.addressLine2 || !shippingAddress?.district || !shippingAddress?.city || !shippingAddress?.state || !shippingAddress?.pincode) {
    return res.status(400).json({ message: 'Shipping address is incomplete' })
  }

  if (!product?.sku || !product?.title || !product?.amount) {
    return res.status(400).json({ message: 'Product details are incomplete' })
  }

  const amount = Number(product.amount)
  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ message: 'Invalid amount' })
  }

  const razorpay = getRazorpayClient()
  const receipt = buildOrderReference()

  const razorpayOrder = await razorpay.orders.create({
    amount,
    currency: 'INR',
    receipt,
    notes: {
      productTitle: product.title,
      customerEmail: customer.email,
      medium: customer.medium,
    },
  })

  const order = await Order.create({
    orderReference: receipt,
    razorpayOrderId: razorpayOrder.id,
    receipt,
    amount,
    currency: 'INR',
    quantity: Number(product.quantity || 1),
    product: {
      sku: product.sku,
      title: product.title,
    },
    customer: {
      fullName: customer.fullName,
      email: customer.email,
      phone: customer.phone,
      medium: customer.medium,
    },
    shippingAddress,
    payment: {
      status: 'created',
    },
    status: 'pending_payment',
  })

  return res.status(201).json({
    orderId: order.razorpayOrderId,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
    orderReference: order.orderReference,
  })
}

async function markOrderAsPaid(order, paymentData, { sendNotifications = true } = {}) {
  const alreadyNotified = Boolean(order.paymentConfirmationSentAt)

  order.payment = {
    ...(typeof order.payment?.toObject === 'function' ? order.payment.toObject() : order.payment),
    razorpayOrderId: paymentData.razorpay_order_id,
    razorpayPaymentId: paymentData.razorpay_payment_id,
    razorpaySignature: paymentData.razorpay_signature,
    status: 'paid',
    verifiedAt: new Date(),
  }
  order.status = 'paid'

  if (sendNotifications) {
    order.paymentConfirmationSentAt = order.paymentConfirmationSentAt || new Date()
  }

  await order.save()

  if (sendNotifications && !alreadyNotified) {
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
  }

  return order
}

async function verifyPayment(req, res) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {}

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ message: 'Payment verification payload is incomplete' })
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex')

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ message: 'Invalid payment signature' })
  }

  const order = await Order.findOne({ razorpayOrderId: razorpay_order_id })
  if (!order) {
    return res.status(404).json({ message: 'Order not found' })
  }

  if (order.status !== 'paid') {
    await markOrderAsPaid(
      order,
      { razorpay_order_id, razorpay_payment_id, razorpay_signature },
      { sendNotifications: false },
    )
  } else {
    order.payment = {
      ...(typeof order.payment?.toObject === 'function' ? order.payment.toObject() : order.payment),
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      status: 'paid',
      verifiedAt: order.payment?.verifiedAt || new Date(),
    }
    await order.save()
  }

  return res.json({
    message: 'Payment verified',
    order,
  })
}

async function handleWebhook(req, res) {
  const signature = req.headers['x-razorpay-signature']
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  const bodyString = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : JSON.stringify(req.body || {})

  if (!signature || !secret) {
    return res.status(400).json({ message: 'Webhook signature missing' })
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(bodyString)
    .digest('hex')

  if (expectedSignature !== signature) {
    return res.status(400).json({ message: 'Invalid webhook signature' })
  }

  const event = JSON.parse(bodyString)
  const eventType = event?.event
  const paymentEntity = event?.payload?.payment?.entity
  const orderEntity = event?.payload?.order?.entity

  if (eventType === 'payment.captured' || eventType === 'order.paid') {
    const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id
    const razorpayPaymentId = paymentEntity?.id || ''

    if (razorpayOrderId) {
      const order = await Order.findOne({ razorpayOrderId })
      if (order) {
        await markOrderAsPaid(
          order,
          {
            razorpay_order_id: razorpayOrderId,
            razorpay_payment_id: razorpayPaymentId,
            razorpay_signature: signature,
          },
          { sendNotifications: true },
        )
      }
    }
  }

  return res.json({ received: true })
}

module.exports = {
  createOrder,
  verifyPayment,
  handleWebhook,
}
