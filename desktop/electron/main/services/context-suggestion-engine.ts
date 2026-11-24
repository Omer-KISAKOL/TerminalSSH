import { randomUUID } from 'node:crypto'

import type { ContextCommandSuggestion, ServerIntelligenceSnapshot } from '@shared/contracts/server-ops'

function push(
  list: ContextCommandSuggestion[],
  input: Omit<ContextCommandSuggestion, 'id'>,
): void {
  list.push({ ...input, id: randomUUID() })
}

export function buildContextSuggestions(snapshot: ServerIntelligenceSnapshot | null): ContextCommandSuggestion[] {
  const suggestions: ContextCommandSuggestion[] = []
  const tools = new Set((snapshot?.detectedTools ?? []).map((tool) => tool.toLowerCase()))

  push(suggestions, {
    label: 'Disk kullanımı',
    command: 'df -h -P -x tmpfs -x devtmpfs',
    description: 'Bağlı dosya sistemlerinin doluluk oranlarını gösterir.',
    category: 'diagnostics',
  })

  push(suggestions, {
    label: 'Bellek durumu',
    command: 'free -h',
    description: 'RAM ve swap kullanımını özetler.',
    category: 'diagnostics',
  })

  push(suggestions, {
    label: 'Sistem günlüğü (son 40)',
    command: 'journalctl -n 40 --no-pager 2>/dev/null || tail -n 40 /var/log/syslog 2>/dev/null',
    description: 'Son sistem olaylarını okur; izin yoksa alternatif günlük dener.',
    category: 'logs',
  })

  push(suggestions, {
    label: 'Aktif servisler',
    command: 'systemctl list-units --type=service --state=running --no-pager 2>/dev/null | head -n 30',
    description: 'Çalışan systemd servislerini listeler.',
    category: 'service',
  })

  if (tools.has('docker')) {
    push(suggestions, {
      label: 'Docker konteynerleri',
      command: 'docker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"',
      description: 'Çalışan konteynerleri tablo halinde gösterir.',
      category: 'docker',
    })

    push(suggestions, {
      label: 'Docker kaynak kullanımı',
      command: 'docker stats --no-stream --format "table {{.Name}}\\t{{.CPUPerc}}\\t{{.MemUsage}}"',
      description: 'Anlık CPU ve bellek kullanımını özetler.',
      category: 'docker',
    })
  }

  if (tools.has('nginx')) {
    push(suggestions, {
      label: 'Nginx yapılandırma testi',
      command: 'sudo nginx -t 2>&1',
      description: 'Nginx konfigürasyonunu doğrular (sudo gerekebilir).',
      category: 'service',
    })

    push(suggestions, {
      label: 'Nginx durumu',
      command: 'systemctl status nginx --no-pager 2>/dev/null | head -n 20',
      description: 'Nginx servis durumunu gösterir.',
      category: 'service',
    })
  }

  if (tools.has('pm2')) {
    push(suggestions, {
      label: 'PM2 süreç listesi',
      command: 'pm2 list',
      description: 'Node.js süreçlerini PM2 üzerinden listeler.',
      category: 'service',
    })
  }

  if (tools.has('node')) {
    push(suggestions, {
      label: 'Node sürümü',
      command: 'node -v && npm -v',
      description: 'Kurulu Node.js ve npm sürümlerini yazar.',
      category: 'diagnostics',
    })
  }

  push(suggestions, {
    label: 'Açık portlar (dinleyen)',
    command: 'ss -tulpen 2>/dev/null | head -n 25 || netstat -tulpen 2>/dev/null | head -n 25',
    description: 'Dinleyen TCP/UDP portlarını listeler.',
    category: 'network',
  })

  return suggestions
}