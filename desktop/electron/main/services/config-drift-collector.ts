const DRIFT_SHELL = `
echo '===CONFIG_HASH==='
for f in /etc/nginx/nginx.conf /etc/ssh/sshd_config /etc/ufw/ufw.conf /etc/iptables/rules.v4; do
  if [ -r "$f" ]; then
    h=$(sha256sum "$f" 2>/dev/null | awk '{print $1}')
    sz=$(stat -c%s "$f" 2>/dev/null || echo 0)
    echo "$h|$f|$sz"
  else
    echo "MISSING|$f|0"
  fi
done
`.trim()

export function buildConfigDriftCommand(): string {
  return `/bin/sh -c ${JSON.stringify(DRIFT_SHELL)}`
}