---
layout: posts
title: 微前端 ③ systemJs
date: 2024-01-26 11:55:26
categories:
  - JavaScript
tags:
  - 微前端
  - systemJs
---

#### 什么是 systemJs

它可以加载不同模块格式的代码，包括 ES 模块、CommonJS 和 AMD 模块，提供了一致的模块加载体验。

SystemJS 支持将现代 ES 模块代码转译为 System.register 格式（通常需要配合 webpack 等编译工具），以便在不支持 ES 模块的旧版浏览器中运行。这意味着开发者可以编写现代的、基于标准的模块代码，并确保它在旧版浏览器（如 IE11）中也能正常运行。

通过使用接近原生模块加载速度的 System.register 格式，SystemJS 在旧版浏览器中提供了高性能的模块加载能力。

另外还有一下的高级特性：

- SystemJS 支持顶级 await、动态导入（dynamic import）、循环引用和实时绑定（live bindings），这些都是现代 JavaScript 模块的重要特性。
- 它还支持 import.meta.url，这是 ES 模块的一部分，允许模块访问其自身的 URL。
- 支持模块类型（module types）和导入映射（import maps），使得开发者可以更灵活地管理模块依赖关系。
- 提供对内容安全策略（Content Security Policy, CSP）和完整性检查（integrity）的支持，增强了模块加载的安全性。

它也是 import 提案的解决方案， 在浏览器中原生的 esModule 不允许通过 `import React from 'react'` 的方式引入依赖，必须使用相对或绝对路径 `import React from 'https://xxx/cdn/react.js'` 或 `import React from './react'` ，但配合 webpack, 可以将代码编译成 systemJs 模块化方案的代码，用于加载外部依赖。

#### systemJs 加载 react 应用

创建 index.html 模板, systemJS 会接管有 `type='systemjs-importmap'` script 标签中资源的加载。

```html
<head>
  <script type="systemjs-importmap">
    {
      "imports": {
        "react": "https://cdn.jsdelivr.net/npm/react/umd/react.development.js",
        "react-dom": "https://cdn.jsdelivr.net/npm/react-dom/umd/react-dom.production.min.js"
      }
    }
  </script>
  <script src="https://cdn.staticfile.net/systemjs/6.14.3/system.js"></script>
</head>

<body>
  <div id="root"></div>
</body>
```

配合 webpack 将 scripts 处理成 systemJs 能识别的格式, `libraryTarget` 配置为 `system`, 设置 `HtmlWebpackPlugin` 插件的 `scriptLoading: "systemjs-module"` 可以为 script 标签自动添加 type 类型。`externals` 配置是可选的，对于多个子应用有不同版本的相同第三方依赖，可以直接将依赖打包在子应用中，不需要单独在主应用中加载。（对于这个多版本依赖的问题，并没有明确的最佳实践，官方推荐将比较重的第三方依赖变成共享资源， 如果共享资源有依赖关系例如 `react` `react-dom`，可以使用 systemJS 的 amd 扩展，或者将依赖放置到 depcache 字段中，推荐使用 amd 扩展能比较好的统一接管)

```js
module.exports = {
  entry: path.resolve(__dirname, "./src/index.js"),
  output: {
    path: path.resolve(__dirname, "dist"),
    publicPath: "/",
    // 设置打包格式为 system
    libraryTarget: "system",
  },
  // 排除依赖，通过 cdn 加载
  externals: {
    react: "react",
    "react-dom": "react-dom",
  },
  module: {/** loader 配置 */}
  plugins: [
    new HtmlWebpackPlugin({
      template: "./public/index.html",
      scriptLoading: "systemjs-module",
    }),
  ],
};
```

index.js 文件编译为 `System.register` 函数调用

```js
System.register(
  ["react", "react-dom"],
  function (__WEBPACK_DYNAMIC_EXPORT__, __system_context__) {
    var __WEBPACK_EXTERNAL_MODULE_react__ = {};
    var __WEBPACK_EXTERNAL_MODULE_react_dom__ = {};
    Object.defineProperty(__WEBPACK_EXTERNAL_MODULE_react__, "__esModule", {
      value: true,
    });
    Object.defineProperty(__WEBPACK_EXTERNAL_MODULE_react_dom__, "__esModule", {
      value: true,
    });
    return {
      setters: [
        function (module) {
          Object.keys(module).forEach(function (key) {
            __WEBPACK_EXTERNAL_MODULE_react__[key] = module[key];
          });
        },
        function (module) {
          Object.keys(module).forEach(function (key) {
            __WEBPACK_EXTERNAL_MODULE_react_dom__[key] = module[key];
          });
        },
      ],
      execute: function () {
        __WEBPACK_DYNAMIC_EXPORT__(
          (() => {
            "use strict";
            var __webpack_modules__ = {
              "./src/index.js": (
                __unused_webpack_module,
                __webpack_exports__,
                __webpack_require__
              ) => {
                eval(/** index.js 编译结果 */);
              },

              "./node_modules/react-dom/client.js": (
                __unused_webpack_module,
                exports,
                __webpack_require__
              ) => {
                eval(/**react-dom/client.js 编译结果 */);
              },

              react: (module) => {
                module.exports = __WEBPACK_EXTERNAL_MODULE_react__;
              },

              "react-dom": (module) => {
                module.exports = __WEBPACK_EXTERNAL_MODULE_react_dom__;
              },
            };
            /************************************************************************/
            // The module cache
            var __webpack_module_cache__ = {};

            // The require function
            function __webpack_require__(moduleId) {
              // Check if module is in cache
              var cachedModule = __webpack_module_cache__[moduleId];
              if (cachedModule !== undefined) {
                return cachedModule.exports;
              }
              // Create a new module (and put it into the cache)
              var module = (__webpack_module_cache__[moduleId] = {
                // no module.id needed
                // no module.loaded needed
                exports: {},
              });

              // Execute the module function
              __webpack_modules__[moduleId](
                module,
                module.exports,
                __webpack_require__
              );

              // Return the exports of the module
              return module.exports;
            }

            // startup
            // Load entry module and return exports
            // This entry module can't be inlined because the eval devtool is used.
            var __webpack_exports__ = __webpack_require__("./src/index.js");

            return __webpack_exports__;
          })()
        );
      },
    };
  }
);
```

#### systemJs 加载流程

- Q: systemjs-importmap 的作用是什么

  A: systemjs-importmap 作用是建立资源依赖的映射关系，由于浏览器不支持裸导入，因此通过一个自定义的 script 标签建立裸导入名称和资源路径的依赖关系

![](001.png)

以单 React 子应用为例，加载主应用以及子应用的过程。

index.html 页面配置如下

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Root Config</title>
    <meta name="importmap-type" content="systemjs-importmap" />
    <script type="systemjs-importmap">
      {
        "imports": {
          "single-spa": "https://cdn.jsdelivr.net/npm/single-spa@5.9.0/lib/system/single-spa.min.js",
          "react": "https://cdn.jsdelivr.net/npm/react@16.14.0/umd/react.production.min.js",
          "react-dom": "https://cdn.jsdelivr.net/npm/react-dom@16.14.0/umd/react-dom.production.min.js",
          "@root/root-config": "//localhost:9000/root-config.js",
          "@supos/supos-react-1": "//localhost:3000/supos-supos-react-1.js"
        }
      }
    </script>

    <script src="https://cdn.jsdelivr.net/npm/single-spa@5.9.0/lib/system/single-spa.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/systemjs@6.8.3/dist/system.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/systemjs@6.8.3/dist/extras/amd.js"></script>
  </head>

  <body>
    <main id="root"></main>
    <div id="aa"></div>
    <script>
      System.import("@root/root-config");
    </script>
  </body>
</html>
```

1. 主应用是一个编译后的 `root-config.js` 文件，先忽略 single-spa 相关的概念，简单理解为主应用通过 `system.import` 加载 `@root/root-config` 也就是通过 systemJS 映射之后的 `root-config.js`，在文件加载前 `systemJS` 已经分析了 `systemjs-importmap` script 标签中的依赖项，并生成了依赖图

```js
{
  depcache:{},
  imports:{
    "single-spa": "https://cdn.jsdelivr.net/npm/single-spa@5.9.0/lib/system/single-spa.min.js",
    "react": "https://cdn.jsdelivr.net/npm/react@16.14.0/umd/react.production.min.js",
    "react-dom": "https://cdn.jsdelivr.net/npm/react-dom@16.14.0/umd/react-dom.production.min.js",
    "@fefw/root-config": "http://localhost:9000/fefw-root-config.js",
    "@supos/supos-react-1": "http://localhost:3000/supos-supos-react-1.js",
    "@supos/supos-react-2": "http://localhost:8081/supos-supos-react-2.js"
  },
  integrity:{},
  scope:{}
}
```

2. 解析并获取 `@root/root-config` 的资源路径 `http:////localhost:9000/root-config.js`， 只要请求的资源与依赖途中匹配，就会解析资源的请求路径，并记录当前环境变量快照后，尝试加载资源。

3. 资源加载后

   如果资源是 systemJS 模块会自动执行 `system.register`, 再执行上下文中保存依赖数组，和声明函数。

   如果不是 systemJS 模块，例如公用的 `react`, `react-dom`, 会将资源直接包装成 systemJS 声明函数的执行结果，通常会使用 amd 扩展，如果不使用 amd 扩展，例如 `react` 等 umd 格式的资源会将导出对象直接挂载在 window 对象上，systemJS 会尝试与上一次的环境变量快照比对找到资源导出的对象。但是这种方式将导致污染全局对象，且不能多版本共存。请查看 [amd 扩展源码实现](#amd扩展源码实现)

   紧接着执行声明函数，声明函数接受一个 `export` 函数，用于接受第三方资源中暴露的对象，同时返回一个包含 `setters` 数组和 `execute` 方法的对象，如果加载的资源没有依赖项，那就不会有 `setters` 数组（例如： 主应用无第三方依赖), 延迟执行声明函数可以有时机处理依赖项。

4. 当资源的声明函数检查无额外依赖，则执行 `execute` 方法，内部执行 `webpack` 等构建工具打包后的代码，将返回的对象传递给 `export` 函数

5. 此时主应用资源已经执行，会尝试匹配路由，并通过 `system.import` 加载子应用，再次进入到第 2 步的流程，当子应用加载完成并执行后，获取到了子应用的依赖 `['react','react-dom']`, 以及子应用的声明函数，由于此时有依赖项所以需要等待依赖项加载完成，依赖项的加载也会进入到第 2 步的流程，通过 `Promise.all` 保证所有的依赖加载完成后再，执行声明函数。而第三步的 `setter` 方法会在子应用加载后调用，依赖中暴露的对象注入到声明函数中。

6. `react` 资源加载后，由于并不是一个 systemJS 模块，会通过 amd 扩展，包装成 systemjs 注册的对象，而且由于 react 没有依赖，会在稍后直接执行 `execute` 方法, 由于 react-dom 不是 systemjs 模块， 声明函数的执行也会被包装成 systemjs 注册的对象, 因为 react-dom 依赖 react, 所以会在缓存中找到已经加载的 react 包装对象， 需要注意这时的 `execute` 都还没有执行。在所有资源都准备好之后，`topLevelLoad` 会统一执行 `execute` 方法，将资源导出对象暴露给依赖对象，接着执行父级资源的 `setter` 方法，将暴露出的依赖对象注入到，父级资源中。从而完成整个依赖关系的加载。

总结一下 systemJS 核心方法， `import` 可以递归的加载资源以及其依赖项， `setter` 方法将依赖资源暴漏的对象注入到父资源中。

#### systemjs 实现原理

```js
// 1. 序列化import map
// importMap 只用作描述资源，建立映射关系，不会主动加载资源

function System() {}
var global = window;
// 记录加载的资源
System["@"] = {};

// 记录import资源隐射
var importMap = { imports: {} };

// baseURL 为当前的资源加载路径
var baseUrl = location.href.split("#")[0].split("?")[0];

var importMapPromise = Promise.resolve();
function processScripts() {
  document.querySelectorAll("script").forEach((script) => {
    // 处理 importmap
    if (script.type === "systemjs-importmap") {
      if (script.src) {
        /** 如果是远程资源，则发起请求 */
      } else {
        // 解析 importmap
        importMapPromise = importMapPromise.then(() =>
          extendImportMap(importMap, script.innerHTML, baseUrl)
        );
      }
    }
    // 处理systemjs 模块
    else if (script.type === "systemjs-module") {
      System.import(script.src);
    }
  });
}

// 尽早执行, 并在 dom 全部加载后重新检测
processScripts();

window.addEventListener("DOMContentLoaded", processScripts);

function extendImportMap(importMap, content, baseUrl) {
  const packages = JSON.parse(content);
  for (let k in packages) {
    importMap[k] = packages[k];
  }
}

// 用于加载 system-module 以及依赖项

var firstGlobalProp = (secondGlobalProp = undefined);

function shouldSkipProperty(p) {
  return !global.hasOwnProperty(p) || (!isNaN(p) && p < global.length);
}
function noteGlobalProps() {
  firstGlobalProp = secondGlobalProp = undefined;
  for (var p in global) {
    if (shouldSkipProperty(p)) continue;
    if (!firstGlobalProp) firstGlobalProp = p;
    else if (!secondGlobalProp) secondGlobalProp = p;
    lastGlobalProp = p;
  }
  return lastGlobalProp;
}

System.import = function (id) {
  // 加载前记录下当前环境中的属性，依赖加载后和上次环境中的属性做对比，可以知道在环境中挂载了那些新的属性
  noteGlobalProps();

  return Promise.resolve().then(() => {
    var load = getOrCreateLoad(id);
    return load.completion || topLevelLoad(load);
  });
};

function getOrCreateLoad(id) {
  var load = System["@"][id];
  if (load) return load;

  var ns = Object.create(null);
  Object.defineProperty(ns, Symbol.toStringTag, { value: "Module" });

  var instantiatePromise = Promise.resolve()
    .then(() => {
      return System.instantiate(id);
    })
    .then((registration) => {
      //依赖项
      var deps = registration[0];

      var _export = (name) => {
        for (var p in name) {
          ns[p] = name[p];
        }
        load.setter.forEach((setter) => setter(ns));
      };

      // 参数 __WEBPACK_DYNAMIC_EXPORT__ 函数，接受 webpack 模块化对象
      var declare = registration[1](_export);

      load.execute = declare.execute;
      return [deps, declare.setters];
    });

  var linkPromise = instantiatePromise.then((res) => {
    return Promise.all(
      res[0].map((dep, index) => {
        var setter = res[1][index];
        var depLoad = getOrCreateLoad(importMap.imports[dep]);

        if (setter) {
          depLoad.setter.push(setter);
        }

        return depLoad;
      })
    ).then((deps) => {
      load.deps = deps;
    });
  });

  return (load = System["@"][id] =
    {
      id,
      importMapPromise,
      linkPromise,
      ns,
      setter: [],
      deps: [],
      execute: () => {},
      completion: void 0,
    });
}

System.instantiate = function (id) {
  var script = document.createElement("script");
  script.async = true;
  script.src = id;

  // 异步等待 system 模块加载，并执行，执行结束后可以获取到模块注册的依赖信息
  return new Promise((resolve, reject) => {
    script.addEventListener("load", function () {
      document.head.removeChild(script);
      var register = System.getRegister();
      resolve(register);
    });
    document.head.appendChild(script);
  });
};

// 保存注册依赖以及回调函数

var lastRegister;
System.register = function (deps, declare) {
  lastRegister = [deps, declare];
};

function getGlobalProp() {
  var foundLastProp, result;
  var n = 0;

  // 依赖js引擎的行为
  for (var p in global) {
    if (shouldSkipProperty(p)) continue;

    if ((n == 0 && p !== firstGlobalProp) || (n == 1 && secondGlobalProp !== p))
      return p;
    if (foundLastProp) {
      // 下一个属性就是最新被赋值的属性
      lastGlobalProp = p;
      result = p;
    } else {
      // 匹配上一次最后一个属性
      foundLastProp = p === lastGlobalProp;
    }
    n++;
  }
  return result;
}

System.getRegister = function () {
  var _lastRegister = lastRegister;
  lastRegister = void 0;

  if (_lastRegister) return _lastRegister;

  // 检查js文件执行之后在环境中添加的属性

  var prop = getGlobalProp();

  var globalExport = global[prop];

  return [
    [],
    function (_exports) {
      return {
        execute: function () {
          _exports(globalExport);
          // 兼容esModule
          _exports({ default: globalExport, __useDefault: true });
        },
      };
    },
  ];
};

function topLevelLoad(load) {
  return Promise.resolve(load.linkPromise)
    .then(() => {
      return Promise.all(load.deps.map((dep) => dep.linkPromise));
    })
    .then(() => {
      // 等待所有依赖加载完成执行
      postOrderExec(load);
    });
}

function postOrderExec(load) {
  var execute = load.execute;

  // 首先执行依赖

  load.deps.forEach((dep) => {
    postOrderExec(dep);
  });

  execute();
}
```

#### amd 扩展源码实现

systemJS amd 扩展用于解决资源加载时对 window 对象的污染，还可以解决资源加载时的依赖问题， 例如 `react-dom` 依赖 `react`

以 `react` 和 `react-dom` 为例展示资源加载过程, 资源已经被打包为 umd 格式，所以可以兼容 amd 规范。

1. 首先在全局创建 `define` 方法，作为 amd 规范定义模块的方法。`react` 加载后自动执行 `define` 方法，在执行上下文中保存资源的依赖和执行函数。依赖默认有 `exports`

```js
function getDepsAndExec(arg1, arg2) {
  // define([], function () {})
  if (arg1 instanceof Array) {
    return [arg1, arg2];
  }
}
let amdDefineDeps, amdDefineExec;
global.define = function (name, deps, execute) {
  var depsAndExec;

  depsAndExec = getDepsAndExec(name, deps);
  amdDefineDeps = depsAndExec[0];
  amdDefineExec = depsAndExec[1];
};
```

2. 当资源加载成功后，会执行 `systemJS.getRegister`, amd 扩展会重写此方法

```js
var getRegister = systemPrototype.getRegister;
var lastRegisterDeclare;
var systemRegister = systemPrototype.register;
systemPrototype.register = function (name, deps, declare) {
  lastRegisterDeclare = typeof name === "string" ? declare : deps;
  systemRegister.apply(this, arguments);
};

systemPrototype.getRegister = function () {
  var register = getRegister.call(this); //[[], function () { return {} }];
  // 如果可以获取到 register 注册的依赖，表示此资源是标准的 systemJS 模块，直接返回
  if (register && register[1] === lastRegisterDeclare) return register;

  // 由于 amd 接管了模块的加载过程，所以在 window 上不会挂载 react 对象，getRegister 会返回空的声明函数结果，作为返回值
  // amd 模块默认有 ["exports"] 依赖
  // 此时 react 资源的 依赖对象和执行函数 都已经获取到 amdDefineDeps amdDefineExec

  createAMDRegister(amdDefineDeps, amdDefineExec);
};
```

3. 将 react 的加载包装成 systemJS register 数据结构， 后面继续执行 systemJS 第 4 步的加载逻辑

```js
function createAMDRegister(amdDefineDeps, amdDefineExec) {
  var exports = {};
  var module = { exports: exports };
  var depModules = [];
  var setters = [];
  var splice = 0;
  for (var i = 0; i < amdDefineDeps.length; i++) {
    var id = amdDefineDeps[i];
    var index = setters.length;
    if (id === "require") {
      depModules[i] = unsupportedRequire;
      splice++;
    } else if (id === "module") {
      depModules[i] = module;
      splice++;
    } else if (id === "exports") {
      depModules[i] = exports;
      splice++;
    } else {
      createSetter(i);
    }
    if (splice) amdDefineDeps[index] = id;
  }
  if (splice) amdDefineDeps.length -= splice;
  var amdExec = amdDefineExec;
  return [
    amdDefineDeps,
    function (_export) {
      _export({ default: exports, __useDefault: true });
      return {
        setters: setters,
        execute: function () {
          var amdResult = amdExec.apply(exports, depModules);
          if (amdResult !== undefined) module.exports = amdResult;
          _export(module.exports);
          _export("default", module.exports);
        },
      };
    },
  ];

  // needed to avoid iteration scope issues
  function createSetter(idx) {
    setters.push(function (ns) {
      depModules[idx] = ns.__useDefault ? ns.default : ns;
    });
  }
}
```
