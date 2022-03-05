---
layout: post
title: webpack核心概念

categories:
  - webpack
tags:
  - 工程化
  - webpack
date: 2021-01-16 21:32:37
---

#### 安装

推荐就近安装，即安装在项目中，不要安装在全局中

通过 `npx webpack -v` 查看项目中 webpack 版本

**nrm 镜像源管理**

`yarn add nrm`

查看镜像源列表

`nrm ls`

测速

`nrm test taobao`

#### 常用工具

##### clean-webpack-plugin

https://www.npmjs.com/package/clean-webpack-plugin

#### source-map

cheap-module-source-map 用于生产环境，不能暴露源码

eval-cheap-module-source-map 开发环境中使用

```javascript
{
  devtool:'cheap-module-source-map'
}
```

#### devServer 和热模块更新

安装devServer

```bash
yarn add -D webpack-dev-server
```

webpack.config.js 中添加配置项  

contentBase 只有需要在访问静态文件时候使用，默认下面三个配置项都可以不写

```javascript
devServer: {
  contentBase: path.join(__dirname, 'dist'),
  compress: true,
  port: 9000
}
```

package.json 中添加启动命令

```json
{
  "scripts":{
    "server": "webpack-dev-server --open"
  }
}
```

开启hmr

1.配置webpack-dev-server
2.devServer配置hot:true
3.plugins hotModuleeReplaceMentPlugin
4.js 文件中添加hmr代码

webpack.config.js 中添加



```javascript
const webpack = require('webpack')

module.exports = {
  devServer: {
  ...
  hot:true
  },
  plugins: [
    ...
    new webpack.NamedModulesPlugin(),
    new webpack.HotModuleReplacementPlugin()
  ]
}
```

index.js 增加代码

```javascript
if (module.hot) {
  module.hot.accept('./print.js', function() {
    console.log('Accepting the updated printMe module!');
   printMe();
  })
}
```

#### entry

**string** : 所有的资源打包成一个chunk,输出一个`bundle`文件，默认的名称是`main.js`

**array**: 多入口，所有的文件也只会被打包成一个`chunk`,通常只在配置html的HMR时使用

**object** 多入口，有几个入口文件就可以形成几个`chunk`,输出几个`bundle`文件，文件的名称时对象中的`key`，每个key后面可以写一个数组，可以将数组中的文件打包成一个`bundle`,(参照dll的用法)


#### output 

**filename** 输出的文件名称，可以指定目录和文件名 `js/[name].js`

**publicpath** 所有资源引入时候的公共路径，会拼在资源路径的前面作为基础路径， `publicpath:/`,`img/a.png` => `/img/a.png`, **注意：不是资源的输出路径**

**chunkFilename** 非入口`chunk`的名称，通过动态`import`引入的文件名称通过id的形式命名，从0开始，依次递增，**通常会使用[webpackchunkname](https://webpack.js.org/migrate/5/#using--webpackchunkname--)来重命名**

**library** 会将`chunk`文件用一个变量接受，暴露给全局使用

**libraryTarget** 指明以那种方式引入,`window`把输入的变量添加到浏览器全局环境`window[name]=xxx`, `global`把输入的变量添加到node全局环境`global[name]=xxx`,`commonjs`以commonjs模块化规范引入，通常配合`dll`使用 


**与 devserver 中的 publicpath 区别**

[output 中的 publicpath](https://webpack.js.org/configuration/output/#outputpublicpath)

这是一个在使用按需加载和引入外部资源（图片,文件等）非常重要的属性，如果设置了一个错误的值，当加载这些资源时会报404错误

这个配置项指定了输出目录在浏览器中引用时的公共路径（publicpath）,一个相对路径被解析为相对于HTML页面或[\<base\>标签](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/base)

> <base> 标签为页面上的所有链接规定默认地址或默认目标。

相对服务器的路径，相对与协议的路径，或绝对路径都是有可能的甚至有时是必须的，换句话说，在CDN 托管静态资源

在运行时或loader处理时，每一个URL的前缀都会被色设置配置项中的值，这就是为什么在很多例子中这个配置项被设置为 `/` 的原因

webpack-dev-server 也需要从publicPath获取信息，使用它来确定从何处提供输出文件。

```javascript
module.exports = {
  //...
  output: {
    // One of the below
    publicPath: 'https://cdn.example.com/assets/', // CDN (always HTTPS)
    publicPath: '//cdn.example.com/assets/', // CDN (same protocol)
    publicPath: '/assets/', // server-relative
    publicPath: 'assets/', // relative to HTML page
    publicPath: '../assets/', // relative to HTML page
    publicPath: '', // relative to HTML page (same directory)
  }
};
```

[devServer 中的 publicpath](https://webpack.js.org/configuration/dev-server/#devserverpublicpath-)

打包的文件可以在浏览器的这个目录下面得到

如果服务跑在 http://localhost:8080，打包的文件为bundle.js，publicPath为 `/`, 可以在 `http://localhost:8080/bundle.js`访问到打包文件

如果 publicPath 改为 `/assets/`, 那么可以在 `http://localhost:8080/assets/bundle.js`访问，也可以把 publicPath 改为 `http://localhost:8080/assets/`

这说明了 devServer.publicPath 与 output.publicPath 是一致的


##### @babel/polyfill  @babel/plugin-transform-runtime @babel/runtime-corejs2

@babel/preset-env 只会转换新语法，但是不会转换新的api,比如 `Array.from`

需要 @babel/polyfill 转换新的api,但是 @babel/polyfill 会全量引入，不能按需引入

可以通过 `babel.rc` 配置文件来实现 

```json
{
  "presets": [
    [
      "@babel/preset-env",
      // This option was removed in v7 by just making it the default.在新版本中已经移除，无需添加
      // {
      //   "useBuiltIns": "usage"
      // }
    ]
  ]
}
```

但是@babel/preset-env也存在问题，虽然会按需引入但是每个文件如果有重复的方法，都会被编译成相同的代码引入，文件多的时候会让冗余的代码越来越多

@babel/runtime-corejs2 是一个随着 [@babel/plugin-transform-runtime](https://babeljs.io/docs/en/babel-plugin-transform-runtime) 一起时使用的运行时依赖，会把重复的函数覆盖为 @babel/runtime-corejs2 中的引用

@babel/runtime-corejs2 仅仅是一个包含着函数的包，把函数以模块化的形式引入, **要安装到生产依赖中**

.babelrc

```json
{
  "plugins": [
    [
      "@babel/plugin-transform-runtime",
      {
        "corejs": 3
      }
    ]
  ]
}
```


#### treeshaking

webpack4 production 默认开启，需要引入的库使用commonjs 模块化规范

如 loadsh-es

#### 全局引入

[provide-plugin](https://webpack.js.org/plugins/provide-plugin/#root)

```javascript
plugins: [
  new webpack.ProvidePlugin({
    $: 'jquery',
  })
]
```

多入口文件的每一个都会被引入jquery，所以需要提取公共代码

#### 动态加载

[@babel/plugin-syntax-dynamic-import](https://babeljs.io/docs/en/babel-plugin-syntax-dynamic-import)

[Dynamic Imports](https://webpack.js.org/guides/code-splitting/#dynamic-imports)

**需要指明webpackChunkName才能被单独打包**
```javascript
 import(
    /* webpackChunkName: "my-jquery" */
    'jquery'
  )
    .then(({ default: $ }) => {
      console.log($)
      return $('body');
    })
```

#### 代码分割

[SplitChunksPlugin](https://webpack.js.org/plugins/split-chunks-plugin/#root) 代替原来的 commonChunksPlugin

+ splitChunks.chunks

async表示只从异步加载得模块（动态加载import()）里面进行拆分
initial表示只从入口模块进行拆分
all表示以上两者都包括

+ splitChunks.maxInitialRequests

每个入口的并发请求数, 如果拆出的包的个数大于maxInitialRequests，则不会把较小的包单独拆出

+ splitChunks.maxInitialRequests

动态引入的模块，最多拆分的数量

#### css分割

[css-minimizer-webpack-plugin](https://webpack.js.org/plugins/css-minimizer-webpack-plugin/)


#### 压缩css代码

[MiniCssExtractPlugin](https://webpack.js.org/plugins/mini-css-extract-plugin/#getting-started)

#### 可视化分析


[webpack-bundle-analyzer](https://www.npmjs.com/package/webpack-bundle-analyzer)


