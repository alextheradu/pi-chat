import assert from 'node:assert/strict'
import { Client as MinioClient } from 'minio'
import { Client as PgClient } from 'pg'

export function getEnv(name) {
  return process.env[`SMOKE_${name}`] ?? process.env[name]
}

export function getRequiredEnv(name) {
  const value = getEnv(name)
  assert.ok(value, `Missing required environment variable: ${name}`)
  return value
}

export function getBaseUrl() {
  const port = process.env.PORT ?? '3000'
  const fallbackBaseUrl = `http://127.0.0.1:${port}`

  return (
    process.env.HEALTHCHECK_BASE_URL ??
    fallbackBaseUrl
  ).replace(/\/$/, '')
}

export function createDatabaseClient() {
  return new PgClient({
    connectionString: getRequiredEnv('DATABASE_URL'),
  })
}

export function createMinioClient() {
  const rawEndpoint = getRequiredEnv('MINIO_ENDPOINT')
  const rawPort = getEnv('MINIO_PORT')
  const rawUseSSL = getEnv('MINIO_USE_SSL')

  if (/^https?:\/\//i.test(rawEndpoint)) {
    const url = new URL(rawEndpoint)

    return new MinioClient({
      endPoint: url.hostname,
      port: url.port
        ? Number.parseInt(url.port, 10)
        : url.protocol === 'https:'
          ? 443
          : 80,
      useSSL: url.protocol === 'https:',
      accessKey: getRequiredEnv('MINIO_ACCESS_KEY'),
      secretKey: getRequiredEnv('MINIO_SECRET_KEY'),
    })
  }

  const requestedUseSSL = rawUseSSL === 'true'
  const requestedPort = rawPort
    ? Number.parseInt(rawPort, 10)
    : requestedUseSSL
      ? 443
      : 9000

  return new MinioClient({
    endPoint: rawEndpoint,
    port: requestedUseSSL && requestedPort === 80 ? 443 : requestedPort,
    useSSL: requestedUseSSL,
    accessKey: getRequiredEnv('MINIO_ACCESS_KEY'),
    secretKey: getRequiredEnv('MINIO_SECRET_KEY'),
  })
}
