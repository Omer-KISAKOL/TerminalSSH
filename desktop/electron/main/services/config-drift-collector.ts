export const CONFIG_DRIFT_PATHS = [
  '/etc/nginx/nginx.conf',
  '/etc/nginx/sites-enabled/default',
  '/etc/ssh/sshd_config',
  '/etc/ufw/ufw.conf',
  '/etc/iptables/rules.v4',
  '/etc/firewalld/firewalld.conf',
] as const

function fingerprintLineForPath(path: string): string {
  const escaped = path.replace(/'/g, `'\\''`)
  return `f='${escaped}'; if [ -e "$f" ] && [ -r "$f" ]; then h=$(sha256sum "$f" 2>/dev/null | awk '{print $1}'); [ -z "$h" ] && h=$(md5sum "$f" 2>/dev/null | awk '{print $1}'); sz=$(wc -c < "$f" 2>/dev/null | tr -d ' '); [ -z "$sz" ] && sz=0; echo "$h|$f|$sz"; elif [ -e "$f" ]; then echo "DENIED|$f|0"; else echo "MISSING|$f|0"; fi`
}

const DISCOVER_NGINX_SITES_SHELL =
  'for f in /etc/nginx/sites-enabled/* /etc/nginx/conf.d/*.conf; do [ -f "$f" ] && echo "$f"; done 2>/dev/null | head -n 10'

export function buildConfigDriftDiscoverCommand(): string {
  return `sh -c ${JSON.stringify(DISCOVER_NGINX_SITES_SHELL)}`
}

const DRIFT_SHELL = [
  "echo '===CONFIG_HASH==='",
  ...CONFIG_DRIFT_PATHS.map((path) => fingerprintLineForPath(path)),
]
  .join('\n')
  .trim()

export function buildConfigDriftCommand(): string {
  return `sh -c ${JSON.stringify(DRIFT_SHELL)}`
}

export function buildConfigDriftPathCommand(path: string): string {
  return `sh -c ${JSON.stringify(fingerprintLineForPath(path))}`
}