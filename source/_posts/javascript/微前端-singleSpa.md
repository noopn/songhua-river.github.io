---
layout: posts
title: 微前端 ② single-spa
date: 2024-08-01 15:30:59
categories:
  - JavaScript
tags:
  - 微前端
  - single-spa
---

single-spa 是一个将多个 JavaScript 微前端整合到一个前端应用程序中的框架。下面是一些优点:

- 在同一个页面上使用多个框架而不刷新页面
- 独立部署微前端
- 使用新框架编写代码，而无需重写现有的应用程序

single-spa 比较好的解决了以下问题：

- 应用加载顺序和依赖管理
- 路由管理
- 版本管理和升级
- 调试和监控

#### 依赖管理

single-spa 通过 [systemjs](/posts/ae7d32dcd157/) 实现了应用资源的依赖管理

#### webpack 配置

微前端应用需要适当改造，将输出的模式更改为 systemjs， 并且实现 single-spa 指定的接口。single-spa 官方提供了配置工具，用来降低配置的成本。

webpack-config-single-spa 用于输出 webpack 打包文件

```js
{
  output: {
    // 输出格式改为 systemjs
    libraryTarget: "system",
  },
   devServer: {
      // 任意路径下都返回 spa 应用入口文件
      historyApiFallback: true，
      // 允许对子应用的跨域调用
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    },
    // 会增加一个入口文件，动态指定 __webpack_public_path__
    // 避免子应用中异步加载的资源请求了主应用的路径
    new SystemJSPublicPathPlugin(
        //...
    ),
    // 处理开发模式下独立启动子应用显示页面
    !isProduction &&
    new StandaloneSingleSpaPlugin({
        //...
    }),
};
```

#### 前端项目配置

项目的入口需要使用 [`single-spa-react`](https://single-spa.js.org/docs/ecosystem-react/) 改造， 帮助实现 `single-spa` 要求的生命周期函数。

```js
const lifecycles = singleSpaReact({
  React,
  ReactDOM,
  rootComponent: Root,
  domElementGetter: () => document.querySelector("#aa"),
  errorBoundary(err, info, props) {
    // Customize the root error boundary for your microfrontend here.
    return null;
  },
});
```

下面是 singleSpaReact 的实现

```js
const opts = {
  /** 接收到的参数*/
};
const SingleSpaContext = opts.React.createContext();

opts.SingleSpaRoot = createSingleSpaRoot(opts);

// 将传入的新组件包装成新的 Root 组件

function createSingleSpaRoot() {
  // 为了支持 React 15 所以 single-spa 并没有使用 useEffect
  // 并且使用 函数 模拟 ES6 class 实现
  function SingleSpaRoot() {}
  SingleSpaRoot.prototype = Object.create(opts.React.Component.prototype);

  // 绑定自定义钩子函数
  SingleSpaRoot.prototype.componentDidMount = function () {
    setTimeout(this.props.mountFinished);
  };

  // 绑定自定义钩子函数
  SingleSpaRoot.prototype.render = function () {
    return this.props.children;
  };

  opts.SingleSpaRoot = createSingleSpaRoot(opts);

  const lifecycles = {
    bootstrap: bootstrap.bind(null, opts),
    mount: mount.bind(null, opts),
    unmount: unmount.bind(null, opts),
  };

  // 暴露接口方法
  return lifecycles;
}
```

实现 `bootstrap` 接口方法

```js
function mount(opts, props) {
  const whenMounted = function () {
    resolve(this);
  };

  const elementToRender = getElementToRender(opts, props, whenMounted);

  // 包装 rootComponent  传入额外的 props
  function getElementToRender(opts, props, mountFinished) {
    const elementToRender = opts.React.createElement(opts.rootComponent, props);

    // 绑定 context
    // ...

    // 绑定 errorBoundary
    // ...

    elementToRender = opts.React.createElement(
      opts.SingleSpaRoot,
      {
        ...props,
        mountFinished,
        updateFinished() {
          //...
        },
        unmountFinished() {
          //...
        },
      },
      elementToRender
    );

    return elementToRender;
  }
  const domElement = opts.domElementGetter();

  if (opts.ReactDOMClient?.createRoot) {
    opts.renderType = "createRoot";
  } else {
    opts.renderType = "render";
  }
  const renderResult = reactDomRender({
    elementToRender,
    domElement: opts.domElementGetter(),
    reactDom: opts.ReactDOMClient || opts.ReactDOM,
    renderType: opts.renderType,
  });

  // 挂载组件
  function reactDomRender({
    reactDom,
    renderType,
    elementToRender,
    domElement,
  }) {
    const renderFn = reactDom[renderType];

    switch (renderType) {
      case "createRoot":
      case "unstable_createRoot":
      case "createBlockingRoot":
      case "unstable_createBlockingRoot": {
        const root = renderFn(domElement);
        root.render(elementToRender);
        return root;
      }
      case "hydrateRoot": {
        const root = renderFn(domElement, elementToRender);
        return root;
      }
      case "hydrate":
      default: {
        renderFn(elementToRender, domElement);
        // The renderRoot function should return a react root, but ReactDOM.hydrate() and ReactDOM.render()
        // do not return a react root. So instead, we return null which indicates that there is no react root
        // that can be used for updates or unmounting
        return null;
      }
    }
  }

  opts.domElements[props.name] = domElement;
  opts.renderResults[props.name] = renderResult;
}
```

实现 `unmount` 接口方法

```js
function unmount(opts, props) {
  return new Promise((resolve) => {
    opts.unmountResolves[props.name] = resolve;

    const root = opts.renderResults[props.name];

    if (root && root.unmount) {
      // React >= 18
      const unmountResult = root.unmount();
    } else {
      // React < 18
      (opts.ReactDOMClient || opts.ReactDOM).unmountComponentAtNode(
        opts.domElements[props.name]
      );
    }
    delete opts.domElements[props.name];
    delete opts.renderResults[props.name];
  });
}
```

实现 `update` 接口方法

```js
function update(opts, props) {
  return new Promise((resolve) => {
    if (!opts.updateResolves[props.name]) {
      opts.updateResolves[props.name] = [];
    }

    opts.updateResolves[props.name].push(resolve);

    const elementToRender = getElementToRender(opts, props, null);
    const renderRoot = opts.renderResults[props.name];
    if (renderRoot && renderRoot.render) {
      // React 18 with ReactDOM.createRoot()
      renderRoot.render(elementToRender);
    } else {
      // React 16 / 17 with ReactDOM.render()
      const domElement = chooseDomElementGetter(opts, props)();
      // This is the old way to update a react application - just call render() again
      getReactDom(opts).render(elementToRender, domElement);
    }
  });
}
```

#### singleSpa 源码

- 首先定义子应用加载数组，以及各个阶段的状态

```js
const apps = [];

const NOT_LOADED = "NOT_LOADED";
const LOADING_SOURCE_CODE = "LOADING_SOURCE_CODE";
const NOT_BOOTSTRAPPED = "NOT_BOOTSTRAPPED";
const BOOTSTRAPPING = "BOOTSTRAPPING";
const NOT_MOUNTED = "NOT_MOUNTED";
const MOUNTING = "MOUNTING";
const MOUNTED = "MOUNTED";
const LOAD_ERROR = "LOAD_ERROR";
const SKIP_BECAUSE_BROKEN = "SKIP_BECAUSE_BROKEN";

// 主应用启动状态
let isStart = false;
```

- singleSpa 提供 `registerApplication` 方法用于注册子应用，记录子应用必要信息， 同时会执行 `reroute` 方法，如何路径匹配，会加载子应用， 但是不会渲染子应用，子应用渲染需要等待 `start` 方法执行 `isStart` 标记为 `true` 后才会挂载子应用。

```js
function registerApplication(appNameOrConfig) {
  // app 必须是返回 promise 的函数
  // customProps 必须是对象
  appNameOrConfig.customProps = appNameOrConfig.customProps || {};
  // activeWhen 是一个路径匹配函数的数组

  appNameOrConfig.activeWhen = Array.isArray(appNameOrConfig.activeWhen)
    ? appNameOrConfig.activeWhen
    : [appNameOrConfig.activeWhen];
  appNameOrConfig.activeWhen = appNameOrConfig.activeWhen.map((path) =>
    typeof path === "function" ? path : pathToActiveWhen(path)
  );

  apps.push({
    loadErrorTime: null,
    status: NOT_LOADED,
    ...appNameOrConfig,
  });

  reroute();
}
```

- singleSpa 提供 `start` 方法用于在注册后启动主应用, 在 `start` 方法中重写路由监听事件，可以让 singleSpa 响应路由的变化。

```js
function start() {
  isStart = true;
  patchHistoryApi(opts);
  reroute();
}

let urlRerouteOnly;
let originalReplaceState;
function createPopStateEvent(state, originalMethodName) {
  // https://github.com/single-spa/single-spa/issues/224 and https://github.com/single-spa/single-spa-angular/issues/49
  // We need a popstate event even though the browser doesn't do one by default when you call replaceState, so that
  // all the applications can reroute. We explicitly identify this extraneous event by setting singleSpa=true and
  // singleSpaTrigger=<pushState|replaceState> on the event instance.
  let evt;
  try {
    evt = new PopStateEvent("popstate", { state });
  } catch (err) {
    // IE 11 compatibility https://github.com/single-spa/single-spa/issues/299
    // https://docs.microsoft.com/en-us/openspecs/ie_standards/ms-html5e/bd560f47-b349-4d2c-baa8-f1560fb489dd
    evt = document.createEvent("PopStateEvent");
    evt.initPopStateEvent("popstate", false, false, state);
  }
  evt.singleSpa = true;
  evt.singleSpaTrigger = originalMethodName;
  return evt;
}

function patchedUpdateState(updateState, methodName) {
  return function () {
    const urlBefore = window.location.href;
    const result = updateState.apply(this, arguments);
    const urlAfter = window.location.href;

    if (urlBefore !== urlAfter) {
      // 手动触发 popstate 事件，让不同的子应用可以响应路由的变化。
      window.dispatchEvent(
        createPopStateEvent(window.history.state, methodName)
      );
    }
    return result;
  };
}

function patchHistoryApi() {
  urlRerouteOnly = true;
  originalReplaceState = window.history.replaceState;
  function urlReroute() {
    reroute([], arguments);
  }
  window.addEventListener("hashchange", urlReroute);
  //调用 history.pushState() 或者 history.replaceState() 不会触发 popstate 事件。popstate 事件只会在浏览器某些行为下触发
  //比如点击后退按钮（或者在 JavaScript 中调用 history.back()  go()方法）。即，在同一文档的两个历史记录条目之间导航会触发该事件。
  window.addEventListener("popstate", urlReroute);

  const originalAddEventListener = window.addEventListener;
  const originalRemoveEventListener = window.removeEventListener;

  // history 改变的时候需要主动触发事件
  window.history.pushState = patchedUpdateState(
    window.history.pushState,
    "pushState"
  );
  window.history.replaceState = patchedUpdateState(
    originalReplaceState,
    "replaceState"
  );
}
```

- `reroute` 方法控制了子应用生命周期的执行。

```js
function reroute(
  pendingPromises = [],
  eventArguments,
  silentNavigation = false
) {
  const { appsToUnload, appsToUnmount, appsToLoad, appsToMount } =
    getAppChanges();

  let appsThatChanged,
    cancelPromises = [];

  if (start) {
    appsThatChanged = appsToUnload.concat(
      appsToLoad,
      appsToUnmount,
      appsToMount
    );
    return performAppChanges();
  }
  if (!start) {
    appsThatChanged = appsToLoad;
    return loadApps();
  }

  function loadApps() {
    return Promise.resolve().then(() => {
      const loadPromises = appsToLoad.map((app) => {
        if (app.loadPromise) return app.loadPromise;
        if (app.status !== NOT_LOADED && app.status !== LOAD_ERROR) {
          return app;
        }

        app.status = LOADING_SOURCE_CODE;

        return (app.loadPromise = Promise.resolve()
          .then((val) => {
            // val 获取到子项目暴露的接口
            return (loadPromise = app.app(app));
          })
          .then((val) => {
            app.status = NOT_BOOTSTRAPPED;
            app.bootstrap = val.bootstrap;
            app.mount = val.mount;
            app.unmount = val.unmount;
            app.unload = val.unload;
            delete app.loadPromise;
          }));
      });
      let succeeded;

      return Promise.all(loadPromises);
    });
  }

  function performAppChanges() {
    return Promise.resolve().then(() => {
      return Promise.all(cancelPromises).then(() => {
        appsToUnmount.map((app) =>
          app.unmount({ name: app.name }).then(() => (app.status = NOT_MOUNTED))
        );

        loadApps().then((res) => {
          const loadThenMountPromises = appsToLoad.map((app) => {
            console.log(app);
            app.status = BOOTSTRAPPING;

            return Promise.resolve(app.loadPromise)
              .then((res) => {
                return app.bootstrap();
              })
              .then(() => {
                return Promise.resolve().then(() => {
                  app.status = MOUNTING;
                  return app
                    .mount({
                      name: app.name,
                    })
                    .then(() => {
                      app.status = MOUNTED;
                    });
                });
              });
          });
        });

        appsToMount.map((app) => {
          app.mount({ name: app.name }).then(() => (app.status = MOUNTED));
        });
      });
    });
  }
}

function getAppChanges() {
  const appsToUnload = [],
    appsToUnmount = [],
    appsToLoad = [],
    appsToMount = [];

  let appsThatChanged,
    cancelPromises = [];
  // We re-attempt to download applications in LOAD_ERROR after a timeout of 200 milliseconds
  const currentTime = new Date().getTime();

  console.log(apps);
  apps.forEach((app) => {
    const appShouldBeActive =
      app.status !== SKIP_BECAUSE_BROKEN && app.activeWhen[0](window.location);

    switch (app.status) {
      case LOAD_ERROR:
        if (appShouldBeActive && currentTime - app.loadErrorTime >= 200) {
          appsToLoad.push(app);
        }
        break;
      case NOT_LOADED:
      case LOADING_SOURCE_CODE:
        if (appShouldBeActive) {
          appsToLoad.push(app);
        }
        break;
      case NOT_BOOTSTRAPPED:
      case NOT_MOUNTED:
        if (!appShouldBeActive) {
          appsToUnload.push(app);
        } else if (appShouldBeActive) {
          appsToMount.push(app);
        }
        break;
      case MOUNTED:
        if (!appShouldBeActive) {
          appsToUnmount.push(app);
        }
        break;
      // all other statuses are ignored
    }
  });

  return { appsToUnload, appsToUnmount, appsToLoad, appsToMount };
}
```
