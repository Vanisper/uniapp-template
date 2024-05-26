import pagesJsonToRoutes from "uni-parse-pages"
import pagesJson from "../pages.json"
import { isDenyAccessAfterLogin, isNeedAuth } from "./routes"

const router = createRouter({
  routes: [...pagesJsonToRoutes(pagesJson)],
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  if (isNeedAuth(to.name) && !authStore.isLogin) {
    uni.showToast({
      title: "请先登录",
      icon: "error",
    })
    next(false)
  }
  else if (isDenyAccessAfterLogin(to.name) && authStore.isLogin) {
    uni.showToast({
      title: "已登录",
      icon: "error",
    })
    next(false)
  }
  else {
    next()
  }
  // const authStore = useAuthStore()
  // if (!authStore.$state.userInfo && to && to.name !== 'login') {
  //   // 如果没有登录信息且目标路由不是登录页面则跳转到登录页面
  //   next({ name: 'login', navType: 'replaceAll' })
  // } else if (authStore.$state.userInfo && to && to.name === 'login') {
  //   // 如果已经登录且目标页面是登录页面则跳转至首页
  //   next({ name: 'home', navType: 'replaceAll' })
  // } else {
  //   next()
  // }
})

router.afterEach((to, from) => {
  const authStore = useAuthStore()

  if (isNeedAuth(to.name) && !authStore.isLogin) {
    // 如果没有登录信息且目标路由需要登录则跳转到登录页面
    router.replaceAll({ name: "login" })
  }
  else if (isDenyAccessAfterLogin(to.name) && authStore.isLogin) {
    // 如果已经登录且目标页面是例如登录页面的登录后需要屏蔽的页面则跳转至首页
    router.replaceAll({ name: "workbench" })
  }
})

export default router
