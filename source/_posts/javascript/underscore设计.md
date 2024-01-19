---
layout: post
title: underscore框架设计
categories:
  - JavaScript
tags:
  - 函数式编程
  - underscore

date: 2020-12-02 13:44:27
---

#### 立即执行函数

使用立即执行函数，创建局部作用域，隔离环境并初始化代码

```javascript
(function (global, factory) {

}(this, function () {}))
```

#### 判断采用那种模块化规范导出

```javascript
// commomjs 规范
typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
// amd 规范
typeof define === 'function' && define.amd ? define('underscore', factory) :
// 如果都不是则 直接挂在this上
(global = global || self, (function () {
  var current = global._;
  var exports = global._ = factory();
  //防止多次引入冲突
  exports.noConflict = function () {
    global._ = current;
    return exports;
  };
}()));
```

#### 创建根节点

```javascript
// 建立根节点对象，self 在浏览器端， global 在服务端， this 在一些虚拟机中，使用self 代替 window 提供对 Webworker 的支持
var root = typeof self == 'object' && self.self === self && self ||
          typeof global == 'object' && global.global === global && global ||
          Function('return this')() ||
          {};
```

#### each方法

**each 依赖的函数**

一个内部函数，根据参数返回不同的回调函数的封装，一个复用的方法
```javascript
function optimizeCb(func, context, argCount) {

  // 没有传入执行上下文， 直接返回函数
  if (context === void 0) return func;
  switch (argCount == null ? 3 : argCount) {
    case 1:
      return function (value) {
        return func.call(context, value);
      };
      // The 2-argument case is omitted because we’re not using it.
    case 3:
      return function (value, index, collection) {
        return func.call(context, value, index, collection);
      };
    case 4:
      return function (accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
  }
  return function () {
    return func.apply(context, arguments);
  };
}
```

**isArrayLike**

```javascript
var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;


// 简单获取属性值
function shallowProperty(key) {
  return function (obj) {
    return obj == null ? void 0 : obj[key];
  };
}

var getLength = shallowProperty('length');

// 属性检查 数字格式，且不能超过数组最大值
function createSizePropertyCheck(getSizeProperty) {
  return function (collection) {
    var sizeProperty = getSizeProperty(collection);
    return typeof sizeProperty == 'number' && sizeProperty >= 0 && sizeProperty <= MAX_ARRAY_INDEX;
  }
}

var isArrayLike = createSizePropertyCheck(getLength);
```

```javascript
function each(obj, iteratee, context) {
  iteratee = optimizeCb(iteratee, context);
  var i, length;
  if (isArrayLike(obj)) {
    for (i = 0, length = obj.length; i < length; i++) {
      iteratee(obj[i], i, obj);
    }
  } else {
    var _keys = keys(obj);
    for (i = 0, length = _keys.length; i < length; i++) {
      iteratee(obj[_keys[i]], _keys[i], obj);
    }
  }
  return obj;
}
```

#### 挂载方法 混合模式

依赖的函数

```javascript
//内部方法，创建一个toString 基础测试器
  function tagTester(name) {
    var tag = '[object ' + name + ']';
    return function (obj) {
      return toString.call(obj) === tag;
    };
  }
  var isFunction = tagTester('Function');
  var isFunction$1 = isFunction;

  //返回一个排序的 所有工具函数名的数组
  function functions(obj) {
    var names = [];
    for (var key in obj) {
      if (isFunction$1(obj[key])) names.push(key);
    }
    return names.sort();
  }
```

**定义underscore方法**

+ 如果是underscore实例直接返回
+ 如果不是通过new操作符执行函数
+ 再次进入第二行的判断，这时已经是underscore的实例会继续往下执行
+ 在实例上挂在一个变量指向传入的对象

```javascript
function _(obj) {
  if (obj instanceof _) return obj;
  if (!(this instanceof _)) return new _(obj);
  this._wrapped = obj;
}
```

**核心mixin 方法**

```javascript
function mixin(obj) {

  // 循环所有导出方法的名称
  each(functions(obj), function (name) {
    // 每个名称对应的方法
    var func = _[name] = obj[name];
    //  在原型上挂载同样的方法
    _.prototype[name] = function () {
      //拿到上面挂载的 传入的对象
      var args = [this._wrapped];
      // 拼接为整个数组 
      Array.prototype.push.apply(args, arguments);
      //直接用定义的内置方法执行
      return chainResult(this, func.apply(_, args));
    };
  });
  return _;
}

var allExports = {
  each:each
}

var _$1 = mixin(allExports);
// Legacy Node.js API.
_$1._ = _$1;

return _$1;
```

所以可以用下面的方法执行方法

```javascript
_([1,2,3]).each(function(item){console.log(item)});
```

