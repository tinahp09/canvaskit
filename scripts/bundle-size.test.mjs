import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { createBundleSizeReport, verifyBundleBudgets } from './bundle-size.mjs'

const packages = [
  'core',
  'geometry',
  'plugins',
  'react',
  'renderer-canvas',
  'renderer-svg',
  'vue',
]

async function createRepository() {
  const root = await mkdtemp(join(tmpdir(), 'canvaskit-bundle-size-'))

  for (const [index, name] of packages.entries()) {
    const dist = join(root, 'packages', name, 'dist')
    await mkdir(dist, { recursive: true })
    await writeFile(join(root, 'packages', name, 'package.json'), `${JSON.stringify({ name: `@canvaskit/${name}` })}\n`)
    await writeFile(join(dist, 'index.js'), `${'x'.repeat(index + 1)}\n`)
    await writeFile(join(dist, 'internal.js'), `${'y'.repeat(index + 2)}\n`)
    await writeFile(join(dist, 'index.d.ts'), 'export {}\n')
  }

  return root
}

async function withRepository(run) {
  const root = await createRepository()
  try {
    await run(root)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

test('reports every published package in stable package-name order using runtime JavaScript only', async () => {
  await withRepository(async (root) => {
    const report = await createBundleSizeReport(root)

    assert.deepEqual(report, [
      { name: '@canvaskit/core', bytes: 5 },
      { name: '@canvaskit/geometry', bytes: 7 },
      { name: '@canvaskit/plugins', bytes: 9 },
      { name: '@canvaskit/react', bytes: 11 },
      { name: '@canvaskit/renderer-canvas', bytes: 13 },
      { name: '@canvaskit/renderer-svg', bytes: 15 },
      { name: '@canvaskit/vue', bytes: 17 },
    ])
  })
})

test('rejects a package whose runtime output exceeds its explicit byte budget', async () => {
  await withRepository(async (root) => {
    const budgets = Object.fromEntries(packages.map((name) => [name, 100]))
    budgets.core = 4

    assert.deepEqual(await verifyBundleBudgets(root, budgets), [
      '@canvaskit/core: 5 B exceeds the 4 B bundle budget.',
    ])
  })
})

test('rejects a missing built package instead of silently omitting it from the report', async () => {
  await withRepository(async (root) => {
    await rm(join(root, 'packages', 'vue', 'dist'), { recursive: true, force: true })

    assert.deepEqual(await verifyBundleBudgets(root, Object.fromEntries(packages.map((name) => [name, 100]))), [
      '@canvaskit/vue: missing dist directory.',
    ])
  })
})
