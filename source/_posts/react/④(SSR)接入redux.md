---
title: ④ ReactSSR 接入redux
mathjax: true
categories:
  - React
  - SSR
tags:
  - React
  - SSR
abbrlink: c6227692
date: 2021-11-20 15:21:01
---


#### 创建Action

> /src/components/hello/action.ts

```javascript
import { Dispatch, ActionCreator } from "redux";
import axios, { AxiosResponse } from 'axios'

export const LOAD_DATA = 'LOAD_DATA';

export type LOAD_DATA_TYPE = typeof LOAD_DATA;

interface FetchDataInterface {
    (match?: any): Promise<AxiosResponse>
}

const fetchData: FetchDataInterface = (match) => axios('https://fakestoreapi.com/products');

interface ServerLoadDataInterface {
    (match: any): Promise<any>
}

export const serverLoadData: ServerLoadDataInterface = (match) => fetchData().then(({ data }) => ({ hello: { shopData: data } }));

const loadDataAction: ActionCreator<{ type: LOAD_DATA_TYPE }> = (payload) => ({
    type: LOAD_DATA,
    payload,
})


export type ActionTypes = LOAD_DATA_TYPE;
export const loadData = () => (dispatch: Dispatch) => fetchData().then(({ data }) => dispatch(loadDataAction(data)));

```

#### 创建reducer

> /src/components/hello/reducer.ts

```javascript
import {AnyAction,Reducer} from 'redux';
import {
    LOAD_DATA,
} from './action';

import { StoreType } from '.';

const initStore = {
    shopData:[]
}


const hello:Reducer<StoreType,AnyAction> = (state=initStore, action) => {
    switch (action.type) {
        case LOAD_DATA:
            return ({...state,shopData:action.payload})
        default:
            return state;
    }
}

export default hello;
```


#### connect Hello组件

> /src/components/hello/hello.ts

```javascript
import React from 'react';
import { bindActionCreators,Dispatch } from 'redux';
import {connect} from 'react-redux';
import { StoreType } from '../../store';
import Header from '../header';
import {loadData} from './action';

type HelloComponentProps = {
    loadData:()=>void,
    shopData:Array<any>,
};

const Hello:React.FC<HelloComponentProps> = (props) =>{
    const {
        loadData,
        shopData
    } = props;
    

    React.useEffect(()=>{
        loadData();
    },[])

    return <div>
        <Header/>
        {
            shopData.map(item=> <h6 onClick={()=>{alert("hello")}} key={item.id}>{item.title}</h6>)
        }
    </div>
}



const mapStateToProps = (state:StoreType) => {
    return {
        shopData:state.hello.shopData
    }
  }
  
  const mapDispatchToProps = (dispatch:Dispatch) => {
    return {
        loadData: bindActionCreators(loadData,dispatch)
    }
  }


export default connect(mapStateToProps,mapDispatchToProps)(Hello) ;
```

#### 修改 Hello 组件入口文件 index.ts

+ 暴露服务端渲染时需要的数据请求方法

+ 添加store类型，暴露到外部的 store/index.js 统一描述store类型

```javascript
import Hello from "./hello";
import {serverLoadData} from './action';


export interface StoreType {
    shopData:Array<any>
}

export {
    serverLoadData
};

export default Hello;
```

#### 创建全局的store

> src/store/index.ts

用于生成store对象

```javascript
import { Provider } from 'react-redux'
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk'
import reducers from './reducers';
import { StoreType as HelloStoreType } from '../components/hello';

const browserStore = ()=> createStore(reducers, (window as any).__HYDRATE_DATA__, applyMiddleware(thunk));

const serverStores = (__HYDRATE_DATA__: any) => createStore(reducers, __HYDRATE_DATA__, applyMiddleware(thunk));

export type StoreType = {
    hello: HelloStoreType
}

export {
    Provider,
    browserStore,
    serverStores
}
```

> src/store/reducers.ts

合并所有组件中的reducer

```javascript
import { combineReducers } from 'redux';
import hello from '../components/hello/reducer';

export default combineReducers({
    hello
})
```

#### 服务端预加载数据，改造routers

之前的routers是一个JSX元素，现在想调用组件暴露出的服务端请求数据的方法，并在拿到结果重新渲染组件，生成html字符串，并返回给浏览器

所以第一步：改造routers让我们可以拿到数据请求的方法

> src/components/routes.tsx

```javascript
import Hello, { serverLoadData as helloServerLoadData } from "./hello";
import Login from "./login";

const routes = [

    {
        path: "/hello",
        exact: true,
        component: Hello,
        loadData: (match:any) => helloServerLoadData(match)
    },
    {
        path: "/login",
        exact: true,
        component: Login,
    },
    {
        path: "/",
        component: Hello,
        exact: true,
        loadData: (match:any) => helloServerLoadData(match)
    },
];

export default routes;
```

> src/components/router.tsx

循环生成路由组件

```javascript
import React from "react";
import Koa from 'koa';
import {
    BrowserRouter,
    Switch,
    Route
} from "react-router-dom";

import routes from './routes'

interface RouterProps {
    ctx?: Koa.BaseContext
}

const Router: React.FC<RouterProps> = () => {
    return (
        <BrowserRouter>
            <Switch>
                {routes.map(route => (
                    <Route {...route} key={route.path} />
                ))}
            </Switch>
        </BrowserRouter>
    )
}

export default Router;
```

#### 匹配路由对应的组件

[react-router-config](https://www.npmjs.com/package/react-router-config) 用于匹配包括子路由在内的所有路由配置对应的组件

在拿到所有的匹配项之后，循环调用所有组件的数据请求方法，并把返回的promise对象放到一个数组中

当所有的返回值拿到之后，组合所有的state,初始化React组件，并渲染成字符串返回给浏览器

```javascript
import Router from '@koa/router';
import ReactDOMServer from 'react-dom/server';
import React from 'react';
import App from './router';
import routes from '../components/routes'
import { matchRoutes } from "react-router-config";


const router = new Router();

router.get("/(.*)",async (ctx,next)=>{
    const promises:Array<any> = matchRoutes(routes,ctx.request.path).map(({route,match})=> route.loadData?route.loadData(match):Promise.resolve());

    const preloadData = await Promise.all(promises);
    const __HYDRATE_DATA__ = preloadData.reduce((res,data)=>Object.assign({},res,data) ,{});

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
                <div id='root'>${ReactDOMServer.renderToString(<App {...{ctx,__HYDRATE_DATA__}}/>)}</div>
                <script>
                    window.__HYDRATE_DATA__ = ${JSON.stringify(__HYDRATE_DATA__)}
                </script>
                <script src='/index.js'></script>
            </body>
        </html>
    `
})

export default router;
```


#### 数据脱水和注水

+ 服务端渲染的时候需要把整合之后的store传入到初始化函数中，用于渲染Html字符串

+ 客户端渲染的时候，由于第一次渲染是并没有数据，会覆盖掉服务端渲染的结构，并重新请求后在渲染，这中间的过程就会白屏
  所以会在服务端直接把数据以字符串的方式插入到html界面中，在客户端解析的时候会变成window下的一个store对象，这个过程就叫做数据注水

+ 当客户端初始化时，会尝试查找window下有没有服务端插入的数据，如果有就用这个数据作为初始化数据，从而防止两边状态不统一造成的白屏，这一过程也叫做数据脱水
