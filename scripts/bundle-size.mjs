import { readdir, stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

export const PUBLISHED_PACKAGES = [
  'core',
  'geometry',
  'plugins',
  'react',
  'renderer-canvas',
  'renderer-svg',
  'vue',
]

// Runtime JavaScript budgets include every emitted .js file in the dist allowlist.
// They are deliberately rounded above the 2026-08-29 baseline to allow small,
// intentional changes while catching accidental package growth.
export const BUNDLE_BUDGETS = {
  core: 55_000,
  geometry: 1_100,
  plugins: 2_400,
  react: 8_700,
  'renderer-canvas': 9_300,
  'renderer-svg': 4_300,
  vue: 7_500,
}

async function collectJavaScriptBytes(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  let bytes = 0

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) {
      bytes += await collectJavaScriptBytes(path)
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      bytes += (await stat(path)).size
    }
  }

  return bytes
}

export async function createBundleSizeReport(root = process.cwd()) {
  const report = []

  for (const packageName of PUBLISHED_PACKAGES) {
    const directory = resolve(root, 'packages', packageName, 'dist')
    report.push({
      name: `@canvaskit/${packageName}`,
      bytes: await collectJavaScriptBytes(directory),
    })
  }

  return report
}

export async function verifyBundleBudgets(root = process.cwd(), budgets = BUNDLE_BUDGETS) {
  const errors = []
  const report = []

  for (const packageName of PUBLISHED_PACKAGES) {
    const directory = resolve(root, 'packages', packageName, 'dist')
    let bytes
    try {
      bytes = await collectJavaScriptBytes(directory)
    } catch (error) {
      if (error && typeof error === 'object' && error.code === 'ENOENT') {
        errors.push(`@canvaskit/${packageName}: missing dist directory.`)
        continue
      }
      throw error
    }

    report.push({ name: `@canvaskit/${packageName}`, bytes })
    const budget = budgets[packageName]
    if (!Number.isSafeInteger(budget) || budget < 0) {
      errors.push(`@canvaskit/${packageName}: missing a valid byte budget.`)
    } else if (bytes > budget) {
      errors.push(`@canvaskit/${packageName}: ${formatBytes(bytes)} exceeds the ${formatBytes(budget)} bundle budget.`)
    }
  }

  return errors
}

export function formatBytes(bytes) {
  return `${bytes.toLocaleString('en-US')} B`
}

async function main() {
  const report = await createBundleSizeReport()
  const errors = await verifyBundleBudgets()

  for (const item of report) {
    const packageName = item.name.replace('@canvaskit/', '')
    console.log(`${item.name}: ${formatBytes(item.bytes)} / ${formatBytes(BUNDLE_BUDGETS[packageName])}`)
  }

  if (errors.length === 0) return
  for (const error of errors) console.error(error)
  process.exitCode = 1
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main()
}
