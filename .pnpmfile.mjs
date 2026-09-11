export const hooks = {
  readPackage(pkg) {
    if (pkg.name === '@vitest/eslint-plugin' && pkg.version === '1.6.27') {
      // 该版本的规则只分析源码，无需把测试运行器引入根工具链
      delete pkg.peerDependencies?.vitest
      delete pkg.peerDependenciesMeta?.vitest
    }
    return pkg
  },
}
