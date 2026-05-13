require('dotenv').config()
const { connectDatabase } = require('./config/db')
const { seedAdminAccount } = require('./services/adminSeed')

async function run() {
  await connectDatabase()
  await seedAdminAccount()
  console.log('Admin seeded successfully')
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
