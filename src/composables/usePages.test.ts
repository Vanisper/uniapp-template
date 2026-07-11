import { afterEach, describe, expect, it, vi } from 'vitest'
import { usePages } from './usePages'

vi.mock('@/pages.json', () => ({
  default: {
    globalStyle: {},
    pages: [
      { path: 'pages/index' },
      { path: 'pages/about' },
    ],
    tabBar: {
      list: [
        { pagePath: 'pages/index', text: '首页' },
        { pagePath: 'pages/about', text: '关于' },
      ],
    },
  },
}))

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('usePages', () => {
  it('显式同步后重新读取当前页面栈', () => {
    const pageStack: any[] = [{ options: {}, route: 'pages/index' }]
    vi.stubGlobal('getCurrentPages', () => pageStack)

    const { currentPage, syncPageStack } = usePages()
    expect(currentPage.value.route).toBe('pages/index')

    pageStack[0] = { options: {}, route: 'pages/about' }
    syncPageStack()

    expect(currentPage.value.route).toBe('pages/about')
  })
})
