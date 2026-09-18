import { randomUUID } from 'node:crypto'

import { pool } from '../db/pool.js'
import type { SnippetInput, SnippetResponse, SnippetRow } from '../types.js'
import { getUserDataKey } from './auth-service.js'
import { decryptSecret, encryptSecret } from './crypto-service.js'
function mapSnippetRow(row: SnippetRow, dataKey: Buffer): SnippetResponse {
  return {
    id: row.id,
    profileId: row.profile_id,
    name: row.name,
    content: decryptSecret(dataKey, row.encrypted_content) ?? '',
    sortOrder: row.sort_order,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}

async function getSnippetRow(userId: string, profileId: string, snippetId: string): Promise<SnippetRow | null> {
  const result = await pool.query<SnippetRow>(
    `SELECT * FROM profile_snippets
     WHERE user_id = $1 AND profile_id = $2 AND id = $3 AND deleted_at IS NULL`,
    [userId, profileId, snippetId],
  )

  return result.rows[0] ?? null
}

async function assertProfileAccess(userId: string, profileId: string): Promise<void> {
  const result = await pool.query(
    `SELECT id FROM server_profiles
     WHERE user_id = $1 AND id = $2 AND deleted_at IS NULL`,
    [userId, profileId],
  )

  if (result.rowCount === 0) {
    throw new Error('Profil bulunamadı.')
  }
}

export async function listSnippets(userId: string, profileId: string): Promise<SnippetResponse[]> {
  await assertProfileAccess(userId, profileId)
  const dataKey = await getUserDataKey(userId)

  const result = await pool.query<SnippetRow>(
    `SELECT * FROM profile_snippets
     WHERE user_id = $1 AND profile_id = $2 AND deleted_at IS NULL
     ORDER BY sort_order ASC, name ASC`,
    [userId, profileId],
  )

  return result.rows.map((row) => mapSnippetRow(row, dataKey))
}

export async function createSnippet(
  userId: string,
  profileId: string,
  input: SnippetInput,
): Promise<SnippetResponse> {
  await assertProfileAccess(userId, profileId)
  const dataKey = await getUserDataKey(userId)
  const id = input.id ?? randomUUID()
  const now = new Date()

  const result = await pool.query<SnippetRow>(
    `INSERT INTO profile_snippets (
      id, profile_id, user_id, name, encrypted_content, sort_order, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
    RETURNING *`,
    [
      id,
      profileId,
      userId,
      input.name,
      encryptSecret(dataKey, input.content),
      input.sortOrder ?? 0,
      now,
    ],
  )

  return mapSnippetRow(result.rows[0]!, dataKey)
}

export async function updateSnippet(
  userId: string,
  profileId: string,
  snippetId: string,
  input: Partial<SnippetInput>,
): Promise<SnippetResponse> {
  const existing = await getSnippetRow(userId, profileId, snippetId)

  if (!existing) {
    throw new Error('Snippet bulunamadı.')
  }

  const dataKey = await getUserDataKey(userId)
  const name = input.name ?? existing.name
  const content = input.content ?? decryptSecret(dataKey, existing.encrypted_content) ?? ''
  const sortOrder = input.sortOrder ?? existing.sort_order

  const result = await pool.query<SnippetRow>(
    `UPDATE profile_snippets
     SET name = $4, encrypted_content = $5, sort_order = $6, updated_at = NOW()
     WHERE user_id = $1 AND profile_id = $2 AND id = $3 AND deleted_at IS NULL
     RETURNING *`,
    [userId, profileId, snippetId, name, encryptSecret(dataKey, content), sortOrder],
  )

  return mapSnippetRow(result.rows[0]!, dataKey)
}

export async function deleteSnippet(userId: string, profileId: string, snippetId: string): Promise<void> {
  const result = await pool.query(
    `UPDATE profile_snippets
     SET deleted_at = NOW(), updated_at = NOW()
     WHERE user_id = $1 AND profile_id = $2 AND id = $3 AND deleted_at IS NULL`,
    [userId, profileId, snippetId],
  )

  if (result.rowCount === 0) {
    throw new Error('Snippet bulunamadı.')
  }
}
