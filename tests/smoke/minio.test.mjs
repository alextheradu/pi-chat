import assert from 'node:assert/strict'
import test from 'node:test'

import { createMinioClient, getRequiredEnv } from './helpers.mjs'

test('minio connection succeeds and lists buckets', async () => {
  const client = createMinioClient()

  const buckets = await client.listBuckets()

  assert.ok(Array.isArray(buckets))
})

test('configured MinIO buckets are addressable', async () => {
  const client = createMinioClient()

  for (const bucket of [
    getRequiredEnv('MINIO_BUCKET_FILES'),
    getRequiredEnv('MINIO_BUCKET_AVATARS'),
  ]) {
    const exists = await client.bucketExists(bucket)
    assert.equal(typeof exists, 'boolean')
  }
})
