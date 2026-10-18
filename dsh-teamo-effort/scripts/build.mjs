/**
 * Build both halves of `dsh-teamo-effort`.
 *
 * Host half: one ESM module. Bare specifiers stay external because the profile
 * resolves them against the Harness installation (`@deepseek-ai/schemastery`).
 * Browser half: one CommonJS chunk wrapped in the `window.__ModuleLoader__`
 * factory contract, with `react` resolved from the host module table.
 */
import { mkdir, readFile, rm } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
import { wrapClient } from './wrap-client.mjs'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
const entry = (path) => join(root, path)

await rm(entry('lib'), { recursive: true, force: true })
await rm(entry('.client'), { recursive: true, force: true })
await mkdir(entry('lib'), { recursive: true })

await build({
  absWorkingDir: root,
  entryPoints: ['src/index.ts'],
  outfile: 'lib/index.js',
  bundle: true,
  format: 'esm',
  platform: 'node',
  packages: 'external',
  target: 'node22',
  sourcemap: false,
  legalComments: 'none',
})

await build({
  absWorkingDir: root,
  entryPoints: ['src/client/index.tsx'],
  outfile: '.client/index.js',
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  external: ['react'],
  jsx: 'transform',
  target: 'es2022',
  sourcemap: false,
  legalComments: 'none',
})

await wrapClient()
console.log(`built ${manifest.name}: lib/index.js, lib/client.js`)
