/* eslint-disable unused-imports/no-unused-vars */
import path from 'node:path'
import process from 'node:process'
import { defineConfig } from '@uni-helper/unh'
import { copyDir } from './plugins/common'

/**
 * unh 配置文件
 * 更多配置请参考：https://uni-helper.js.org/unh/
 */
export default defineConfig({
  platform: {
    // 默认平台
    default: 'h5',
    // 平台别名
    alias: {
      'h5': ['w', 'h'],
      'mp-weixin': 'wx',
    },
  },
  autoGenerate: {
    pages: true,
    manifest: true,
  },
  devtools: {
    open: true,
  },
  hooks: {
    async onBuildAfter({ platform, options, envData }) {
      if (!options || platform !== 'h5') {
        return
      }
      // uniapp 不会对非 dev\build 之外的产物做专门的产物目录存放
      // 此处实现 h5:test 的产物复制，便于多 mode 的产物区分
      // 也可以在 vite 插件中实现
      if (options.mode === 'test') {
        const buildPath = path.join(process.cwd(), 'dist/build/h5')
        const targetPath = path.join(process.cwd(), 'dist/test/h5')
        console.log('[h5:test] build-after:', '准备复制构建产物至', targetPath)
        await copyDir(buildPath, targetPath)
        console.log('[h5:test] build-after:', '成功', targetPath)
      }
    },
  },
})
