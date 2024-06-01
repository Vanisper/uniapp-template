import type { IUserInfo } from "@/model/LoginModel"

import { genCustomerList } from "@/mock/customer"
import type { ICustomer, ICustomerQuery, ICustomerResponse } from "@/model/CustomerModel"

export function editUserInfo(userInfo: IUserInfo) {
  return Promise.resolve(userInfo)
}

export function getCustomerList(params?: Partial<ICustomerQuery>) {
  const list = genCustomerList()
  const total = list.length
  const pageNo = params?.pageNo || 1
  const pageSize = params?.pageSize || 10

  return Promise.resolve({
    current: pageNo,
    pages: Math.ceil(total / pageSize),
    records: list.slice((pageNo - 1) * pageSize, pageNo * pageSize),
    size: pageSize,
    total,
  } as ICustomerResponse)
}

export function deleteCustomerById(id: string) {
  return Promise.resolve("success")
}

export function getCustomerById(id: string) {
  const list = genCustomerList()
  return Promise.resolve(list.find(item => item.id === id))
}

export function addCustomer(customer: ICustomer) {
  return Promise.resolve(customer)
}

export function editCustomer(customer: ICustomer) {
  return Promise.resolve(customer)
}
