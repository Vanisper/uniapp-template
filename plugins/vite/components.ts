import Components from '@uni-helper/vite-plugin-uni-components'
import { WotV2Resolver, ZPagingResolver } from '@uni-helper/vite-plugin-uni-components/resolvers'
import { UniEchartsResolver } from 'uni-echarts/resolver'

/** 本地组件生成声明，第三方组件沿用各自的全局类型 */
export function createComponentPlugins() {
  const sharedOptions = {
    dtsTsx: false,
    types: [],
    directoryAsNamespace: true,
  }
  const localTypes = Components({
    ...sharedOptions,
    dts: 'src/typings/components.d.ts',
    syncMode: 'overwrite',
  })
  const transform = typeof localTypes.transform === 'function' ? localTypes.transform : localTypes.transform?.handler

  // 0.3.2 不支持仅排除第三方声明；此实例触发类型生成后，把原代码交给运行时实例
  localTypes.name = 'uni-components:local-types'
  localTypes.transform = async function (...args) {
    await transform?.apply(this, args)
    return null
  }

  return [localTypes, Components({
    ...sharedOptions,
    dts: false,
    resolvers: [UniEchartsResolver(), WotV2Resolver(), ZPagingResolver()],
  })]
}
