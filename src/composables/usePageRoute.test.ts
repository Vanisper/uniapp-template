import type { Component } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineAsyncComponent, defineComponent, getCurrentInstance, h, nextTick, shallowRef } from 'vue'
import { usePageRoute } from './usePageRoute'

const wrappers: ReturnType<typeof mount>[] = []

function injectPageFields(fields: Record<string, unknown>) {
  const instance = getCurrentInstance() as unknown as { ctx: Record<string, unknown> }
  Object.assign(instance.ctx, fields)
}

function createPage(fields: Record<string, unknown>) {
  return defineComponent({
    setup(_, { slots }) {
      injectPageFields({ $mpType: 'page', ...fields })
      return () => h('section', slots.default?.())
    },
  })
}

const RouteProbe = defineComponent({
  setup() {
    const route = usePageRoute()
    return () => h('output', route ?? 'undefined')
  },
})

afterEach(() => {
  wrappers.splice(0).forEach(wrapper => wrapper.unmount())
  vi.unstubAllGlobals()
})

describe('所属页面路由', () => {
  it('从小程序页面的原生 scope 读取路由并移除前导 /', () => {
    const Page = createPage({ $scope: { route: '//pages/index' } })
    const wrapper = mount(Page, { slots: { default: RouteProbe } })
    wrappers.push(wrapper)

    expect(wrapper.find('output').text()).toBe('pages/index')
  })

  it('从 H5 和 App 页面 proxy 读取路由', () => {
    const Page = createPage({ route: 'pages/about', $scope: {} })
    const wrapper = mount(Page, { slots: { default: RouteProbe } })
    wrappers.push(wrapper)

    expect(wrapper.find('output').text()).toBe('pages/about')
  })

  it('支持在页面自身 setup 中读取路由', () => {
    const Page = defineComponent({
      setup() {
        injectPageFields({ $mpType: 'page', route: '/pages/index' })
        const route = usePageRoute()
        return () => h('output', route)
      },
    })
    const wrapper = mount(Page)
    wrappers.push(wrapper)

    expect(wrapper.text()).toBe('pages/index')
  })

  it('穿过嵌套组件找到最近的所属页，不读取应用根或组件自身路由', () => {
    const OuterPage = createPage({ route: 'pages/outer' })
    const Page = createPage({ route: 'pages/index' })
    const Nested = defineComponent({
      setup() {
        injectPageFields({ $mpType: 'component', $scope: { route: 'components/nested' } })
        return () => h(RouteProbe)
      },
    })
    const App = defineComponent({
      setup() {
        injectPageFields({ $mpType: 'app', route: 'app' })
        return () => h(OuterPage, () => h(Page, () => h(Nested)))
      },
    })
    const wrapper = mount(App)
    wrappers.push(wrapper)

    expect(wrapper.find('output').text()).toBe('pages/index')
  })

  it('异步子组件在活动页切换后完成加载，仍读取原所属页', async () => {
    const activeRoute = shallowRef('pages/index')
    const getPages = vi.fn(() => [{ route: activeRoute.value }])
    vi.stubGlobal('getCurrentPages', getPages)
    let resolveComponent!: (component: Component) => void
    const DeferredProbe = defineAsyncComponent(() => new Promise<Component>((resolve) => {
      resolveComponent = resolve
    }))
    const Page = createPage({ $scope: { route: 'pages/index' }, $route: activeRoute })
    const wrapper = mount(Page, {
      slots: { default: () => h(DeferredProbe) },
    })
    wrappers.push(wrapper)

    activeRoute.value = 'pages/about'
    await nextTick()
    resolveComponent(RouteProbe)
    await flushPromises()

    expect(wrapper.find('output').text()).toBe('pages/index')
    expect(getPages).not.toHaveBeenCalled()
  })

  it('没有所属页时返回 undefined，即使存在活动页面', () => {
    const getPages = vi.fn(() => [{ route: 'pages/index' }])
    vi.stubGlobal('getCurrentPages', getPages)
    const wrapper = mount(RouteProbe)
    wrappers.push(wrapper)

    expect(wrapper.text()).toBe('undefined')
    expect(usePageRoute()).toBeUndefined()
    expect(getPages).not.toHaveBeenCalled()
  })

  it('所属页尚无路由时不借用外层页面的路由', () => {
    const OuterPage = createPage({ route: 'pages/outer' })
    const Page = createPage({})
    const wrapper = mount(OuterPage, { slots: { default: () => h(Page, () => h(RouteProbe)) } })
    wrappers.push(wrapper)

    expect(wrapper.find('output').text()).toBe('undefined')
  })
})
