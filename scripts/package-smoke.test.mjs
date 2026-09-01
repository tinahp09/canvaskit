import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import * as packageSmoke from './package-smoke.mjs'

const { verifyPackedManifest, verifyPackedPackage } = packageSmoke
const publishedPackages = [
  'core',
  'geometry',
  'accessibility',
  'plugins',
  'react',
  'renderer-canvas',
  'renderer-pdf',
  'renderer-svg',
  'vue',
]

function stableCoreManifest(overrides = {}) {
  return {
    name: '@canvaskit/core',
    version: '3.0.0',
    license: 'MIT',
    exports: {
      '.': {
        types: './dist/index.d.ts',
        import: './dist/index.js',
      },
    },
    ...overrides,
  }
}

test('accepts a pack result containing the public JavaScript and declaration entrypoints', () => {
  assert.deepEqual(verifyPackedPackage('@canvaskit/core', {
    filename: 'canvaskit-core-3.0.0.tgz',
    files: [
      { path: 'dist/index.d.ts' },
      { path: 'dist/index.js' },
      { path: 'package.json' },
    ],
  }), [])
})

test('uses the V3 stable version for packed manifests by default', () => {
  assert.deepEqual(verifyPackedManifest('@canvaskit/core', {
    ...stableCoreManifest({ version: '3.0.0' }),
    dependencies: { '@canvaskit/geometry': '^3.0.0' },
  }), [])
})

test('rejects a packed package missing its declaration entrypoint', () => {
  assert.deepEqual(verifyPackedPackage('@canvaskit/core', {
    filename: 'canvaskit-core-3.0.0.tgz',
    files: [
      { path: 'dist/index.js' },
      { path: 'package.json' },
    ],
  }), [
    '@canvaskit/core: packed artifact is missing dist/index.d.ts.',
  ])
})

test('rejects a pack result that did not produce a tarball artifact', () => {
  assert.deepEqual(verifyPackedPackage('@canvaskit/core', {
    files: [
      { path: 'dist/index.d.ts' },
      { path: 'dist/index.js' },
      { path: 'package.json' },
    ],
  }), [
    '@canvaskit/core: pack did not report a tarball filename.',
  ])
})

test('rejects a packed manifest that retains a workspace dependency range', () => {
  const manifest = stableCoreManifest({
    dependencies: {
      '@canvaskit/geometry': 'workspace:^3.0.0',
    },
  })

  assert.deepEqual(packageSmoke.verifyPackedManifest?.('@canvaskit/core', manifest), [
    '@canvaskit/core: packed manifest retains workspace range for @canvaskit/geometry.',
  ])
})

test('rejects a packed manifest with the wrong stable version', () => {
  const manifest = stableCoreManifest({
    version: '0.9.0',
  })

  assert.deepEqual(packageSmoke.verifyPackedManifest('@canvaskit/core', manifest), [
    '@canvaskit/core: packed manifest version must be 3.0.0, found 0.9.0.',
  ])
})

test('rejects a packed manifest with a stale internal consumer range', () => {
  const manifest = stableCoreManifest({
    dependencies: {
      '@canvaskit/geometry': '^0.9.0',
    },
  })

  assert.deepEqual(packageSmoke.verifyPackedManifest('@canvaskit/core', manifest), [
    '@canvaskit/core: packed range for @canvaskit/geometry must be ^3.0.0, found ^0.9.0.',
  ])
})

test('rejects a packed manifest with the wrong package identity', () => {
  const manifest = stableCoreManifest({
    name: '@canvaskit/geometry',
  })

  assert.deepEqual(packageSmoke.verifyPackedManifest('@canvaskit/core', manifest), [
    '@canvaskit/core: packed manifest name is @canvaskit/geometry.',
  ])
})

test('rejects a packed manifest without the stable root export', () => {
  const manifest = stableCoreManifest({ exports: {} })

  assert.deepEqual(packageSmoke.verifyPackedManifest('@canvaskit/core', manifest), [
    '@canvaskit/core: packed manifest root export is invalid.',
  ])
})

test('accepts a later stable 3.x packed version and internal consumer range', () => {
  const manifest = stableCoreManifest({
    version: '3.2.3',
    dependencies: { '@canvaskit/geometry': '^3.2.3' },
  })

  assert.deepEqual(packageSmoke.verifyPackedManifest('@canvaskit/core', manifest, {
    version: '3.2.3',
  }), [])
})

test('rejects a packed manifest without MIT license metadata', () => {
  const manifest = stableCoreManifest({ license: undefined })

  assert.deepEqual(packageSmoke.verifyPackedManifest('@canvaskit/core', manifest), [
    '@canvaskit/core: packed manifest license must be MIT, found undefined.',
  ])
})

test('rejects a package suite that fails when imported by a fresh consumer', { timeout: 30_000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), 'canvaskit-pack-consumer-test-'))
  try {
    for (const packageName of publishedPackages) {
      const directory = join(root, 'packages', packageName)
      await mkdir(join(directory, 'dist'), { recursive: true })
      await writeFile(join(directory, 'package.json'), `${JSON.stringify({
        name: `@canvaskit/${packageName}`,
        version: '3.0.0',
        type: 'module',
        license: 'MIT',
        files: ['dist'],
        exports: { '.': { types: './dist/index.d.ts', import: './dist/index.js' } },
      }, null, 2)}\n`)
      await writeFile(
        join(directory, 'dist', 'index.js'),
        packageName === 'core'
          ? "throw new Error('broken consumer import')\n"
          : `export const packageName = '@canvaskit/${packageName}'\n`,
      )
      await writeFile(join(directory, 'dist', 'index.d.ts'), 'export declare const packageName: string\n')
    }

    const errors = await packageSmoke.smokePackedPackages(root)

    assert.equal(errors.length, 1)
    assert.match(errors[0], /fresh consumer import failed.*broken consumer import/s)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
