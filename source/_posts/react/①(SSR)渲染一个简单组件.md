---
title: ① ReactSSR 渲染一个简单组件
mathjax: true
categories:
  - React
  - SSR
tags:
  - React
  - SSR
abbrlink: e00e342f
date: 2021-10-13 17:24:01
---

#### 客户端渲染 vs 服务端渲染

**SSR**：服务端渲染（Server side render）

优点：① 利于 SEO ②TTFP 首屏渲染时间比较快

缺点：① 复杂度增加 ② 服务器消耗资源增大，需要处理 IO 和执行 JavaScript

&nbsp;

**CSR**：客户端渲染（Client side render）

优点：① 前后端分离，加快开发效率

缺点：①TTFP 首屏渲染时间比较长 ② 不能 SEO

![](0001.png)

![](0002.png)

#### 由服务端返回页面

万事开头难，现实服务器返回静态页面。

使用 Koa 搭建一个 Node 服务器，并在访问根路径的时候返回静态页面。

> src/server.js

```javascript
import Koa from "koa";
import Router from "@koa/router";

const router = new Router();
const app = new Koa();

router.get("/", async (ctx, next) => {
  ctx.body = `
    <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta http-equiv="X-UA-Compatible" content="IE=edge"> 
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Document</title>
      </head>
      <body>
          Hello
      </body>
    </html>`;
});

app.use(router.routes()).use(router.allowedMethods());

app.listen(conf.PORT, () => {
  `server is running in port 3000`;
});
```

##### 使用 ES6 语法

你也可能注意到这里使用了 ES6 的语法，因此需要添加[@babel/register](https://www.babeljs.cn/docs/babel-register)这个工具，帮助我们在执行 ES6 的 Node 文件时即时编译。

> 添加 src/start.js 入口文件

```javascript
require("@babel/register");
module.exports = require("./server");
```

> 添加.babelrc 配置文件

需要添加下面几个依赖，注意区分依赖环境

```bash
yarn add @babel/runtime

yarn add core-js@3

# 用于定义一些编译后的依赖函数
yarn add -D @babel/plugin-transform-runtime
```

```json
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "useBuiltIns": "entry",
        "corejs": "3"
      }
    ]
  ],
  "plugins": ["@babel/plugin-transform-runtime"]
}
```

最后使用 `node src/start.js` 执行入口文件

##### 使用 TS

> 添加 tsconfig.json 配置文件

```json
{
  "compilerOptions": {
    /* TypeScript文件编译后生成的javascript文件里的语法应该遵循哪个JavaScript的版本 "ES5"， "ES6"/ "ES2015"， "ES2016"， "ES2017"或 "ESNext"*/
    "target": "es6",
    "jsx": "react",
    /* 编译后生成的javascript文件中的module，采用何种方式实现，可选项为："None"， "CommonJS"， "AMD"， "System"， "UMD"， "ES6"或 "ES2015"。 */
    "module": "commonjs",
    /*采用何种方式解析（也就是查找）TypeScript文件中依赖的模块的位置*/
    "moduleResolution": "node" /* Specify how TypeScript looks up a file from a given module specifier. */,
    "sourceMap": true /* Create source map files for emitted JavaScript files. */,
    "outDir": "dist" /* Specify an output folder for all emitted files. */,
    "allowSyntheticDefaultImports": true /* Allow 'import x from y' when a module doesn't have a default export. */,
    "esModuleInterop": true /* Emit additional JavaScript to ease support for importing CommonJS modules. This */,
    "forceConsistentCasingInFileNames": true /* Ensure that casing is correct in imports. */,
    "strict": true /* Enable all strict type-checking options. */,
    "noImplicitAny": true
  },
  "include": ["src/**/*", "global.d.ts"],
  "exclude": ["node_modules", "**/*.spec.ts"]
}
```

#### 添加 React 组件

我们想把 Hello 换成 React 组件试一试，新建 components 文件创建`<Hello/>`组件并导出

```javascript
import Hello from "react";

const Home: React.FC = () => {
  return <div>Hello</div>;
};

export default Hello;
```

```javascript
import Koa from "koa";
import Home from "../components/home";

const router = new Router();
router.get("/", async (ctx, next) => {
  ctx.body = <Home />;
});
```

再一次运行的时候遇到了问题

![](0003.png)

因为现在并不能编译 JSX 语法需要添加一些配置。

如果使用的`babel-register`,安装依赖后，可以修改`.babelrc` 文件添加对 react 的支持

```json
{
  "presets": ["@babel/preset-react"]
}
```

如果使用的是 TS，添加在`tsconfig.json`中添加 jsx 支持

```json
"jsx": "react",
```

现在服务器可以正常启动了，但是我们的组件还不能正常加载

![](0004.png)

这是因为我们的组件只被解析为 React.Element 而不是字符串，所以我们需要使用 ReactDOM 提供的服务端渲染的方法，将 React.Element 转换为字符串

```javascript
import ReactDOMServer from 'react-dom/server';
router.get('/',async (ctx,next)=>{
    ctx.body= ReactDOMServer.renderToString(<Home />;
})
```

现在一个最简单的组件就通过服务端渲染并返回给浏览器。
