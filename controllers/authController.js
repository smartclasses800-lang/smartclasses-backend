const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const Admin = require('../models/Admin')

async function loginAdmin(req, res) {
  const { email, password, secretKey } = req.body || {}
  const loginPassword = String(password || secretKey || '').trim()

  if (!email || !loginPassword) {
    return res.status(400).json({ message: 'Email and password are required' })
  }

  const inputEmail = String(email).toLowerCase().trim()
  const admin = await Admin.findOne({ email: inputEmail })
  if (!admin) {
    return res.status(401).json({ message: 'Invalid admin credentials' })
  }

  const passwordMatches = await bcrypt.compare(loginPassword, admin.passwordHash)
  if (!passwordMatches) {
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
