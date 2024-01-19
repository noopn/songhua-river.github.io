---
layout: posts
title: service worker 离线访问
date: 2023-01-19 08:32:05
categories:
  - JavaScript
tags:
  - service-worker
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

#### 关闭

- terminated
- 关闭浏览器一段时间
- 手动清除 serviceworker
- 在 sw 安装时直接跳过 waiting 阶段 self.skipWaiting();

#### 拦截请求

拦截请求 只有 activate 之后才能工作

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

数据同步， sw 可以监听客户端发起的 sync 请求，当离线环境时，sw 在后台将任务挂起，当网络恢复会执行回调函数， **相同的 tag 在网路恢复后只会执行一次**， tag 不能用于传输数据， 离线数据应该使用持久化保存。

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

    // 注册成功后发送资源列表
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

  ```js
  // sw.js

  import { pageCache, staticResourceCache, imageCache } from "workbox-recipes";
  import { precacheAndRoute } from "workbox-precaching";

  pageCache();
  staticResourceCache();
  imageCache();

  precacheAndRoute(self.__WB_MANIFEST || []);
  ```

- 使用 workbox-webpack-plugin

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
