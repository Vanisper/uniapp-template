# monorepo 学习

> form: <https://fazalerabbi.medium.com/monorepo-using-pnpm-workspaces-cb23ed332127>

## pnpm-workspace.yaml

``` yaml
packages:   
 - 'packages/*'   
 - 'apps/*'
```

## create sub-project

``` shell
pnpm create vite apps/ui
pnpx @nestjs/cli new apps/api

pnpm --filter ui dev
pnpm --filter api start:dev
```

类库的 tsconfig.json 示例

``` json
{
    "compilerOptions": {
        "target": "ES6",
        "module": "commonjs",
        "allowJs": true,
        "declaration": true,
        "outDir": "./dist",
        "strict": true,
        "moduleResolution": "node",
        "esModuleInterop": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true
    },
    "include": [
        "src"
    ]
}
```

## add script to package.json

``` json
{
    "scripts": {
        "start:ui": "pnpm --filter ui dev", 
        "start:api": "pnpm --filter api start:dev",
        "start": "pnpm run start:ui & pnpm run start:api",
        "build": "pnpm recursive run build",
        "test": "pnpm recursive run test"
    }
}
```

> `pnpm start:ui` // It will run UI app
> 
> `pnpm start:api` // It will run API app
> 
> `pnpm start` // It will run both apps
> 
> `pnpm test` // it will test on all workspaces
>
> `— recursive`: 它将在所有工作区上运行指定的命令，例如构建和测试。如果某些工作区没有对应的 `script` 命令，它将忽略它。

## add dependencies

``` shell
pnpm add --filter logger typescript
```

## build

``` shell
pnpm --filter logger build
```

## add sub-project as dependency

``` shell
pnpm add ./packages/logger --workspace-root
```

> Above command will add the package logger into root node_module folder.
>
> — workspace-root: 这将把子项目包以`link`的形式添加到根 `node_modules` 文件夹中，且会在根 `package.json` 文件中添加依赖项。
>
> 如此一来，你可以在任何工作区中使用 `logger` 包。