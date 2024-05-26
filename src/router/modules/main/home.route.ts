import type { AppPageMetaDatum } from "@/router/types"

export default {
  path: "pages/home/index",
  // #region
  name: "home",
  text: "首页",
  icon: "money-circle",
  tabbar: true,
  // #endregion
  style: {
    "mp-alipay": {
      allowsBounceVertical: "NO",
    },
    "navigationBarTitleText": "首页",
    "navigationStyle": "custom",
  },
} as AppPageMetaDatum
