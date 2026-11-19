const STORAGE_KEY = 'terminalssh-sidebar-collapsed'

export function loadSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function saveSidebarCollapsed(collapsed: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0')
  } catch {
    // sessizce geç
  }
}

const SNIPPET_KEY = 'terminalssh-snippet-panel-collapsed'

export function loadSnippetPanelCollapsed(): boolean {
  try {
    return localStorage.getItem(SNIPPET_KEY) === '1'
  } catch {
    return false
  }
}

export function saveSnippetPanelCollapsed(collapsed: boolean): void {
  try {
    localStorage.setItem(SNIPPET_KEY, collapsed ? '1' : '0')
  } catch {
    // sessizce geç
  }
}