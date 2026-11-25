const DISK_SHELL = `
echo '===MOUNTS==='
df -h -P -x tmpfs -x devtmpfs 2>/dev/null | head -n 12
echo '===TOP_DIRS==='
for p in /var /home /usr /opt /tmp /srv; do
  [ -d "$p" ] || continue
  du -x -sk --max-depth=1 "$p" 2>/dev/null
done | awk 'NF>=2 {print ($1 * 1024) "\\t" $2}' | sort -n | tail -n 22
echo '===LARGE_FILES==='
find /var /home /opt /tmp /srv -xdev -type f -size +48M 2>/dev/null | head -n 25 | while read -r f; do
  sz=$(stat -c%s "$f" 2>/dev/null || wc -c <"$f" 2>/dev/null || echo 0)
  echo "$sz|$f|file"
done | sort -t'|' -k1 -n | tail -n 18
echo '===CLUTTER==='
du -x -sk --max-depth=1 /var/log /var/cache 2>/dev/null | awk 'NF>=2 {print ($1 * 1024) "\\t" $2}'
find /var/log -xdev -type f \\( -name '*.log' -o -name '*.gz' \\) -size +8M 2>/dev/null | head -n 15 | while read -r f; do
  sz=$(stat -c%s "$f" 2>/dev/null || echo 0)
  echo "$sz|$f|log"
done
find /var/cache -xdev -type f -size +5M 2>/dev/null | head -n 15 | while read -r f; do
  sz=$(stat -c%s "$f" 2>/dev/null || echo 0)
  echo "$sz|$f|cache"
done
`.trim()

export function buildDiskAnalyzerCommand(): string {
  return `/bin/sh -c ${JSON.stringify(DISK_SHELL)}`
}