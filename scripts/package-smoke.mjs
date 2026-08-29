import { access, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { isAbsolute, join, resolve } from 'node:path'
import { promisify } from 'node:util'
import { execFile as executeFile } from 'node:child_process'
import { pathToFileURL } from 'node:url'

import { PUBLISHED_PACKAGES } from './bundle-size.mjs'

const execFile = promisify(executeFile)
const REQUIRED_PACKED_FILES = ['dist/index.d.ts', 'dist/index.js', 'package.json']
const PUBLISHED_PACKAGE_NAMES = new Set(PUBLISHED_PACKAGES.map((name) => `@canvaskit/${name}`))

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

export function verifyPackedManifest(packageName, manifest) {
  const errors = []

  if (manifest?.name !== packageName) {
    errors.push(`${packageName}: packed manifest name is ${String(manifest?.name)}.`)
  }

  if (manifest?.version !== '1.0.0') {
    errors.push(`${packageName}: packed manifest version must be 1.0.0, found ${String(manifest?.version)}.`)
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
      } else if (PUBLISHED_PACKAGE_NAMES.has(dependencyName) && range !== '^1.0.0') {
        errors.push(`${packageName}: packed range for ${dependencyName} must be ^1.0.0, found ${String(range)}.`)
      }
    }
  }

  return errors
}

async function packPackage(root, packageName, outputDirectory) {
  const packageDirectory = resolve(root, 'packages', packageName)
  const { stdout } = await execFile('pnpm', ['pack', '--json', '--pack-destination', outputDirectory], {
    cwd: packageDirectory,
    env: {
      ...process.env,
      npm_config_cache: join(outputDirectory, `.npm-cache-${packageName}`),
      npm_config_update_notifier: 'false',
    },
  })
  const packedPackage = JSON.parse(stdout)

  if (!packedPackage || Array.isArray(packedPackage) || typeof packedPackage !== 'object') {
    return [`@canvaskit/${packageName}: pnpm pack did not return one package artifact.`]
  }

  const errors = verifyPackedPackage(`@canvaskit/${packageName}`, packedPackage)
  if (typeof packedPackage.filename === 'string') {
    const archivePath = isAbsolute(packedPackage.filename)
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
      ))
    } catch {
      errors.push(`@canvaskit/${packageName}: pnpm pack did not write ${packedPackage.filename}.`)
    }
  }

  return errors
}

export async function smokePackedPackages(root = process.cwd()) {
  const outputDirectory = await mkdtemp(join(tmpdir(), 'canvaskit-pack-'))
  try {
    const results = await Promise.all(
      PUBLISHED_PACKAGES.map((packageName) => packPackage(root, packageName, outputDirectory)),
    )
    return results.flat()
  } finally {
    await rm(outputDirectory, { recursive: true, force: true })
  }
}

async function main() {
  const errors = await smokePackedPackages()
  if (errors.length === 0) {
    console.log(`pnpm pack smoke checks passed for ${PUBLISHED_PACKAGES.length} publishable packages.`)
    return
  }

  for (const error of errors) console.error(error)
  process.exitCode = 1
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main()
}
