import assert from 'node:assert/strict'
import test from 'node:test'

import { createDatabaseClient, createMinioClient } from './helpers.mjs'

test('health checks resolve db and minio as healthy', async () => {
  const services = {
    db: 'ok',
    minio: 'ok',
  }

  const dbClient = createDatabaseClient()
  await dbClient.connect()

  try {
    await dbClient.query('SELECT 1')
  } catch {
    services.db = 'error'
  } finally {
    await dbClient.end()
  }

  try {
    const minioClient = createMinioClient()
    await minioClient.listBuckets()
  } catch {
    services.minio = 'error'
  }

  assert.deepEqual(services, {
    db: 'ok',
    minio: 'ok',
  })
})
