import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const iconDir = join(root, 'resources', 'icons')
const svg = join(iconDir, 'icon.svg')
const png = join(iconDir, 'icon.png')
const ico = join(iconDir, 'icon.ico')
const sizesDir = join(iconDir, 'icons')

function runMagick(args) {
  const result = spawnSync('magick', args, { stdio: 'inherit' })
  return result.status === 0
}

function magickAvailable() {
  const result = spawnSync('magick', ['-version'], { stdio: 'ignore' })
  return result.status === 0
}

function copyPublicIcon() {
  if (!existsSync(png)) {
    console.error(`Icon not found: ${png}`)
    process.exit(1)
  }

  copyFileSync(png, join(root, 'public', 'icon.png'))
}

async function ensureWindowsIco() {
  if (!existsSync(png)) {
    console.error(`Icon not found: ${png}`)
    process.exit(1)
  }

  const pngToIco = (await import('png-to-ico')).default
  const buffer = await pngToIco(png)
  writeFileSync(ico, buffer)
  console.log(`Generated Windows icon: ${ico}`)
}

if (magickAvailable() && existsSync(svg)) {
  mkdirSync(sizesDir, { recursive: true })

  const steps = [
    ['-background', 'none', svg, '-resize', '512x512', png],
    ['-background', 'none', svg, '-resize', '256x256', join(sizesDir, '256x256.png')],
    ['-background', 'none', svg, '-resize', '128x128', join(sizesDir, '128x128.png')],
    ['-background', 'none', svg, '-resize', '64x64', join(sizesDir, '64x64.png')],
    ['-background', 'none', svg, '-resize', '48x48', join(sizesDir, '48x48.png')],
    ['-background', 'none', svg, '-resize', '32x32', join(sizesDir, '32x32.png')],
    ['-background', 'none', svg, '-resize', '16x16', join(sizesDir, '16x16.png')],
    [png, '-define', 'icon:auto-resize=256,128,64,48,32,16', ico],
  ]

  for (const args of steps) {
    if (!runMagick(args)) {
      console.error('ImageMagick icon generation failed.')
      process.exit(1)
    }
  }

  console.log(`Icons generated in ${iconDir}`)
} else if (existsSync(png)) {
  console.log(`ImageMagick yok; icon.png kullanılıyor (${iconDir})`)
  await ensureWindowsIco()
} else {
  console.error('ImageMagick (magick) gerekli veya resources/icons içinde icon.png olmalı.')
  process.exit(1)
}

copyPublicIcon()