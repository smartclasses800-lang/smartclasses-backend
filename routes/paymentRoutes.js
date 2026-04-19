const express = require('express')
const asyncHandler = require('../utils/asyncHandler')
const { createOrder, verifyPayment, handleWebhook } = require('../controllers/paymentController')

const router = express.Router()

router.post('/create-order', asyncHandler(createOrder))
router.post('/verify-payment', asyncHandler(verifyPayment))
router.post('/webhook', express.raw({ type: 'application/json' }), asyncHandler(handleWebhook))

module.exports = router
