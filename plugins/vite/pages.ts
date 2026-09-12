import type { UserOptions } from '@uni-helper/vite-plugin-uni-pages'
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { normalizePath } from 'vite'

/** 根据项目目录生成主包与分包的页面扫描配置 */
export function getPagesOptions(root = process.cwd()): UserOptions {
  const packagesDir = join(root, 'src/packages')
  const packageNames = existsSync(packagesDir)
    ? readdirSync(packagesDir, { withFileTypes: true })
        .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
        .map(entry => entry.name)
        .sort()
    : []

  return {
    dts: normalizePath(join(root, 'src/typings/uni-pages.d.ts')),
    exclude: ['_*.*', '**/components/**/*.*', '**/_components/**/*.*'],
    subPackages: packageNames.map(name => ({
      dir: normalizePath(join(packagesDir, name, 'pages')),
      root: `packages/${name}`,
    })),
  }
}
