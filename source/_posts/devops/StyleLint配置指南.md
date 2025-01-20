---
title: StyleLint配置指南
mathjax: true
categories:
  - DevOps
tags:
  - DevOps

date: 2021-09-13 11:02:29
---


#### 基础包

[stylelint](https://stylelint.io/user-guide/get-started) 有力的，现代的 lint 工具，帮助你在 style 中避免错误， 按照约定转换会规则。

[stylelint-config-standard](https://github.com/stylelint/stylelint-config-standard) stylelint 配置共享库，可以通过 rules 覆盖规则

[stylelint-order](https://github.com/hudochenkov/stylelint-order) 一个为 stylelint 规则排序的插件包

[stylelint-config-sass-guidelines](https://github.com/bjankord/stylelint-config-sass-guidelines) 如果你写 SCSS 可以用这个包

[stylelint-scss](https://github.com/kristerkari/stylelint-scss) 一个SCSS的规则集合


#### 配置文件

```javascript
{
  "extends": "stylelint-config-sass-guidelines",
  "plugins": [
    "stylelint-scss",
    "stylelint-order"
  ],
  "rules": {
    "order/properties-order": [
      "position",
      "top",
      "right",
      "bottom",
      "left",
      "z-index",
      "display",
      "justify-content",
      "align-items",
      "float",
      "clear",
      "overflow",
      "overflow-x",
      "overflow-y",
      "margin",
      "margin",
      "margin-top",
      "margin-right",
      "margin-bottom",
      "margin-left",
      "border",
      "border-style",
      "border-width",
      "border-color",
      "border-top",
      "border-top-style",
      "border-top-width",
      "border-top-color",
      "border-right",
      "border-right-style",
      "border-right-width",
      "border-right-color",
      "border-bottom",
      "border-bottom-style",
      "border-bottom-width",
      "border-bottom-color",
      "border-left",
      "border-left-style",
      "border-left-width",
      "border-left-color",
      "border-radius",
      "padding",
      "padding-top",
      "padding-right",
      "padding-bottom",
      "padding-left",
      "width",
      "min-width",
      "max-width",
      "height",
      "min-height",
      "max-height",
      "font-size",
      "font-family",
      "font-weight",
      "text-align",
      "text-justify",
      "text-indent",
      "text-overflow",
      "text-decoration",
      "white-space",
      "color",
      "background",
      "background-position",
      "background-repeat",
      "background-size",
      "background-color",
      "background-clip",
      "opacity",
      "filter",
      "list-style",
      "outline",
      "visibility",
      "box-shadow",
      "text-shadow",
      "resize",
      "transition"
    ]
  }
}
```

#### 忽略配置

+ 忽略整个文件，在首行加入 `/* stylelint-disable */`

```html
/* stylelint-disable */
html {}
```

+ 忽略多行

```html
/* stylelint-disable */
html {}
.div {
    color: red;
}
/* stylelint-enable */
```

+ 忽略一行， 在样式前加入 `/* stylelint-disable-next-line */` 以忽略该行

```html
#id {
  /* stylelint-disable-next-line */
  color: pink !important;
}
```

+ `.stylelintrc.json` 配置文件

#### 自动格式化

+ 安裝 StyleLint

+ 在 settings.json 文件设置

```javascript
{
  "editor.codeActionsOnSave": {
    "source.fixAll.stylelint": true
  }
}
```

#### 与 Prettier 结合

[stylelint-prettier](https://github.com/prettier/stylelint-prettier) 让 Prettier 作为 StyleLint 的规则，并让 StyleLint 统一报错

[stylelint-config-prettier](https://github.com/prettier/stylelint-config-prettier) 关闭所有可能冲突的配置

配置文件

```javascript
{
  "extends": [
    "stylelint-config-sass-guidelines",
    "stylelint-prettier/recommended"
  ],
  "plugins": [
    "stylelint-scss"
  ]
}
```