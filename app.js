const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')

const authRoutes = require('./routes/authRoutes')
const orderRoutes = require('./routes/orderRoutes')
const paymentRoutes = require('./routes/paymentRoutes')
const webhookRoutes = require('./routes/webhookRoutes')
const { connectDatabase } = require('./config/db')

const app = express()

app.use(helmet())
app.use(cors({ origin: true, credentials: true }))
app.use(morgan('dev'))
app.use('/api/auth/admin/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }))
app.use('/api/webhook', express.raw({ type: 'application/json' }), async (req, res, next) => {
  try {
    await connectDatabase()
    next()
  } catch (error) {
    next(error)
  }
}, webhookRoutes)
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true }))

app.use('/api', async (req, res, next) => {
  try {
    await connectDatabase()
    next()
  } catch (error) {
    next(error)
  }
})

app.get('/', (req, res) => {
  res.json({ message: 'ILLAM-E-PUNJAB backend is running' })
})

app.get('/api/health', (req, res) => {
  res.json({ ok: true })
})

app.use('/api/auth', authRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/payments', paymentRoutes)

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ message: 'Internal server error' })
})

module.exports = app
