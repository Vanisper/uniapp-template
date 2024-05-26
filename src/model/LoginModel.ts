export interface IRegisterParams {
  username: string
  password: string
  tenantId?: string
}

export type IRegisterResponse = IUserInfo

export interface ILoginParams {
  username: string
  password: string
  captcha: string
  checkKey: string | number

  /** 是否记住密码 */
  remember?: boolean
}

export interface IPhoneLoginParams {
  mobile: string
  captcha: string
}

export interface ISmsParams {
  mobile: string
  /** 0登录、1注册、2忘记密码 */
  smsmode: "0" | "1" | "2"
}

export interface ILoginResponse {
  token: string
  tenantList: ITenant[]
  userInfo: IUserInfo
  sysAllDictItems: ISysAllDict
  multi_depart: number
  departs: any[]
}

export interface ITenant {
  beginDate: Nullable<string>
  createBy: string
  createTime: string
  endDate: Nullable<string>
  id: number | string
  name: string
  status: number
}

export type RoleType = "" | "*" | "admin" | "user"

export interface IUserInfo {
  activitiSync: number
  /** 头像 */
  avatar: string
  birthday: string
  clientId: string
  createBy: string
  createTime: string
  delFlag: number
  departIds: string
  email: string
  homePath: string
  id: string
  orgCode: string
  orgCodeTxt: string
  /** 手机号 */
  phone: string
  post: string
  /** 昵称|姓名 */
  realname: string
  /** 租户Id */
  relTenantIds: string
  sex: number
  status: number
  telephone: string
  tenantName: string
  updateBy: string
  updateTime: string
  userIdentity: number
  /** 登录账号 */
  username: string
  /** 工号 */
  workNo: string
}

export interface ISysAllDict {
  [key: string]: ISysDictItem[]
}

export interface ISysDictItem {
  value: string
  text: string
  label: string
  title: string
}
