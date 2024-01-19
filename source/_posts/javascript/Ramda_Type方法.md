---
title: Ramda Type 方法源码解析
mathjax: true

date: 2021-01-19 16:01:47
categories:
  - JavaScript
tags:
  - 函数式编程
  - Ramda
---


#### type

toString 方法是Object内部实现的原型方法，实现方式中规定了某种类型的返回值

```javascript
var type = _curry1(function type(val) {
  return val === null
    ? 'Null'
    : val === undefined
      ? 'Undefined'
      : Object.prototype.toString.call(val).slice(8, -1);
});
export default type;

```