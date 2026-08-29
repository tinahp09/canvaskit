import { access, readdir, readFile } from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const STABLE_VERSION = '1.0.0'
const STABLE_INTERNAL_RANGE = 'workspace:^1.0.0'
const PACKAGE_NAMES = [
  'core',
  'geometry',
  'plugins',
  'react',
  'renderer-canvas',
  'renderer-svg',
  'vue',
]
const PACKAGE_SET = new Set(PACKAGE_NAMES.map((name) => `@canvaskit/${name}`))
const RELEASE_ARTIFACTS = [
  'README.md',
  'CONTRIBUTING.md',
  'SECURITY.md',
  'docs/api-stability.md',
  'docs/rc-feedback.md',
  'docs/release-checklist.md',
  'docs/release-candidate-checklist.md',
  'docs/api/core.md',
  'docs/api/geometry.md',
  'docs/api/plugins.md',
  'docs/api/react.md',
  'docs/api/canvas.md',
  'docs/api/svg.md',
  'docs/api/vue.md',
]
const SOURCE_EXTENSIONS = /\.(?:[cm]?[jt]sx?|md|vue)$/
const IGNORED_DIRECTORIES = new Set([
  '.git',
  '.pnpm-store',
  '.turbo',
  'dist',
  'node_modules',
  'storybook-static',
])
const PACKAGE_IMPORT = /@canvaskit\/(core|geometry|plugins|react|renderer-canvas|renderer-svg|vue)(\/[\w./-]+)/g

async function exists(path) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function collectSourceFiles(path) {
  if (!(await exists(path))) return []

  const entries = await readdir(path, { withFileTypes: true })
  const files = []
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) continue
    const child = resolve(path, entry.name)
    if (entry.isDirectory()) files.push(...await collectSourceFiles(child))
    else if (entry.isFile() && SOURCE_EXTENSIONS.test(entry.name)) files.push(child)
  }
  return files
}

function inspectManifest(manifest, manifestPath) {
  const errors = []

  if (manifest.version !== STABLE_VERSION) {
    errors.push(`${manifestPath}: expected version ${STABLE_VERSION}, found ${String(manifest.version)}.`)
  }

  if (!Array.isArray(manifest.files) || manifest.files.length !== 1 || manifest.files[0] !== 'dist') {
    errors.push(`${manifestPath}: files must contain only dist.`)
  }

  const publicExports = Object.keys(manifest.exports ?? {}).filter((key) => key !== '.')
  if (publicExports.length > 0) {
    errors.push(`${manifestPath}: only the root export (.) is public; found ${publicExports.join(', ')}.`)
  }

  const rootExport = manifest.exports?.['.']
  if (rootExport?.types !== './dist/index.d.ts' || rootExport?.import !== './dist/index.js') {
    errors.push(
      `${manifestPath}: root export must map types to ./dist/index.d.ts and import to ./dist/index.js.`,
    )
  }

  for (const dependencyType of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
    for (const [name, range] of Object.entries(manifest[dependencyType] ?? {})) {
      if (PACKAGE_SET.has(name) && range !== STABLE_INTERNAL_RANGE) {
        errors.push(`${manifestPath}: ${name} must use ${STABLE_INTERNAL_RANGE}, found ${String(range)}.`)
      }
    }
  }

  return errors
}

async function inspectPrivateImports(root) {
  const scanRoots = ['docs', 'examples', 'packages']
  const rootFiles = ['README.md', 'CONTRIBUTING.md'].map((file) => resolve(root, file))
  const existingRootFiles = (
    await Promise.all(rootFiles.map(async (file) => ({ file, exists: await exists(file) })))
  ).filter(({ exists: fileExists }) => fileExists).map(({ file }) => file)
  const files = [
    ...(await Promise.all(scanRoots.map((directory) => collectSourceFiles(resolve(root, directory))))).flat(),
    ...existingRootFiles,
  ]
  const errors = []

  for (const file of files.sort()) {
    const contents = await readFile(file, 'utf8')
    const lines = contents.split(/\r?\n/)
    for (const [index, line] of lines.entries()) {
      for (const match of line.matchAll(PACKAGE_IMPORT)) {
        const packageName = `@canvaskit/${match[1]}`
        errors.push(
          `${relative(root, file)}:${index + 1}: private package import ${match[0]}; import from ${packageName}.`,
        )
      }
    }
  }

  return errors
}

export async function verifyStableRelease(root = process.cwd()) {
  const errors = []

  for (const packageName of PACKAGE_NAMES) {
    const manifestPath = `packages/${packageName}/package.json`
    const absoluteManifestPath = resolve(root, manifestPath)
    if (!(await exists(absoluteManifestPath))) {
      errors.push(`Missing release artifact: ${manifestPath}.`)
      continue
    }
    const manifest = JSON.parse(await readFile(absoluteManifestPath, 'utf8'))
    errors.push(...inspectManifest(manifest, manifestPath))
  }

  errors.push(...await inspectPrivateImports(root))

  for (const artifact of RELEASE_ARTIFACTS) {
    if (!(await exists(resolve(root, artifact)))) errors.push(`Missing release artifact: ${artifact}.`)
  }

  return errors
}

async function main() {
  const errors = await verifyStableRelease()
  if (errors.length === 0) {
    console.log(`Stable release metadata verified for ${PACKAGE_NAMES.length} packages.`)
    return
  }

  for (const error of errors) console.error(error)
  process.exitCode = 1
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main()
}
