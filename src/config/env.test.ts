import { describe, expect, it } from 'vitest'
import { parseAppEnv } from './env'

describe('客户端环境变量', () => {
  it('未配置业务变量时保留空 API 地址并采用公共默认值', () => {
    expect(parseAppEnv({ MODE: 'development' })).toEqual({
      apiBaseURL: '',
      requestTimeout: 10_000,
      authHeaderName: 'Authorization',
      authTokenPrefix: 'Bearer',
      authTokenKey: 'uniapp-template:auth:token',
      mockDelay: 500,
      mode: 'development',
      mockEnabled: false,
      mockLogEnabled: true,
    })
  })

  it('解析自定义 mode 和数值，规范化带前缀的 API 地址', () => {
    expect(parseAppEnv({
      MODE: 'staging',
      VITE_API_BASE_URL: ' https://api.example.com/v1/ ',
      VITE_REQUEST_TIMEOUT: '3000',
      VITE_MOCK_DELAY: '100',
      VITE_MOCK_ENABLED: 'true',
    })).toEqual({
      apiBaseURL: 'https://api.example.com/v1',
      requestTimeout: 3000,
      authHeaderName: 'Authorization',
      authTokenPrefix: 'Bearer',
      authTokenKey: 'uniapp-template:auth:token',
      mockDelay: 100,
      mode: 'staging',
      mockEnabled: true,
      mockLogEnabled: true,
    })
  })

  it('production 模式不受本机 Mock 开关覆盖', () => {
    expect(parseAppEnv({ MODE: 'production', VITE_MOCK_ENABLED: 'true' }).mockEnabled).toBe(false)
    expect(parseAppEnv({ MODE: 'test', VITE_MOCK_ENABLED: 'false' }).mockEnabled).toBe(false)
  })

  it('支持自定义 Token 缓存 key 和关闭 Mock 日志', () => {
    expect(parseAppEnv({ MODE: 'test', VITE_AUTH_TOKEN_KEY: ' project:test:token ', VITE_MOCK_LOG_ENABLED: 'false' })).toMatchObject({
      authTokenKey: 'project:test:token',
      mockLogEnabled: false,
    })
  })

  it.each(['', ' '])('拒绝空白 Token 缓存 key %j', (value) => {
    expect(() => parseAppEnv({ MODE: 'test', VITE_AUTH_TOKEN_KEY: value })).toThrow('VITE_AUTH_TOKEN_KEY')
  })

  it('自定义鉴权头和前缀会移除首尾空格，空前缀保持为空', () => {
    expect(parseAppEnv({ MODE: 'test', VITE_AUTH_HEADER_NAME: ' X-Token ', VITE_AUTH_TOKEN_PREFIX: ' Token ' })).toMatchObject({
      authHeaderName: 'X-Token',
      authTokenPrefix: 'Token',
    })
    expect(parseAppEnv({ MODE: 'production', VITE_AUTH_TOKEN_PREFIX: '' }).authTokenPrefix).toBe('')
  })

  it.each(['', ' ', 'X Token', 'X:Token', 'X-Token\r\nInjected'])('拒绝无效鉴权头名称 %j', (value) => {
    expect(() => parseAppEnv({ MODE: 'test', VITE_AUTH_HEADER_NAME: value })).toThrow('VITE_AUTH_HEADER_NAME')
  })

  it('拒绝前缀中的换行或其他控制字符', () => {
    expect(() => parseAppEnv({ MODE: 'test', VITE_AUTH_TOKEN_PREFIX: 'Bearer\r\n' })).toThrow('VITE_AUTH_TOKEN_PREFIX')
    expect(() => parseAppEnv({ MODE: 'test', VITE_AUTH_TOKEN_PREFIX: 'Token\u0000' })).toThrow('VITE_AUTH_TOKEN_PREFIX')
  })

  it.each(['', ' ', '0', '-1', 'NaN', 'Infinity', '1e309', '1000ms'])('拒绝无效时间配置 %j', (value) => {
    expect(() => parseAppEnv({ MODE: 'test', VITE_REQUEST_TIMEOUT: value })).toThrow('VITE_REQUEST_TIMEOUT')
    expect(() => parseAppEnv({ MODE: 'test', VITE_MOCK_DELAY: value })).toThrow('VITE_MOCK_DELAY')
  })

  it.each(['', 'TRUE', '1', 'yes', ' true '])('拒绝含糊的 Mock 开关 %j', (value) => {
    expect(() => parseAppEnv({ MODE: 'test', VITE_MOCK_ENABLED: value })).toThrow('VITE_MOCK_ENABLED')
    expect(() => parseAppEnv({ MODE: 'test', VITE_MOCK_LOG_ENABLED: value })).toThrow('VITE_MOCK_LOG_ENABLED')
  })

  it.each(['/', '/api', '//api.example.com', 'api.example.com', 'https://', 'ftp://api.example.com', 'https://api.example.com?token=1', 'https://api.example.com/#part'])('拒绝跨端不可用的 API 根地址 %j', (value) => {
    expect(() => parseAppEnv({ MODE: 'test', VITE_API_BASE_URL: value })).toThrow('VITE_API_BASE_URL')
  })

  it.each(['http://localhost:3000/api', 'https://api.example.com', 'http://127.0.0.1:8080', 'http://[::1]:3000/api'])('允许带协议和主机的地址 %s', (value) => {
    expect(parseAppEnv({ MODE: 'test', VITE_API_BASE_URL: value }).apiBaseURL).toBe(value)
  })
})
