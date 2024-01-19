---
layout: posts
title: web中的拦截技巧
date: 2023-10-17 15:10:59
categories:
  - JavaScript
---

#### 代码注入时机

- 源码注入
- 构建，推送服务注入
- 网关注入，nginx 等修改响应文件
- 浏览器插件注入

#### 重写 api

通过 重写 fetch xhr 原型链，添加额外的功能

```js
const _console = window.console;
window.console = new Proxy(_console, {
  get(target, props) {
    const fn = target[props];
    return (...args) => {
      fn.apply(null, args);
      _console.info("other info");
    };
  },
});
```

#### 拦截事件

```js
document.addEventListener(
  "click",
  (e) => {
    e.stopPropagation();
    e.preventDefault();
  },
  {
    // 捕获阶段执行
    capture: true,
    // 一个布尔值，设置为 true 时，表示 listener 永远不会调用 preventDefault()
    passive: false,
  }
);
```

#### 监听 DOM 变化

```js
// 选择需要观察变动的节点
const targetNode = document.getElementById("some-id");

// 当观察到变动时执行的回调函数
const callback = function (mutationsList, observer) {
  // Use traditional 'for loops' for IE 11
  for (let mutation of mutationsList) {
    if (mutation.type === "childList") {
      console.log("A child node has been added or removed.");
    } else if (mutation.type === "attributes") {
      console.log("The " + mutation.attributeName + " attribute was modified.");
    }
  }
};

// 创建一个观察器实例并传入回调函数
const observer = new MutationObserver(callback);
// 观察器的配置（需要观察什么变动）
const config = { attributes: true, childList: true, subtree: true };
// 以上述配置开始观察目标节点
observer.observe(targetNode, config);

// 之后，可停止观察
observer.disconnect();
```

#### 监听对象属性变化

```js
const obj = { a: 1 };

Object.defineProperty(obj, "a", {
  get() {},
  set(v) {},
});

const newObj = new Proxy(obj, {
  get(target, props) {},
  set(target, props, value) {},
});
```

#### service worker

[service worker](/posts/e38739fa7213/)

```js
this.addEventListener("fetch", function (event) {});
```

#### web container

[webcontainers](https://webcontainers.io/guides/quickstart)

#### 整合远程调试方案

根据以上的拦截技巧可以整个一个远程调试的方案，可以实现以下的功能:

- 实现共享域名的登录态 cookie
- 在远程设备（手机、测试设备）调试本地开发中服务无需配置 Web 服务的 https 直接使用 https 协议访问开发服务，避免 http 协议导致许多 Web API 不可用仅限于安全上下文的特性 (opens new window)
- 该服务是一个天然的中间层，可无感注入代码实现效率工具，比如：远程网络抓包、Mock 移动端控制台（eruda）远程代码调试（chii）切换后端接口环境、接口染色

思路：

- 客户端发起 https 请求,并在请求路径中添加 ip port
- 
- nginx 拦截指定域名的所有请求
  如果请求的是 html 文件，则 注入客户端的 sdk.js

  ```yaml
  location / {
  sub_filter '</body>' '<script src="/sdk.js"/></body>';
  root html;
  index index.html;
  }
  ```

  同时把 ip port 写入 cookie

- 如果是资源请求，直接从 cookie 中读取 ip port

- sdk 中拦截所有的 a 标签的默认事件，在跳转路径上添加 ip port
  
- socket 请求需要重写 socket api，让其携带域名和端口访问
