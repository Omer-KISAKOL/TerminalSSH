CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  encrypted_data_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refresh_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  device_name TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS refresh_sessions_user_id_idx ON refresh_sessions(user_id);

CREATE TABLE IF NOT EXISTS server_profiles (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  host TEXT NOT NULL,
  port INTEGER NOT NULL,
  username TEXT NOT NULL,
  auth_type TEXT NOT NULL CHECK (auth_type IN ('password', 'privateKey')),
  save_password BOOLEAN NOT NULL DEFAULT FALSE,
  save_passphrase BOOLEAN NOT NULL DEFAULT FALSE,
  encrypted_password TEXT,
  encrypted_passphrase TEXT,
  encrypted_private_key TEXT,
  last_connected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS server_profiles_user_id_idx ON server_profiles(user_id);
CREATE INDEX IF NOT EXISTS server_profiles_updated_at_idx ON server_profiles(updated_at);

CREATE TABLE IF NOT EXISTS profile_snippets (
  id UUID PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES server_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  encrypted_content TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS profile_snippets_profile_id_idx ON profile_snippets(profile_id);
CREATE INDEX IF NOT EXISTS profile_snippets_user_id_idx ON profile_snippets(user_id);
