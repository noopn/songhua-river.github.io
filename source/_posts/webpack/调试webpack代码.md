---
title: 调试webpack代码
mathjax: true
categories:
  - webpack
tags:
  - 工程化
  - webpack

date: 2021-08-26 16:56:19
---


#### 通过浏览器调试

修改package.json配置

```javascript
"scripts": {
  "start": "node --inspect-brk ./node_modules/webpack/bin/webpack.js",
}
```

打开浏览器 chrome://inspect/#devices

![](0001.png)

点击inspect进行调试

