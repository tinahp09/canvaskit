import { access, mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { isAbsolute, join, resolve } from 'node:path'
import { promisify } from 'node:util'
import { execFile as executeFile } from 'node:child_process'
import { pathToFileURL } from 'node:url'

import { PUBLISHED_PACKAGES } from './bundle-size.mjs'

const execFile = promisify(executeFile)
const REQUIRED_PACKED_FILES = ['dist/index.d.ts', 'dist/index.js', 'package.json']
const PUBLISHED_PACKAGE_NAMES = new Set(PUBLISHED_PACKAGES.map((name) => `@canvaskit/${name}`))
const DEFAULT_STABLE_VERSION = '5.0.0'
const PNPM_BINARY = process.env.CANVASKIT_PNPM_BIN ?? 'pnpm'

export function verifyPackedPackage(packageName, packedPackage) {
  const errors = []

  if (typeof packedPackage?.filename !== 'string' || !packedPackage.filename.endsWith('.tgz')) {
    errors.push(`${packageName}: pack did not report a tarball filename.`)
  }

  const packedFiles = new Set(
    Array.isArray(packedPackage?.files)
      ? packedPackage.files.map((file) => file?.path).filter((path) => typeof path === 'string')
      : [],
  )

  for (const requiredFile of REQUIRED_PACKED_FILES) {
    if (!packedFiles.has(requiredFile)) {
      errors.push(`${packageName}: packed artifact is missing ${requiredFile}.`)
    }
  }

  return errors
}

export function verifyPackedManifest(packageName, manifest, options = {}) {
  const errors = []
  const version = options.version ?? DEFAULT_STABLE_VERSION
  const internalRange = options.internalRange ?? `^${version}`

  if (manifest?.name !== packageName) {
    errors.push(`${packageName}: packed manifest name is ${String(manifest?.name)}.`)
  }

  if (manifest?.version !== version) {
    errors.push(`${packageName}: packed manifest version must be ${version}, found ${String(manifest?.version)}.`)
  }

  if (manifest?.license !== 'MIT') {
    errors.push(`${packageName}: packed manifest license must be MIT, found ${String(manifest?.license)}.`)
  }

  const exportKeys = Object.keys(manifest?.exports ?? {})
  const rootExport = manifest?.exports?.['.']
  if (
    exportKeys.length !== 1
    || exportKeys[0] !== '.'
    || rootExport?.types !== './dist/index.d.ts'
    || rootExport?.import !== './dist/index.js'
  ) {
    errors.push(`${packageName}: packed manifest root export is invalid.`)
  }

  for (const dependencyType of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
    for (const [dependencyName, range] of Object.entries(manifest?.[dependencyType] ?? {})) {
      if (typeof range === 'string' && range.startsWith('workspace:')) {
        errors.push(`${packageName}: packed manifest retains workspace range for ${dependencyName}.`)
      } else if (PUBLISHED_PACKAGE_NAMES.has(dependencyName) && range !== internalRange) {
        errors.push(`${packageName}: packed range for ${dependencyName} must be ${internalRange}, found ${String(range)}.`)
      }
    }
  }

  return errors
}

async function packPackage(root, packageName, outputDirectory, options) {
  const packageDirectory = resolve(root, 'packages', packageName)
  const { stdout } = await execFile(PNPM_BINARY, ['pack', '--json', '--pack-destination', outputDirectory], {
    cwd: packageDirectory,
    env: {
      ...process.env,
      npm_config_cache: join(outputDirectory, `.npm-cache-${packageName}`),
      npm_config_update_notifier: 'false',
    },
  })
  const packedPackage = JSON.parse(stdout)

  if (!packedPackage || Array.isArray(packedPackage) || typeof packedPackage !== 'object') {
    return {
      archivePath: undefined,
      errors: [`@canvaskit/${packageName}: pnpm pack did not return one package artifact.`],
    }
  }

  const errors = verifyPackedPackage(`@canvaskit/${packageName}`, packedPackage)
  let archivePath
  if (typeof packedPackage.filename === 'string') {
    archivePath = isAbsolute(packedPackage.filename)
      ? packedPackage.filename
      : join(outputDirectory, packedPackage.filename)
    try {
      await access(archivePath)
      const { stdout: manifestJson } = await execFile(
        'tar',
        ['-xOf', archivePath, 'package/package.json'],
      )
      errors.push(...verifyPackedManifest(
        `@canvaskit/${packageName}`,
        JSON.parse(manifestJson),
        options,
      ))
    } catch {
      errors.push(`@canvaskit/${packageName}: pnpm pack did not write ${packedPackage.filename}.`)
    }
  }

  return { archivePath: errors.length === 0 ? archivePath : undefined, errors }
}

async function linkConsumerPeer(root, consumerDirectory, packagePath) {
  const source = resolve(root, 'node_modules', ...packagePath.split('/'))
  try {
    await access(source)
  } catch {
    return
  }

  const target = resolve(consumerDirectory, 'node_modules', ...packagePath.split('/'))
  await mkdir(resolve(target, '..'), { recursive: true })
  await symlink(source, target, 'dir')
}

function commandFailure(label, error) {
  const details = [error?.stderr, error?.stdout, error?.message]
    .find((value) => typeof value === 'string' && value.trim().length > 0)
  return `${label}: ${details?.trim() ?? 'unknown command failure'}`
}

async function verifyFreshConsumer(root, outputDirectory, archivePaths) {
  const consumerDirectory = resolve(outputDirectory, 'consumer')
  const sourceDirectory = resolve(consumerDirectory, 'src')
  await mkdir(sourceDirectory, { recursive: true })
  await writeFile(resolve(consumerDirectory, 'package.json'), `${JSON.stringify({
    name: 'canvaskit-package-smoke-consumer',
    private: true,
    type: 'module',
  }, null, 2)}\n`)
  await writeFile(resolve(consumerDirectory, 'tsconfig.json'), `${JSON.stringify({
    compilerOptions: {
      target: 'ES2022',
      module: 'NodeNext',
      moduleResolution: 'NodeNext',
      strict: true,
      skipLibCheck: false,
      lib: ['ES2022', 'DOM'],
      outDir: 'dist',
    },
    include: ['src'],
  }, null, 2)}\n`)
  await writeFile(resolve(sourceDirectory, 'index.ts'), [
    "import * as core from '@canvaskit/core'",
    "import * as geometry from '@canvaskit/geometry'",
    "import * as accessibility from '@canvaskit/accessibility'",
    "import * as collaborationAdapters from '@canvaskit/collaboration-adapters'",
    "import * as plugins from '@canvaskit/plugins'",
    "import * as react from '@canvaskit/react'",
    "import * as canvasRenderer from '@canvaskit/renderer-canvas'",
    "import * as pdfRenderer from '@canvaskit/renderer-pdf'",
    "import * as svgRenderer from '@canvaskit/renderer-svg'",
    "import * as vue from '@canvaskit/vue'",
    '',
    'const packageRoots = [core, geometry, accessibility, collaborationAdapters, plugins, react, canvasRenderer, pdfRenderer, svgRenderer, vue]',
    "if (packageRoots.some((packageRoot) => typeof packageRoot !== 'object')) throw new Error('package root import failed')",
    "console.log('Imported all 10 packed package roots.')",
    '',
  ].join('\n'))

  try {
    await execFile('npm', [
      'install',
      '--offline',
      '--ignore-scripts',
      '--legacy-peer-deps',
      '--no-audit',
      '--no-fund',
      '--no-package-lock',
      ...archivePaths,
    ], {
      cwd: consumerDirectory,
      env: {
        ...process.env,
        npm_config_cache: resolve(outputDirectory, 'consumer-npm-cache'),
        npm_config_update_notifier: 'false',
      },
    })
  } catch (error) {
    return [commandFailure('fresh consumer install failed', error)]
  }

  for (const peer of ['react', 'react-dom', 'vue', '@types']) {
    await linkConsumerPeer(root, consumerDirectory, peer)
  }

  const typescript = resolve(process.cwd(), 'node_modules', '.bin', 'tsc')
  try {
    await execFile(typescript, ['--project', 'tsconfig.json', '--noEmit'], { cwd: consumerDirectory })
  } catch (error) {
    return [commandFailure('fresh consumer typecheck failed', error)]
  }

  try {
    await execFile(typescript, ['--project', 'tsconfig.json'], { cwd: consumerDirectory })
  } catch (error) {
    return [commandFailure('fresh consumer build failed', error)]
  }

  try {
    await execFile('node', ['dist/index.js'], { cwd: consumerDirectory })
  } catch (error) {
    return [commandFailure('fresh consumer import failed', error)]
  }

  return []
}

export async function smokePackedPackages(root = process.cwd(), options = {}) {
  const outputDirectory = await mkdtemp(join(tmpdir(), 'canvaskit-pack-'))
  try {
    const results = await Promise.all(
      PUBLISHED_PACKAGES.map((packageName) => packPackage(root, packageName, outputDirectory, options)),
    )
    const errors = results.flatMap((result) => result.errors)
    if (errors.length > 0) return errors

    const archivePaths = results.map((result) => result.archivePath).filter(Boolean)
    return await verifyFreshConsumer(root, outputDirectory, archivePaths)
  } finally {
    await rm(outputDirectory, { recursive: true, force: true })
  }
}

async function main() {
  const version = process.env.CANVASKIT_RELEASE_VERSION ?? DEFAULT_STABLE_VERSION
  const errors = await smokePackedPackages(process.cwd(), { version })
  if (errors.length === 0) {
    console.log(`pnpm pack and fresh consumer checks passed for ${PUBLISHED_PACKAGES.length} packages at ${version}.`)
    return
  }

  for (const error of errors) console.error(error)
  process.exitCode = 1
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main()
}
