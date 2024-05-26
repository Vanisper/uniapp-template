import type { AppPageMetaDatum } from "@/router/types"

export default {
  path: "pages/about/index",
  // #region
  name: "about",
  text: "关于",
  icon: "app",
  tabbar: true,
  // #endregion
  style: {
    "mp-alipay": {
      allowsBounceVertical: "NO",
    },
    "enablePullDownRefresh": true,
    "navigationBarTitleText": "关于",
    "navigationStyle": "custom",
  },
} as AppPageMetaDatum
