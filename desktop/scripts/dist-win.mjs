import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const releaseDir = join(root, 'release')
const tempOut = join(tmpdir(), 'terminalssh-eb-release')

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function safeRemove(target) {
  if (!existsSync(target)) {
    return
  }

  try {
    rmSync(target, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 })
  } catch (error) {
    console.warn(`Uyarı: ${target} silinemedi (${error?.code ?? 'error'}). Devam ediliyor.`)
  }
}

safeRemove(tempOut)

run('pnpm', ['icons'])
run('pnpm', ['build'])
run('pnpm', [
  'exec',
  'electron-builder',
  '--config',
  'electron-builder.yml',
  '--win',
  `--config.directories.output=${tempOut}`,
])

if (!existsSync(tempOut)) {
  console.error('electron-builder çıktısı bulunamadı.')
  process.exit(1)
}

mkdirSync(releaseDir, { recursive: true })

for (const entry of readdirSync(tempOut)) {
  const source = join(tempOut, entry)
  const target = join(releaseDir, entry)
  safeRemove(target)
  cpSync(source, target, { recursive: true })
}

console.log(`Kurulum dosyaları kopyalandı: ${releaseDir}`)