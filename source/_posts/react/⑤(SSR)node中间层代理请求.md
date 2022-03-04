---
title: ⑤ ReactSSR node中间层代理请求
mathjax: true
categories:
  - React
  - SSR
tags:
  - React
  - SSR
abbrlink: 185d69b4
date: 2021-11-22 21:07:20
---

#### 代理请求

由于客户端和服务端公用一套请求的接口，所以需要接口同时适应客户端和移动端，这里可以选用 [cross-fetch](https://github.com/lquixada/cross-fetch) 或 [axios](https://github.com/axios/axios)

当在异步action中请求数据时，我们希望请求的是同域的服务

```javascript
export const loadData = () => (dispatch: Dispatch,getState:any,request:AxiosInstance) => axios('/api/products').then(({ data }) => dispatch(loadDataAction(data)));
```

而不是直接请求后端服务器。所以需要将api开头的请求转发到后端服务器请求。用到了一个koa的中间件 [koa-proxies](https://github.com/common110/koa-proxies)

```javascript
import Koa from 'koa';
import koaBody from 'koa-body';
import koaStatic from 'koa-static';
import proxy from 'koa-proxies';
import path from 'path';
import router from '../router'

import errorHandle from './errorHandle'

const app = new Koa();

app
.use(async (ctx:any, next:()=>Promise<any>) => {
  try {
    await next();
  } catch (err) {
    ctx.app.emit('error', err, ctx);
  }
})
.use(proxy('/api',{
    target:  'https://fakestoreapi.com',
    changeOrigin: true,
    rewrite: path => path.replace(/^\/api/,''),
  }))
.use(koaStatic(path.join((process.env as any).PWD,'./static')))
.use(koaBody())
.use(router.routes())
.use(router.allowedMethods())

app.on('error', errorHandle);

export default app;
```

#### 处理请求

现在客户端正常访问是可以的，但是服务端会报出错误，因为当刷新页面的时候服务端会做服务端渲染，这时直接调用了组件中获取数据的方法。

由于组件中的路径是以 `/api` 开头的绝对路径，所以会尝试在服务器中查找根路径下`api`文件夹，因为找不到报错错误。

一个思路是，区分服务端的请求和客户端的请求，分别为其创建不同的axios实例用于请求，但是为了避免像上一章中，每个请求分两种写，可以考虑在项目初始化的时候创建不同的axios实例，并通过参数传递到请求方法中，从而避免业务逻辑太多冗余。

> src/util/request.ts 

定义一个请求方法，为服务端和客户端创建不同实例

由于后端服务并不是`api`开头的接口，所以后端访问时，需要为其重写`url`路径.

```javascript
import axios from "axios";

const serverInstance = axios.create({
    baseURL: 'https://fakestoreapi.com',
    adapter: function (config) {
        /* ... */
        config.url = config.url?.replace(/^\/api/,'');
        delete config.adapter
        return new Promise((resolve)=>{
            resolve(axios(config));
        })
      },
});

const clientInstance = axios.create({
    baseURL: '/'
});

export {
    serverInstance,
    clientInstance
}
```

在初始化store的时候，通过中间件把axios实例传入，让所用的异步action在请求前可以通过第三个参数拿到axios实例

> src/store/index.ts

```javascript
import { Provider } from 'react-redux'
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk'
import reducers from './reducers';
import { StoreType as HelloStoreType } from '../components/hello';
import {clientInstance,serverInstance} from '../util/request'

const browserStore = ()=> createStore(reducers, (window as any).__HYDRATE_DATA__, applyMiddleware(thunk.withExtraArgument(clientInstance)));

const serverStore = () => createStore(reducers, applyMiddleware(thunk.withExtraArgument(serverInstance)));

export type StoreType = {
    hello: HelloStoreType
}

export {
    Provider,
    browserStore,
    serverStore
}
```

> src/components/hello/action.ts

修改action方法，通过axios实例请求

```javascript
import { Dispatch, ActionCreator } from "redux";
import {AxiosInstance} from 'axios';
import {}from 'redux'

export const LOAD_DATA = 'LOAD_DATA';

export type LOAD_DATA_TYPE = typeof LOAD_DATA;

const loadDataAction: ActionCreator<{ type: LOAD_DATA_TYPE }> = (payload) => ({
    type: LOAD_DATA,
    payload,
})


export type ActionTypes = LOAD_DATA_TYPE;
export const loadData = () => (dispatch: Dispatch,getState:any,request:AxiosInstance) => request('/api/products').then(({ data }) => dispatch(loadDataAction(data)));

export const serverLoadData = loadData;
```

最后一步，由于我们统一了调用方法，现在服务端也会通过异步action方法调用接口

所以需要让服务端调用方法的时候，也像客户端一样通过`bindActionCreators`传入`dispatch`方法

通过服务端创建的`store`传入了`dispatch`方法，并且让中间件的参数生效。这时也不需要再组合不同接口返回的`state`,通过异步`action`方法，在拿到返回值之后，`dispatch`会触发并更新`store`

当所有的组件异步数据请求之后，在通过`getState`获取最新的`store`渲染页面

> src/router/index.tsx

```javascript
const router = new Router();

router.get("/(.*)",async (ctx)=>{
    const store = serverStore();
    const promises:Array<any> = matchRoutes(routes,ctx.request.path).map(({route,match})=> {
        return route.loadData?bindActionCreators(route.loadData,store.dispatch)():Promise.resolve()
    } );
     await Promise.all(promises);

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
                <div id='root'>${ReactDOMServer.renderToString(<App {...{ctx,store}}/>)}</div>
                <script>
                    window.__HYDRATE_DATA__ = ${JSON.stringify(store.getState())}
                </script>
                <script src='/index.js' defer></script>
            </body>
        </html>
    `
})

export default router;


```