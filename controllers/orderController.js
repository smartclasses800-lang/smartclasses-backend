const Order = require('../models/Order')
const { sendEmail } = require('../services/emailService')
const {
  trackerSentUserTemplate,
} = require('../services/emailTemplates')

async function listOrders(req, res) {
  const orders = await Order.find().sort({ createdAt: -1 })
  return res.json({ orders })
}

async function updateTrackerAndDispatch(req, res) {
  const { orderId } = req.params
  const { trackerId, status } = req.body || {}

  if (!trackerId) {
    return res.status(400).json({ message: 'trackerId is required' })
  }

  const order = await Order.findOne({ razorpayOrderId: orderId })
  if (!order) {
    return res.status(404).json({ message: 'Order not found' })
  }

  order.trackerId = trackerId.trim()
  if (status === 'delivered') {
    order.status = 'delivered'
  } else if (!order.dispatchedAt) {
    order.status = 'out_for_delivery'
    order.dispatchedAt = new Date()
  } else {
    order.status = 'out_for_delivery'
  }
  const isDeliveryUpdate = status === 'delivered'
  order.trackerEmailSentAt = new Date()
  await order.save()

  if (!isDeliveryUpdate) {
    await Promise.allSettled([
      sendEmail({
        to: order.customer.email,
        subject: 'Your ILLAM-E-PUNJAB tracker ID',
        html: trackerSentUserTemplate(order, order.trackerId),
      }),
    ])
  }

  return res.json({
    message: isDeliveryUpdate
      ? 'Order marked as delivered'
      : 'Tracker email sent and order updated',
    order,
  })
}

module.exports = {
  listOrders,
  updateTrackerAndDispatch,
}
