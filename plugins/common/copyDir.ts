import { cp, mkdir, rm } from 'node:fs/promises'

export async function copyDir(sourcePath: string, targetPath: string) {
  // 删除文件夹 (force: true 忽略路径不存在的情况)
  await rm(targetPath, { recursive: true, force: true })
  // 创建文件夹
  await mkdir(targetPath, { recursive: true })
  // 复制内容 (recursive: true 用于复制整个目录)
  await cp(sourcePath, targetPath, { recursive: true })
}
