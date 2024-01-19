---
title: Ramda 私有方法源码分析
mathjax: true
categories:
  - JavaScript
tags:
  - 函数式编程
  - Ramda

date: 2021-01-16 16:26:50
---

#### _objectIs

[Object.is](https://developer.mozilla.org/zh-cn/docs/web/javascript/reference/global_objects/object/is) 用于判断两值是否项等

```javascript
function _objectIs(a, b) {
  // MDN polyfill
  if (a === b) {
    // Steps 6.b-6.e: +0 != -0
    return a !== 0 || 1 / a === 1 / b;
  } else {
    // Step 6.a: NaN == NaN
    return a !== a && b !== b;
  }
}
export default typeof Object.is === 'function' ? Object.is : _objectIs;

```

#### _arrayFromIterator

```javascript
export default function _arrayFromIterator(iter) {
  var list = [];
  var next;
  while (!(next = iter.next()).done) {
    list.push(next.value);
  }
  return list;
}
```

#### _functionName

[function.name](https://developer.mozilla.org/zh-cn/docs/web/javascript/reference/global_objects/function/name) 可能被压缩工具修改，不能依赖函数名来判断函数

作者通过正则方式判断

```javascript
export default function _functionName(f) {
  // String(x => x) evaluates to "x => x", so the pattern may not match.
  var match = String(f).match(/^function (\w*)/);
  return match == null ? '' : match[1];
}

```

#### _has

判断属性在对象的实例上，而不是在原型上

```javascript
export default function _has(prop, obj) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}
```

等价于

```javascript
Reflect.has(obj, prop)
```


#### _isArguments

实现了 `callee` 方法数组也可以当作是形式参数

```javascript
var toString = Object.prototype.toString;
var _isArguments = (function() {
  return toString.call(arguments) === '[object Arguments]' ?
    function _isArguments(x) { return toString.call(x) === '[object Arguments]'; } :
    function _isArguments(x) { return _has('callee', x); };
}());
```

#### _concat 

通过双循环，涵盖了array-like类型，

```javascript
/**
 * Private `concat` function to merge two array-like objects.
 *
 * @private
 * @param {Array|Arguments} [set1=[]] An array-like object.
 * @param {Array|Arguments} [set2=[]] An array-like object.
 * @return {Array} A new, merged array.
 * @example
 *
 *      _concat([4, 5, 6], [1, 2, 3]); //=> [4, 5, 6, 1, 2, 3]
 */
export default function _concat(set1, set2) {
  set1 = set1 || [];
  set2 = set2 || [];
  var idx;
  var len1 = set1.length;
  var len2 = set2.length;
  var result = [];

  idx = 0;
  while (idx < len1) {
    result[result.length] = set1[idx];
    idx += 1;
  }
  idx = 0;
  while (idx < len2) {
    result[result.length] = set2[idx];
    idx += 1;
  }
  return result;
}

```


#### _dispatchable

dispatchable翻译为调度单元，这个方法用在了类似 [`R.all`](/posts/6ac7a6cf/#all) 遍历每一项的方法上

如果如参是一个数组会按照常规循环方式处理，如果不是数组但是对象携带了传入的方法s数组(`[all]`)其中的一个，将会调用对象携带的方法

```javascript
export default function _dispatchable(methodNames, transducerCreator, fn) {
  return function() {
    if (arguments.length === 0) {
      return fn();
    }
    var obj = arguments[arguments.length - 1];
    if (!_isArray(obj)) {
      var idx = 0;
      while (idx < methodNames.length) {
        if (typeof obj[methodNames[idx]] === 'function') {
          return obj[methodNames[idx]].apply(obj, Array.prototype.slice.call(arguments, 0, -1));
        }
        idx += 1;
      }
      if (_isTransformer(obj)) {
        var transducer = transducerCreator.apply(null, Array.prototype.slice.call(arguments, 0, -1));
        return transducer(obj);
      }
    }
    return fn.apply(this, arguments);
  };
}
```

#### _arrayFromIterator

```javascript
export default function _arrayFromIterator(iter) {
  var list = [];
  var next;
  while (!(next = iter.next()).done) {
    list.push(next.value);
  }
  return list;
}
```

#### _equals

用在了涉及到比较的方法上,例如 `R.equals`

[_objectIs](/posts/2b6baf0c/#_objectIs)

[type](/posts/54a7cf63/#type)

[_arrayFromIterator](/posts/54a7cf63/#_arrayFromIterator)


```javascript

// 处理map set 集合

function _uniqContentEquals(aIterator, bIterator, stackA, stackB) {
  var a = _arrayFromIterator(aIterator);
  var b = _arrayFromIterator(bIterator);

  function eq(_a, _b) {
    return _equals(_a, _b, stackA.slice(), stackB.slice());
  }

  // if *a* array contains any element that is not included in *b*
  return !_includesWith(function(b, aItem) {
    return !_includesWith(eq, aItem, b);
  }, b, a);
}

export default function _equals(a, b, stackA, stackB) {
  // 引用相同，基本类型的值相同
  if (_objectIs(a, b)) {
    return true;
  }

  // 类型不同
  var typeA = type(a);

  if (typeA !== type(b)) {
    return false;
  }

  // 引用不同的情况
  //  ??????
  if (typeof a['fantasy-land/equals'] === 'function' || typeof b['fantasy-land/equals'] === 'function') {
    return typeof a['fantasy-land/equals'] === 'function' && a['fantasy-land/equals'](b) &&
      typeof b['fantasy-land/equals'] === 'function' && b['fantasy-land/equals'](a);
  }

  // 如果自身实现了equals方法
  if (typeof a.equals === 'function' || typeof b.equals === 'function') {
    return typeof a.equals === 'function' && a.equals(b) &&
      typeof b.equals === 'function' && b.equals(a);
  }

  // 其他引用类型
  switch (typeA) {
    case 'Arguments':
    case 'Array':
    case 'Object':
      // 引用类型如果为Promise实例，看作是项等的
      if (typeof a.constructor === 'function' &&
        _functionName(a.constructor) === 'Promise') {
        return a === b;
      }
      break;
    // 基本类型的装箱对象
    case 'Boolean':
    case 'Number':
    case 'String':
      if (!(typeof a === typeof b && _objectIs(a.valueOf(), b.valueOf()))) {
        return false;
      }
      break;
    case 'Date':
    // 时间类型转为事件戳
      if (!_objectIs(a.valueOf(), b.valueOf())) {
        return false;
      }
      break;
    case 'Error':
      return a.name === b.name && a.message === b.message;
    case 'RegExp':
    // 正则类型的所有实例方法的实现相同
      if (!(a.source === b.source &&
          a.global === b.global &&
          a.ignoreCase === b.ignoreCase &&
          a.multiline === b.multiline &&
          a.sticky === b.sticky &&
          a.unicode === b.unicode)) {
        return false;
      }
      break;
  }
  // 处理map set集合
  var idx = stackA.length - 1;
  while (idx >= 0) {
    if (stackA[idx] === a) {
      return stackB[idx] === b;
    }
    idx -= 1;
  }

  switch (typeA) {
    case 'Map':
      if (a.size !== b.size) {
        return false;
      }

      return _uniqContentEquals(a.entries(), b.entries(), stackA.concat([a]), stackB.concat([b]));
    case 'Set':
      if (a.size !== b.size) {
        return false;
      }

      return _uniqContentEquals(a.values(), b.values(), stackA.concat([a]), stackB.concat([b]));
    case 'Arguments':
    case 'Array':
    case 'Object':
    case 'Boolean':
    case 'Number':
    case 'String':
    case 'Date':
    case 'Error':
    case 'RegExp':
    case 'Int8Array':
    case 'Uint8Array':
    case 'Uint8ClampedArray':
    case 'Int16Array':
    case 'Uint16Array':
    case 'Int32Array':
    case 'Uint32Array':
    case 'Float32Array':
    case 'Float64Array':
    case 'ArrayBuffer':
      break;
    default:
      // Values of other types are only equal if identical.
      // 其他类型只有引用相同才算项等
      return false;
  }

  // 处理数组或对象的每一个值是否项等
  var keysA = keys(a);
  if (keysA.length !== keys(b).length) {
    return false;
  }

  var extendedStackA = stackA.concat([a]);
  var extendedStackB = stackB.concat([b]);

  idx = keysA.length - 1;
  while (idx >= 0) {
    var key = keysA[idx];
    if (!(_has(key, b) && _equals(b[key], a[key], extendedStackA, extendedStackB))) {
      return false;
    }
    idx -= 1;
  }
  return true;
}

```