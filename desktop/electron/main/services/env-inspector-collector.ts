export const ENV_SEARCH_ROOTS = [
  '/home',
  '/var/www',
  '/www',
  '/wwwroot',
  '/opt',
  '/srv',
  '/data',
  '/usr/share/nginx/html',
] as const

const ENV_FIND_CORE = `
echo '===ENV_FILES==='
(
  for base in ${ENV_SEARCH_ROOTS.map((r) => `"${r}"`).join(' ')}; do
  if [ -d "$base" ]; then
    find "$base" -maxdepth 10 \\( -name '.env' -o -name '.env.*' -o -iname '.env.local' -o -iname '.env.production' \\) -type f 2>/dev/null
  fi
  done
  if [ -n "$HOME" ] && [ -d "$HOME" ]; then
    find "$HOME" -maxdepth 10 \\( -name '.env' -o -name '.env.*' \\) -type f 2>/dev/null
  fi
  cwd=$(pwd 2>/dev/null)
  if [ -n "$cwd" ] && [ -d "$cwd" ]; then
    find "$cwd" -maxdepth 6 \\( -name '.env' -o -name '.env.*' \\) -type f 2>/dev/null
  fi
) | sort -u | head -n 20
`.trim()

export function buildEnvFindCommand(): string {
  return `sh -c ${JSON.stringify(ENV_FIND_CORE)}`
}

export function buildEnvKeysCommand(filePath: string): string {
  const safePath = filePath.replace(/'/g, `'\\''`)
  const shell = `
echo '===ENVKEYS:${safePath}==='
grep -v '^[[:space:]]*#' '${safePath}' 2>/dev/null | grep '=' | sed 's/[[:space:]]*=.*//' | sed 's/^[[:space:]]*export[[:space:]]*//' | sed 's/[[:space:]]//g' | grep -E '^[A-Za-z_][A-Za-z0-9_]*$' | head -n 80
`.trim()
  return `sh -c ${JSON.stringify(shell)}`
}

export function buildEnvInspectorCommand(): string {
  return buildEnvFindCommand()
}