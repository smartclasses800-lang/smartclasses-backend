const express = require('express')
const asyncHandler = require('../utils/asyncHandler')
const { requireAdminAuth } = require('../middleware/authMiddleware')
const { createManualOrder } = require('../controllers/manualOrderController')

const router = express.Router()

router.post('/', requireAdminAuth, asyncHandler(createManualOrder))

module.exports = router