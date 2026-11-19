import { Menu } from 'electron'

/** Yerel File / Edit / View çubuğunu kapatır; işlevler uygulama içi arayüzde. */
export function clearApplicationMenu(): void {
  Menu.setApplicationMenu(null)
}