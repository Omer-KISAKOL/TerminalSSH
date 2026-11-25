const INCIDENT_SHELL = `
echo '===JOURNAL_ERRORS==='
journalctl -p err..alert -n 25 --no-pager 2>/dev/null || dmesg -T -l err,crit,alert,emerg 2>/dev/null | tail -n 25
echo '===RESOURCE==='
uptime 2>/dev/null
free -b 2>/dev/null | head -n 3
`.trim()

export function buildIncidentAnalyzerCommand(): string {
  return `/bin/sh -c ${JSON.stringify(INCIDENT_SHELL)}`
}