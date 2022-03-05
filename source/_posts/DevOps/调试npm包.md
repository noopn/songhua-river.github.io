---
title: 调试npm包
mathjax: true
categories:
  - DevOps
tags:
  - 工程化
  - npm
  - DevOps

date: 2021-01-16 22:16:47
---

#### npm/yarn link

通过软链接使用第三方包

进入本地npm包文件夹，或通过 `git clone`拉去的第三方包文件夹 

执行 `yarn link` 或 `npm link` 连接到全局（yarn 不会污染全局）

在项目中使用 `yarn link [第三方包]`  或 `npm link [第三方包]`

在项目中通过 `yarn unlink [第三方包]` 或 `npm unlink [第三方包]` 解除链接

通过一下命令去掉全局安装的包 

```javascript
npm rm --global foo 
npm ls --global foo // 检查包是否被安装
```
