import { computed, onScopeDispose, shallowRef } from 'vue'
import { clearToken, getToken, setToken } from '@/auth/token'
import { isMockEnabled, RequestError } from '@/http'
import { getDemoProfile, getDemoPublic, loginDemo } from '../../api/auth'

type AuthAction = 'login' | 'profile' | 'public'
interface AuthFeedback {
  state: 'idle' | 'loading' | 'success' | 'error'
  message: string
}
interface PendingRequest {
  abort: () => Promise<void>
}

function errorMessage(error: unknown) {
  if (error instanceof RequestError && error.kind === 'business' && error.code !== undefined)
    return `${error.message}（业务码 ${error.code}）`
  return error instanceof Error ? error.message : '操作失败，请重试'
}

/** 管理 Mock 登录、个人信息与匿名请求，退出或卸载后丢弃在途响应 */
export function useAuthDemo() {
  const username = shallowRef('demo')
  const password = shallowRef('demo123')
  const hasToken = shallowRef(false)
  const storageMessage = shallowRef('')
  const activeAction = shallowRef<AuthAction | null>(null)
  const busy = computed(() => activeAction.value !== null)
  const canLogin = computed(() => isMockEnabled && !busy.value && !!username.value.trim() && !!password.value)
  const feedback = {
    login: shallowRef<AuthFeedback>({ state: 'idle', message: '使用已填好的示例账号登录' }),
    profile: shallowRef<AuthFeedback>({ state: 'idle', message: '登录前或退出后请求，将收到 HTTP 401' }),
    public: shallowRef<AuthFeedback>({ state: 'idle', message: '登录后也可验证匿名请求不携带认证头' }),
  }
  let generation = 0
  let disposed = false
  let pendingRequest: PendingRequest | undefined

  function refreshTokenState() {
    try {
      hasToken.value = !!getToken()
      storageMessage.value = ''
    }
    catch (error) {
      hasToken.value = false
      storageMessage.value = `无法读取 Token 缓存：${errorMessage(error)}`
    }
  }

  async function run<T>(action: AuthAction, createRequest: () => PendingRequest & { send: () => Promise<T> }, receive: (data: T) => string) {
    if (!isMockEnabled || disposed || busy.value)
      return

    const currentGeneration = ++generation
    activeAction.value = action
    feedback[action].value = { state: 'loading', message: '请求中…' }
    try {
      const request = createRequest()
      pendingRequest = request
      const data = await request.send()
      // 取消不保证服务端停止处理，写入缓存前仍需校验操作是否有效
      if (disposed || generation !== currentGeneration)
        return

      feedback[action].value = { state: 'success', message: receive(data) }
    }
    catch (error) {
      if (!disposed && generation === currentGeneration)
        feedback[action].value = { state: 'error', message: errorMessage(error) }
    }
    finally {
      if (!disposed && generation === currentGeneration) {
        pendingRequest = undefined
        activeAction.value = null
        refreshTokenState()
      }
    }
  }

  function login() {
    if (!canLogin.value)
      return

    return run('login', () => loginDemo(username.value.trim(), password.value), (data) => {
      setToken(data.token)
      return `已登录：${data.user.name}；登录请求${data.hasAuthHeader ? '携带了' : '未携带'}认证头`
    })
  }

  function requestProfile() {
    return run('profile', getDemoProfile, data => `当前用户：${data.name}（ID ${data.id}）`)
  }

  function requestPublic() {
    return run('public', getDemoPublic, data => `${data.message}；${data.hasAuthHeader ? '携带了' : '未携带'}认证头`)
  }

  function invalidateRequest() {
    generation++
    const request = pendingRequest
    pendingRequest = undefined
    activeAction.value = null
    if (request) {
      // 响应已由代次隔离，底层取消失败也不能恢复旧操作
      void request.abort().catch(() => {})
    }
  }

  function logout() {
    if (!isMockEnabled || disposed)
      return

    invalidateRequest()
    feedback.profile.value = { state: 'idle', message: '个人信息已清空，可再次请求验证 HTTP 401' }
    if (feedback.public.value.state === 'loading')
      feedback.public.value = { state: 'idle', message: '已取消在途匿名请求，可重新发起' }
    try {
      clearToken()
      feedback.login.value = { state: 'idle', message: '已退出并清除本地 Token' }
    }
    catch (error) {
      feedback.login.value = { state: 'error', message: `清除 Token 失败：${errorMessage(error)}` }
    }
    refreshTokenState()
  }

  if (isMockEnabled)
    refreshTokenState()

  onScopeDispose(() => {
    disposed = true
    invalidateRequest()
  })

  return {
    username,
    password,
    hasToken,
    storageMessage,
    activeAction,
    busy,
    canLogin,
    loginResult: feedback.login,
    profileResult: feedback.profile,
    publicResult: feedback.public,
    login,
    requestProfile,
    requestPublic,
    logout,
  }
}
