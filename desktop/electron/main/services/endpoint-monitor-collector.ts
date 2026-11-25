const ENDPOINT_SHELL = `
echo '===PROBE_RESULTS==='
ports=$(ss -tlnH 2>/dev/null | awk '{print $4}' | sed 's/.*://g' | sort -u | head -n 8)
for port in $ports 80 443 3000 8080 8787; do
  for path in / /health /api/health /status; do
    url="http://127.0.0.1:$port$path"
    out=$(curl -k -s -o /dev/null -w '%{http_code}|%{time_total}|%{ssl_verify_result}' --connect-timeout 2 --max-time 4 "$url" 2>/dev/null || echo '0|0|0')
    code=$(echo "$out" | cut -d'|' -f1)
    ssl=$(echo "$out" | cut -d'|' -f3)
    time=$(echo "$out" | cut -d'|' -f2)
    [ "$code" = "000" ] && continue
    echo "$code|$time|$ssl|$url"
  done
done | head -n 20
`.trim()

export function buildEndpointMonitorCommand(): string {
  return `/bin/sh -c ${JSON.stringify(ENDPOINT_SHELL)}`
}