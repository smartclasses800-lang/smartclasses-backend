const mongoose = require('mongoose')

const bookSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, unique: true, index: true, trim: true },
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    images: { type: [String], default: [] },
    pages: { type: Number, default: 0 },
    pricePaise: { type: Number, required: true, min: 1 },
    description: { type: String, default: '' },
    bilangual: { type: Boolean, default: false },
    onlyEnglish: { type: Boolean, default: false },
    onpunjabi: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model('Book', bookSchema)
