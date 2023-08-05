---
title: ESLint配置指南
mathjax: true
categories:
  - DevOps
tags:
  - DevOps

date: 2021-09-12 19:05:29
---

#### 基础包

[ESLint](https://github.com/eslint/eslint): lint 代码的主要工具，所以的一切都是基于此包

#### 解析器(parser)

[babel-eslint](https://github.com/babel/babel-eslint) 已经变更为 [@babel/eslint-parser](https://github.com/babel/babel/tree/main/eslint/babel-eslint-parser): 该依赖包允许你使用一些实验特性的时候，依然能够用上 ESlint 语法检查。

[@typescript-eslint/parser](https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/parser): 与`@babel/eslint-parser`类似，如果你使用 typescript,需要使用 typescript 专有的解析器

#### 扩展的配置

[eslint-config-airbnb](https://github.com/airbnb/javascript/tree/master/packages/eslint-config-airbnb): 提供了 Airbnb 的 eslintrc 作为可扩展的共享配置。默认导出包含我们所有的 ESLint 规则，包括 ECMAScript 6+ 和 React。引入了 `eslint`，`eslint-plugin-import`，`eslint-plugin-react`，`eslint-plugin-react-hooks`，和 `eslint-plugin-jsx-a11y`。如果您不需要 React，请使用[eslint-config-airbnb-base](https://www.npmjs.com/package/eslint-config-airbnb-base)。

[eslint-config-jest-enzyme](https://github.com/enzymejs/enzyme-matchers/tree/master/packages/eslint-config-jest-enzyme): 只用当你使用[jest-environment-enzyme](https://github.com/enzymejs/enzyme-matchers/tree/master/packages/jest-environment-enzyme) 这个库的时候，这个扩展才会有效，使用 `jest-environment-enzyme` 时有一些全局变量，这个规则可以让 `eslint` 不报警告。

#### 插件

[eslint-plugin-babel](@babel/eslint-plugin) 已经变更为 [@babel/eslint-plugin](https://www.npmjs.com/package/@babel/eslint-plugin): 和 babel-eslint 一起用的一款插件.babel-eslint 在将 eslint 应用于 Babel 方面做得很好，但是它不能更改内置规则来支持实验性特性。eslint-plugin-babel 重新实现了有问题的规则，因此就不会误报一些错误信息

[eslint-plugin-import](https://github.com/import-js/eslint-plugin-import#sublimelinter-eslint) 该插目的是要支持对 ES2015+ (ES6+) import/export 语法的校验, 并防止一些文件路径拼错或者是导入名称错误的情况

[eslint-plugin-jsx-a11y](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y) 在 JSX 元素上，对可访问性规则进行静态 AST 检查。

[eslint-import-resolver-webpack](https://github.com/import-js/eslint-plugin-import/tree/main/resolvers/webpack) 在 webpack 项目之中， 我们会借助 alias 别名提升代码效率和打包效率。但是在使用了自定义的路径指向后，eslint 就会对应产生找不到模块的报错。这时候就需要`eslint-import-resolver-webpack`

[eslint-import-resolver-typescript](https://github.com/alexgorbatchev/eslint-import-resolver-typescript) 和 eslint-import-resolver-webpack 类似，主要是为了解决 alias 的问题

[eslint-plugin-react](https://github.com/yannickcr/eslint-plugin-react) React 专用的校验规则插件.

[eslint-plugin-jest](https://github.com/jest-community/eslint-plugin-jest) Jest 专用的 Eslint 规则校验插件.

[eslint-plugin-prettier](https://github.com/prettier/eslint-plugin-prettier) 该插件辅助 Eslint 可以平滑地与 Prettier 一起协作，并将 Prettier 的解析作为 Eslint 的一部分，在最后的输出可以给出修改意见。这样当 Prettier 格式化代码的时候，依然能够遵循我们的 Eslint 规则。如果你禁用掉了所有和代码格式化相关的 Eslint 规则的话，该插件可以更好得工作。所以你可以使用 eslint-config-prettier 禁用掉所有的格式化相关的规则(如果其他有效的 Eslint 规则与 prettier 在代码如何格式化的问题上不一致的时候，报错是在所难免的了)

[@typescript-eslint/eslint-plugin](https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/eslint-plugin) Typescript 辅助 Eslint 的插件。

[eslint-plugin-promise](https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/eslint-plugin) promise 规范写法检查插件，附带了一些校验规则。

#### 其他工具

[husky](https://github.com/typicode/husky) git 命令 hook 专用配置.

[lint-staged](https://github.com/okonet/lint-staged) 可以定制在特定的 git 阶段执行特定的命令。

#### ESLint 配置文件

[ESLint 配置](https://eslint.org/docs/user-guide/configuring/)

```javascript
module.exports =  {
  // 表示eslint检查只在当前目录生效
  root:true,

  // 默认ESlint使用Espree作为解析器，但是一旦我们使用babel的话，我们需要用@babel/eslint-parser。
  // 如果使用TS，则使用 @typescript-eslint/parser
  // Specifies the ESLint parser
  parser:  '@babel/eslint-parser',

  parserOptions: {
    // ecmaVersion: 默认值是5，可以设置为3、5、6、7、8、9、10，用来指定使用哪一个ECMAScript版本的 // 语法。也可以设置基于年份的JS标准，比如2015(ECMA 6),也可以设置 latest 使用最近支持的版本
    // specify the version of ECMAScript syntax you want to use: 2015 => (ES6)
    ecmaVersion: 'latest',
    // 如果你的代码是ECMAScript 模块写的，该字段配置为module，否则为script(默认值)
    sourceType:  'module',  // Allows for the use of imports
    // 额外的语言特性
    ecmaFeatures: {
      jsx: true, // enable JSX
      impliedStrict: true // enable global strict mode
    }，
      // babel 文件路径
    babelOptions: {
      configFile: './.babelrc',
    },
  },

  // 指定扩展的配置，配置支持递归扩展，支持规则的覆盖和聚合。
  extends:  [
    // // Uses airbnb, it including the react rule(eslint-plugin-react/eslint-plugin-jsx-a11y)
    'airbnb',
    // prettier规则额放在最后需要覆盖默认规则
    'plugin:prettier/recommended',
  ],

  // 字段定义的数据可以在所有的插件中共享。这样每条规则执行的时候都可以访问这里面定义的数据
  settings: {
    'import/resolver': { // This config is used by eslint-import-resolver-webpack
      webpack: {
        config: './webpack/webpack-common-config.js'
      }
    },
  },
  // 环境可以提供的全局变量
  env: {
    // enable all browser global variables
    browser: true
  },

  // 配置那些我们想要Linting规则的插件。
  // plugins: ['react-hooks', 'promise'],

  // 自定义规则，可以覆盖掉extends的配置。
  rules:  {
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off'
  },
};
```

#### VSCode 使用 eslint 自动修复

- 下载插件 `eslint`

- 在`setting.json`开启 eslint 自动修复配置

```json
"editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
}
```
