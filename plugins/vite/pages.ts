import type { UserOptions } from '@uni-helper/vite-plugin-uni-pages'
import { join, posix } from 'node:path'
import process from 'node:process'
import { normalizePath } from 'vite'

/** 根据项目目录生成主包与分包的页面扫描配置 */
export function getPagesOptions(root = process.cwd()): UserOptions {
  return {
    platformSuffix: true,
    dts: normalizePath(join(root, 'src/typings/uni-pages.d.ts')),
    exclude: ['_*.*', '**/components/**/*.*', '**/_components/**/*.*', '**/.*/**'],
    subPackages: [{
      dir: 'src/packages/*/pages',
      root: dir => posix.relative('src', posix.dirname(dir)),
    }],
  }
}
