import type { AppPageMetaDatum } from "@/router/types"

export default [
  {
    path: "pages/user_center/index",
    // #region
    name: "user-center",
    text: "我的",
    icon: "user",
    tabbar: true,
    needauth: false,
    // #endregion
    style: {
      "mp-alipay": {
        allowsBounceVertical: "NO",
      },
      "navigationBarTitleText": "我的",
      "navigationStyle": "custom",
    },
  },
] as AppPageMetaDatum[]
