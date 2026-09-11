// @vitest-environment node
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { expect, it, vi } from 'vitest'

// 沿实际依赖链验证 tar 覆盖，避免误测提升到根目录的其他版本
const require = createRequire(import.meta.url)
const layoutsRequire = createRequire(require.resolve('@uni-helper/vite-plugin-uni-layouts'))
const configRequire = createRequire(layoutsRequire.resolve('c12'))
const templatePath = configRequire.resolve('giget')
const templateRequire = createRequire(templatePath)
const { create } = templateRequire('tar')
const { downloadTemplate } = await import(pathToFileURL(templatePath).href)

it.each(['', 'src'])('布局工具的归档依赖能提取模板并保留子目录规则：%s', async (subdir) => {
  const directory = await mkdtemp(join(tmpdir(), 'layout-archive-'))
  vi.stubEnv('XDG_CACHE_HOME', join(directory, 'cache'))

  try {
    const archive = join(directory, 'cache/giget/fixture/template/v1.tar.gz')
    await mkdir(join(directory, 'repository/src'), { recursive: true })
    await mkdir(join(directory, 'cache/giget/fixture/template'), { recursive: true })
    await writeFile(join(directory, 'repository/src/layout.vue'), '<template><slot /></template>')
    await create({ file: archive, cwd: directory, gzip: true }, ['repository'])

    await downloadTemplate('fixture:template', {
      cwd: directory,
      dir: 'output',
      offline: true,
      registry: false,
      providers: {
        fixture: () => ({ name: 'template', version: 'v1', subdir }),
      },
    })

    const output = join(directory, 'output', subdir ? '' : 'src', 'layout.vue')
    expect(await readFile(output, 'utf8')).toBe('<template><slot /></template>')
  }
  finally {
    vi.unstubAllEnvs()
    await rm(directory, { recursive: true, force: true })
  }
})
