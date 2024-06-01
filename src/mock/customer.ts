import type { ICustomer } from "@/model/CustomerModel"

/** 客户 */
export function genCustomer(id: string): ICustomer {
  return {
    id,
    code: `c${id}`,
    name: `测试客户${id}`,
    logisticsAddress: `测试地址${id}`,
  }
}

/** 客户列表 */
export function genCustomerList(len = 20): ICustomer[] {
  return Array(len).fill(0).map((_, idx) => genCustomer(`${idx}`))
}
