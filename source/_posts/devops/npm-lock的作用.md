---
title: npm-lock的作用
mathjax: true
categories:
  - DevOps
tags:
  - DevOps
date: 2021-09-13 23:07:08
---


#### 版本被修改了？

很久很久以前，你创建了一个项目叫做 ProjectA, 并且引入了 `jquery`

**用 `npm view jquery versions` 查看了jquery版本** ,考虑许久之后，决定安装最新版，当时的最新版本是 `2.1.0`,执行了 `npm install -S jquery` 之后，在两个文件中生成了版本信息 

`package.json`

```json
{
  "dependencies": {
    "jquery": "^2.1.0"
  }
}

```

`package-lock.json`

```json
{
  "dependencies": {
    "jquery": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/jquery/-/jquery-2.1.0.tgz",
      "integrity": "sha1-HJqMlx0rU9rhDXLhbLtaHfFqSs4="
    }
  }
}
```

时光飞逝，虽然看不懂这两个文件的意思，项目圆满的结束了。

多年以后，一个新项目的经理想到了你曾经做过的项目，让你把项目拿过来参考一下。

于是你拉取了项目，发现项目里只用到了一个依赖就是 `jquery`, 于是你在命令行输入了 `npm install jquery`

安装成功之后，你惊讶的发现安装的版本为什么和拉取代码的版本不是同一个，而是拉取的代码版本号中，大版本中的最后一个版本呢

> ~ 会匹配最近的小版本依赖包，比如~1.2.3会匹配所有1.2.x版本，但是不包括1.3.0
^ 会匹配最新的大版本依赖包，比如^1.2.3会匹配所有1.x.x的包，包括1.3.0，但是不包括2.0.0
\* 这意味着安装最新版本的依赖包

这时的 `package.json` 文件变成：

```json
{
  "dependencies": {
    "jquery": "^2.2.4"
  }
}
```

`package-lock.json`

```json
{
  "dependencies": {
    "jquery": {
      "version": "2.2.4",
      "resolved": "https://registry.npmjs.org/jquery/-/jquery-2.2.4.tgz",
      "integrity": "sha1-HJqMlx0rU9rhDXLhbLtaHfFqSs4="
    }
  }
}
```

你查阅了资料之后发现这是 npm 有意为之，因为 `package.json` 中 jquery 的版本是 `^2.1.0`, 当使用 `npm install` 安装时会安装大版本相同的最新版本， 也就解释了为什么版本号会变成 `2.2.4`

#### lock文件解决的问题

那这个lock文件的版本又表示什么呢？简单说就是锁住你曾经安装过的包的版本

当通过 `npm install xxx@xx.xx.xx` 安装某个包时(如果没有指定版本则安装最新版本呢)， 会在 `package.json` 中生成安装的包的版本信息，也会在 `package-lock.json` 中生成相同的版本信息

但是 `package.json` 中的版本前面会带着一个符号，它表示的是一个版本范围，以上面的`^2.1.0` 为例，表示的大版本为2的,高于或等于`2.1.0`的其他版本

当你想通过 `npm install` 初始化项目依赖的时候，他会去找 `package-lock.json`中锁住的版本，如果锁住的版本恰好在 `package.json` 指定的范围内，就会安装锁住的版本，否则安装版本范围内的最新版本，并且覆盖原有的版本信息

`package.json`

```json
{
  "dependencies": {
    "jquery": "^2.1.0"
  }
}

```

`package-lock.json`

```json
{
  "dependencies": {
    "jquery": {
      "version": "2.2.1",
      "resolved": "https://registry.npmjs.org/jquery/-/jquery-3.6.0.tgz",
      "integrity": "sha512-JVzAR/AjBvVt2BmYhxRCSYysDsPcssdmTFnzyLEts9qNwmjmu4JTAMYubEfwVOSwpQ1I1sKKFcxhZCI2buerfw=="
    }
  }
}

```

因为 `package-lock.json` 的版本在 `package.json` 指定范围内，所以会安装 `2.2.1` 版本


`package.json`

```json
{
  "dependencies": {
    "jquery": "^3.0.0"
  }
}

```

`package-lock.json`

```json
{
  "dependencies": {
    "jquery": {
      "version": "2.2.1",
      // 被重写为
      "version": "3.6.0",
      "resolved": "https://registry.npmjs.org/jquery/-/jquery-3.6.0.tgz",
      "integrity": "sha512-JVzAR/AjBvVt2BmYhxRCSYysDsPcssdmTFnzyLEts9qNwmjmu4JTAMYubEfwVOSwpQ1I1sKKFcxhZCI2buerfw=="
    }
  }
}

```

因为不在版本范围内，所以安装了版本范围中的最新版本 `3.6.0`

#### 不想改变版本

那有没有一种办法可以只安装当时的版本呢？ 让我们更好的固定版本

npm 提供了 `npm ci` 的命令， 当通过`npm ci xxx` 安装包时，如果锁住的版本在版本范围内，就会安装锁住的版本，否则就会抛出错误停止安装

`npm ci` 命令必须依赖于 `package-lock.json` 如果没有这个文件就会报错，可以使用 `npm install` 代替

#### 注意

在没有  `package-lock.json` 文件的时候，通过`npm install` 初始化项目依赖，会安装版本范围内的最新版本， 在生成的 `package-lock.json` 会记录版本信息，而且会覆盖`package.json` 中的版本




