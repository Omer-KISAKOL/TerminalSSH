type SidebarProps = {
  onNewConnection: () => void
}

export function Sidebar({ onNewConnection }: SidebarProps) {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-surface-raised">
      <header className="border-b border-border px-5 py-4">
        <h1 className="text-lg font-semibold tracking-tight text-white">TerminalSSH</h1>
        <p className="mt-1 text-xs text-text-muted">SSH Terminal İstemcisi</p>
      </header>

      <div className="p-4">
        <button
          type="button"
          onClick={onNewConnection}
          className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:brightness-110"
        >
          Yeni Bağlantı
        </button>
      </div>

      <section className="flex min-h-0 flex-1 flex-col px-4 pb-4">
        <h2 className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-text-muted">
          Kayıtlı Sunucular
        </h2>
        <div className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-text-muted">
          Henüz kayıtlı sunucu yok.
        </div>
      </section>
    </aside>
  )
}
