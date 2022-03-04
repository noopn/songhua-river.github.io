---
layout: post
title: TypeScript 编译
categories:
  - TypeScript
tags:
  - TypeScript
abbrlink: c4c01a83
date: 2021-01-14 23:26:07
---

#### TS 解析工具

通过`tsc` 命令把 TS 转为 JS 代码

```bash
yarn add typescript
```

#### helloWord

创建 `index.ts`

配置 `package.json`

```json
"scripts": {
  "tsc": "tsc src/index.ts &&  node src/index.js"
}
```

执行 `yarn tsc`

使用自动化的方法,通过`tsc --init `创建tsconfig.json

配置输入输出目录 `rootDir` `outDir`

在 VScode 中点击 Terminal -> Run Task -> typescript 选择 tsconfig.json 配置文件

可以实时监听文件变化并输出

#### 常用配置

[exclude](https://www.staging-typescript.org/tsconfig#exclude)

[include](https://www.staging-typescript.org/tsconfig#include)

**compilerOptions**

[target](https://www.staging-typescript.org/tsconfig#target) 指定编译版本
 
[module](https://www.staging-typescript.org/tsconfig#module) 使用的模块化规范

[lib](https://www.staging-typescript.org/tsconfig#lib) 指定依赖的库

[outDir](https://www.staging-typescript.org/tsconfig#outDir) 输出的目录

[outFile](https://www.staging-typescript.org/tsconfig#outFile) 按照模块化规范合并成一个文件

[allowJs](https://www.staging-typescript.org/tsconfig#allowJs) 是否对js文件进行编译

[checkJs](https://www.staging-typescript.org/tsconfig#checkJs) 是否检查js代码

[removeComments](https://www.staging-typescript.org/tsconfig#removeComments) 是否移除注释

[noEmit](https://www.staging-typescript.org/tsconfig#noEmit) 不生成编译的文件

[alwaysStrict](https://www.staging-typescript.org/tsconfig#alwaysStrict) 编译的后文件使用严格模式

[noImplicitAny](https://www.staging-typescript.org/tsconfig#noImplicitAny) 不允许使用隐式any

[noImplicitThis](https://www.staging-typescript.org/tsconfig#noImplicitThis) 不允许不明确类型的this

[strictNullChecks](https://www.staging-typescript.org/tsconfig#strictNullChecks) 检查可能的null值， 通过`if`判断或者使用`?.`

[esModuleInterop](https://www.staging-typescript.org/tsconfig#esModuleInterop) 允许`commonjs`规范 es6模块化规范互相通用

```javascript

// b.ts
const obj = require('./a');

// 命名空间
// obj={
//   default:'demo',
//   a:'a',
//   b:'b'
// }

// a.ts
export const a = "a";
export const b = "b";
export default "demo";
```
