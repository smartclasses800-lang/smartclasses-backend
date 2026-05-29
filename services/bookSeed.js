const Book = require('../models/Book')

const DEFAULT_BOOKS = [
  {
    sku: 'illami-punjab',
    title: 'Illami Punjab',
    author: 'Rebecca Yarros',
    images: [
      'https://illamipunjabmcp.vercel.app/book.webp',
      'https://images.unsplash.com/photo-1455885666463-3a0b1f77f49f?auto=format&fit=crop&w=1200&q=80',
    ],
    pages: 320,
    pricePaise: 29900,
    description:
      'A gripping tale of love and resilience set in the heart of Punjab, where tradition meets modernity.',
    bilangual: true,
    onlyEnglish: false,
    onpunjabi: false,
  },
  {
    sku: 'punjabi-bhasha-ate-vyakaran',
    title: 'Punjabi Bhasha Ate Vyakaran',
    author: 'Charlie Kirk',
    images: [
      'https://i.ibb.co/FqWzjWQN/book.jpg',
      'https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?auto=format&fit=crop&w=1200&q=80',
    ],
    pages: 250,
    pricePaise: 19900,
    description:
      'A comprehensive guide to Punjabi language and grammar, perfect for students and language enthusiasts.',
    bilangual: true,
    onlyEnglish: false,
    onpunjabi: false,
  },
  {
    sku: 'punjab-police-constable-2026-district-armed-cadre',
    title: 'Punjab Police Constable 2026 District & Armed Cadre',
    author: 'Allen Levi',
    images: [
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTXLd0s6lxmSBqEUfKQI68Z7AG6zU2c0Nu44g&s',
      'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1200&q=80',
    ],
    pages: 300,
    pricePaise: 24900,
    description:
      'A comprehensive guide to the Punjab Police Constable exam, covering all important topics and practice questions.',
    bilangual: false,
    onlyEnglish: true,
    onpunjabi: false,
  },
]

function slugifyTitle(title) {
  const slug = String(title || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || 'book'
}

function normalizePricePaise(payload) {
  if (Number.isFinite(Number(payload?.pricePaise))) {
    return Math.round(Number(payload.pricePaise))
  }

  const price = Number(payload?.price)
  if (Number.isFinite(price)) {
    return Math.round(price * 100)
  }

  return 0
}

function normalizeImages(payload = {}) {
  const rawImages = Array.isArray(payload.images)
    ? payload.images
    : typeof payload.images === 'string'
      ? payload.images.split(',')
      : []

  const fallback = [payload.uri, payload.cover]
    .map((value) => String(value || '').trim())
    .filter(Boolean)

  const images = [...rawImages, ...fallback]
    .map((value) => String(value || '').trim())
    .filter(Boolean)

  return [...new Set(images)]
}

function normalizeBookPayload(payload = {}) {
  const title = String(payload.title || '').trim()
  const sku = String(payload.sku || '').trim() || slugifyTitle(title)
  const bilangual = Boolean(payload.bilangual)
  const images = normalizeImages(payload)

  return {
    sku,
    title,
    author: String(payload.author || '').trim(),
    images,
    pages: Number.isFinite(Number(payload.pages)) ? Number(payload.pages) : 0,
    pricePaise: normalizePricePaise(payload),
    description: String(payload.description || '').trim(),
    bilangual,
    onlyEnglish: bilangual ? true : Boolean(payload.onlyEnglish),
    onpunjabi: bilangual ? true : Boolean(payload.onpunjabi),
  }
}

async function ensureBookSeeded() {
  const count = await Book.countDocuments()
  if (count > 0) {
    return
  }

  await Book.insertMany(DEFAULT_BOOKS)
}

async function resetBookCatalog() {
  await Book.deleteMany({})
  await Book.insertMany(DEFAULT_BOOKS)
  return Book.find().sort({ createdAt: 1 })
}

module.exports = {
  DEFAULT_BOOKS,
  ensureBookSeeded,
  normalizeBookPayload,
  resetBookCatalog,
  slugifyTitle,
}
