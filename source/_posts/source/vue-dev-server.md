---
layout: posts
title: vue/dev-server
date: 2023-08-05 14:42:41
categories:
  - 源码分析
  - vue
tags:
  - vue
---

## demo 介绍

此 [demo](https://github.com/vuejs/vue-dev-server) 展示在页面中直接引入 esModule 文件，并在文件中引入 vue 组件的渲染流程

## 渲染流程

<div class='mermaid'>
sequenceDiagram
    autonumber
    participant Client
    participant Server
    Client->>Server: /main.js
    Note left of Server: 返回资源的时候处理node_modules中依赖的路径
    Server->>Client: main.js文件内容
    Note left of Server: __module/vue 和 test.vue
    Client->>Server: 浏览器分析分析并请求import资源
    Server->>Client: 返回依赖资源或是打包后的js文件
</div>

- 浏览器向服务器请求入口文件 `main.js`, 请求路径为 import 路径 `.main.js`
- 服务端接收到请求，交给 middleware 处理，首先检查缓存，如果缓存存在直接返回缓存结果，如果不存在，通过请求路径读取本地资源文件，处理后加入缓存并返回
- 如果文件是 js 结尾, 这里表示的是入口文件

  - 将文件内容转为 ast 语法树， 分析依赖模块包括 vue 和 text.vue，将 node_module 中的依赖路径转换为自定义路径用于资源请求时区分资源并可以加入缓存优化，例如`__module/vue`，将 ast 生成的代码返回给浏览器
  - 浏览器会自动请求 esMoudle 中 import 的文件 <br/>`http://localhost:3000/\_\_modules/vue` <br/>`http://localhost:3000/test.vue`

- 如果文件路径中包含 `\_\_moudles`, 则尝试加载 node_modules 中的文件
  通过 `require.resolve("vue")` 可以获取某个包在 `node_modules` 中的绝对路径

- 如果文件路径是以 `.vue` 结尾， 需要使用 vue 提供的编译模块将文件编译成单个 js 文件
  - 首先通过 vueComplier compileToDescriptor 将 vue 文件处理 template, styles，scripts 的描述对象
  - 在使用 vueCompiler.assemble 将描述文件中的各部分组装成代码，返回给浏览器

## middleware.js

```js
const vueCompiler = require("@vue/component-compiler");
const fs = require("fs");
const stat = require("util").promisify(fs.stat);
const root = process.cwd();
const path = require("path");
const parseUrl = require("parseurl");
const { transformModuleImports } = require("./transformModuleImports");
const readFile = require("util").promisify(fs.readFile);
const parseUrl = require("parseurl");
const defaultOptions = {
  cache: true,
};

async function loadPkg(pkg) {
  if (pkg === "vue") {
    const dir = path.dirname(require.resolve("vue"));
    const filepath = path.join(dir, "vue.esm.browser.js");
    return readFile(filepath);
  } else {
    // TODO
    // check if the package has a browser es module that can be used
    // otherwise bundle it with rollup on the fly?
    throw new Error("npm imports support are not ready yet.");
  }
}
async function readSource(req) {
  const { pathname } = parseUrl(req);
  const filepath = path.resolve(root, pathname.replace(/^\//, ""));
  return {
    filepath,
    source: await readFile(filepath, "utf-8"),
    updateTime: (await stat(filepath)).mtime.getTime(),
  };
}
function transformModuleImports(code) {
  const ast = recast.parse(code);
  recast.types.visit(ast, {
    visitImportDeclaration(path) {
      const source = path.node.source.value;
      if (!/^\.\/?/.test(source) && isPkg(source)) {
        path.node.source = recast.types.builders.literal(
          `/__modules/${source}`
        );
      }
      this.traverse(path);
    },
  });
  return recast.print(ast).code;
}

const vueMiddleware = (options = defaultOptions) => {
  let cache;
  let time = {};
  if (options.cache) {
    const LRU = require("lru-cache");

    cache = new LRU({
      max: 500,
      length: function (n, key) {
        return n * 2 + key.length;
      },
    });
  }

  const compiler = vueCompiler.createDefaultCompiler();

  function send(res, source, mime) {
    res.setHeader("Content-Type", mime);
    res.end(source);
  }

  function injectSourceMapToBlock(block, lang) {
    const map = Base64.toBase64(JSON.stringify(block.map));
    let mapInject;

    switch (lang) {
      case "js":
        mapInject = `//# sourceMappingURL=data:application/json;base64,${map}\n`;
        break;
      case "css":
        mapInject = `/*# sourceMappingURL=data:application/json;base64,${map}*/\n`;
        break;
      default:
        break;
    }

    return {
      ...block,
      code: mapInject + block.code,
    };
  }

  function injectSourceMapToScript(script) {
    return injectSourceMapToBlock(script, "js");
  }

  function injectSourceMapsToStyles(styles) {
    return styles.map((style) => injectSourceMapToBlock(style, "css"));
  }

  async function tryCache(key, checkUpdateTime = true) {
    const data = cache.get(key);

    if (checkUpdateTime) {
      const cacheUpdateTime = time[key];
      const fileUpdateTime = (
        await stat(path.resolve(root, key.replace(/^\//, "")))
      ).mtime.getTime();
      if (cacheUpdateTime < fileUpdateTime) return null;
    }

    return data;
  }

  function cacheData(key, data, updateTime) {
    const old = cache.peek(key);

    if (old != data) {
      cache.set(key, data);
      if (updateTime) time[key] = updateTime;
      return true;
    } else return false;
  }

  async function bundleSFC(req) {
    const { filepath, source, updateTime } = await readSource(req);
    const descriptorResult = compiler.compileToDescriptor(filepath, source);
    console.log(descriptorResult);
    const assembledResult = vueCompiler.assemble(compiler, filepath, {
      ...descriptorResult,
      script: injectSourceMapToScript(descriptorResult.script),
      styles: injectSourceMapsToStyles(descriptorResult.styles),
    });
    return { ...assembledResult, updateTime };
  }

  return async (req, res, next) => {
    if (req.path.endsWith(".vue")) {
      const key = parseUrl(req).pathname;
      let out = await tryCache(key);

      if (!out) {
        // Bundle Single-File Component
        const result = await bundleSFC(req);
        console.log(result);
        out = result;
        cacheData(key, out, result.updateTime);
      }

      send(res, out.code, "application/javascript");
    } else if (req.path.endsWith(".js")) {
      const key = parseUrl(req).pathname;
      let out = await tryCache(key);

      if (!out) {
        // transform import statements
        const result = await readSource(req);
        out = transformModuleImports(result.source);
        console.log(out);
        cacheData(key, out, result.updateTime);
      }

      send(res, out, "application/javascript");
    } else if (req.path.startsWith("/__modules/")) {
      const key = parseUrl(req).pathname;
      const pkg = req.path.replace(/^\/__modules\//, "");

      let out = await tryCache(key, false); // Do not outdate modules
      if (!out) {
        out = (await loadPkg(pkg)).toString();
        cacheData(key, out, false); // Do not outdate modules
      }

      send(res, out, "application/javascript");
    } else {
      next();
    }
  };
};

exports.vueMiddleware = vueMiddleware;
```
