import type { DependencyIntelligenceSnapshot } from '@shared/server-ops/dependency-parser'
import {
  dependencyHasPayload,
  parseDependencyOutput,
} from '@shared/server-ops/dependency-parser'

const DEPENDENCY_SHELL = `
echo '===LISTEN==='
ss -tlnp 2>/dev/null | head -n 45
echo '===DOCKER==='
docker ps --format '{{.Names}}|{{.Ports}}|{{.Image}}' 2>/dev/null | head -n 30
echo '===SYSTEMD==='
systemctl list-units --type=service --state=running --no-pager --no-legend 2>/dev/null | awk '{print $1}' | head -n 35
echo '===PROXY==='
grep -rhE 'proxy_pass\\s+https?:' /etc/nginx 2>/dev/null | head -n 20
`.trim()

export function buildDependencyCommand(): string {
  return `/bin/sh -c ${JSON.stringify(DEPENDENCY_SHELL)}`
}

export { dependencyHasPayload, parseDependencyOutput }

export type { DependencyIntelligenceSnapshot }