import { defineManifestConfig } from "@uni-helper/vite-plugin-uni-manifest"

export default defineManifestConfig({
  "name": "",
  "appid": "",
  "description": "",
  "versionName": "1.0.0",
  "versionCode": "100",
  "transformPx": false,
  /* 5+App特有相关 */
  "app-plus": {
    usingComponents: true,
    nvueStyleCompiler: "uni-app",
    compilerVersion: 3,
    splashscreen: {
      alwaysShowBeforeRender: true,
      waiting: true,
      autoclose: true,
      delay: 0,
    },
    /* 模块配置 */
    modules: {},
    /* 应用发布信息 */
    distribute: {
      /* android打包配置 */
      android: {
        permissions: [
          "<uses-permission android:name=\"android.permission.CHANGE_NETWORK_STATE\"/>",
          "<uses-permission android:name=\"android.permission.MOUNT_UNMOUNT_FILESYSTEMS\"/>",
          "<uses-permission android:name=\"android.permission.VIBRATE\"/>",
          "<uses-permission android:name=\"android.permission.READ_LOGS\"/>",
          "<uses-permission android:name=\"android.permission.ACCESS_WIFI_STATE\"/>",
          "<uses-feature android:name=\"android.hardware.camera.autofocus\"/>",
          "<uses-permission android:name=\"android.permission.ACCESS_NETWORK_STATE\"/>",
          "<uses-permission android:name=\"android.permission.CAMERA\"/>",
          "<uses-permission android:name=\"android.permission.GET_ACCOUNTS\"/>",
          "<uses-permission android:name=\"android.permission.READ_PHONE_STATE\"/>",
          "<uses-permission android:name=\"android.permission.CHANGE_WIFI_STATE\"/>",
          "<uses-permission android:name=\"android.permission.WAKE_LOCK\"/>",
          "<uses-permission android:name=\"android.permission.FLASHLIGHT\"/>",
          "<uses-feature android:name=\"android.hardware.camera\"/>",
          "<uses-permission android:name=\"android.permission.WRITE_SETTINGS\"/>",
        ],
      },
      /* ios打包配置 */
      ios: {},
      /* SDK配置 */
      sdkConfigs: {},
    },
  },
  /* 快应用特有相关 */
  "quickapp": {},
  /* 小程序特有相关 */
  "mp-weixin": {
    appid: "wx17284ec2d145a7e6",
    setting: {
      urlCheck: true,
      minified: true,
      postcss: true,
      es6: true,
    },
    permission: {
      "scope.userLocation": {
        desc: "为了帮助定位及查看距离",
      },
    },
    // "plugins" : {
    //     "chat" : {
    //         "version" : "1.0.8",
    //         "provider" : "wx738958e0f4c894f9"
    //     }
    // },
    // "sitemapLocation" : "sitemap.json",
    usingComponents: true,
    // https://zhuanlan.zhihu.com/p/572723761
    requiredPrivateInfos: ["getLocation"],
    // lazyCodeLoading: "requiredComponents",
    // https://developers.weixin.qq.com/community/develop/article/doc/00060ed660c7d8970c40142ef66c13
    __usePrivacyCheck__: true,
    uniStatistics: {
      enable: false,
    },
    optimization: {
      subPackages: true,
    },
    darkmode: true,
    themeLocation: "theme.json",
  },
  "mp-alipay": {
    usingComponents: true,
  },
  "mp-baidu": {
    usingComponents: true,
  },
  "mp-toutiao": {
    usingComponents: true,
  },
  "h5": {
    darkmode: true,
    themeLocation: "theme.json",
  },
  "uniStatistics": {
    enable: false,
  },
  "vueVersion": "3",
})
