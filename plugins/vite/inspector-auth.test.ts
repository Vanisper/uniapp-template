// @vitest-environment node
import { execFile } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { expect, it } from 'vitest'

const runNode = promisify(execFile)

// 子进程通过 UnoCSS 的真实依赖链加载 Inspector，隔离验证码、连接和存储
const program = String.raw`
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setTimeout } from 'node:timers/promises'
import { pathToFileURL } from 'node:url'
import { stripVTControlCharacters } from 'node:util'

const rootRequire = createRequire(pathToFileURL(join(process.cwd(), 'package.json')))
const unoRequire = createRequire(rootRequire.resolve('unocss'))
const inspectorRequire = createRequire(unoRequire.resolve('@unocss/inspector'))
const load = name => import(pathToFileURL(inspectorRequire.resolve(name)).href)
const { initDevframe } = await load('devframe/initiate')
const { createRpcClient } = await load('devframe/rpc/client')
const { createWsRpcChannel } = await load('devframe/rpc/transports/ws-client')
const directory = await mkdtemp(join(tmpdir(), 'inspector-auth-'))
const prompts = []
const originalLog = console.log
console.log = (...args) => {
  const match = stripVTControlCharacters(args.join(' ')).match(/auth code\s+(\d{6})/)
  if (match) prompts.push(match[1])
}
let instance
const channels = []
const server = createServer((request, response) => instance.nodeMiddleware(request, response))
try {
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  const origin = 'http://127.0.0.1:' + server.address().port
  instance = initDevframe({
    id: 'inspector-auth-test',
    name: 'Inspector Auth Test',
    version: '1.0.0',
    packageName: 'inspector-auth-test',
    importMetaUrl: pathToFileURL(join(directory, 'test.mjs')).href,
    setup(context) {
      context.rpc.register({
        name: 'inspector:private',
        type: 'query',
        handler: () => 'authorized',
      })
    },
  }, {
    base: '/inspector/', server, origin, mcp: false, sse: false, register: false,
    getStorageDir: () => directory,
  })
  await instance.ready
  function connect() {
    const channel = createWsRpcChannel({ url: origin.replace('http:', 'ws:') + '/inspector/__ws' })
    channels.push(channel)
    return createRpcClient({}, { channel, rpcOptions: { timeout: 2000 } })
  }
  const rpc = connect()
  const client = { ua: 'Inspector regression test', origin }
  const handshake = token => rpc.$call('anonymous:devframe:auth', { ...client, authToken: token })
  const exchange = code => rpc.$call('anonymous:devframe:auth:exchange', { ...client, code })
  await assert.rejects(rpc.$call('inspector:private'), /not authorized/i)
  if (process.argv[1] === 'handshake') {
    assert.equal((await handshake('')).isTrusted, false)
    assert.equal(prompts.length, 1, '首次未授权握手应显示验证码')
    assert.equal((await handshake('invalid-token')).isTrusted, false)
    assert.equal(prompts.length, 1, '同一验证码不应重复提示')
    assert.equal((await exchange('invalid-code')).authToken, null)
  }
  else {
    assert.equal((await exchange('invalid-code')).authToken, null)
    assert.equal(prompts.length, 1, '直接交换错误验证码应显示验证码')
    for (let index = 0; index < 4; index++)
      assert.equal((await exchange('invalid-code')).authToken, null)
    assert.equal(prompts.length, 2, '达到错误次数上限后应显示新验证码')
  }
  await assert.rejects(rpc.$call('inspector:private'), /not authorized/i)
  const { authToken } = await exchange(prompts.at(-1))
  assert.equal(typeof authToken, 'string', '正确验证码应换取授权令牌')
  assert.equal(await rpc.$call('inspector:private'), 'authorized')
  const promptCount = prompts.length
  assert.equal((await handshake(authToken)).isTrusted, true)
  const reconnect = connect()
  assert.equal((await reconnect.$call('anonymous:devframe:auth', { ...client, authToken })).isTrusted, true)
  assert.equal(await reconnect.$call('inspector:private'), 'authorized')
  assert.equal(prompts.length, promptCount, '授权会话和令牌重连不应重复提示')
}
finally {
  channels.forEach(channel => channel.close())
  await instance?.close()
  await new Promise(resolve => server.close(resolve))
  // 等待 devframe 的 100 ms 存储防抖写入，再移除测试目录
  await setTimeout(150)
  await rm(directory, { recursive: true, force: true })
  console.log = originalLog
}
`

it.each([
  ['handshake', '首次匿名握手提示验证码且保留 RPC 授权检查'],
  ['exchange', '错误验证码触发提示并保留失败次数限制'],
])('%s: %s', async (mode) => {
  const result = await runNode(process.execPath, ['--input-type=module', '-e', program, mode], {
    cwd: fileURLToPath(new URL('../../', import.meta.url)),
    timeout: 10000,
  })
  expect(result.stdout).toBe('')
  expect(result.stderr.match(/\[DF0036\]/g)).toHaveLength(2)
})
