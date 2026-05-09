require('dotenv').config()
const { connectDatabase } = require('./config/db')

async function run() {
  await connectDatabase()
  console.log('Admin seeded successfully')
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
