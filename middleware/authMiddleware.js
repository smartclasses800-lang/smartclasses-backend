const jwt = require('jsonwebtoken')

function requireAdminAuth(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.admin = decoded
    return next()
  } catch {
    return res.status(401).json({ message: 'Invalid token' })
  }
}

module.exports = {
  requireAdminAuth,
}
