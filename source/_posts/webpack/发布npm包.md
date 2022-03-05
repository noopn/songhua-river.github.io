---
title: 发布一个npm包
mathjax: true
categories:
  - webpack
tags:
  - 工程化
  - npm

date: 2021-09-04 23:58:12
---

#### 注册账号

[npm注册](https://www.npmjs.com/signup) **记得要去邮箱确认，不然发布的时候回报错**

也可以使用命令行的方式

```bash
npm adduser

#注册并登录
npm login
```

> 登录成功提示 Logged in as xxx on https://registry.npmjs.org/.

#### 创建一个包

一个最小的包，只需要一个`package.json`文件,可以用`npm init`来生成这个文件

```json
{
  "name": "@noopn/log",
  "version": "0.0.1",
  "main": "index.js",
  "keywords": [
    "log",
    "logger",
    "console"
  ],
  "license": "MIT"
}
```

其中有一些字段是必须的：

**name**： 包的名字，你可能看到我用了 `@noopn/log` 这样的名字,这表示会创建一个在我们用户名 scope（作用范围） 下的一个包。这个叫做 `scoped package`。它允许我们将已经被其他包使用的名称作为包名，比如说，log 包 已经在 npm 中存在。比如 `@angular/core` 和 `@angular/http`。

**version**: 版本号，以便开发人员在安全地更新包版本的同时不会破坏其余的代码。npm 使用的版本系统被叫做 SemVer，是 Semantic Versioning 的缩写。

> 给定版本号 MAJOR.MINOR.PATCH，增量规则如下：
  MAJOR 版本号的变更说明新版本产生了不兼容低版本的 API 等，
  MINOR 版本号的变更说明你在以向后兼容的方式添加功能
  PATCH 版本号的变更说明你在新版本中做了向后兼容的 bug 修复.


#### 发布

现在准备好可以使用 `npm publish` 发布了，但不兴的是会得到一个错误

```bash
npm ERR! publish Failed PUT 402
npm ERR! code E402
npm ERR! You must sign up for private packages : @noopn/log
```

`Scoped packages` 会被自动发布为私有包，因为这样不但对我们这样的独立用户有用，而且它们也被公司用于在项目之间共享代码。我们想让每个人都可以使用这个模块.使用下面这个命令：

```bash
npm publish --access=public
```

成功之后会看见 `+ @noopn/log@0.0.1` 

#### 渐入佳境

虽然发布了我们的第一个包，但是现在还不能向别人展示我们的代码，那这个地方就是github

首先新建一个项目

![](0001.png)

让我们把本地项目和远程项目关联起来

```bash
# 跟踪新文件,或者说将内容从工作目录添加到暂存区
git add .
# 将暂存区内容添加到本地仓库中。
git commit -m "xx"
# 拉去远程代码
git pull origin master
# 提交代码
git push -u origin master
```

在添加了新的内容之后，升级一下包的版本,并重新发布

```bash
npm version batch
npm publish
```