const express = require('express')
const asyncHandler = require('../utils/asyncHandler')
const { requireAdminAuth } = require('../middleware/authMiddleware')
const upload = require('../middleware/mutler')
const {
  listBooks,
  getBookBySku,
  createBook,
  updateBook,
  deleteBook,
  uploadBookImages,
  resetBooks,
} = require('../controllers/bookController')

const router = express.Router()

router.get('/', asyncHandler(listBooks))
router.post('/', requireAdminAuth, asyncHandler(createBook))
router.post('/upload-images', requireAdminAuth, upload.array('images', 10), asyncHandler(uploadBookImages))
router.post('/admin/reset', requireAdminAuth, asyncHandler(resetBooks))
router.get('/:sku', asyncHandler(getBookBySku))
router.patch('/:sku', requireAdminAuth, asyncHandler(updateBook))
router.delete('/:sku', requireAdminAuth, asyncHandler(deleteBook))

module.exports = router
