import axios from "axios"
import type { AxiosRequestConfig, AxiosRequestHeaders, AxiosResponse, InternalAxiosRequestConfig } from "axios"
import { createUniAppAxiosAdapter } from "@uni-helper/axios-adapter"

export interface HttpResponse<T = unknown> {
  success: number
  message: string
  code: number
  result: T
  timestamp: number
}

/** ## 微信小程序不支持使用axios 这里需要添加适配器 底层还是调用的uni.request */
axios.defaults.adapter = createUniAppAxiosAdapter()

if (import.meta.env.VITE_APP_API_BASE_URL)
  axios.defaults.baseURL = import.meta.env.VITE_APP_API_BASE_URL

// TODO: 这里的AuthorizationKey需要根据实际情况修改
const AuthorizationKey = "X-Access-Token" as "Authorization" | "X-Access-Token"
// TODO: 这里的mockapi前缀需要根据实际情况修改
const MOCK_API_PREFIX = "/mockapi"

axios.interceptors.request.use(
  (config: InternalAxiosRequestConfig<AxiosRequestConfig>) => {
    // let each request carry token
    // this example using the JWT token
    // Authorization is a custom headers key
    // please modify it according to the actual situation
    const authStore = useAuthStore()
    const token = authStore.appToken
    const tenantIds = authStore.userInfo?.relTenantIds.split(",") || []

    if (token) {
      if (!config.headers)
        config.headers = {} as AxiosRequestHeaders

      config.headers[AuthorizationKey] = `${AuthorizationKey === "Authorization" ? "Bearer " : ""}${token}`
    }

    if (tenantIds.length > 0)
      config.headers["tenant-id"] = tenantIds.join(",")

    // 判断是mockapi前缀的接口  在请求头中添加mock字段
    if (config.url?.startsWith(MOCK_API_PREFIX)) {
      (config as any).mock = true
      return config
    }
    return config
  },
  (error) => {
    // do something
    return Promise.reject(error)
  },
)
// add response interceptors
axios.interceptors.response.use(
  (response: AxiosResponse<HttpResponse>) => {
    // 判断是mockapi前缀的接口
    if (response.config.url?.startsWith(MOCK_API_PREFIX))
      return response

    const res = response.data
    // TODO 这里暂时规定接口返回结果成功与否的字段为success，需要根据实际情况修改
    if (!res.success) {
      // showNotify({ type: "danger", message: res.message || "Error" })
      // TODO: 这里的401、接口地址需要根据实际情况修改
      // 判断是否是token过期
      // 401: 非法的token 或者 token过期了; 略过请求用户信息的接口
      if ([401].includes(res.code) && response.config.url !== "/api/user/info") {
        const authStore = useAuthStore()
        authStore.setIsLogin(false)
        // Message.confirm({
        //   title: "Confirm logout",
        //   msg: "You have been logged out, you can cancel to stay on this page, or log in again",
        // }).then(async () => {
        //   const userStore = useAuthStore()
        //   await userStore.logout()
        //   // #ifdef H5
        //   window.location.reload()
        //   // #endif
        // }).catch(() => {
        //   // console.log("点击了取消按钮")
        // })
      }

      return Promise.reject(new Error(res.message || "Error"))
    }
    return response
  },
  (error) => {
    if (!error?.config?.mock)
      return Promise.reject(error)

    // TODO: 这里是处理mock接口的逻辑，需要根据实际情况修改
    let data = null
    switch (error.config.url) {
      case "":
        data = {}
        break
      default:
        break
    }
    // 构造一个axiosResponse对象
    return Promise.resolve({
      data,
      status: 200,
      statusText: "OK",
      headers: error.config.headers,
      config: error.config,
    } as AxiosResponse)
  },
)
