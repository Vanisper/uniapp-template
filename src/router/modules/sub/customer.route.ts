import type { AppSubPackage } from "@/router/types"

export default {
  root: "pages-customer",
  name: "pages-customer",
  text: "客户管理",
  pages: [
    {
      path: "index",
      layout: "notabbar",
      // #region
      name: "customer",
      text: "客户管理",
      needauth: false,
      // #endregion
      style: {
        "mp-alipay": {
          allowsBounceVertical: "NO",
        },
        "navigationBarTitleText": "客户管理",
        "navigationStyle": "custom",
      },
    },
    {
      path: "customer-add/index",
      layout: "notabbar",
      // #region
      name: "customer-add",
      text: "添加|编辑客户",
      needauth: false,
      // #endregion
      style: {
        "mp-alipay": {
          allowsBounceVertical: "NO",
        },
        "navigationBarTitleText": "添加|编辑客户",
        "navigationStyle": "custom",
      },
    },
    {
      path: "customer-tag/index",
      layout: "notabbar",
      // #region
      name: "customer-tag",
      text: "客户标签",
      needauth: false,
      // #endregion
      style: {
        "mp-alipay": {
          allowsBounceVertical: "NO",
        },
        "navigationBarTitleText": "客户标签",
        "navigationStyle": "custom",
      },
    },
  ],
} as AppSubPackage
