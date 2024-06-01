export interface ICustomer {
  /** ID */
  id: string

  // --- 基本信息 ---
  /** 编码 */
  code: string
  /** 名称 */
  name: string
  /** 物流备注 */
  logisticsAddress: string

  // --- 可选信息 ---
  /** 客户类别 */
  customerCategory?: string
  /** 客户等级 */
  customerLevel?: string
  /** 纳税规模 */
  taxScale?: string
  /** 欠款额度 */
  creditQuota?: number
  /** 是否启用 */
  isEnabled?: 0 | 1 | "0" | "1" | boolean
  /** 备注 */
  remark?: string

  // --- 开票信息 ---
  /** 单位名称 */
  invoiceCompany?: string
  /** 税务代码 | 税号 */
  invoiceTaxCode?: string
  /** 开户行 */
  invoiceBankName?: string
  /** 行号 */
  invoiceBankCode?: string
  /** 账户 */
  invoiceAccount?: string
  /** 联系电话 */
  invoicePhone?: string
  /** 开票地址 */
  invoiceAddress?: string

  // --- 办款资料 ---
  /** 单位名称 */
  paymentCompany?: string
  /** 开户行 */
  paymentBankName?: string
  /** 行号 */
  paymentBankCode?: string
  /** 账户 */
  paymentAccount?: string

  // --- 收件信息 ---
  /** 收件人 */
  recvName?: string
  /** 联系电话 */
  recvPhone?: string
  /** 传真 */
  recvFax?: string
  /** Email */
  recvEmail?: string
  /** 地址 */
  recvAddress?: string
  /** 邮编 */
  recvPostcode?: string

  // --- 财务信息 ---
  /** 财务联系人 */
  financialContacts?: string
  /** 财务电话 */
  financialPhone?: string

  // --- 其他信息 ---
  /** 简称 */
  shortName?: string
  /** 客户网站 */
  website?: string
  /** 法人代表 */
  legalPerson?: string
  /** 法人电话 */
  legalPersonPhone?: string
  /** 所属总公司 */
  headquarters?: string
  /** 所属地区 */
  area?: string
  /** 业务区域 */
  bizArea?: string
  /** 客户地址 */
  address?: string
  /** 附件 */
  attachment?: string

  // --- 系统操作信息 ---
  /** 创建时间 */
  createTime?: string
  /** 创建人 */
  createBy?: string
  /** 修改时间 */
  updateTime?: string
  /** 修改人 */
  updateBy?: string
  /** 版本 */
  version?: number
}

export interface ICustomerQuery extends ICustomer {

  /** 页码 */
  pageNo?: number
  /** 每页数量 */
  pageSize?: number
}

export interface ICustomerResponse {
  current: number
  pages: number
  records: ICustomer[]
  size: number
  total: number
}
