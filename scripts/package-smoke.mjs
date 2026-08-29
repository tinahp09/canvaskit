import { access, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { promisify } from 'node:util'
import { execFile as executeFile } from 'node:child_process'
import { pathToFileURL } from 'node:url'

import { PUBLISHED_PACKAGES } from './bundle-size.mjs'

const execFile = promisify(executeFile)
const REQUIRED_PACKED_FILES = ['dist/index.d.ts', 'dist/index.js', 'package.json']

export function verifyPackedPackage(packageName, packedPackage) {
  const errors = []

  if (typeof packedPackage?.filename !== 'string' || !packedPackage.filename.endsWith('.tgz')) {
    errors.push(`${packageName}: npm pack did not report a tarball filename.`)
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

async function packPackage(root, packageName, outputDirectory) {
  const packageDirectory = resolve(root, 'packages', packageName)
  const { stdout } = await execFile('npm', ['pack', '--json', '--pack-destination', outputDirectory], {
    cwd: packageDirectory,
    env: {
      ...process.env,
      npm_config_cache: join(outputDirectory, `.npm-cache-${packageName}`),
      npm_config_update_notifier: 'false',
    },
  })
  const packedPackages = JSON.parse(stdout)

  if (!Array.isArray(packedPackages) || packedPackages.length !== 1) {
    return [`@canvaskit/${packageName}: npm pack did not return exactly one package artifact.`]
  }

  const packedPackage = packedPackages[0]
  const errors = verifyPackedPackage(`@canvaskit/${packageName}`, packedPackage)
  if (typeof packedPackage.filename === 'string') {
    try {
      await access(join(outputDirectory, packedPackage.filename))
    } catch {
      errors.push(`@canvaskit/${packageName}: npm pack did not write ${packedPackage.filename}.`)
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
    console.log(`npm pack smoke checks passed for ${PUBLISHED_PACKAGES.length} publishable packages.`)
    return
  }

  for (const error of errors) console.error(error)
  process.exitCode = 1
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main()
}
