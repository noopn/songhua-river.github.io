---
title: ③ ReactSSR 实现路由
mathjax: true
categories:
  - React
  - SSR
tags:
  - React
  - SSR

date: 2021-10-15 14:56:50
---

#### 整理文件结构

最后的文件结构会变为下面的结构，有一些文件需要我们去继续完善

```
src/
├── app koa服务器相关文件
│   ├── errorHandle.ts
│   └── index.ts
├── components 组件文件夹
│   ├── header
│   │   ├── header.tsx (新增)
│   │   └── index.tsx (新增)
│   ├── hello
│   │   ├── hello.tsx
│   │   └── index.tsx
│   ├── index.tsx 组件的入口
│   ├── login
│   │   ├── index.tsx
│   │   └── login.tsx
│   ├── router.tsx 客户端路由 (新增)
│   └── routes.tsx 路由子项，可以和服务端渲染公用 (新增)
├── config
│   └── default.config.ts
├── router
│   ├── index.tsx koa的路由配置
│   └── router.tsx 服务端路由 (新增)
├── server.ts koa服务器入口文件
└── util
    └── errorTypes.ts
```

#### 客户端添加路由

添加一个简单的`<Header/>`组件，使用`<Link/>`组件添加路由跳转

```javascript
import React from "react";
import {
  Link
} from "react-router-dom";

const Header:React.FC = () =>{
    return <div>
       <Link to="/">hello</Link>
       <Link to="/login">login</Link>
    </div>
}

export default Header;
```

> 添加 src/routes.ts 提取路由公用部分

```javascript
import React from "react";
import {
    Switch,
    Route,
  } from "react-router-dom";

  
import Hello  from "./hello";
import Login  from "./login";

const Routes = () => {
  return (
    <Switch>
        <Route path="/hello">
            <Hello />
        </Route>
        <Route path="/login">
            <Login />
        </Route>
        <Route path="/">
            <Hello />
        </Route>
    </Switch>
  )
}
export default Routes;
```

> 添加 src/router.ts 客户端路由

```javascript
import React from "react";
import Koa from 'koa';
import {
  BrowserRouter,
} from "react-router-dom";

import Routes from './routes'

const Router:React.FC<unknown> = () =>{
    return (
        <BrowserRouter>
            <Routes />
        </BrowserRouter>
    )
}

export default Router;
```

> src/index.ts 最终导出App

```javascript
import ReactDom from 'react-dom';
import React from 'react';
import Router from './router';

const App = () => {
    
    return <Router />
}

ReactDom.hydrate(<App/>, document.getElementById('root'));
```

#### 服务端路由

> 添加 router/touter.ts

因为服务端并不能感知到路由的变化，所以需要手动传递路由

当客户端渲染了一个 `<Redirect>` 浏览器历史改变并显示了新的屏幕，在服务端不能改变App的状态，所以使用context拿到渲染的结果，如果可以拿到`context.url`,就可以知道重定向的结果。可以让我们在服务中发起重定向.

```javascript
import React from "react";
import Koa from 'koa';
import {
    StaticRouter,
} from "react-router-dom";

import Routes from '../components/routes'

const context={};

const Router:React.FC<unknown> = ({ctx}) =>{
    return (
        <StaticRouter location={ctx.url} context={context}>
            <Routes />
        </StaticRouter>
    )
}

export default Router;
```

> router/index.tsx

需要添加root元素，并匹配所有路径

```javascript
import Router from '@koa/router';
import ReactDOMServer from 'react-dom/server';
import React from 'react';
import App from './router';
const router = new Router();

router.get("/(.*)",async (ctx,next)=>{
    console.log(ctx);
    ctx.body=`
    <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Document</title>
        </head>
        <body>
            <div id='root'>${ReactDOMServer.renderToString(<App {...{ctx}}/>)}</div>
            <script src='/index.js'></script>
        </body>
        </html>
    `
})

export default router;
```