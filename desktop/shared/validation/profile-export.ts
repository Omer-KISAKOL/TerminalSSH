import type { ProfileExportBundle, ProfileExportEntry } from '@shared/contracts/profile'

function assertAuthType(value: unknown): 'password' | 'privateKey' {
  if (value === 'password' || value === 'privateKey') {
    return value
  }

  throw new Error('Geçersiz kimlik doğrulama türü.')
}

function assertProfileExportEntry(value: unknown): ProfileExportEntry {
  if (!value || typeof value !== 'object') {
    throw new Error('Geçersiz profil kaydı.')
  }

  const entry = value as Partial<ProfileExportEntry>

  if (!entry.name?.trim() || !entry.host?.trim() || !entry.username?.trim()) {
    throw new Error('Profil adı, adres ve kullanıcı adı gerekli.')
  }

  if (typeof entry.port !== 'number' || entry.port < 1 || entry.port > 65535) {
    throw new Error('Geçersiz port numarası.')
  }

  return {
    name: entry.name.trim(),
    host: entry.host.trim(),
    port: entry.port,
    username: entry.username.trim(),
    authType: assertAuthType(entry.authType ?? 'password'),
    savePassword: Boolean(entry.savePassword),
    savePassphrase: Boolean(entry.savePassphrase),
    password: typeof entry.password === 'string' ? entry.password : entry.password ?? null,
    passphrase: typeof entry.passphrase === 'string' ? entry.passphrase : entry.passphrase ?? null,
    privateKey: typeof entry.privateKey === 'string' ? entry.privateKey : entry.privateKey ?? null,
  }
}

export function assertProfileExportBundle(input: unknown): ProfileExportBundle {
  if (!input || typeof input !== 'object') {
    throw new Error('Geçersiz dışa aktarma dosyası.')
  }

  const bundle = input as Partial<ProfileExportBundle>

  if (bundle.kind !== 'terminalssh-profiles') {
    throw new Error('Bu dosya TerminalSSH profil dışa aktarımı değil.')
  }

  if (bundle.version !== 1) {
    throw new Error('Desteklenmeyen dışa aktarma sürümü.')
  }

  if (!Array.isArray(bundle.profiles)) {
    throw new Error('Profil listesi bulunamadı.')
  }

  return {
    version: 1,
    kind: 'terminalssh-profiles',
    exportedAt: typeof bundle.exportedAt === 'string' ? bundle.exportedAt : new Date().toISOString(),
    includeSecrets: Boolean(bundle.includeSecrets),
    profiles: bundle.profiles.map(assertProfileExportEntry),
  }
}
