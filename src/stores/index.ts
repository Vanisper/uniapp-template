import { defineStore } from "pinia"
import type { ISysAllDict, ITenant, IUserInfo } from "@/model/LoginModel"
import { editUserInfo } from "@/services/api"

interface AuthStore {
  isLogin: boolean
  // 鉴权令牌
  appToken: Nullable<string>
  userInfo: Nullable<IUserInfo>
  tenantList: Nullable<ITenant[]>
  sysAllDictItems: Nullable<ISysAllDict>
}
// defineStore 调用后返回一个函数，调用该函数获得 Store 实体
export const useAuthStore = defineStore("authState", {
  // state: 返回对象的函数
  state: (): AuthStore => ({
    isLogin: false,
    appToken: null,
    userInfo: null,
    tenantList: null,
    sysAllDictItems: null,
  }),
  actions: {
    // #region setter
    setIsLogin(isLogin: boolean) {
      this.isLogin = isLogin
    },
    setToken(token: string) {
      this.appToken = token
    },
    setUserInfo(userInfo: IUserInfo) {
      this.userInfo = userInfo
    },
    setTenantList(tenantList: ITenant[]) {
      this.tenantList = tenantList
    },
    setSysAllDictItems(sysAllDictItems: ISysAllDict) {
      this.sysAllDictItems = sysAllDictItems
    },
    setAvatar(avatar: string) {
      if (this.userInfo) {
        this.userInfo.avatar = avatar
        return editUserInfo(this.userInfo)
      }
    },
    setRealName(realname: string) {
      if (this.userInfo) {
        this.userInfo.realname = realname
        return editUserInfo(this.userInfo)
      }
    },
    setPhone(phone: string) {
      if (this.userInfo) {
        this.userInfo.phone = phone
        return editUserInfo(this.userInfo)
      }
    },
    setWorkNo(workNo: string) {
      if (this.userInfo) {
        this.userInfo.workNo = workNo
        return editUserInfo(this.userInfo)
      }
    },
    setEmail(email: string) {
      if (this.userInfo) {
        this.userInfo.email = email
        return editUserInfo(this.userInfo)
      }
    },
    // #endregion

    // #region getter
    getToken() {
      return this.appToken
    },
    getUserName(username?: boolean) {
      return this.userInfo?.realname || (username ? this.userInfo?.username : undefined)
    },
    getAvatar() {
      return this.userInfo?.avatar
    },
    // #endregion

    clearAuth() {
      this.appToken = null
      this.userInfo = null
      this.tenantList = null
      this.sysAllDictItems = null
      this.isLogin = false
    },
  },
})
