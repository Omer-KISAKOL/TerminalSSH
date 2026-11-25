const ENV_SHELL = `
echo '===ENV_FILES==='
find /home /var/www /opt /srv -maxdepth 6 \\( -name '.env' -o -name '.env.local' -o -name '.env.production' -o -name '.env.example' \\) 2>/dev/null | head -n 12
for f in $(find /home /var/www /opt /srv -maxdepth 6 \\( -name '.env' -o -name '.env.local' -o -name '.env.production' -o -name '.env.example' \\) 2>/dev/null | head -n 12); do
  echo "===ENVKEYS:$f==="
  grep -E '^[A-Za-z_][A-Za-z0-9_]*=' "$f" 2>/dev/null | cut -d= -f1 | sed 's/[[:space:]]//g' | head -n 60
done
`.trim()

export function buildEnvInspectorCommand(): string {
  return `/bin/sh -c ${JSON.stringify(ENV_SHELL)}`
}