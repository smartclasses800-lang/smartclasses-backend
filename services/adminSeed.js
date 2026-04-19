const bcrypt = require('bcryptjs')
const Admin = require('../models/Admin')

async function seedAdminAccount() {
  const adminEmail = (process.env.ADMIN_EMAIL || 'johnkhore26@gmail.com').toLowerCase().trim()
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@12345'

  const passwordHash = await bcrypt.hash(adminPassword, 10)

  await Admin.findOneAndUpdate(
    { email: adminEmail },
    {
      email: adminEmail,
      passwordHash,
      role: 'admin',
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  )
}

module.exports = {
  seedAdminAccount,
}
