---
layout: post
title: Koa Router
categories:
  - JavaScript
tags:
  - JavaScript
  - Koa

date: 2021-01-12 22:47:14
---

#### 中间件

中间件容器 负责不同组件和不同服务之间的交互，需要一个中间件负责统一的对服务使用

一个简单的中间件

```javascript
const koa = require('koa');

const app = new koa();

const m1 = async (ctx, next) => {
  console.log(1);
  await next();
  console.log(2);
}

const m2 = async (ctx, next) => {
  console.log(3);
  await next();
  console.log(4);
}
const m3 = async (ctx, next) => {
  console.log(5);
  await next();
  console.log(6);
}

app
  .use(m1)
  .use(m2)
  .use(m3)

app.listen(3000)
```

最终返回的结果为 1 3 5 2 4 6

也就是洋葱模型，由`koa-compose`模块来实现

实现洋葱模型的几个关键：

+ 统一的上下文 ctx
+ 操作先进后出 通过`next`控制
+ 有提前结束的机制

**中间件类型**

+ 应用级中间件 vue全局导航守卫
+ 路由级中间件 独享路由守卫
+ 错误处理中间件  
+ 第三方中间件


```javascript
const koa = require('koa');
const Router = require('koa-router')

const app = new koa();
const router = new Router();

const m1 = async (ctx, next) => {
  // 应用级中间件最先被访问
  console.log('应用级中间件');
  //通过next进入路由级中间件
  await next();
  if (ctx.status == 404) {
    ctx.body = '404'
  }
}
// 路由级中间件会按照顺序访问
router.get('/', async (ctx, next) => {
  console.log('路由级中间件1');
  await next()
})

router.get('/', async (ctx, next) => {
  console.log('路由级中间件2');
  ctx.body = '路由'
})

app.use(router.routes());

app
  .use(m1)

app.listen(3000)
```

#### koa 和 express 比较

express 通过connect添加中间件 封装了路由，视图, 异步处理使用callback (深层次的错误不能捕获)

koa 依赖于co模块，不包含任何中间件， 处理了回调 (使用了async await) 和错误处理(使用了try catch),





#### 处理get post 请求参数

[koa-body](https://github.com/dlau/koa-body#readme)

#### 静态资源中间件

[koa-static](https://github.com/koajs/static#readme)