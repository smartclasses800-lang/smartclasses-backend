require('dotenv').config()
const app = require('./app')
const { connectDatabase } = require('./config/db')

async function startServer() {
  await connectDatabase()

  const port = process.env.PORT || 5000
  app.listen(port, () => {
    console.log(`ILLAM-E-PUNJAB backend running on port ${port}`)
  })
}

startServer().catch((error) => {
  console.error('Failed to start backend:', error)
  process.exit(1)
})
