---
title: Prettire配置指南
mathjax: true
categories:
  - DevOps
tags:
  - DevOps

date: 2021-09-12 21:50:39
---

#### 基础库

[prettier](https://github.com/prettier/prettier) 定义并实现了基本规则

[eslint-config-prettier](https://github.com/prettier/eslint-config-prettier) 关闭所有可能和 `prettier` 有冲突的规则

[eslint-plugin-prettier](https://github.com/prettier/eslint-plugin-prettier) 屏蔽了冲突规则之后，仍然想让`eslint`统一报错信息

[prettier-eslint](https://github.com/prettier/prettier-eslint) 可以通过 `eslint --fix` 来使用 `prettier` 格式化代码

[prettier-eslint-cli](https://github.com/prettier/prettier-eslint-cli) 以 cli 方式执行`prettier-eslint`

#### Prettier 影响的规则

[规则](https://prettier.io/docs/en/options.html)

#### Prettier 配置文件

一共有三种方式支持对 Prettier 进行配置：

- 根目录创建.prettierrc 文件，能够写入 YML、JSON 的配置格式，并且支持.yaml/.yml/.json/.js 后缀；
- 根目录创建.prettier.config.js 文件，并对外 export 一个对象；
- 在 package.json 中新建 prettier 属性。

[更多配置](https://prettier.io/docs/en/options.html)

```json
{
  "singleQuote": true,
  "semi": true,
  "printWidth": 80,
  "useTabs": false
}
```

#### 与 ESLint 结合

安装 prettier 插件

[ESLint 配置指南](/posts/ef51be94/)
