const mongoose = require('mongoose')
const dns = require('dns')
const { seedAdminAccount } = require('../services/adminSeed')

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
  return mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000,
    family: 4,
  })
}

async function connectDatabase() {
  const mongoUri = process.env.BASE_MONGO_URI || process.env.MONGODB_URI
  if (!mongoUri) {
    throw new Error('BASE_MONGO_URI or MONGODB_URI is required')
  }

  const isSrvUri = mongoUri.startsWith('mongodb+srv://')

  if (!isSrvUri) {
    await connectWithUri(mongoUri)
    await seedAdminAccount()
    return
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

      await connectWithUri(mongoUri)
      await seedAdminAccount()
      return
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
}

module.exports = {
  connectDatabase,
}
