const express = require('express')
const router = express.Router()
const { PRODUCT_CATALOG } = require('../config/products')

router.get('/:sku', (req, res) => {
  const { sku } = req.params || {}
  const product = PRODUCT_CATALOG[sku]
  if (!product) return res.status(404).json({ message: 'Product not found' })
  return res.json({ sku: product.sku, title: product.title, pricePaise: product.pricePaise })
})

module.exports = router