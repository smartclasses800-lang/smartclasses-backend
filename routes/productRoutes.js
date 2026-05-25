const express = require('express')
const router = express.Router()
const Book = require('../models/Book')
const { ensureBookSeeded } = require('../services/bookSeed')

router.get('/:sku', async (req, res) => {
  const { sku } = req.params || {}
  await ensureBookSeeded()
  const product = await Book.findOne({ sku })
  if (!product) return res.status(404).json({ message: 'Product not found' })
  return res.json({
    sku: product.sku,
    title: product.title,
    pricePaise: product.pricePaise,
    price: Math.round(Number(product.pricePaise || 0) / 100),
  })
})

module.exports = router