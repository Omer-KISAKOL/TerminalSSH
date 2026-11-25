const DISK_SHELL = `
echo '===MOUNTS==='
df -h -P -x tmpfs -x devtmpfs 2>/dev/null | head -n 12
echo '===TOP_DIRS==='
du -sk /var /home /usr /opt /tmp /srv /var/log /var/cache 2>/dev/null | awk '{print ($1 * 1024) "\\t" $2}'
echo '===LARGE_FILES==='
find /var /home /opt /tmp /srv -xdev -type f -size +32M -printf '%s|%p|file\\n' 2>/dev/null | head -n 18
echo '===CLUTTER==='
find /var/log /var/cache -xdev -type f \\( -name '*.log' -o -name '*.gz' \\) -size +4M -printf '%s|%p|log\\n' 2>/dev/null | head -n 12
find /var/cache -xdev -type f -size +2M -printf '%s|%p|cache\\n' 2>/dev/null | head -n 12
`.trim()

export function buildDiskAnalyzerCommand(): string {
  return `/bin/sh -c ${JSON.stringify(DISK_SHELL)}`
}