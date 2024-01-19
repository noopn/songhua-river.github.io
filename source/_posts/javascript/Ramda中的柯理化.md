---
title: Ramda中的柯理化
mathjax: true
categories:
  - JavaScript
tags:
  - 函数式编程
  - Ramda

date: 2021-01-15 21:54:03
---

#### _curry1

内置接口，保证了参数的个数，无需判断

```javascript
/**
 * Optimized internal one-arity curry function.
 *
 * @private
 * @category Function
 * @param {Function} fn The function to curry.
 * @return {Function} The curried function.
 */

export default function _curry1(fn) {
  return function f1(a) {
    if (arguments.length === 0 || _isPlaceholder(a)) {
      return f1;
    } else {
      return fn.apply(this, arguments);
    }
  };
}
```


#### _curry2

如果以值的真假为纬度分支会比较复杂，而且不能正确参数的位置

```javascript
const _curry2 = function (fn) {
  return function f2(a, b) {
    return a !== undefined && b !== undefined
      ? _isPlaceholder(a) && _isPlaceholder(b)
        ? f2
        : isPlaceholder(a)
          ? _curry1(function (_a) { return fn(_a, b) })
          : _isPlaceholder(b)
            ? _curry1(function (_b) { return fn(a, _b) })
            : fn.apply(this, arguments)
      : a !== undefined
        ? _curry1(function (_b) { return fn(a, _b) })
        : f2
  }
}
```

作者以参数的个数为纬度考虑

```javascript
/**
 * Optimized internal two-arity curry function.
 *
 * @private
 * @category Function
 * @param {Function} fn The function to curry.
 * @return {Function} The curried function.
 */
export default function _curry2(fn) {
  return function f2(a, b) {
    switch (arguments.length) {
      case 0:
        return f2;
      case 1:
        // 如果a传入的是undefined也是一个参数
        return _isPlaceholder(a)
          ? f2
          : _curry1(function(_b) { return fn(a, _b); });
      default:
        return _isPlaceholder(a) && _isPlaceholder(b)
          ? f2
          : _isPlaceholder(a)
            ? _curry1(function(_a) { return fn(_a, b); })
            : _isPlaceholder(b)
              ? _curry1(function(_b) { return fn(a, _b); })
              : fn(a, b);
    }
  };
}
```


#### _curry3

同理增加分支判断

```javascript
/**
 * Optimized internal three-arity curry function.
 *
 * @private
 * @category Function
 * @param {Function} fn The function to curry.
 * @return {Function} The curried function.
 */
export default function _curry3(fn) {
  return function f3(a, b, c) {
    switch (arguments.length) {
      case 0:
        return f3;
      case 1:
        return _isPlaceholder(a)
          ? f3
          : _curry2(function(_b, _c) { return fn(a, _b, _c); });
      case 2:
        return _isPlaceholder(a) && _isPlaceholder(b)
          ? f3
          : _isPlaceholder(a)
            ? _curry2(function(_a, _c) { return fn(_a, b, _c); })
            : _isPlaceholder(b)
              ? _curry2(function(_b, _c) { return fn(a, _b, _c); })
              : _curry1(function(_c) { return fn(a, b, _c); });
      default:
        return _isPlaceholder(a) && _isPlaceholder(b) && _isPlaceholder(c)
          ? f3
          // 其中两个是占位符的情况
          : _isPlaceholder(a) && _isPlaceholder(b)
            ? _curry2(function(_a, _b) { return fn(_a, _b, c); })
            : _isPlaceholder(a) && _isPlaceholder(c)
              ? _curry2(function(_a, _c) { return fn(_a, b, _c); })
              : _isPlaceholder(b) && _isPlaceholder(c)
                ? _curry2(function(_b, _c) { return fn(a, _b, _c); })
                // 其中一个是占位符的情况
                : _isPlaceholder(a)
                  ? _curry1(function(_a) { return fn(_a, b, c); })
                  : _isPlaceholder(b)
                    ? _curry1(function(_b) { return fn(a, _b, c); })
                    : _isPlaceholder(c)
                      ? _curry1(function(_c) { return fn(a, b, _c); })
                      : fn(a, b, c);
    }
  };
}
```

#### curry

共有方法curry的实现， 对共有方法curryN的封装，在不确定参数个数时候通过 `fn.length` 获取参数长度

```javascript
var curry = _curry1(function curry(fn) {
  return curryN(fn.length, fn);
});
```

#### curryN

需要指定参数的个数， 抽象出参数个数的判断，最多个数为10个，防止参数过多造成栈溢出

_arity 对参数个数的处理

```javascript
export default function _arity(n, fn) {
  /* eslint-disable no-unused-vars */
  switch (n) {
    case 0: return function() { return fn.apply(this, arguments); };
    case 1: return function(a0) { return fn.apply(this, arguments); };
    case 2: return function(a0, a1) { return fn.apply(this, arguments); };
    // ...
    case 10: return function(a0, a1, a2, a3, a4, a5, a6, a7, a8, a9) { return fn.apply(this, arguments); };
    default: throw new Error('First argument to _arity must be a non-negative integer no greater than ten');
  }
}

```

```javascript
var curryN = _curry2(function curryN(length, fn) {
  if (length === 1) {
    return _curry1(fn);
  }
  return _arity(length, _curryN(length, [], fn));
});
```

在参数较少时使用其他的内置方法  

```javascript
function curryN(length, fn) {
  return _curry2(function (length, fn) {
    return length === 1
      ? _curry1(fn)
      : length === 2
        ? _curry2(fn)
        : length === 3
          ? _curry3(fn)
          : _arity(length, _curryN(length, [], fn))
  })
}
```


#### _curryN 核心方法

下面是一段糟糕的代码

receive保持了源数组的引用，不符合函数式编成数据不可变的思想

每次添加新参数，都要查询可添加的位置

```javascript
// 1. 真实参数个数和length项等 则执行函数
// 2. 实时记录占位符的位置， 新参数优先放到占位符
function _curryN(length, receive, fn) {
  return function fN() {
    var index = 0;
    var zw = 0;
    function findzw(zw, receive) {
      while (zw < receive.length) {
        if (_isPlaceholder(receive[zw])) {
          //指向占位符的前一位， 方便后面处理
          return zw - 1
        }
        zw++
      }
      return zw - 1
    }
    // 找到占位符的位置
    zw = findzw(zw, receive);
    while (index < arguments.length) {
      receive[zw + 1] = arguments[index];
      //更新之后重新查找占位符, 条过当前的占位符
      zw = findzw(zw + 1, receive);
      index++;
    }
    // 没有占位符 则位置+1为参数长度
    if (zw + 1 === length) {
      return fn.apply(this, receive)
    } else {
      // 计算剩余参数
      var j = 0;
      var len = 0
      while (j < receive.length) {
        if (!_isPlaceholder(receive[index])) {
          len++;
        }
        j++
      }
      return _arity(length - len, _curryN(length, receive, fn))
    }
  }
}
```

源码的实现

```javascript
function _curryN(length, receive, fn) {
  return function () {
    // 复制已接受参数的数组
    var combined = [];
    // 遍历入参的索引
    var argsIdx = 0;
    // 剩余参数
    var left = length;
    // 遍历已接受参数索引
    var combinedIdx = 0;

    // 如果参数没有复制完成，或新如参没有添加完成则继续执行
    while (combinedIdx < received.length || argsIdx < arguments.length) {
      var result;
      // 通过条件语句处理了占位符的问题
      // 如果老参数没有复制完成，且复制的值不是占位符，或者入参已经都处理了，直接取出当前的老参数，用于复制到新的数组中
      // 通过双指针解决占位符的问题
      if (combinedIdx < received.length &&
        (!_isPlaceholder(received[combinedIdx]) ||
          argsIdx >= arguments.length)) {
        result = received[combinedIdx];
      } else {
        // 如果老参数都复制完，或者时占位符，或者还有新参数没有复制
        // 取一个新参数加到数组中
        result = arguments[argsIdx];
        argsIdx += 1;
      }
      // 添加到新数组中
      combined[combinedIdx] = result;
      // 如果不是占位符剩余参数 -1
      if (!_isPlaceholder(result)) {
        left -= 1;
      }
      combinedIdx += 1;
    }
    // 如果没有剩余参数直接执行
    return left <= 0
      ? fn.apply(this, combined)
      // 否则通过_arity固定新函数的参数个数
      : _arity(left, _curryN(length, combined, fn));
  };
}
```
