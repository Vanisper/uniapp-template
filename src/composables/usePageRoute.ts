import { getCurrentInstance } from 'vue'

interface PageProxy {
  $mpType?: string
  route?: string
  $scope?: { route?: string }
}

/**
 * 获取当前组件所属页面的固定路由，不含前导 /
 *
 * @description 在 setup 中调用，没有所属页面时返回 undefined
 */
export function usePageRoute(): string | undefined {
  let instance = getCurrentInstance()

  while (instance) {
    const proxy = instance.proxy as PageProxy | null
    if (proxy?.$mpType === 'page') {
      const route = proxy.route ?? proxy.$scope?.route
      return route?.replace(/^\/+/, '') || undefined
    }
    instance = instance.parent
  }

  return undefined
}
