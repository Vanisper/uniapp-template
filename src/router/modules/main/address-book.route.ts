import type { AppPageMetaDatum } from "@/router/types"

export default {
  path: "pages/address-book/index",
  // #region
  name: "address-book",
  text: "通讯录",
  icon: "note",
  tabbar: true,
  needauth: false,
  // #endregion
  style: {
    "mp-alipay": {
      allowsBounceVertical: "NO",
    },
    "navigationBarTitleText": "通讯录",
    "navigationStyle": "custom",
  },
} as AppPageMetaDatum
