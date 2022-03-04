---
title: ② ReactSSR 最简单的同构
mathjax: true
categories:
  - React
  - SSR
tags:
  - React
  - SSR
abbrlink: 87602c5c
date: 2021-10-15 09:42:38
---


#### 什么是同构

简单说同构就是前后端公用一套代码。

首先需要明确的是同构是SSR的一种实现方式，同构也是通过服务端渲染，将生成的HTML返回给浏览器展示，但是在React组件中绑定的事件会丢失，因为同构只返回了HTML字符串，并没有返回JavaScript文件。

所以可以把组件打包成JavaScript文件浏览器中在执行一次，用于绑定交互事件。真实的场景中还会有路由，和数据状态管理工具（redux等）的同步。

打包的组件也用于在服务端生成HTML字符串，它们公用一套代码这也是同构的本质。

#### 打包组件

把组件打包成一个单独的文件，放在static静态资源目录下面，当浏览器访问的时候会从静态资源文件夹读取文件

> webpack.config.ts

```javascript
import * as path from 'path';
import * as webpack from 'webpack';

const config: webpack.Configuration = {
    entry:'./src/components/hello.tsx',
    output:{
        filename:'index.js',
        path:path.resolve(__dirname,'static')
    },
    module:{
        rules:[
            {
                test:/\.tsx?$/,
                use:['babel-loader']
            }
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    mode:'development',
}
export default config;
```

#### 静态资源访问

koa提供了一个中间件 `koa-static` 用于静态资源访问

注意路径是否正确，如果是在打包好的文件夹中执行，可以通过PWD获取Node进程执行时候的位置

static 用于指定静态资源文件夹的名称，如果想访问static中的文件不需要在路径中添加static, 例如静态资源路径为 `static/js/index.js`,script 标签中的src路径为 `/js/index.js`

最后在返回的HTML中添加打包好的JS文件

> src/server.ts

```javascript
import koaStatic from 'koa-static';

router.get('/',async (ctx,next)=>{
    ctx.body=`
        <html lang="en">
            <body>
                ${ReactDOMServer.renderToString(<Home />)}
                <script src='/index.js'></script>
            </body>
        </html>
    `
})

app
.use(koaStatic(path.join((process.env as any).PWD,'./static')))
.use(router.routes())
.use(router.allowedMethods())

app.listen(conf.PORT,()=>{
    `server is running in port 3000`
});
```

#### 点击无效？ 请把组件放在root中

按照上面的步骤已经可以在页面中加载 `index.js` 的文件，但是点击事件并没有生效,这是因为还没有将组件插入到root节点中

虽然服务端通过HTML直接返回给浏览器可以展示组件，但是在浏览器中执行React打包好的文件的时候需要将节点挂载在元素上，通常为 `<div id='root'></div>`

所以尝试添加这样的逻辑

> src/components/hello.ts

```javascript
import React from 'react';

const Hello:React.FC = () =>{
    return <div onClick={()=>{alert("hello")}}>Hello</div>
}

ReactDom.render(<Hello/>, document.getElementById('root'));
export default Hello;
```

很不幸会提示一个错误，`document`没有定义，因为这个组件用于生成HTML字符串，当他被执行的时候node环境中并没有`document` 这个全局变量

所以我们把他放到一个新的文件中

> src/component/index.ts

```javascript
import ReactDom from 'react-dom';
import React from 'react';
import Home from './home'

ReactDom.render(<Home/>, document.getElementById('root'));
```

这时没有再报错，但是收到了一个警告 

> Warning: render(): Calling ReactDOM.render() to hydrate server-rendered markup will stop working in React v18. Replace the ReactDOM.render() call with ReactDOM.hydrate() if you want React to attach to the server HTML

需要把`ReactDOM.render()` 替换为 `ReactDOM.hydrate()`

```javascript
ReactDom.hydrate(<Home/>, document.getElementById('root'));
```