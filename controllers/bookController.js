const Book = require('../models/Book')
const { ensureBookSeeded, normalizeBookPayload, resetBookCatalog, slugifyTitle } = require('../services/bookSeed')
const { cloudinary, cloudinaryConnect } = require('../config/cloudinary')

function getBookImages(book) {
  const images = Array.isArray(book?.images) ? book.images : []
  const fallback = [book?.uri, book?.cover]
    .map((value) => String(value || '').trim())
    .filter(Boolean)

  const merged = [...images, ...fallback]
    .map((value) => String(value || '').trim())
    .filter(Boolean)

  return [...new Set(merged)]
}

function toBookResponse(book) {
  if (!book) {
    return null
  }

  const images = getBookImages(book)

  return {
    id: book._id,
    sku: book.sku,
    title: book.title,
    author: book.author,
    images,
    uri: images[0] || '',
    pages: book.pages,
    pricePaise: book.pricePaise,
    price: Math.round(Number(book.pricePaise || 0) / 100),
    description: book.description,
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

  if (!payload.title || !payload.author || !payload.pages || payload.pages <= 0 || !payload.pricePaise || payload.pricePaise <= 0 || !payload.description || !payload.images.length) {
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
  if (!payload.title || !payload.author || !payload.pages || payload.pages <= 0 || !payload.pricePaise || payload.pricePaise <= 0 || !payload.description || !payload.images.length) {
    return res.status(400).json({ message: 'Book details are incomplete' })
  }

  currentBook.title = payload.title
  currentBook.author = payload.author
  currentBook.images = payload.images
  currentBook.pages = payload.pages
  currentBook.pricePaise = payload.pricePaise
  currentBook.description = payload.description
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

function uploadBufferToCloudinary(file) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'illamipunjapmcp/books',
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          reject(error)
          return
        }

        resolve(result)
      },
    )

    uploadStream.end(file.buffer)
  })
}

async function uploadBookImages(req, res) {
  const files = Array.isArray(req.files) ? req.files : []
  if (!files.length) {
    return res.status(400).json({ message: 'Please select at least one image to upload' })
  }

  cloudinaryConnect()

  const uploads = await Promise.all(files.map(uploadBufferToCloudinary))
  return res.status(201).json({
    message: 'Images uploaded successfully',
    images: uploads.map((file) => file?.secure_url || file?.url || '').filter(Boolean),
  })
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
  uploadBookImages,
  resetBooks,
  toBookResponse,
}
