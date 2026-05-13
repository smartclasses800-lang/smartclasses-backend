const mongoose = require('mongoose')
const dns = require('dns')
const { seedAdminAccount } = require('../services/adminSeed')

let connectionPromise = null

function parseDnsServers(value) {
  return String(value || '')
    .split(',')
    .map((server) => server.trim())
    .filter(Boolean)
}

function isSrvDnsError(error) {
  const msg = String(error?.message || '')
  return error?.code === 'ECONNREFUSED' && msg.includes('querySrv')
}

async function connectWithUri(mongoUri) {
  const connection = await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000,
    family: 4,
  })
  console.log("Connected to MongoDB")
  return connection
}

async function connectDatabase() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection
  }

  if (connectionPromise) {
    return connectionPromise
  }

  connectionPromise = (async () => {
    const mongoUri = process.env.BASE_MONGO_URI || process.env.MONGODB_URI
    if (!mongoUri) {
      throw new Error('BASE_MONGO_URI or MONGODB_URI is required')
    }

    const isSrvUri = mongoUri.startsWith('mongodb+srv://')

    if (!isSrvUri) {
      await connectWithUri(mongoUri)
      await seedAdminAccount()
      return mongoose.connection
    }

    const configuredResolvers = parseDnsServers(process.env.MONGO_DNS_SERVERS || '8.8.8.8,1.1.1.1')
    const fallbackResolvers = [
      parseDnsServers('1.1.1.1,8.8.8.8'),
      parseDnsServers('8.8.4.4,1.0.0.1'),
    ]

    const resolverAttempts = [
      { label: 'system-default', servers: null },
      { label: 'env-configured', servers: configuredResolvers },
      ...fallbackResolvers.map((servers, index) => ({ label: `fallback-${index + 1}`, servers })),
    ]

    let lastError = null

    for (const attempt of resolverAttempts) {
      try {
        if (attempt.servers && attempt.servers.length > 0) {
          dns.setServers(attempt.servers)
          console.log(`Mongo DNS resolver attempt: ${attempt.label} -> ${attempt.servers.join(', ')}`)
        } else {
          console.log(`Mongo DNS resolver attempt: ${attempt.label}`)
        }

        const connection = await connectWithUri(mongoUri)
        await seedAdminAccount()
        return connection
      } catch (error) {
        lastError = error
        if (!isSrvDnsError(error)) {
          throw error
        }
      }
    }

    throw new Error(
      `MongoDB SRV DNS lookup failed after multiple resolver attempts. Last error: ${String(lastError?.message || lastError)}`,
    )
  })().catch((error) => {
    connectionPromise = null
    throw error
  })

  return connectionPromise
}

module.exports = {
  connectDatabase,
}
