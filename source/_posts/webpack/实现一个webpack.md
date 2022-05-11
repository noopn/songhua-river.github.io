---
title: 实现一个简易 webpack
mathjax: true
categories:
  - webpack
tags:
  - 工程化
  - webpack

date: 2021-09-05 20:53:23
---

#### webpack 的执行流程

- 初始化 Compiler: new Webpack(config) 得到 Compiler 对象
- 开始编译，调用 Compiler 对象 run 方法开始编译。
- 确定入口，根据配置中的 entry 找出所有入口文件
- 编译模块，从入口出发，调用所有配置的 Loader 对模块进行编译，找出该模块依赖的模块，递归直到所有的模块被加载进来。
- 完成模块编译：在经过第四步使用 Loader 编译完所有模块之后，得到了每个模块被编译后的最终内容以及他们之间的依赖关系。
- 输出资源:根据入口和模块之间的依赖关系，组装成一个个包含多个模块的 Chunk,再把每个 Chunk 转换成一个单独的文件加入到输出列表。（注意：这步是可以修改输出内容的最后机会）
- 输出完成：在确定好输出内容后，根据配置确定输出的路径和文件名，把文件内容写入到文件系统。

#### 做一些准备工作

想要打包总要有个项目吧，让我们着手准备一些项目文件

![](0001.png)

`src`，目录是项目的源文件，包含了一个工具方法`util/add.js`

```javascript
const add = (a, b) => a + b;
export default add;
```

还有另一个打印方法 `log.js` 有一个更深层的依赖文件

```javascript
import bind from "./util/bind";
const log = bind(console.log, console);

export default log;
```

在项目的入口文件中，引入并使用这两个方法

```javascript
import add from "./util/add";
import log from "./log";

const count = add(1, 2);
log(count);
```

下面我们需要添加打包命令，就像 create-react-app 做的一样，我们想通过一个`npm build`命令打包, 所以通过 `npm init -y`初始化了`package.json`文件并添加了一个脚本

```json
{
  "name": "my-webpack",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "build": "node scripts/build"
  }
}
```

显然我们并没有用于打包的可执行脚本，所以要创建一个，放在`scripts/build.js`文件夹下面

正如上一小结流程描述的一样，我们通过一个自定义的`myWebpack`方法，传入配置后生成了`compiler`对象

```javascript
const webpack = require("../lib/myWebpack");
const config = require("../config/webpack.config");
const compiler = webpack(config);
compiler.run();
```

`myWebpack`文件是主要要去实现的功能，我们暂时先建一个空文件，那么剩下的就只有这个`webpack.config.js`配置文件了,简单的给一些必须配置

```javascript
const path = require("path");

module.exports = {
  entry: "../src/index.js",
  output: {
    path: path.resolve(__dirname, "../dist"),
    filename: "main.js",
  },
};
```

#### 解析入口文件依赖并编译代码

`myWebpack.js`

```javascript
const fs = require("fs");
const path = require("path");
const { parse } = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const { transformFromAst } = require("@babel/core");

const webpack = (config) => {
  return new Compiler(config);
};

class Compiler {
  constructor(options = {}) {
    this.options = options;
  }

  run() {
    const { entry } = this.options;
    // 获取node进程执行的目录
    const cwdPath = process.cwd();

    // 因为readFile中使用相对路径是以node进程执行时的路径作为基准路径
    // 可能有查不到文件报错的情况，这里使用path.resolve转换成绝对路径
    const relativeEntryPath = path.resolve(__dirname, entry);
    const file = fs.readFileSync(relativeEntryPath, "utf-8");

    // 把文件内容转换成ast抽象语法树
    // https://www.babeljs.cn/docs/babel-parser
    const ast = parse(file, {
      sourceType: "module",
    });

    // 收集入口文件依赖
    const deps = [];
    // 分析ast中的依赖关系保存奥依赖中
    traverse(ast, {
      ImportDeclaration: ({ node }) => {
        // 获取到依赖文件的引用路径
        const traverseModulePath = node.source.value;
        // 转换为绝对路径
        const relativePath = path.resolve(cwdPath, "src", traverseModulePath);
        deps.push(relativePath);
      },
    });

    // 编译代码，从ast编译为es5

    const { code } = transformFromAst(ast, null, {
      presets: ["@babel/preset-env"],
    });
    console.log(code);
  }
}
module.exports = webpack;
```

#### 深层递归，生成依赖关系图

虽然我们拿到了入口文件的依赖，但显然是不够的，依赖的文件可能还有自己的依赖，需要递归的去获取

可以把递归解析依赖的方法，抽取成公共方法

```javascript
const fs = require("fs");
const path = require("path");
const { parse } = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const { transformFromAst } = require("@babel/core");

const webpack = (config) => {
  return new Compiler(config);
};

class Compiler {
  constructor(options = {}) {
    this.options = options;
  }
  analysis(entry) {
    // 获取node进程执行的目录
    const cwdPath = process.cwd();

    // 因为readFile中使用相对路径是以node进程执行时的路径作为基准路径
    // 可能有查不到文件报错的情况，这里使用path.resolve转换成绝对路径
    const relativeEntryPath = path.resolve(cwdPath, "src", entry);
    const file = fs.readFileSync(relativeEntryPath, "utf-8");

    // 把文件内容转换成ast抽象语法树
    // https://www.babeljs.cn/docs/babel-parser
    const ast = parse(file, {
      sourceType: "module",
    });

    // 收集入口文件依赖
    const deps = {};
    // 分析ast中的依赖关系保存到依赖中
    traverse(ast, {
      ImportDeclaration: ({ node }) => {
        // 获取到依赖文件的引用路径
        const traverseModulePath = node.source.value + ".js";
        // 转换为绝对路径
        const relativePath = path.resolve(cwdPath, "src", traverseModulePath);
        deps[traverseModulePath] = relativePath;
      },
    });

    // 编译代码，从ast编译为es5

    const { code } = transformFromAst(ast, null, {
      presets: ["@babel/preset-env"],
    });

    return {
      code,
      deps,
      entry,
    };
  }
  run() {
    const { entry } = this.options;
    // 保存加载的模块
    let module = [];
    let index = 0;
    let parseModule = this.analysis(entry);
    module.push(parseModule);

    while ((parseModule = module[index])) {
      const { deps } = parseModule;
      Object.keys(deps).forEach((depPath) => {
        parseModule = this.analysis(depPath);
        module.push(parseModule);
      });
      index++;
    }

    // 把各模块依赖关系从数据形式转换成对象的形式，方便使用
    module = module.reduce((o, item) => {
      o[item.entry] = {
        deps: item.deps,
        code: item.code,
      };
      return o;
    }, {});
  }
}

module.exports = webpack;
```

#### 生成代码

我们需要用刚才创建好的依赖关系图来动态加载我们的代码

```javascript
class Compiler {
  generate(module) {
    /**
     * 入口文件
     * var _add = _interopRequireDefault(require("./util/add"));
     * var _log = _interopRequireDefault(require("./log"));
     * function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
     * var count = (0, _add["default"])(1, 2);
     */

    /**
     * 模块文件
     * Object.defineProperty(exports, "__esModule", {
     *  value: true
     * });
     * exports["default"] = void 0;
     * var bind = require('./util/bind');
     * var log = bind(console.log, console);
     * var _default = log;
     * exports["default"] = _default;
     */
    const js = `
        (function(modules){
            //加载入口文件
            var fn = function(path){
                var code = modules[path].code;
                // 提供给模块内部使用的require
                var require = function(path){
                    return fn(path+'.js');
                }
                const exports = {};

                // 根据commonjs规范包装模块的方法
                (function(exports,require,code){
                    // eval方法中的字符串在运行时会向上级作用于查找需要的变量
                    eval(code)
                })(exports,require,code);
                // 导出给下一个模块使用
                return exports; 
            }

            // 加载入口文件
            fn('${this.options.entry}')

        })(${JSON.stringify(module)})
        `;
    const filename = path.resolve(
      this.options.output.path,
      this.options.output.filename
    );
    fs.writeFileSync(filename, js, "utf-8");
  }
}
```

#### 把关系图直接变成函数声明

由于用了`JSON.stringify`所以生成的文件中各个模块都是以字符串的形式保存，需要用`eval`执行

所以我们选择另一种处理方法，直接拼接出字符串形式的模块依赖表，这样在生成文件的时候可以直接变成可执行函数

下面是优化过的完整代码

```javascript
class Compiler {
  constructor(options = {}) {
    this.options = options;
  }
  analysis(entry) {
    // 获取node进程执行的目录
    const cwdPath = process.cwd();

    // 因为readFile中使用相对路径是以node进程执行时的路径作为基准路径
    // 可能有查不到文件报错的情况，这里使用path.resolve转换成绝对路径
    const relativeEntryPath = path.resolve(cwdPath, "src", entry);
    const file = fs.readFileSync(relativeEntryPath, "utf-8");

    // 把文件内容转换成ast抽象语法树
    // https://www.babeljs.cn/docs/babel-parser
    const ast = parse(file, {
      sourceType: "module",
    });

    // 收集入口文件依赖
    const deps = {};
    // 分析ast中的依赖关系保存到依赖中
    traverse(ast, {
      ImportDeclaration: ({ node }) => {
        // 获取到依赖文件的引用路径
        const traverseModulePath = node.source.value + ".js";
        // 转换为绝对路径
        const relativePath = path.resolve(cwdPath, "src", traverseModulePath);
        deps[traverseModulePath] = relativePath;
      },
    });

    // 编译代码，从ast编译为es5

    let { code } = transformFromAst(ast, null, {
      presets: ["@babel/preset-env"],
    });
    code = `
            (function(exports,require){
                ${code}
            })
        `;
    return {
      code,
      deps,
      entry,
    };
  }
  run() {
    const { entry } = this.options;
    // 保存加载的模块
    let module = [];
    let index = 0;
    let parseModule = this.analysis(entry);
    module.push(parseModule);

    while ((parseModule = module[index])) {
      const { deps } = parseModule;
      Object.keys(deps).forEach((depPath) => {
        parseModule = this.analysis(depPath);
        module.push(parseModule);
      });
      index++;
    }
    let moduleString = "{";
    module.forEach((m) => {
      moduleString += `"${m.entry}":${m.code},`;
    });
    moduleString += "}";
    this.generate(moduleString);
  }
  generate(moduleString) {
    /**
     * 入口文件
     * var _add = _interopRequireDefault(require("./util/add"));
     * var _log = _interopRequireDefault(require("./log"));
     * function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
     * var count = (0, _add["default"])(1, 2);
     */

    /**
     * 模块文件
     * Object.defineProperty(exports, "__esModule", {
     *  value: true
     * });
     * exports["default"] = void 0;
     * var bind = require('./util/bind');
     * var log = bind(console.log, console);
     * var _default = log;
     * exports["default"] = _default;
     */
    const js = `
        (function(modules){
            function require(path){
                var exports = {};
                modules[path+'.js'](exports,require)
                return exports;
            }
            // 加载入口文件
            modules['${this.options.entry}']({},require)

        })(${moduleString})
        `;
    const filename = path.resolve(
      this.options.output.path,
      this.options.output.filename
    );
    fs.writeFileSync(filename, js, "utf-8");
  }
}
```
