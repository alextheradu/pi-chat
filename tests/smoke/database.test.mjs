import assert from 'node:assert/strict'
import test from 'node:test'

import { createDatabaseClient } from './helpers.mjs'

test('database connection succeeds and responds to SELECT 1', async () => {
  const client = createDatabaseClient()

  await client.connect()

  try {
    const result = await client.query('SELECT 1 AS connected')
    assert.equal(result.rowCount, 1)
    assert.equal(result.rows[0]?.connected, 1)
  } finally {
    await client.end()
  }
})
