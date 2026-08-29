import assert from 'node:assert/strict'
import test from 'node:test'

import * as packageSmoke from './package-smoke.mjs'

const { verifyPackedPackage } = packageSmoke

function stableCoreManifest(overrides = {}) {
  return {
    name: '@canvaskit/core',
    version: '1.0.0',
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
    filename: 'canvaskit-core-1.0.0.tgz',
    files: [
      { path: 'dist/index.d.ts' },
      { path: 'dist/index.js' },
      { path: 'package.json' },
    ],
  }), [])
})

test('rejects a packed package missing its declaration entrypoint', () => {
  assert.deepEqual(verifyPackedPackage('@canvaskit/core', {
    filename: 'canvaskit-core-1.0.0.tgz',
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
      '@canvaskit/geometry': 'workspace:^1.0.0',
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
    '@canvaskit/core: packed manifest version must be 1.0.0, found 0.9.0.',
  ])
})

test('rejects a packed manifest with a stale internal consumer range', () => {
  const manifest = stableCoreManifest({
    dependencies: {
      '@canvaskit/geometry': '^0.9.0',
    },
  })

  assert.deepEqual(packageSmoke.verifyPackedManifest('@canvaskit/core', manifest), [
    '@canvaskit/core: packed range for @canvaskit/geometry must be ^1.0.0, found ^0.9.0.',
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
