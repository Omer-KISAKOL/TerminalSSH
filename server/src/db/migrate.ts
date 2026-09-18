import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { config as loadEnv } from 'dotenv'
import pg from 'pg'

loadEnv()

const schemaPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'schema.sql')

async function migrate() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL is required for migration.')
  }

  const pool = new pg.Pool({ connectionString })
  const schema = readFileSync(schemaPath, 'utf8')

  try {
    await pool.query(schema)
    console.log('Database migration completed.')
  } finally {
    await pool.end()
  }
}

migrate().catch((error) => {
  console.error('Migration failed:', error)
  process.exitCode = 1
})
