const jwt = require('jsonwebtoken')
const Admin = require('../models/Admin')

async function loginAdmin(req, res) {
  const { email, secretKey } = req.body || {}

  if (!email || !secretKey) {
    return res.status(400).json({ message: 'Email and secret key are required' })
  }

  const adminEmail = String(process.env.ADMIN_EMAIL).toLowerCase().trim()
  const adminSecretKey = String(process.env.ADMIN_SECRET_KEY)

  const inputEmail = String(email).toLowerCase().trim()
  const inputSecretKey = String(secretKey).trim()

  if (inputEmail !== adminEmail || inputSecretKey !== adminSecretKey) {
    return res.status(401).json({ message: 'Invalid admin credentials' })
  }

  const admin = await Admin.findOne({ email: adminEmail })
  if (!admin) {
    return res.status(401).json({ message: 'Invalid admin credentials' })
  }

  const token = jwt.sign(
    {
      sub: admin._id.toString(),
      email: admin.email,
      role: admin.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: '12h' },
  )

  return res.json({
    token,
    admin: {
      id: admin._id,
      email: admin.email,
      role: admin.role,
    },
  })
}

async function getMe(req, res) {
  return res.json({
    admin: req.admin,
  })
}

module.exports = {
  loginAdmin,
  getMe,
}
