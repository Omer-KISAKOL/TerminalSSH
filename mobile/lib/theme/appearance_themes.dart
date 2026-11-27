import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Masaüstü projedeki (desktop/src/lib/appearance-theme.ts) temaların birebir karşılığı.
class AppearanceTheme {
  const AppearanceTheme({
    required this.id,
    required this.name,
    required this.previewBars,
    required this.surface,
    required this.surfaceRaised,
    required this.surfaceMuted,
    required this.border,
    required this.text,
    required this.textMuted,
    required this.statusConnected,
    required this.terminalBackground,
    required this.terminalForeground,
    required this.terminalCursor,
  });

  final String id;
  final String name;
  final List<Color> previewBars;
  final Color surface;
  final Color surfaceRaised;
  final Color surfaceMuted;
  final Color border;
  final Color text;
  final Color textMuted;
  final Color statusConnected;
  final Color terminalBackground;
  final Color terminalForeground;
  final Color terminalCursor;

  Color get accent => terminalCursor;
  bool get isLight => surface.computeLuminance() > 0.55;
}

const defaultThemeId = 'termius-dark';

const appearanceThemes = <AppearanceTheme>[
  AppearanceTheme(
    id: 'termius-dark',
    name: 'TSSH Main',
    previewBars: [Color(0xFF4AF626), Color(0xFF7AA2FF), Color(0xFFE0E0E0)],
    surface: Color(0xFF12141F),
    surfaceRaised: Color(0xFF1A1D2E),
    surfaceMuted: Color(0xFF222536),
    border: Color(0xFF2D3148),
    text: Color(0xFFE8EAED),
    textMuted: Color(0xFF9AA0B4),
    statusConnected: Color(0xFF4AF626),
    terminalBackground: Color(0xFF1D2033),
    terminalForeground: Color(0xFF4AF626),
    terminalCursor: Color(0xFF4AF626),
  ),
  AppearanceTheme(
    id: 'termius-light',
    name: 'Clean Slate',
    previewBars: [Color(0xFF1B4332), Color(0xFF2563EB), Color(0xFF374151)],
    surface: Color(0xFFFFFFFF),
    surfaceRaised: Color(0xFFF4F4F6),
    surfaceMuted: Color(0xFFEBEBEF),
    border: Color(0xFFD8D8DE),
    text: Color(0xFF1A1D26),
    textMuted: Color(0xFF5C6370),
    statusConnected: Color(0xFF16A34A),
    terminalBackground: Color(0xFFFFFFFF),
    terminalForeground: Color(0xFF1A1D26),
    terminalCursor: Color(0xFF2563EB),
  ),
  AppearanceTheme(
    id: 'flexoki-dark',
    name: 'Charcoal Ink',
    previewBars: [Color(0xFFCECDC3), Color(0xFF879A39), Color(0xFF4385BE)],
    surface: Color(0xFF100F0F),
    surfaceRaised: Color(0xFF1C1B1A),
    surfaceMuted: Color(0xFF282726),
    border: Color(0xFF403E3C),
    text: Color(0xFFCECDC3),
    textMuted: Color(0xFF878580),
    statusConnected: Color(0xFF879A39),
    terminalBackground: Color(0xFF100F0F),
    terminalForeground: Color(0xFFCECDC3),
    terminalCursor: Color(0xFF4385BE),
  ),
  AppearanceTheme(
    id: 'flexoki-light',
    name: 'Warm Parchment',
    previewBars: [Color(0xFF100F0F), Color(0xFF66800B), Color(0xFF205EA6)],
    surface: Color(0xFFFFFCF0),
    surfaceRaised: Color(0xFFF2EFE5),
    surfaceMuted: Color(0xFFE6E2D6),
    border: Color(0xFFCECDC3),
    text: Color(0xFF100F0F),
    textMuted: Color(0xFF6F6E69),
    statusConnected: Color(0xFF66800B),
    terminalBackground: Color(0xFFFFFCF0),
    terminalForeground: Color(0xFF100F0F),
    terminalCursor: Color(0xFF205EA6),
  ),
  AppearanceTheme(
    id: 'kanagawa-wave',
    name: 'Pacific Ink',
    previewBars: [Color(0xFFDCD7BA), Color(0xFF7E9CD8), Color(0xFF98BB6C)],
    surface: Color(0xFF1A1A22),
    surfaceRaised: Color(0xFF1F1F28),
    surfaceMuted: Color(0xFF2A2A35),
    border: Color(0xFF363B4A),
    text: Color(0xFFDCD7BA),
    textMuted: Color(0xFF727169),
    statusConnected: Color(0xFF98BB6C),
    terminalBackground: Color(0xFF1F1F28),
    terminalForeground: Color(0xFFDCD7BA),
    terminalCursor: Color(0xFF7E9CD8),
  ),
  AppearanceTheme(
    id: 'kanagawa-lotus',
    name: 'Lotus Cream',
    previewBars: [Color(0xFF545464), Color(0xFF8A4F77), Color(0xFF6F894E)],
    surface: Color(0xFFE8E2C8),
    surfaceRaised: Color(0xFFF2ECBC),
    surfaceMuted: Color(0xFFDCD6B8),
    border: Color(0xFFC4BEA0),
    text: Color(0xFF545464),
    textMuted: Color(0xFF727169),
    statusConnected: Color(0xFF6F894E),
    terminalBackground: Color(0xFFF2ECBC),
    terminalForeground: Color(0xFF545464),
    terminalCursor: Color(0xFF8A4F77),
  ),
  AppearanceTheme(
    id: 'kanagawa-dragon',
    name: 'Obsidian Grove',
    previewBars: [Color(0xFFC8C093), Color(0xFF7FB4CA), Color(0xFF938AA9)],
    surface: Color(0xFF121210),
    surfaceRaised: Color(0xFF181616),
    surfaceMuted: Color(0xFF222020),
    border: Color(0xFF36342E),
    text: Color(0xFFC8C093),
    textMuted: Color(0xFF737C73),
    statusConnected: Color(0xFF8A9A7B),
    terminalBackground: Color(0xFF181616),
    terminalForeground: Color(0xFFC8C093),
    terminalCursor: Color(0xFF7FB4CA),
  ),
  AppearanceTheme(
    id: 'hacker-green',
    name: 'Phosphor Green',
    previewBars: [Color(0xFF00FF41), Color(0xFF00CC33), Color(0xFF009922)],
    surface: Color(0xFF000000),
    surfaceRaised: Color(0xFF050805),
    surfaceMuted: Color(0xFF0A120A),
    border: Color(0xFF1A3D1A),
    text: Color(0xFF00FF41),
    textMuted: Color(0xFF00CC33),
    statusConnected: Color(0xFF00FF41),
    terminalBackground: Color(0xFF000000),
    terminalForeground: Color(0xFF00FF41),
    terminalCursor: Color(0xFF39FF6A),
  ),
  AppearanceTheme(
    id: 'hacker-blue',
    name: 'Neon Wire',
    previewBars: [Color(0xFF00BFFF), Color(0xFF0088CC), Color(0xFF006699)],
    surface: Color(0xFF000000),
    surfaceRaised: Color(0xFF050508),
    surfaceMuted: Color(0xFF0A0A14),
    border: Color(0xFF1A2A4D),
    text: Color(0xFF00BFFF),
    textMuted: Color(0xFF66D4FF),
    statusConnected: Color(0xFF00BFFF),
    terminalBackground: Color(0xFF000000),
    terminalForeground: Color(0xFF00BFFF),
    terminalCursor: Color(0xFF66D4FF),
  ),
  AppearanceTheme(
    id: 'hacker-red',
    name: 'Crimson Terminal',
    previewBars: [Color(0xFFFF3333), Color(0xFFCC2222), Color(0xFFFF6666)],
    surface: Color(0xFF0D0000),
    surfaceRaised: Color(0xFF140505),
    surfaceMuted: Color(0xFF1F0808),
    border: Color(0xFF4D1A1A),
    text: Color(0xFFFF5555),
    textMuted: Color(0xFFCC4444),
    statusConnected: Color(0xFFFF3333),
    terminalBackground: Color(0xFF0A0000),
    terminalForeground: Color(0xFFFF3333),
    terminalCursor: Color(0xFFFF6666),
  ),
  AppearanceTheme(
    id: 'everforest-dark',
    name: 'Mosswood',
    previewBars: [Color(0xFFA7C080), Color(0xFF7FBBB3), Color(0xFFE69875)],
    surface: Color(0xFF232A2E),
    surfaceRaised: Color(0xFF2D353B),
    surfaceMuted: Color(0xFF343F44),
    border: Color(0xFF4F585E),
    text: Color(0xFFD3C6AA),
    textMuted: Color(0xFF9DA9A0),
    statusConnected: Color(0xFFA7C080),
    terminalBackground: Color(0xFF2D353B),
    terminalForeground: Color(0xFFD3C6AA),
    terminalCursor: Color(0xFFA7C080),
  ),
  AppearanceTheme(
    id: 'everforest-light',
    name: 'Mosswood Day',
    previewBars: [Color(0xFF5C6A72), Color(0xFF8DA101), Color(0xFF93B259)],
    surface: Color(0xFFF3EAD3),
    surfaceRaised: Color(0xFFFDF6E3),
    surfaceMuted: Color(0xFFE8DFC8),
    border: Color(0xFFD5CBB0),
    text: Color(0xFF5C6A72),
    textMuted: Color(0xFF829181),
    statusConnected: Color(0xFF8DA101),
    terminalBackground: Color(0xFFFDF6E3),
    terminalForeground: Color(0xFF5C6A72),
    terminalCursor: Color(0xFF8DA101),
  ),
  AppearanceTheme(
    id: 'night-owl',
    name: 'Nocturne',
    previewBars: [Color(0xFFD6DEEB), Color(0xFF82AAFF), Color(0xFFC3E88D)],
    surface: Color(0xFF01111D),
    surfaceRaised: Color(0xFF011627),
    surfaceMuted: Color(0xFF0B2942),
    border: Color(0xFF1D3B53),
    text: Color(0xFFD6DEEB),
    textMuted: Color(0xFF637777),
    statusConnected: Color(0xFFC3E88D),
    terminalBackground: Color(0xFF011627),
    terminalForeground: Color(0xFFD6DEEB),
    terminalCursor: Color(0xFF82AAFF),
  ),
  AppearanceTheme(
    id: 'light-owl',
    name: 'Daybreak',
    previewBars: [Color(0xFF403F53), Color(0xFF0C969B), Color(0xFFAA0982)],
    surface: Color(0xFFF5F5F5),
    surfaceRaised: Color(0xFFFBFBFB),
    surfaceMuted: Color(0xFFECECEC),
    border: Color(0xFFD4D4D4),
    text: Color(0xFF403F53),
    textMuted: Color(0xFF6B6A7A),
    statusConnected: Color(0xFF0C969B),
    terminalBackground: Color(0xFFFBFBFB),
    terminalForeground: Color(0xFF403F53),
    terminalCursor: Color(0xFF0C969B),
  ),
  AppearanceTheme(
    id: 'aura',
    name: 'Violet Haze',
    previewBars: [Color(0xFFE6E6E6), Color(0xFFA277FF), Color(0xFF61FFCA)],
    surface: Color(0xFF0F0E14),
    surfaceRaised: Color(0xFF15141B),
    surfaceMuted: Color(0xFF1F1D27),
    border: Color(0xFF2D2A38),
    text: Color(0xFFEDEDED),
    textMuted: Color(0xFFA0A0A8),
    statusConnected: Color(0xFF61FFCA),
    terminalBackground: Color(0xFF15141B),
    terminalForeground: Color(0xFFE6E6E6),
    terminalCursor: Color(0xFFA277FF),
  ),
  AppearanceTheme(
    id: 'rose-pine',
    name: 'Dusk Lavender',
    previewBars: [Color(0xFFE0DEF4), Color(0xFFEBBCBA), Color(0xFF9CCFD8)],
    surface: Color(0xFF13111A),
    surfaceRaised: Color(0xFF191724),
    surfaceMuted: Color(0xFF1F1D2B),
    border: Color(0xFF403D52),
    text: Color(0xFFE0DEF4),
    textMuted: Color(0xFF908CAA),
    statusConnected: Color(0xFF9CCFD8),
    terminalBackground: Color(0xFF191724),
    terminalForeground: Color(0xFFE0DEF4),
    terminalCursor: Color(0xFFEBBCBA),
  ),
  AppearanceTheme(
    id: 'rose-pine-moon',
    name: 'Warkose Mauve',
    previewBars: [Color(0xFFE0DEF4), Color(0xFFC4A7E7), Color(0xFF3E8FB0)],
    surface: Color(0xFF1C1A26),
    surfaceRaised: Color(0xFF232136),
    surfaceMuted: Color(0xFF2A273F),
    border: Color(0xFF44415A),
    text: Color(0xFFE0DEF4),
    textMuted: Color(0xFF908CAA),
    statusConnected: Color(0xFF3E8FB0),
    terminalBackground: Color(0xFF232136),
    terminalForeground: Color(0xFFE0DEF4),
    terminalCursor: Color(0xFFC4A7E7),
  ),
  AppearanceTheme(
    id: 'rose-pine-dawn',
    name: 'Morning Blush',
    previewBars: [Color(0xFF575279), Color(0xFFD7827E), Color(0xFF286983)],
    surface: Color(0xFFF0E9DF),
    surfaceRaised: Color(0xFFFAF4ED),
    surfaceMuted: Color(0xFFE8E0D4),
    border: Color(0xFFCEC8BC),
    text: Color(0xFF575279),
    textMuted: Color(0xFF797593),
    statusConnected: Color(0xFF286983),
    terminalBackground: Color(0xFFFAF4ED),
    terminalForeground: Color(0xFF575279),
    terminalCursor: Color(0xFFD7827E),
  ),
  AppearanceTheme(
    id: 'copper-foundry',
    name: 'Copper Foundry',
    previewBars: [Color(0xFFE8A87C), Color(0xFFE07B39), Color(0xFFC45C26)],
    surface: Color(0xFF1C1511),
    surfaceRaised: Color(0xFF261E18),
    surfaceMuted: Color(0xFF302820),
    border: Color(0xFF4A3C32),
    text: Color(0xFFF2E6DC),
    textMuted: Color(0xFFA89585),
    statusConnected: Color(0xFFE07B39),
    terminalBackground: Color(0xFF261E18),
    terminalForeground: Color(0xFFE8A87C),
    terminalCursor: Color(0xFFFF9F5A),
  ),
  AppearanceTheme(
    id: 'tokyo-rain',
    name: 'Tokyo Rain',
    previewBars: [Color(0xFFA8D8FF), Color(0xFFFF6B9D), Color(0xFFFFD93D)],
    surface: Color(0xFF141820),
    surfaceRaised: Color(0xFF1A2230),
    surfaceMuted: Color(0xFF232D3D),
    border: Color(0xFF354152),
    text: Color(0xFFD4E4F7),
    textMuted: Color(0xFF7A8FA6),
    statusConnected: Color(0xFFFF6B9D),
    terminalBackground: Color(0xFF1A2230),
    terminalForeground: Color(0xFFA8D8FF),
    terminalCursor: Color(0xFFFF6B9D),
  ),
  AppearanceTheme(
    id: 'saffron-vault',
    name: 'Saffron Vault',
    previewBars: [Color(0xFFF4D35E), Color(0xFF6EB5FF), Color(0xFFF4C430)],
    surface: Color(0xFF0C0F1A),
    surfaceRaised: Color(0xFF12172A),
    surfaceMuted: Color(0xFF1A2138),
    border: Color(0xFF2D3555),
    text: Color(0xFFE8ECF4),
    textMuted: Color(0xFF8892AB),
    statusConnected: Color(0xFFF4C430),
    terminalBackground: Color(0xFF12172A),
    terminalForeground: Color(0xFFF4D35E),
    terminalCursor: Color(0xFF6EB5FF),
  ),
  AppearanceTheme(
    id: 'salt-mirage',
    name: 'Salt Mirage',
    previewBars: [Color(0xFF2C5282), Color(0xFFC05621), Color(0xFF38B2AC)],
    surface: Color(0xFFF4F7FA),
    surfaceRaised: Color(0xFFFAFCFE),
    surfaceMuted: Color(0xFFE8EEF3),
    border: Color(0xFFCDD6E0),
    text: Color(0xFF243447),
    textMuted: Color(0xFF5C6B7A),
    statusConnected: Color(0xFFC05621),
    terminalBackground: Color(0xFFFAFCFE),
    terminalForeground: Color(0xFF2C5282),
    terminalCursor: Color(0xFFC05621),
  ),
  AppearanceTheme(
    id: 'boreal-mist',
    name: 'Boreal Mist',
    previewBars: [Color(0xFF9EF0E4), Color(0xFFB8A0FF), Color(0xFF7EE8D8)],
    surface: Color(0xFF0A1214),
    surfaceRaised: Color(0xFF0F1C20),
    surfaceMuted: Color(0xFF15282E),
    border: Color(0xFF24505A),
    text: Color(0xFFCCE8E4),
    textMuted: Color(0xFF6A9A94),
    statusConnected: Color(0xFF7EE8D8),
    terminalBackground: Color(0xFF0F1C20),
    terminalForeground: Color(0xFF9EF0E4),
    terminalCursor: Color(0xFFB8A0FF),
  ),
];

AppearanceTheme appearanceThemeById(String id) {
  for (final theme in appearanceThemes) {
    if (theme.id == id) return theme;
  }
  return appearanceThemes.first;
}

const _storageKey = 'terminalssh-appearance-theme';

/// Seçili temayı tutar, kalıcı saklar ve değişince tüm arayüzü yeniden çizdirir.
class ThemeController extends ChangeNotifier {
  ThemeController._();

  static final ThemeController instance = ThemeController._();

  AppearanceTheme _theme = appearanceThemeById(defaultThemeId);

  AppearanceTheme get theme => _theme;

  Future<void> load() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final id = prefs.getString(_storageKey);
      if (id != null) {
        _theme = appearanceThemeById(id);
      }
    } catch (_) {
      // Kayıtlı tema okunamazsa varsayılan kullanılır.
    }
  }

  Future<void> select(String id) async {
    if (id == _theme.id) return;
    _theme = appearanceThemeById(id);
    notifyListeners();
    _rebuildAll();

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_storageKey, _theme.id);
    } catch (_) {
      // Kaydedilemese de tema oturum boyunca geçerli kalır.
    }
  }

  /// Renkler AppColors üzerinden okunduğu için tüm element ağacını (durumu koruyarak)
  /// yeniden çizdirir; açık terminal oturumları kapanmaz.
  void _rebuildAll() {
    void visit(Element element) {
      element.markNeedsBuild();
      element.visitChildren(visit);
    }

    WidgetsBinding.instance.addPostFrameCallback((_) {
      WidgetsBinding.instance.rootElement?.visitChildren(visit);
    });
    WidgetsBinding.instance.scheduleFrame();
  }
}
