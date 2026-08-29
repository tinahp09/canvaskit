import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { verifyStableRelease } from './release-readiness.mjs'

const packages = [
  'core',
  'geometry',
  'plugins',
  'react',
  'renderer-canvas',
  'renderer-svg',
  'vue',
]

const releaseArtifacts = [
  'README.md',
  'CONTRIBUTING.md',
  'SECURITY.md',
  'docs/api-stability.md',
  'docs/rc-feedback.md',
  'docs/release-checklist.md',
  'docs/release-candidate-checklist.md',
  ...packages.map((name) => `docs/api/${name.replace('renderer-', '')}.md`),
]

async function createRepository() {
  const root = await mkdtemp(join(tmpdir(), 'canvaskit-release-'))

  for (const name of packages) {
    const directory = join(root, 'packages', name)
    await mkdir(directory, { recursive: true })
    const manifest = {
      name: `@canvaskit/${name}`,
      version: '1.0.0',
      type: 'module',
      files: ['dist'],
      exports: {
        '.': {
          types: './dist/index.d.ts',
          import: './dist/index.js',
        },
      },
    }
    await writeFile(join(directory, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  }

  for (const artifact of releaseArtifacts) {
    const path = join(root, artifact)
    await mkdir(join(path, '..'), { recursive: true })
    await writeFile(path, `# ${artifact}\n`)
  }

  await mkdir(join(root, 'examples', 'app', 'src'), { recursive: true })
  await writeFile(
    join(root, 'examples', 'app', 'src', 'main.ts'),
    "import { createScene } from '@canvaskit/core'\nvoid createScene\n",
  )

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

test('accepts a complete stable release repository', async () => {
  await withRepository(async (root) => {
    assert.deepEqual(await verifyStableRelease(root), [])
  })
})

test('rejects a publishable package version that is not 1.0.0', async () => {
  await withRepository(async (root) => {
    const path = join(root, 'packages', 'core', 'package.json')
    const manifest = JSON.parse(await readFile(path, 'utf8'))
    manifest.version = '0.9.0'
    await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`)

    assert.deepEqual(await verifyStableRelease(root), [
      'packages/core/package.json: expected version 1.0.0, found 0.9.0.',
    ])
  })
})

test('rejects a stale internal published-package dependency range', async () => {
  await withRepository(async (root) => {
    const path = join(root, 'packages', 'react', 'package.json')
    const manifest = JSON.parse(await readFile(path, 'utf8'))
    manifest.peerDependencies = { '@canvaskit/core': 'workspace:^0.9.0' }
    await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`)

    assert.deepEqual(await verifyStableRelease(root), [
      'packages/react/package.json: @canvaskit/core must use workspace:^1.0.0, found workspace:^0.9.0.',
    ])
  })
})

test('rejects package contents that are not limited to built output', async () => {
  await withRepository(async (root) => {
    const path = join(root, 'packages', 'plugins', 'package.json')
    const manifest = JSON.parse(await readFile(path, 'utf8'))
    manifest.files = ['dist', 'src']
    await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`)

    assert.deepEqual(await verifyStableRelease(root), [
      'packages/plugins/package.json: files must contain only dist.',
    ])
  })
})

test('rejects an undeclared public package subpath', async () => {
  await withRepository(async (root) => {
    const path = join(root, 'packages', 'geometry', 'package.json')
    const manifest = JSON.parse(await readFile(path, 'utf8'))
    manifest.exports['./internal'] = './dist/internal.js'
    await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`)

    assert.deepEqual(await verifyStableRelease(root), [
      'packages/geometry/package.json: only the root export (.) is public; found ./internal.',
    ])
  })
})

test('rejects a missing root JavaScript and declaration export', async () => {
  await withRepository(async (root) => {
    const path = join(root, 'packages', 'renderer-svg', 'package.json')
    const manifest = JSON.parse(await readFile(path, 'utf8'))
    manifest.exports = {}
    await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`)

    assert.deepEqual(await verifyStableRelease(root), [
      'packages/renderer-svg/package.json: root export must map types to ./dist/index.d.ts and import to ./dist/index.js.',
    ])
  })
})

test('rejects imports that bypass a published package root export', async () => {
  await withRepository(async (root) => {
    await writeFile(
      join(root, 'examples', 'app', 'src', 'main.ts'),
      "import { createScene } from '@canvaskit/core/src/scene'\nvoid createScene\n",
    )

    assert.deepEqual(await verifyStableRelease(root), [
      'examples/app/src/main.ts:1: private package import @canvaskit/core/src/scene; import from @canvaskit/core.',
    ])
  })
})

test('rejects private imports in root consumer documentation', async () => {
  await withRepository(async (root) => {
    await writeFile(
      join(root, 'README.md'),
      "Use `import { createScene } from '@canvaskit/core/dist/index.js'`.\n",
    )

    assert.deepEqual(await verifyStableRelease(root), [
      'README.md:1: private package import @canvaskit/core/dist/index.js; import from @canvaskit/core.',
    ])
  })
})

test('rejects a missing stable-release artifact', async () => {
  await withRepository(async (root) => {
    await rm(join(root, 'docs', 'api-stability.md'))

    assert.deepEqual(await verifyStableRelease(root), [
      'Missing release artifact: docs/api-stability.md.',
    ])
  })
})

test('rejects a missing release-candidate feedback artifact', async () => {
  await withRepository(async (root) => {
    await rm(join(root, 'docs', 'rc-feedback.md'))

    assert.deepEqual(await verifyStableRelease(root), [
      'Missing release artifact: docs/rc-feedback.md.',
    ])
  })
})

test('reports a missing scanned root artifact instead of aborting the audit', async () => {
  await withRepository(async (root) => {
    await rm(join(root, 'README.md'))

    assert.deepEqual(await verifyStableRelease(root), [
      'Missing release artifact: README.md.',
    ])
  })
})
