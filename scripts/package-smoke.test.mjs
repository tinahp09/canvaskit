import assert from 'node:assert/strict'
import test from 'node:test'

import { verifyPackedPackage } from './package-smoke.mjs'

test('accepts an npm pack result containing the public JavaScript and declaration entrypoints', () => {
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
    '@canvaskit/core: npm pack did not report a tarball filename.',
  ])
})
