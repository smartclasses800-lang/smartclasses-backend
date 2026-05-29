const mongoose = require('mongoose')

const addressSchema = new mongoose.Schema(
  {
    addressLine1: { type: String, required: true },
    addressLine2: { type: String, required: true },
    landmark: { type: String, default: '' },
    district: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: 'India' },
  },
  { _id: false },
)

const customerSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    medium: { type: String, required: true },
  },
  { _id: false },
)

const paymentSchema = new mongoose.Schema(
  {
    razorpayOrderId: { type: String, default: '' },
    razorpayPaymentId: { type: String, default: '' },
    razorpaySignature: { type: String, default: '' },
    status: {
      type: String,
      enum: ['created', 'paid', 'failed', 'manual'],
      default: 'created',
    },
    verifiedAt: { type: Date },
    method: { type: String, default: '' },
  },
  { _id: false },
)

const orderSchema = new mongoose.Schema(
  {
    orderReference: { type: String, required: true, unique: true, index: true },
    razorpayOrderId: { type: String, required: true, unique: true, index: true },
    receipt: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    quantity: { type: Number, default: 1 },
    product: {
      sku: { type: String, required: true },
      title: { type: String, required: true },
      author: { type: String, default: '' },
      cover: { type: String, default: '' },
      uri: { type: String, default: '' },
      pages: { type: Number, default: 0 },
      pricePaise: { type: Number, default: 0 },
      bilangual: { type: Boolean, default: false },
      onlyEnglish: { type: Boolean, default: false },
      onpunjabi: { type: Boolean, default: false },
    },
    customer: { type: customerSchema, required: true },
    shippingAddress: { type: addressSchema, required: true },
    payment: { type: paymentSchema, default: () => ({}) },
    trackerId: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending_payment', 'paid', 'out_for_delivery', 'delivered', 'failed'],
      default: 'pending_payment',
    },
    paymentConfirmationSentAt: { type: Date },
    trackerEmailSentAt: { type: Date },
    dispatchedAt: { type: Date },
    notes: { type: String, default: '' },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model('Order', orderSchema)
