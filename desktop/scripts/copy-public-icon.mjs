import { copyFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const source = join(root, 'resources', 'icons', 'icon.png')
const target = join(root, 'public', 'icon.png')

if (!existsSync(source)) {
  console.error(`Icon not found: ${source}`)
  process.exit(1)
}

copyFileSync(source, target)
console.log(`Copied icon to ${target}`)