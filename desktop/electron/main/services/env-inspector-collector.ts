export const ENV_SEARCH_ROOTS = ['/home', '/var/www', '/www', '/opt', '/srv'] as const

export const ENV_FILE_GLOB_NAMES = [
  '.env',
  '.env.local',
  '.env.production',
  '.env.development',
  '.env.staging',
  '.env.example',
] as const

const FIND_EXPR = ENV_FILE_GLOB_NAMES.map((name) => `-name '${name}'`)
  .join(' -o ')

const ENV_FIND_SHELL = `
echo '===ENV_FILES==='
(
  find ${ENV_SEARCH_ROOTS.join(' ')} -maxdepth 8 \\( ${FIND_EXPR} \\) 2>/dev/null
  if [ -n "$HOME" ]; then
    find "$HOME" -maxdepth 8 \\( ${FIND_EXPR} \\) 2>/dev/null
  fi
) | sort -u | head -n 16
`.trim()

export function buildEnvFindCommand(): string {
  return `/bin/sh -c ${JSON.stringify(ENV_FIND_SHELL)}`
}

export function buildEnvKeysCommand(filePath: string): string {
  const safePath = filePath.replace(/'/g, `'\\''`)
  const shell = `
echo '===ENVKEYS:${safePath}==='
grep -E '^[[:space:]]*([A-Za-z_][A-Za-z0-9_]*|export[[:space:]]+[A-Za-z_][A-Za-z0-9_]*)=' '${safePath}' 2>/dev/null | sed -E 's/^[[:space:]]*(export[[:space:]]+)?([A-Za-z_][A-Za-z0-9_]*)=.*/\\2/' | head -n 80
`.trim()
  return `/bin/sh -c ${JSON.stringify(shell)}`
}

/** @deprecated Prefer find + per-file key commands in server-ops-extended-service */
export function buildEnvInspectorCommand(): string {
  return buildEnvFindCommand()
}