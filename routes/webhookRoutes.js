const express = require('express')
const asyncHandler = require('../utils/asyncHandler')
const { handleWebhook } = require('../controllers/paymentController')

const router = express.Router()

router.post('/', asyncHandler(handleWebhook))

module.exports = router