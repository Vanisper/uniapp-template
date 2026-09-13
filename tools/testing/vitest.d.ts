import 'vitest'

declare module 'vitest' {
  export interface ProvidedContext {
    uniPlatform: 'h5' | 'mp-weixin'
  }
}
