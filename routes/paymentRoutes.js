const express = require('express')
const asyncHandler = require('../utils/asyncHandler')
const { createOrder, verifyPayment } = require('../controllers/paymentController')

const router = express.Router()

router.post('/create-order', asyncHandler(createOrder))
router.post('/verify-payment', asyncHandler(verifyPayment))

module.exports = router
