---
title: Ramda Object方法源码分析
mathjax: true
categories:
  - JavaScript
tags:
  - 函数式编程
  - Ramda

date: 2021-01-16 17:15:23
---


#### keys 

Safari 可能存在 argument.length 可枚举的bug

```javascript
var hasArgsEnumBug = (function() {
  'use strict';
  return arguments.propertyIsEnumerable('length');
}());
```

IE9一下`toString`方法存在可以枚举的bug

```javascript
// cover IE < 9 keys issues
var hasEnumBug = !({toString: null}).propertyIsEnumerable('toString');
var nonEnumerableProps = [
  'constructor', 'valueOf', 'isPrototypeOf', 'toString',
  'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'
];
```

```javascript
// 如果有原生 Object.keys 实现且Safari不存在bug
var keys = typeof Object.keys === 'function' && !hasArgsEnumBug ?
  _curry1(function keys(obj) {
    // 参数错误处理
    return Object(obj) !== obj ? [] : Object.keys(obj);
  }) :
  _curry1(function keys(obj) {
    if (Object(obj) !== obj) {
      return [];
    }
    var prop, nIdx;
    var ks = [];
    // 如果传入的对象时argument，而且有bug
    var checkArgsLength = hasArgsEnumBug && _isArguments(obj);
    // 循环对象每一项检查
    for (prop in obj) {
      if (_has(prop, obj) && (!checkArgsLength || prop !== 'length')) {
        ks[ks.length] = prop;
      }
    }
    // 如果有toString可枚举的bug
    if (hasEnumBug) {
      nIdx = nonEnumerableProps.length - 1;
      // 排除不可枚举的属性
      while (nIdx >= 0) {
        prop = nonEnumerableProps[nIdx];
        if (_has(prop, obj) && !contains(ks, prop)) {
          ks[ks.length] = prop;
        }
        nIdx -= 1;
      }
    }
    return ks;
  });
```