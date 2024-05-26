import type { IUserInfo } from "@/model/LoginModel"

export function editUserInfo(userInfo: IUserInfo) {
  return Promise.resolve(userInfo)
}
