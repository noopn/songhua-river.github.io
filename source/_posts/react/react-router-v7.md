---
layout: posts
title: React Router v7 概览
mathjax: true
date: 2025-01-23 20:26:46
categories:
  - React
tags:
  - React
---

v7 可以让 React Router 作为框架来使用，利用提供的 cli 工具创建项目，提供了相关的构建包，以 React Router 的视角开发项目。以下是官方提供的特性说明：

- Vite 捆绑器和开发服务器集成
- 热模块替换
- 代码分割
- 带类型安全的路由约定
- 文件系统或基于配置的路由
- 带类型安全的数据加载
- 带类型安全的操作
- 操作后页面数据的自动重新验证
- SSR、SPA 和静态呈现策略
- 待定状态和乐观 UI 的 api
- 部署适配器

#### 特殊文件

##### react-router.config.ts

可选，[全局的配置文件](https://api.reactrouter.com/v7/types/_react_router_dev.config.Config.html)。

##### root.ts

必须，唯一的必须路由，是 routes 目录有所有路由的父路由，也用于描述 HTML 文档。

可以把 React Router 提供的全局组件写在这里，只会渲染一次。

```tsx
import type { LinksFunction } from "react-router";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

import "./global-styles.css";

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* 所有路由上的所有meta导出都会在这里渲染 */}
        <Meta />

        {/* 所有路由上的所有link导出都会在这里渲染 */}
        <Links />
      </head>
      <body>
        {/* 子路由*/}
        <Outlet />

        {/* 管理客户端渲染时候的滚动条位置 */}
        {/* If you use a nonce-based content security policy for scripts, you must provide the `nonce` prop. Otherwise, omit the nonce prop as shown here. */}

        <ScrollRestoration />

        <Scripts />
      </body>
    </html>
  );
}
```

Content Security Policy (CSP)
CSP 是一种浏览器安全机制，用于防止跨站脚本攻击（XSS）等安全问题。通过配置 CSP，开发者可以限制页面加载的资源（如脚本、样式等）的来源和执行方式。

Nonce
nonce 是 CSP 中的一个概念，表示一个随机生成的字符串（一次性值）。通过在 CSP 中配置 nonce，可以允许特定的内联脚本或动态加载的脚本执行，而不会违反 CSP 规则。

如果你使用了基于 nonce 的 CSP 策略：
如果你的 CSP 配置中使用了 nonce 来允许脚本执行，那么你需要在 React Router 的相关组件中传递 nonce 属性。这是因为 React Router 可能会动态加载或执行一些脚本，这些脚本需要符合你的 CSP 策略。

如果你没有使用基于 nonce 的 CSP 策略：
如果你的 CSP 配置不涉及 nonce，或者你不需要对脚本进行特殊限制，那么你可以忽略 nonce 属性（如示例中所示）.

假设你的 CSP 配置如下：

```bash
Content-Security-Policy: script-src 'nonce-abc123';
```

这意味着只有带有 nonce="abc123" 的脚本才能执行。在这种情况下，你需要在 React Router 中传递 nonce 属性：

```tsx
<Router nonce="abc123">{/* Your routes here */}</Router>
```

**layout-export**

一个单独导出的组件，可以避免在 Root Component,HydrateFallback, ErrorBoundary 重复声明 app 的框架元素。

##### routes.ts

必须， 统一的路由配置文件，它将自动对每个路由进行代码拆分，为参数和数据提供类型安全，并在用户导航到数据时自动加载具有挂起状态访问权的数据。

```tsx
import type { RouteConfig } from "@react-router/dev/routes";
import { route } from "@react-router/dev/routes";

export default [
  route("contacts/:contactId", "routes/contact.tsx"),
] satisfies RouteConfig;
```

##### index route

当路由没有匹配任何路径的时候，他会在 Outlet 中显示空白，index 可以当做是默认路由的视图。

```tsx
// app/routes.ts
import type { RouteConfig } from "@react-router/dev/routes";
import { index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("contacts/:contactId", "routes/contact.tsx"),
] satisfies RouteConfig;
```

##### layout route

可以在路由的配置文件中，描述组件的嵌套关系.

```ts
import type { RouteConfig } from "@react-router/dev/routes";
import { index, layout, route } from "@react-router/dev/routes";

export default [
  layout("layouts/sidebar.tsx", [
    index("routes/home.tsx"),

    // 会渲染到 layouts/sidebar.tsx 这个 layout 下的 Outlet 里面。
    route("contacts/:contactId", "routes/contact.tsx"),
  ]),
  route("about", "routes/about.tsx"),
] satisfies RouteConfig;
```

#### 特殊组件

##### <Outlet />

用于展示路由

```tsx
// app/root.tx
import { Outlet } from "react-router";
export default function App() {
  return (
    <>
      <div id="detail">
        <Outlet />
      </div>
    </>
  );
}
```

#### 核心方法

##### clientLoader

只在浏览器中调用，为路由组件提供数据

```tsx
// app/root.tsx

export async function clientLoader() {
  const contacts = await getContacts();
  return { contacts };
}

export default function App({ loaderData }: any) {
  const { contacts } = loaderData;
  // ...
}
```

##### HydrateFallback

如果通过 react-router.config.ts 配置为客户端渲染，那么在 app 根文件执行之前是没有任何内容。

提供一个 HydrateFallback 方法，在 app 被渲染前提供能内容。他会被直接添加到 index.html 文件中。

```tsx
// app/root.tsx
export function HydrateFallback() {
  return (
    <div id="loading-splash">
      <p>Loading, please wait...</p>
    </div>
  );
}
```

##### URL Params Loader

在 loader 方法中获取

```tsx
// existing imports
import type { Route } from "./+types/contact";

export async function loader({ params }: Route.LoaderArgs) {
  const contact = await getContact(params.contactId);
  return { contact };
}

export default function Contact({ loaderData }: Route.ComponentProps) {
  const { contact } = loaderData;

  // existing code
}
```

在组件中获取

```ts
export default function SidebarLayout({ params }: Route.ComponentProps) {
  console.log(params);
  return; //...
}
```

##### useNavigation

返回当前导航信息，包括导航状态。 导航需要等到 loader 结束时才会渲染页面，因此可以使用导航状态展示 loading 信息。

```tsx
import { useNavigation } from "react-router";

export default function SidebarLayout() {
  const navigation = useNavigation();

  return (
    <div
      id="detail"
      className={navigation.state === "loading" ? "loading" : ""}
    ></div>
  );
}
```

#### 类型安全

React Router 自动为每个路由生成类型文件存放在 `+types/<route file>.d.ts`.

```tsx
// app/root.tsx
import type { Route } from "./+types/root";

export default function App({ loaderData }: Route.ComponentProps) {
  const { contacts } = loaderData;
  // ...
}
```

#### 预渲染静态路由

对于没有内容的页面，希望在加载的时候不展示 loading,而是直接展示内容。

指定哪些页面需要预渲染，他们会在打包阶段，打包为静态文件。

```tsx
//react-router.config.ts
import { type Config } from "@react-router/dev/config";

export default {
  ssr: false,
  prerender: ["/about"],
} satisfies Config;
```

#### 抛出错误

在 loader 中抛出错误, 会被 root.tsx 的 ErrorBoundary 捕获

```tsx
export async function clientLoader({ params }: Route.LoaderArgs) {
  const contact = await getContact(params.contactId);
  if (!contact) {
    throw new Response("Not Found", { status: 404 });
  }
  return { contact };
}
```

#### 表单提交

默认情况下，表单的提交会触发 history 的修改，因此使用 Form 组件，它会就近拦截表单的提交，并将请求通过 fetch 发送到最近的 action 中处理。

Form 组件上的 action 会作为请求提交的地址，用于匹配路由。

action 的规则是如果路由匹配那么对应的路由文件中必须存在 action 处理函数否则报错，如果没有对应的路由文件(例如写在 layout 文件中)，会使用 root 中的 action 处理。

需要注意的是使用 action 不能将 react-router.config.ts 中的 ssr 设置为 false,因为这是服务端的功能。

clientLoader 也需要修改为 loader 从服务端获取数据。

```tsx
// root.tsx

// 如果在路由上没有其他的文件写 action 就会到root的action中处理
export async function action() {
  const contact = await createEmptyContact();
  return { contact };
}
```

```tsx
import { Form } from "react-router";

export default function SidebarLayout() {
  return (
    <Form method="post">
      <button type="submit">New</button>
    </Form>
  );
}
```

删除信息

```tsx
// 当前文件 app/routes/contact.tsx 对应的路由是 contacts/:contactId
// 因此表但会提交到 contacts/:contactId/destroy
// 需要为此路由创建对应的文件

<Form
  action="destroy"
  method="post"
  onSubmit={(event) => {
    const response = confirm("Please confirm you want to delete this record.");
    if (!response) {
      event.preventDefault();
    }
  }}
>
  <button type="submit">Delete</button>
</Form>
```

```tsx
// app/routes/destroy-contact.tsx
import { redirect } from "react-router";
import type { Route } from "./+types/destroy-contact";

import { deleteContact } from "../data";

export async function action({ params }: Route.ActionArgs) {
  await deleteContact(params.contactId);
  return redirect("/");
}
```

```tsx
// app/routes.ts

export default [
  route("contacts/:contactId/destroy", "routes/destroy-contact.tsx"),
] satisfies RouteConfig;
```
