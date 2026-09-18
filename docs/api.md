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
