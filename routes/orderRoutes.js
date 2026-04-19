const express = require('express')
const asyncHandler = require('../utils/asyncHandler')
const { requireAdminAuth } = require('../middleware/authMiddleware')
const { listOrders, updateTrackerAndDispatch } = require('../controllers/orderController')

const router = express.Router()

router.get('/', requireAdminAuth, asyncHandler(listOrders))
router.patch('/:orderId/tracker', requireAdminAuth, asyncHandler(updateTrackerAndDispatch))

module.exports = router
