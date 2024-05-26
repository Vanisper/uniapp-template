const uni = require("@uni-helper/eslint-config")

module.exports = uni(
  {
    // 启用 stylistic 格式化规则
    // stylistic: true,

    // 自定义 stylistic 规则
    stylistic: {
      indent: 2, // 4, or 'tab'
      quotes: "double",
    },
    rules: {
      // "no-console": "off",
      // "no-restricted-syntax": [
      //     "error",
      //     {
      //         selector: "CallExpression[callee.object.name='console'][callee.property.name!=/^(log|warn|error|info|trace)$/]",
      //         message: "Unexpected property on console object was called",
      //     },
      // ],
      "unused-imports/no-unused-vars": "off",
      "import/first": "off",
      "jsdoc/require-returns-check": "off",
      "ts/ban-ts-comment": "off",
      "prefer-promise-reject-errors": "off",
    },
    // TypeScript 和 Vue 是自动检测的，你也可以显式启用它们:
    typescript: true,
    vue: true,

    // 禁用 json 和 yaml 支持
    // jsonc: false,
    // yaml: false,
  },
  {
    // 在 Flat 配置中不再支持 `.eslintignore`，请使用 `ignores` 代替
    ignores: [
      // './fixtures',
      // ...globs
      "src/uni_modules/**",
    ],
  },
)
