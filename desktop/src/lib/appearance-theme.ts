import { foregroundOn, isLightSurface, mixHexColors } from './appearance-color'

export type AppearanceThemeId =
  | 'termius-dark'
  | 'termius-light'
  | 'flexoki-dark'
  | 'flexoki-light'
  | 'kanagawa-wave'
  | 'kanagawa-lotus'
  | 'kanagawa-dragon'
  | 'hacker-green'
  | 'hacker-blue'
  | 'hacker-red'
  | 'everforest-dark'
  | 'everforest-light'
  | 'night-owl'
  | 'light-owl'
  | 'aura'
  | 'rose-pine'
  | 'rose-pine-moon'
  | 'rose-pine-dawn'

export type AppearanceThemeColors = {
  surface: string
  surfaceRaised: string
  surfaceMuted: string
  border: string
  text: string
  textMuted: string
  statusConnected: string
  terminalBackground: string
  terminalForeground: string
  terminalCursor: string
}

export type AppearanceTheme = {
  id: AppearanceThemeId
  name: string
  previewBars: [string, string, string]
  colors: AppearanceThemeColors
}

export const APPEARANCE_THEMES: AppearanceTheme[] = [
  {
    id: 'termius-dark',
    name: 'Deep Navy',
    previewBars: ['#4AF626', '#7AA2FF', '#E0E0E0'],
    colors: {
      surface: '#12141f',
      surfaceRaised: '#1a1d2e',
      surfaceMuted: '#222536',
      border: '#2d3148',
      text: '#E8EAED',
      textMuted: '#9AA0B4',
      statusConnected: '#4AF626',
      terminalBackground: '#1D2033',
      terminalForeground: '#E9F9FA',
      terminalCursor: '#4AF626',
    },
  },
  {
    id: 'termius-light',
    name: 'Clean Slate',
    previewBars: ['#1B4332', '#2563EB', '#374151'],
    colors: {
      surface: '#ffffff',
      surfaceRaised: '#f4f4f6',
      surfaceMuted: '#ebebef',
      border: '#d8d8de',
      text: '#1a1d26',
      textMuted: '#5c6370',
      statusConnected: '#16a34a',
      terminalBackground: '#ffffff',
      terminalForeground: '#1a1d26',
      terminalCursor: '#2563eb',
    },
  },
  {
    id: 'flexoki-dark',
    name: 'Charcoal Ink',
    previewBars: ['#CECDC3', '#879A39', '#4385BE'],
    colors: {
      surface: '#100F0F',
      surfaceRaised: '#1C1B1A',
      surfaceMuted: '#282726',
      border: '#403E3C',
      text: '#CECDC3',
      textMuted: '#878580',
      statusConnected: '#879A39',
      terminalBackground: '#100F0F',
      terminalForeground: '#CECDC3',
      terminalCursor: '#4385BE',
    },
  },
  {
    id: 'flexoki-light',
    name: 'Warm Parchment',
    previewBars: ['#100F0F', '#66800B', '#205EA6'],
    colors: {
      surface: '#FFFCF0',
      surfaceRaised: '#F2EFE5',
      surfaceMuted: '#E6E2D6',
      border: '#CECDC3',
      text: '#100F0F',
      textMuted: '#6F6E69',
      statusConnected: '#66800B',
      terminalBackground: '#FFFCF0',
      terminalForeground: '#100F0F',
      terminalCursor: '#205EA6',
    },
  },
  {
    id: 'kanagawa-wave',
    name: 'Pacific Ink',
    previewBars: ['#DCD7BA', '#7E9CD8', '#98BB6C'],
    colors: {
      surface: '#1a1a22',
      surfaceRaised: '#1F1F28',
      surfaceMuted: '#2a2a35',
      border: '#363b4a',
      text: '#DCD7BA',
      textMuted: '#727169',
      statusConnected: '#98BB6C',
      terminalBackground: '#1F1F28',
      terminalForeground: '#DCD7BA',
      terminalCursor: '#7E9CD8',
    },
  },
  {
    id: 'kanagawa-lotus',
    name: 'Lotus Cream',
    previewBars: ['#545464', '#8A4F77', '#6F894E'],
    colors: {
      surface: '#e8e2c8',
      surfaceRaised: '#F2ECBC',
      surfaceMuted: '#dcd6b8',
      border: '#c4bea0',
      text: '#545464',
      textMuted: '#727169',
      statusConnected: '#6F894E',
      terminalBackground: '#F2ECBC',
      terminalForeground: '#545464',
      terminalCursor: '#8A4F77',
    },
  },
  {
    id: 'kanagawa-dragon',
    name: 'Obsidian Grove',
    previewBars: ['#C8C093', '#7FB4CA', '#938AA9'],
    colors: {
      surface: '#121210',
      surfaceRaised: '#181616',
      surfaceMuted: '#222020',
      border: '#36342e',
      text: '#C8C093',
      textMuted: '#737C73',
      statusConnected: '#8A9A7B',
      terminalBackground: '#181616',
      terminalForeground: '#C8C093',
      terminalCursor: '#7FB4CA',
    },
  },
  {
    id: 'hacker-green',
    name: 'Phosphor Green',
    previewBars: ['#00FF41', '#00CC33', '#009922'],
    colors: {
      surface: '#000000',
      surfaceRaised: '#050805',
      surfaceMuted: '#0a120a',
      border: '#1a3d1a',
      text: '#00FF41',
      textMuted: '#00CC33',
      statusConnected: '#00FF41',
      terminalBackground: '#000000',
      terminalForeground: '#00FF41',
      terminalCursor: '#39FF6A',
    },
  },
  {
    id: 'hacker-blue',
    name: 'Neon Wire',
    previewBars: ['#00BFFF', '#0088CC', '#006699'],
    colors: {
      surface: '#000000',
      surfaceRaised: '#050508',
      surfaceMuted: '#0a0a14',
      border: '#1a2a4d',
      text: '#00BFFF',
      textMuted: '#66D4FF',
      statusConnected: '#00BFFF',
      terminalBackground: '#000000',
      terminalForeground: '#00BFFF',
      terminalCursor: '#66D4FF',
    },
  },
  {
    id: 'hacker-red',
    name: 'Crimson Terminal',
    previewBars: ['#FF3333', '#CC2222', '#FF6666'],
    colors: {
      surface: '#0d0000',
      surfaceRaised: '#140505',
      surfaceMuted: '#1f0808',
      border: '#4d1a1a',
      text: '#FF5555',
      textMuted: '#CC4444',
      statusConnected: '#FF3333',
      terminalBackground: '#0a0000',
      terminalForeground: '#FF3333',
      terminalCursor: '#FF6666',
    },
  },
  {
    id: 'everforest-dark',
    name: 'Mosswood',
    previewBars: ['#A7C080', '#7FBBB3', '#E69875'],
    colors: {
      surface: '#232A2E',
      surfaceRaised: '#2D353B',
      surfaceMuted: '#343F44',
      border: '#4F585E',
      text: '#D3C6AA',
      textMuted: '#9DA9A0',
      statusConnected: '#A7C080',
      terminalBackground: '#2D353B',
      terminalForeground: '#D3C6AA',
      terminalCursor: '#A7C080',
    },
  },
  {
    id: 'everforest-light',
    name: 'Mosswood Day',
    previewBars: ['#5C6A72', '#8DA101', '#93B259'],
    colors: {
      surface: '#F3EAD3',
      surfaceRaised: '#FDF6E3',
      surfaceMuted: '#E8DFC8',
      border: '#D5CBB0',
      text: '#5C6A72',
      textMuted: '#829181',
      statusConnected: '#8DA101',
      terminalBackground: '#FDF6E3',
      terminalForeground: '#5C6A72',
      terminalCursor: '#8DA101',
    },
  },
  {
    id: 'night-owl',
    name: 'Nocturne',
    previewBars: ['#D6DEEB', '#82AAFF', '#C3E88D'],
    colors: {
      surface: '#01111d',
      surfaceRaised: '#011627',
      surfaceMuted: '#0b2942',
      border: '#1d3b53',
      text: '#D6DEEB',
      textMuted: '#637777',
      statusConnected: '#C3E88D',
      terminalBackground: '#011627',
      terminalForeground: '#D6DEEB',
      terminalCursor: '#82AAFF',
    },
  },
  {
    id: 'light-owl',
    name: 'Daybreak',
    previewBars: ['#403F53', '#0C969B', '#AA0982'],
    colors: {
      surface: '#f5f5f5',
      surfaceRaised: '#FBFBFB',
      surfaceMuted: '#ececec',
      border: '#d4d4d4',
      text: '#403F53',
      textMuted: '#6b6a7a',
      statusConnected: '#0C969B',
      terminalBackground: '#FBFBFB',
      terminalForeground: '#403F53',
      terminalCursor: '#0C969B',
    },
  },
  {
    id: 'aura',
    name: 'Violet Haze',
    previewBars: ['#E6E6E6', '#A277FF', '#61FFCA'],
    colors: {
      surface: '#0f0e14',
      surfaceRaised: '#15141B',
      surfaceMuted: '#1f1d27',
      border: '#2d2a38',
      text: '#EDEDED',
      textMuted: '#a0a0a8',
      statusConnected: '#61FFCA',
      terminalBackground: '#15141B',
      terminalForeground: '#E6E6E6',
      terminalCursor: '#A277FF',
    },
  },
  {
    id: 'rose-pine',
    name: 'Dusk Lavender',
    previewBars: ['#e0def4', '#ebbcba', '#9ccfd8'],
    colors: {
      surface: '#13111a',
      surfaceRaised: '#191724',
      surfaceMuted: '#1f1d2b',
      border: '#403d52',
      text: '#e0def4',
      textMuted: '#908caa',
      statusConnected: '#9ccfd8',
      terminalBackground: '#191724',
      terminalForeground: '#e0def4',
      terminalCursor: '#ebbcba',
    },
  },
  {
    id: 'rose-pine-moon',
    name: 'Moonlit Mauve',
    previewBars: ['#e0def4', '#c4a7e7', '#3e8fb0'],
    colors: {
      surface: '#1c1a26',
      surfaceRaised: '#232136',
      surfaceMuted: '#2a273f',
      border: '#44415a',
      text: '#e0def4',
      textMuted: '#908caa',
      statusConnected: '#3e8fb0',
      terminalBackground: '#232136',
      terminalForeground: '#e0def4',
      terminalCursor: '#c4a7e7',
    },
  },
  {
    id: 'rose-pine-dawn',
    name: 'Morning Blush',
    previewBars: ['#575279', '#d7827e', '#286983'],
    colors: {
      surface: '#f0e9df',
      surfaceRaised: '#faf4ed',
      surfaceMuted: '#e8e0d4',
      border: '#cec8bc',
      text: '#575279',
      textMuted: '#797593',
      statusConnected: '#286983',
      terminalBackground: '#faf4ed',
      terminalForeground: '#575279',
      terminalCursor: '#d7827e',
    },
  },
]

const THEME_IDS = new Set(APPEARANCE_THEMES.map((theme) => theme.id))

const LEGACY_THEME_MAP: Record<string, AppearanceThemeId> = {
  'pitch-black': 'hacker-green',
  soft: 'termius-dark',
  default: 'termius-dark',
}

const STORAGE_KEY = 'terminalssh-appearance-theme'
const DEFAULT_THEME_ID: AppearanceThemeId = 'termius-dark'

export function isAppearanceThemeId(value: string): value is AppearanceThemeId {
  return THEME_IDS.has(value as AppearanceThemeId)
}

export function loadAppearanceThemeId(): AppearanceThemeId {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)

    if (raw && isAppearanceThemeId(raw)) {
      return raw
    }

    if (raw && raw in LEGACY_THEME_MAP) {
      return LEGACY_THEME_MAP[raw]
    }
  } catch {
    // localStorage kullanılamıyorsa varsayılan
  }

  return DEFAULT_THEME_ID
}

export function saveAppearanceThemeId(id: AppearanceThemeId): void {
  try {
    localStorage.setItem(STORAGE_KEY, id)
  } catch {
    // sessizce geç
  }
}

export function getAppearanceTheme(id: AppearanceThemeId): AppearanceTheme {
  return APPEARANCE_THEMES.find((theme) => theme.id === id) ?? APPEARANCE_THEMES[0]
}

export function applyAppearanceTheme(id: AppearanceThemeId): AppearanceTheme {
  const theme = getAppearanceTheme(id)
  const { colors } = theme
  const root = document.documentElement
  const accent = colors.terminalCursor
  const light = isLightSurface(colors.surface)
  const accentHover = mixHexColors(accent, light ? '#000000' : '#ffffff', light ? 0.14 : 0.16)
  const accentActive = mixHexColors(accent, light ? '#000000' : '#ffffff', light ? 0.24 : 0.26)
  const statusError = light ? '#dc2626' : '#f87171'

  root.style.setProperty('--color-surface', colors.surface)
  root.style.setProperty('--color-surface-raised', colors.surfaceRaised)
  root.style.setProperty('--color-surface-muted', colors.surfaceMuted)
  root.style.setProperty('--color-border', colors.border)
  root.style.setProperty('--color-text', colors.text)
  root.style.setProperty('--color-text-muted', colors.textMuted)
  root.style.setProperty('--color-accent', accent)
  root.style.setProperty('--color-accent-hover', accentHover)
  root.style.setProperty('--color-accent-active', accentActive)
  root.style.setProperty('--color-accent-foreground', foregroundOn(accent))
  root.style.setProperty('--color-status-connected', colors.statusConnected)
  root.style.setProperty('--color-on-connected', foregroundOn(colors.statusConnected))
  root.style.setProperty('--color-status-error', statusError)
  root.style.setProperty('--color-on-danger', '#ffffff')
  root.style.setProperty('--color-terminal-background', colors.terminalBackground)
  root.dataset.appearanceTheme = id

  return theme
}