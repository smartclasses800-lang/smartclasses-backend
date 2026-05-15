const PRODUCT_PRICES = {
  'illam-e-punjab-book': Number(process.env.BOOK_PRICE_PAISE || 69900),
}

const PRODUCT_CATALOG = {
  'illam-e-punjab-book': {
    sku: 'illam-e-punjab-book',
    title: 'ILLAM-E-PUNJAB',
    pricePaise: PRODUCT_PRICES['illam-e-punjab-book'],
  },
}

module.exports = {
  PRODUCT_PRICES,
  PRODUCT_CATALOG,
}
