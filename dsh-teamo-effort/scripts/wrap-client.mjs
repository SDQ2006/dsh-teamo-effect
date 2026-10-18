/**
 * Wrap the compiled browser half in the module-loader contract.
 *
 * `@deepseek-ai/dsh-client-modules` loads every browser bundle by registering a
 * lazy CJS factory: executing the file only registers it, and the factory body
 * (the plugin module) runs when the entry is materialized. `react` resolves
 * through the loader's own module table, so it stays external to the bundle.
 */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))

/** Read the compiled client chunk, wrap it, and drop the intermediate folder. */
export async function wrapClient() {
  const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
  const compiled = await readFile(join(root, '.client/index.js'), 'utf8')
  const banner = `window.__ModuleLoader__.load({ id: ${JSON.stringify(manifest.name)}, factory: (require) => {\nvar module = { exports: {} }; var exports = module.exports;\n`
  const footer = '\nreturn module.exports; } });\n'
  await mkdir(join(root, 'lib'), { recursive: true })
  await writeFile(join(root, 'lib/client.js'), `${banner}${compiled}${footer}`)
  await rm(join(root, '.client'), { recursive: true, force: true })
}
