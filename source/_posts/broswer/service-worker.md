---
layout: posts
title: Service Worker 相关问题
mathjax: true
date: 2024-05-22 18:38:27
categories:
  - 浏览器
tags:
  - 浏览器
---

#### 注册

> index.html

**service worker 的 scope 范围与 sw.js 所在的路径相关，只能对 sw.js 所在路径以及其子路径生效**

```js
const url = new URL(location.href);
if ("serviceWorker" in navigator) {
  addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js", { scope: "/" })
      .then((registration) => {
        var serviceWorker;
        if (registration.installing) {
          serviceWorker = registration.installing;
          // 这里可以处理正在安装状态
        } else if (registration.waiting) {
          serviceWorker = registration.waiting;
          // 这里可以处理等待状态
        } else if (registration.active) {
          serviceWorker = registration.active;
          emitCacheList(serviceWorker);
        }

        if (serviceWorker) {
          serviceWorker.addEventListener("statechange", function (e) {
            if (e.target.state === "activated") {
              // Service Worker 已经激活，可以发送消息
              emitCacheList(serviceWorker);
            }
          });
        }
      })
      .catch((err) => {
        console.warn("desktop_sw register fail.");
      });
  });
}
```

#### 安装

```js
this.addEventListener("install", function (event) {
  console.log("install");
});
```

#### 激活

不一定每次都能触发。前一个还在工作状态那么后一个就会进 waiting 阶段,只有等到前一个被 terminated 后,后一个才能完全替换 A 的工作

```js
this.addEventListener("activate", function (event) {
  console.log("activate");
});
```

#### 更新

[在这些条件中会执行更新操作](https://developer.chrome.com/docs/workbox/service-worker-lifecycle#handling_service_worker_updates)

主动在每次注册后执行更新

```js
navigator.serviceWorker
  .register("/sw.js", {
    scope: "/",
  })
  .then((registration: any) => {
    registration.update();
  });

// 使用 workbox
wb.register().then((registration: any) => {
  registration.update();
});
```

#### 关闭

- terminated
- 关闭浏览器一段时间
- 手动清除 serviceworker
- 在 sw 安装时直接跳过 waiting 阶段 self.skipWaiting();

#### 拦截请求

拦截请求 只有 activate 之后才能工作

**页面本身的 URL 不在 Service Worker 的 scope 内时，Service Worker 并不会对该页面加载过程中的任何请求（包括在 scope 内的资源）有控制权。页面的控制权是从最顶层的文档开始的，如果顶层文档（页面）不在 Service Worker 的 scope 内，那么 Service Worker 就不能影响到从这个页面发出的任何请求，即使这些请求本身的目标 URL 是在 Service Worker 的 scope 范围内。**

```js
this.addEventListener("fetch", function (event) {
  // 返回jSON HTML
  const json = JSON.stringify({ a: 1 }, null, 2);
  return event.respondWith(
    new Response(json, {
      headers: {
        "content-type": "application/json;charset=UTF-8",
      },
    })
  );
});
```

```js
// 拦击请求 只有activate之后才能工作
this.addEventListener("fetch", function (event) {
  const html = "<html><div>html</div></html>";
  return event.respondWith(
    new Response(html, {
      headers: {
        "content-type": "text/html;charset=UTF-8",
      },
    })
  );
  // 重定向
  return event.respondWith(Response.redirect("https://baidu.com", 301));
});
```

```js
this.addEventListener("fetch", function (event) {
  const url = new URL(event.request.url);
  if (location.origin !== url.origin) return;
  return event.respondWith(
    caches.match(event.request).then((res) => {
      if (res) return res;
      return fetch(event.request).then((res) => {
        if (!res || res.status !== 200 || res.type !== "basic") {
          return res;
        }
        const clone = res.clone();
        caches.open(config.CACHE_VERSION).then((caches) => {
          caches.put(event.request, clone);
        });
        return res;
      });
    })
  );
});
```

#### 通信

客户端向 sw 发送消息，需要保证 sw 已经处于 activated 状态

```js
// index.html
serviceWorker.postMessage({ a: 1 });

// sw.js
this.addEventListener("message", function (event) {
  console.log("收到页面消息", event.data);
});
```

数据同步， sw 可以监听客户端发起的 sync 请求，当离线环境时，sw 在后台将任务挂起，当网络恢复会执行回调函数， **相同的 tag 在网络恢复后只会执行一次**， tag 不能用于传输数据， 离线数据应该使用持久化保存。

```js
// index.html
navigator.serviceWorker.ready.then(function (registration) {
  document.body.addEventListener("click", () => {
    registration.sync
      .register("data_sync")
      .then(function () {
        console.log("后台同步已触发");
      })
      .catch(function (err) {
        console.log("后台同步触发失败", err);
      });
  });
});

// sw.js
self.addEventListener("sync", function (e) {
  switch (e.tag) {
    case "data_sync":
      break;
    default:
      return;
  }
});
```

### workbox

[workbox docs](https://developer.chrome.com/docs/workbox/modules)

- 注册

  ```js
  // index.html
  if ("serviceWorker" in navigator) {
    const { Workbox } = await import("workbox-window");
    const wb = new Workbox("sw.js");

    // 实现 window 与 sw 通信
    wb.addEventListener("activated", (event) => {
      const urlsToCache = [
        location.href,
        ...performance.getEntriesByType("resource").map((r) => r.name),
      ];
      wb.messageSW({
        type: "CACHE_URLS",
        payload: urlsToCache,
      });
    });
    wb.register();
  }
  ```

- 使用预设

  通常不需要手动设置 workbox-precaching， 应该使用 workbox-build 或 workbox-webpack-plugin 自动生成依赖文件

  ```js
  // sw.js

  import { pageCache, staticResourceCache, imageCache } from "workbox-recipes";
  import { precacheAndRoute } from "workbox-precaching";

  pageCache();
  staticResourceCache();
  imageCache();

  // 表示缓存所有 webpack 打包的 manifest 文件
  precacheAndRoute(self.__WB_MANIFEST || []);
  ```

- 使用 workbox-precaching 缓存

  当应用首次载入 install 事件中，workbox-precaching 会查看你要下载的资源，删除重复的并使用 SW 事件下载并缓存资源。资源的 URL 中已经包含了可以用作缓存 key 的信息

- 使用 workbox-webpack-plugin

  **GenerateSW** : 适用与预缓存文件，或有简单的缓存需求。 不适用与使用其他的 SW 特新，例如 Web Push, 或有自定一的缓存逻辑

  **InjectManifest**： InjectManifest 插件将生成一个要预缓存的 url 列表，并将该预缓存清单添加到现有的 service worker 文件中。否则它将使文件保持原样。

  适用于想要更多的控制 SW，缓存文件，自定义路由策略，想要使用其他的 SW 特性，

  会在 output.path 中生成 sw.js 文件，需要手动在 index.html 中引入

  ```js
  // webpack.config.js
  const { InjectManifest } = require("workbox-webpack-plugin");

  module.exports = {
    plugins: [
      new InjectManifest({
        swSrc: "sw.js",
        exclude: [
          /\.map$/,
          /manifest$/,
          /\.htaccess$/,
          /service-worker\.js$/,
          /sw\.js$/,
        ],
      }),
    ],
  };
  ```

#### 什么是 Service Worker？它的作用是什么？

Service Worker 是一种运行在浏览器后台的 JavaScript 脚本，独立于页面上下文，并且与页面的生命周期分离。它提供了拦截和处理网络请求的能力，从而使得网页能够支持离线工作、缓存资源和后台同步等功能。它是 渐进式 Web 应用（PWA）的关键组成部分。

离线支持：缓存页面和资源，使得在没有网络连接时，应用仍能工作。
网络请求拦截：可以拦截网络请求并提供自定义响应，例如从缓存中获取资源，或将请求转发给网络。
后台同步：在应用有网络时自动同步数据。
推送通知：支持推送通知，允许在用户不活跃时向其发送消息。

#### Service Worker 的生命周期是什么样的？

注册：通过 navigator.serviceWorker.register() 方法注册 Service Worker。此时浏览器会检查是否需要安装新的 Service Worker。
安装（Install）：注册后，如果没有有效的 Service Worker，浏览器会尝试安装它。在此阶段，通常会缓存一些静态资源。
激活（Activate）：安装完成后，Service Worker 会激活。在此阶段，可以清理旧的缓存和控制页面。
控制：Service Worker 激活后，能够控制所有符合条件的页面，开始拦截网络请求。
更新：Service Worker 可能会定期检查更新，新的 Service Worker 安装并激活后，旧的 Service Worker 会被终止。

#### Service Worker 中的 fetch 事件是如何工作的？

fetch 事件是 Service Worker 中用于拦截和处理网络请求的核心事件。每当页面发起请求时，Service Worker 会通过 fetch 事件捕获请求，允许开发者决定如何响应这些请求（例如，从缓存中获取、从网络获取或自定义响应）。

```js
self.addEventListener("fetch", function (event) {
  event.respondWith(
    caches
      .match(event.request) // 优先从缓存中获取
      .then(function (response) {
        return response || fetch(event.request); // 如果缓存中没有，则从网络获取
      })
  );
});
```

event.respondWith() 方法用于返回一个 Response 对象，覆盖默认的网络请求处理方式。

#### 什么是 Service Worker 的作用域？

Service Worker 的作用域是指它可以控制的 URL 范围。在注册时，可以指定作用域，它决定了 Service Worker 可以拦截哪些请求。默认情况下，Service Worker 会控制它所在路径下的所有页面和资源。

如果没有指定作用域，Service Worker 会默认控制当前路径及其子路径下的页面。

```js
navigator.serviceWorker.register("/service-worker.js", { scope: "/" });
```

#### 如何实现离线缓存？

离线缓存的基本思路是在 install 事件中缓存需要的资源，然后在 fetch 事件中拦截请求，从缓存中提供响应。
在安装时，将文件添加到缓存中，fetch 事件会拦截请求，优先从缓存中返回资源。

cache.add()：将单个资源添加到缓存。
cache.addAll()：将多个资源添加到缓存。
cache.put()：将指定请求和响应对存入缓存。
caches.delete()：删除指定缓存。

```js
self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open("my-cache").then(function (cache) {
      return cache.addAll([
        "/index.html",
        "/styles.css",
        "/script.js",
        "/offline.html",
      ]);
    })
  );
});

self.addEventListener("fetch", function (event) {
  event.respondWith(
    caches.match(event.request).then(function (response) {
      return response || fetch(event.request); // 网络优先
    })
  );
});
```

#### self.skipWaiting() 和 self.clients.claim() 的作用是什么？

self.skipWaiting()：在激活新的 Service Worker 时，跳过等待阶段，立即使新的 Service Worker 控制页面。这对实现即时更新非常有用。

self.clients.claim()：在 Service Worker 激活后，立即接管当前打开的页面，使其受该 Service Worker 控制，避免等待页面重新加载。

```js
self.addEventListener("install", function (event) {
  self.skipWaiting(); // 立即激活
});

self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim()); // 立即接管控制
});
```

#### 如何清理旧的缓存？

在 Service Worker 的 activate 事件中，可以清理旧的缓存。例如，在更新时清理不再需要的缓存：

```js
self.addEventListener("activate", function (event) {
  var cacheWhitelist = ["my-cache-v2"]; // 新的缓存名称
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (cacheName) {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName); // 删除不在白名单中的缓存
          }
        })
      );
    })
  );
});
```

#### 如何使用 Service Worker 支持推送通知

推送通知依赖于 Service Worker 的 push 事件。当接收到推送消息时，Service Worker 会在后台处理并显示通知。

```js
self.addEventListener("push", function (event) {
  var options = {
    body: event.data.text(),
    icon: "/icon.png",
    badge: "/badge.png",
  };
  event.waitUntil(
    self.registration.showNotification("Push Notification", options)
  );
});
```

#### Service Worker 的缓存策略有哪些

Cache-first：优先从缓存获取资源，如果没有，再从网络获取。
Network-first：优先从网络获取资源，如果失败，再从缓存中获取。
Stale-while-revalidate：先从缓存获取过时的资源，然后异步从网络获取最新的资源，并更新缓存。

#### 如何使用 Service Worker 实现离线数据同步？

在网络恢复的时候，sync 会自动触发。

```js
//客户端，注册监听事件
navigator.serviceWorker.ready.then((registration) => {
  registration.sync.register("syncData");
});

// service worker
self.addEventListener("sync", (event) => {
  if (event.tag === "syncData") {
    event.waitUntil(syncData());
  }
});
```

#### Service Worker 如何与多个标签页共享数据

Service Worker 可以通过 客户端 API 与多个标签页进行通信。clients.matchAll() 可以获取所有控制的页面客户端，postMessage 用于与页面通信。

```js
// 页面中
self.addEventListener("message", function (event) {
  console.log("Message from client:", event.data);
  event.ports[0].postMessage("Hello from Service Worker!");
});

// service worker
if (navigator.serviceWorker.controller) {
  navigator.serviceWorker.controller.postMessage("Hello from the page!");
  navigator.serviceWorker.addEventListener("message", function (event) {
    console.log("Message from service worker:", event.data);
  });
}
```

#### 如何在 Service Worker 中使用 self.registration.update()

self.registration.update() 用于强制浏览器检查 Service Worker 是否有更新。如果应用程序需要强制立即检查更新，可以调用该方法。

```js
self.addEventListener("activate", function (event) {
  event.waitUntil(
    self.registration.update() // 强制更新 Service Worker
  );
});
```
