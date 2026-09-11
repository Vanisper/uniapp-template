import { spawnSync } from 'node:child_process'
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const cliPath = join(dirname(require.resolve('@uni-helper/unh/package.json')), 'dist/cli.mjs')
const isWindows = process.platform === 'win32'

function runBuild(outcome: 'success' | 'failure' | 'signal' | 'missing', nodeOptions?: string) {
  const directory = mkdtempSync(join(tmpdir(), 'unh-exit-'))

  try {
    const binDirectory = join(directory, 'bin')
    const hookPath = join(directory, 'hooks.log')
    mkdirSync(binDirectory)
    writeFileSync(join(directory, 'unh.config.mjs'), `
import { appendFileSync } from 'node:fs'
export default {
  autoGenerate: { pages: false, manifest: false },
  hooks: {
    build() { appendFileSync('hooks.log', 'before\\n') },
    onBuildAfter() { appendFileSync('hooks.log', 'after\\n') },
  },
}
`)

    if (outcome !== 'missing') {
      const executable = join(binDirectory, isWindows ? 'uni.cmd' : 'uni')
      writeFileSync(executable, isWindows
        ? '@echo off\r\nif "%UNH_TEST_RESULT%"=="success" exit /b 0\r\nexit /b 7\r\n'
        : '#!/bin/sh\ncase "$UNH_TEST_RESULT" in\n  success) exit 0 ;;\n  failure) exit 7 ;;\n  signal) kill -TERM $$ ;;\nesac\n')
      if (!isWindows)
        chmodSync(executable, 0o755)
    }

    const result = spawnSync(process.execPath, [cliPath, 'build', 'h5'], {
      cwd: directory,
      encoding: 'utf8',
      timeout: 10_000,
      env: {
        ...process.env,
        PATH: binDirectory,
        UNH_TEST_RESULT: outcome,
        ...(nodeOptions ? { NODE_OPTIONS: nodeOptions } : {}),
      },
    })

    expect(result.error).toBeUndefined()
    expect(result.signal).toBeNull()

    return {
      status: result.status,
      stderr: result.stderr,
      hooks: existsSync(hookPath) ? readFileSync(hookPath, 'utf8') : '',
    }
  }
  finally {
    rmSync(directory, { recursive: true, force: true })
  }
}

describe('unh 构建退出状态', () => {
  it('构建成功时返回零并执行后置钩子', () => {
    const result = runBuild('success')

    expect(result.status).toBe(0)
    expect(result.hooks).toBe('before\nafter\n')
  })

  it('构建失败时返回非零并跳过后置钩子', () => {
    const result = runBuild('failure')

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('退出码: 7')
    expect(result.hooks).toBe('before\n')
  })

  // Windows 的命令脚本不支持以 POSIX 信号终止自身
  it.skipIf(isWindows)('构建被信号终止时返回非零并跳过后置钩子', () => {
    const result = runBuild('signal')

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('SIGTERM')
    expect(result.hooks).toBe('before\n')
  })

  it('构建命令不存在时返回非零并跳过后置钩子', () => {
    const result = runBuild('missing')

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('ENOENT')
    expect(result.hooks).toBe('before\n')
  })

  it('未处理 Promise 仅警告时仍可靠传播构建失败', () => {
    const result = runBuild('failure', '--unhandled-rejections=warn')

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('Fatal error:')
    expect(result.hooks).toBe('before\n')
  })
})
