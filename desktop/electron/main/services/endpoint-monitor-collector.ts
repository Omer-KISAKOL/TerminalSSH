export const ENDPOINT_PROBE_URLS = [
  'http://127.0.0.1/',
  'http://127.0.0.1/health',
  'http://127.0.0.1/api/health',
  'http://127.0.0.1/status',
  'http://127.0.0.1:80/',
  'https://127.0.0.1/',
  'https://127.0.0.1:443/',
  'http://127.0.0.1:3000/',
  'http://127.0.0.1:8080/',
  'http://127.0.0.1:8090/',
  'http://127.0.0.1:3005/',
  'http://127.0.0.1:8787/',
] as const

function probeLine(url: string): string {
  const safeUrl = url.replace(/'/g, `'\\''`)
  return `url='${safeUrl}'; out=$(curl -k -s -o /dev/null -w '%{http_code}|%{time_total}|%{ssl_verify_result}' --connect-timeout 2 --max-time 4 "$url" 2>/dev/null || echo '0|0|0'); echo "$out|$url"`
}

const ENDPOINT_SHELL = [
  "echo '===LISTENERS==='",
  'ss -tlnH 2>/dev/null | head -n 16',
  "echo '===PROBE_RESULTS==='",
  ...ENDPOINT_PROBE_URLS.map((url) => probeLine(url)),
]
  .join('\n')
  .trim()

export function buildEndpointMonitorCommand(): string {
  return `/bin/sh -c ${JSON.stringify(ENDPOINT_SHELL)}`
}

export function buildEndpointProbeCommand(url: string): string {
  return `/bin/sh -c ${JSON.stringify(probeLine(url))}`
}

export function buildEndpointListenersCommand(): string {
  return `/bin/sh -c ${JSON.stringify("echo '===LISTENERS==='; ss -tlnH 2>/dev/null | head -n 16 || netstat -tln 2>/dev/null | head -n 16")}`
}