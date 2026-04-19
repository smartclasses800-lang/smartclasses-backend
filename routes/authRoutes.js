const express = require('express')
const asyncHandler = require('../utils/asyncHandler')
const { getMe, loginAdmin } = require('../controllers/authController')
const { requireAdminAuth } = require('../middleware/authMiddleware')

const router = express.Router()

router.post('/admin/login', asyncHandler(loginAdmin))
router.get('/admin/me', requireAdminAuth, asyncHandler(getMe))

module.exports = router
