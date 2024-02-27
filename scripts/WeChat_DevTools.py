# Usage: python WeChat_DevTools.py --dev
# Usage: python WeChat_DevTools.py --build
# Usage: python WeChat_DevTools.py --help
# Description: 微信开发者工具 cli
# More: 建议将此脚本放在uni-app项目的二级目录下（例如 scripts 目录），然后在package.json中配置命令
"""
package.json 参考配置命令：
scripts": {
  "dev:my-mp-weixin": "python scripts/WeChat_DevTools.py --dev",
  "build:my-mp-weixin": "python scripts/WeChat_DevTools.py --build"
}
"""

import subprocess
import winreg
import os
from rich.console import Console

console = Console()

relative_path_level = 2

class WeChatDevTools:
    def __init__(self):
        # 运行路径
        self.run_path = os.path.dirname(os.path.abspath(__file__))
        # 设置运行路径
        os.chdir(self.run_path)

        # 设置该脚本相对于uni-app项目的根目录的几级目录
        # self.relative_path = "../"
        self.relative_path_level = relative_path_level

        self.install_location = self.get_install_location()
        self.cli_path = self.get_cli_path()

    def __str__(self):
        return f"微信开发者工具安装路径: {self.install_location}\n微信开发者工具 cli 路径: {self.cli_path}"

    def __repr__(self):
        return f"WeChatDevTools(install_location={self.install_location}, cli_path={self.cli_path})"

    def get_install_location(self) -> str | None:
        """
        获取微信开发者工具安装路径
        return: 安装路径
        """
        key_path = r"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall"
        app_name = "微信开发者工具"

        with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, key_path) as key:
            for i in range(winreg.QueryInfoKey(key)[0]):
                sub_key_name = winreg.EnumKey(key, i)
                with winreg.OpenKey(key, sub_key_name) as sub_key:
                    try:
                        display_name = winreg.QueryValueEx(sub_key, "DisplayName")[0]
                        # 名称包含
                        if app_name in display_name:
                            install_location = winreg.QueryValueEx(sub_key, "InstallLocation")[0]
                            return install_location
                    except FileNotFoundError as e:
                        try:
                            install_location = winreg.QueryValueEx(sub_key, "DisplayIcon")[0]
                            # 获取路径
                            return os.path.dirname(install_location)
                        except FileNotFoundError as e:
                            continue
        return None

    def get_cli_path(self) -> str | None:
        """
        获取微信开发者工具 cli 路径
        return: cli 路径
        """
        cli_path = os.path.join(self.install_location, "cli.bat")

        # 判断文件是否存在
        if not os.path.exists(cli_path):
            cli_path = None

        return cli_path.replace("\\", "\\\\")

    def run_cli(self, command: str):
        """
        运行微信开发者工具 cli 命令
        more: https://developers.weixin.qq.com/miniprogram/dev/devtools/cli.html
        command: cli 命令
        return: cli 输出
        """
        if self.cli_path is None:
            raise FileNotFoundError("微信开发者工具 cli 未找到")

        # 运行命令
        command = f'"{self.cli_path}" {command}'

        # Print the command being executed
        # console.print(f'运行命令: {command}')
        console.print(f'运行命令: {command}', style="yellow")

        # Run the command and capture the output
        output = subprocess.run(command, shell=True, capture_output=True, text=True, encoding="utf-8")

        # Print the output with syntax highlighting
        console.print(output.stdout, style="green")
        console.print(output.stderr, style="red")

        return output

    def open_project(self, path: str):
        """
        获取微信开发者工具项目列表
        return: 项目列表
        """
        os.chdir(self.run_path)
        # path转换为绝对路径
        path = os.path.abspath(path).replace("\\", "\\\\")

        if not os.path.exists(path):
            raise FileNotFoundError("项目路径不存在")

        return self.run_cli(f'open --project "{path}"')

    def run_pnpm(self, command: str):
        """
        使用pnpm运行项目
        path: 项目路径
        return: cli 输出
        """
        # os.chdir(os.path.dirname(self.run_path))
        # 根据relative_path_level设置运行路径
        if self.relative_path_level is None:
            raise ValueError("relative_path_level 未设置, 请设置为当前脚本相对于uni-app项目的根目录的几级目录")
        for _ in range(self.relative_path_level - 1):
            os.chdir(os.path.dirname(os.getcwd()))
        return subprocess.Popen(['pnpm', command], shell=True, encoding="utf-8")

    def dev_weixin(self, path: str = "../dist/dev/mp-weixin"):
        """
        开发微信小程序
        path: 项目路径
        return: cli 输出
        """
        try:
            # 打开项目
            self.open_project(path)
        except FileNotFoundError:
            try:
                # 去当前目录的上一级目录  执行 pnpm run dev:mp-weixin
                pnpm_process = self.run_pnpm("dev:mp-weixin")
                console.print("[!] 这是第一次运行，请手动终止一次，重新运行此命令", style="yellow")
                pnpm_process.wait()
            except KeyboardInterrupt as e:
                pnpm_process.terminate()
                return "手动终止: dev_weixin"
            except Exception as e:
                return e

        try:
            # 去当前目录的上一级目录  执行 pnpm run dev:mp-weixin
            pnpm_process = self.run_pnpm("dev:mp-weixin")
            pnpm_process.wait()
        except KeyboardInterrupt as e:
            pnpm_process.terminate()
            return "手动终止: dev_weixin"
        except Exception as e:
            return e

    def build_weixin(self, path: str = "../dist/build/mp-weixin"):
        """
        构建微信小程序
        path: 项目路径
        return: cli 输出
        """
        try:
            # 去当前目录的上一级目录  执行 pnpm run build:mp-weixin
            pnpm_process = self.run_pnpm("build:mp-weixin")
            pnpm_process.wait()
        except KeyboardInterrupt as e:
            pnpm_process.terminate()
            return "手动终止: build_weixin"
        except Exception as e:
            return e

        try:
            # 打开项目
            self.open_project(path)
            return "构建完成: build_weixin"
        except Exception as e:
            return e


# 使用示例
# dev_tools = WeChatDevTools() # 实例化微信开发者工具
# print(dev_tools.install_location) # 获取微信开发者工具安装路径
# print(dev_tools.cli_path) # 获取微信开发者工具 cli 路径
# print(dev_tools) # 打印微信开发者工具信息
# print(dev_tools.run_cli("--help")) # 运行微信开发者工具 cli 命令 - 获取帮助
# dev_tools.open_project("../dist/dev/mp-weixin") # 打开微信开发者工具项目
# console.print(dev_tools.dev_weixin(), style="red") # 开发微信小程序
# console.print(dev_tools.build_weixin(), style="red") # 构建微信小程序

if __name__ == "__main__":
    # 获取请求参数
    import argparse
    parser = argparse.ArgumentParser(description="微信开发者工具 cli")
    parser.add_argument("--dev", help="开发微信小程序", action="store_true")
    parser.add_argument("--build", help="构建微信小程序", action="store_true")
    args = parser.parse_args()

    # 实例化微信开发者工具
    dev_tools = WeChatDevTools()

    if args.dev:
        console.print(dev_tools.dev_weixin(), style="red")
    elif args.build:
        console.print(dev_tools.build_weixin(), style="red")
    else:
        parser.print_help()
