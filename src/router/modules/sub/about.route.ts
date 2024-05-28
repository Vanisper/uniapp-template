import type { AppSubPackage } from "@/router/types"

export default {
  root: "pages-about",
  name: "pages-about",
  text: "关于",
  pages: [
    {
      path: "index",
      layout: "notabbar",
      // #region
      name: "about",
      text: "关于",
      // #endregion
      style: {
        "mp-alipay": {
          allowsBounceVertical: "NO",
        },
        "navigationBarTitleText": "关于",
        "navigationStyle": "custom",
      },
    },
  ],
} as AppSubPackage
