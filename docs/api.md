# TerminalSSH API

Base URL: `http://localhost:8787` (development)

## Auth

### POST /auth/register
```json
{ "email": "user@example.com", "password": "secret123", "deviceName": "Desktop" }
```

### POST /auth/login
Same body as register.

Response:
```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "user": { "id": "uuid", "email": "user@example.com" }
}
```

### POST /auth/refresh
```json
{ "refreshToken": "..." }
```

### POST /auth/logout
```json
{ "refreshToken": "..." }
```

### GET /auth/me
Authorization: `Bearer <accessToken>`

## Profiles

All profile routes require `Authorization: Bearer <accessToken>`.

### GET /profiles
Returns decrypted secrets for authenticated session.

### POST /profiles
Create profile with optional `password`, `passphrase`, `privateKey`.

### PUT /profiles/:id
Update profile fields.

### DELETE /profiles/:id
Soft delete profile.

### POST /profiles/sync
Bulk upsert with `updatedAt` conflict resolution.

### POST /profiles/:id/connected
Updates `lastConnectedAt`.

## Snippets

All snippet routes require `Authorization: Bearer <accessToken>`.

Snippets are scoped to a profile. Content is encrypted at rest with the user's data key.

### GET /profiles/:profileId/snippets
Returns `{ "snippets": [...] }` with decrypted content.

### POST /profiles/:profileId/snippets
```json
{ "name": "deploy", "content": "npm run deploy", "sortOrder": 0 }
```

### PUT /profiles/:profileId/snippets/:snippetId
Partial update of `name`, `content`, or `sortOrder`.

### DELETE /profiles/:profileId/snippets/:snippetId
Permanently deletes the snippet.
