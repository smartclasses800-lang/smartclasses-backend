const Book = require('../models/Book')
const { ensureBookSeeded, normalizeBookPayload, resetBookCatalog, slugifyTitle } = require('../services/bookSeed')

function toBookResponse(book) {
  if (!book) {
    return null
  }

  return {
    id: book._id,
    sku: book.sku,
    title: book.title,
    author: book.author,
    cover: book.cover,
    pages: book.pages,
    pricePaise: book.pricePaise,
    price: Math.round(Number(book.pricePaise || 0) / 100),
    description: book.description,
    uri: book.uri,
    bilangual: Boolean(book.bilangual),
    onlyEnglish: Boolean(book.onlyEnglish),
    onpunjabi: Boolean(book.onpunjabi),
    createdAt: book.createdAt,
    updatedAt: book.updatedAt,
  }
}

async function listBooks(req, res) {
  await ensureBookSeeded()
  const books = await Book.find().sort({ createdAt: 1 })
  return res.json({ books: books.map(toBookResponse) })
}

async function getBookBySku(req, res) {
  await ensureBookSeeded()
  const { sku } = req.params || {}
  const book = await Book.findOne({ sku })
  if (!book) {
    return res.status(404).json({ message: 'Book not found' })
  }

  return res.json({ book: toBookResponse(book) })
}

async function createBook(req, res) {
  const payload = normalizeBookPayload(req.body || {})

  if (!payload.title || !payload.author || !payload.pages || payload.pages <= 0 || !payload.pricePaise || payload.pricePaise <= 0 || !payload.description || !payload.uri) {
    return res.status(400).json({ message: 'Book details are incomplete' })
  }

  let sku = payload.sku || slugifyTitle(payload.title)
  let suffix = 2
  while (await Book.exists({ sku })) {
    sku = `${slugifyTitle(payload.title)}-${suffix}`
    suffix += 1
  }

  const book = await Book.create({
    ...payload,
    sku,
  })

  return res.status(201).json({
    message: 'Book created successfully',
    book: toBookResponse(book),
  })
}

async function updateBook(req, res) {
  const { sku } = req.params || {}
  const currentBook = await Book.findOne({ sku })
  if (!currentBook) {
    return res.status(404).json({ message: 'Book not found' })
  }

  const payload = normalizeBookPayload(req.body || {})
  if (!payload.title || !payload.author || !payload.pages || payload.pages <= 0 || !payload.pricePaise || payload.pricePaise <= 0 || !payload.description || !payload.uri) {
    return res.status(400).json({ message: 'Book details are incomplete' })
  }

  currentBook.title = payload.title
  currentBook.author = payload.author
  currentBook.cover = payload.cover
  currentBook.pages = payload.pages
  currentBook.pricePaise = payload.pricePaise
  currentBook.description = payload.description
  currentBook.uri = payload.uri
  currentBook.bilangual = payload.bilangual
  currentBook.onlyEnglish = payload.onlyEnglish
  currentBook.onpunjabi = payload.onpunjabi
  await currentBook.save()

  return res.json({
    message: 'Book updated successfully',
    book: toBookResponse(currentBook),
  })
}

async function deleteBook(req, res) {
  const { sku } = req.params || {}
  const deleted = await Book.findOneAndDelete({ sku })
  if (!deleted) {
    return res.status(404).json({ message: 'Book not found' })
  }

  return res.json({ message: 'Book deleted successfully' })
}

async function resetBooks(req, res) {
  const books = await resetBookCatalog()
  return res.json({ message: 'Default book catalog restored', books: books.map(toBookResponse) })
}

module.exports = {
  listBooks,
  getBookBySku,
  createBook,
  updateBook,
  deleteBook,
  resetBooks,
  toBookResponse,
}
