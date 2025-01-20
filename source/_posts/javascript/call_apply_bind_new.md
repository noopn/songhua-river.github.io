---
title: 实现自己的 call(),apply(),bind(),new()
mathjax: true

date: 2020-10-29 13:54:48
categories:
  - JavaScript
tags:
  - JavaScript
  - ES6基础
---

#### [call()](https://tc39.es/ecma262/multipage/fundamental-objects.html#sec-function.prototype.call)

第一步，改变 this 的指向, 当函数作为对象属性调用时，this 会指向对象，因此需要将参数包装成一个对象

```js
Function.prototype.myCall = function (thisArg) {
  let that = thisArg;
  if (that === undefined || that === null) that = window;
  if (typeof that === "number") that = new Number(that);
  if (typeof that === "string") that = new String(that);
  if (typeof that === "boolean") that = new Boolean(that);
  if (typeof that === "bigint") that = new BigInt(that);
  that.fn = this;
  that.fn();
};

function a() {
  console.log(this);
}
a.myCall(1);
a.myCall("2");
```

第二步，实现参数的传递，如果使用 ES6 可以使用剩余参数和扩展运算符

```js
Function.prototype.myCall = function (thisArg, ...args) {
  thisArg.fn = this;
  thisArg.fn(...args);
};

function a(a, b, c) {
  console.log(this, a, b, c);
}
a.myCall({ name: "name" }, 1, 2, 3);
```

在 ES5 中只用通过 `eval()` 实现，它可以执行一段字符串的脚本, 可以使用一个数组收集参数。

```js
Function.prototype.myCall = function (thisArg) {
  var that = thisArg;
  if (that === undefined || that === null) that = global;
  if (typeof that === "number") that = new Number(that);
  if (typeof that === "string") that = new String(that);
  if (typeof that === "boolean") that = new Boolean(that);
  if (typeof that === "bigint") that = new BigInt(that);
  if (typeof that === "symbol") that = new Symbol(that);
  var args = [];

  for (var i = 1; i < arguments.length; i++) {
    args.push("arguments[" + i + "]");
  }
  that.fn = this;

  // 这里args会进行隐式类型转换，调用toString方法
  return eval("that.fn(" + args + ")");
};

function a(a, b, c) {
  console.log(this, a, b, c);
  return a + b + c;
}
console.log(a.myCall(null, 1, 2, 3));
```

第三步，消除副作用， 由于在执行前在 thisArg 上添加了，fn 方法所以需要清除，也可以使用 Symbol 或自定义的随机数，从创建唯一的标识

```js
{
  var result = eval("that.fn(" + args + ")");
  delete that.fn;
  return result;
}
```

#### [apply()](https://tc39.es/ecma262/multipage/fundamental-objects.html#sec-function.prototype.apply)

apply 与 call 的区别只是参数的形式是数组，因此可以直接遍历参数，而不用使用 arguments

```js
Function.prototype.myApply = function (thisArg, args) {
  var argsArr = [];
  var result = void 0;
  thisArg.fn = this;

  if (!args) {
    result = eval("that.fn()");
  } else {
    for (var i = 1; i < args.length; i++) {
      argsArr.push("arguments[" + i + "]");
    }
    result = eval("that.fn(" + args + ")");
  }

  // 这里args会进行隐式类型转换，调用toString方法
  delete that.fn;
  return result;
};
```

#### [bind()](https://tc39.es/ecma262/multipage/fundamental-objects.html#sec-function.prototype.bind)

第一步, 验证 this 必须是一个函数， 这是为了避免 bind 方法 this 被修改 `fn.bind.call(null)`, 把 this 包装成新的函数并返回

```js
Function.prototype.myBind = function (thisArg) {
  if (typeof this !== "function")
    throw new TypeError("Bind must be called on a function");
  var boundTargetFunction = this;
  var args =
  return function boundFunction() {
    return boundTargetFunction.apply(newThis);
  };
};
```

第二步，处理参数，新函数调用时的参数需要和 bind 执行时的参数合并，共同传递给原函数

```js
Function.prototype.myBind = function (thisArg) {
  if (typeof this !== "function")
    throw new TypeError("Bind must be called on a function");
  var targetFunction = this;
  var args = Array.prototype.slice.call(arguments, 1);
  return function boundFunction() {
    return targetFunction.apply(
      args.concat(Array.prototype.slice.call(arguments, 1))
    );
  };
};
```

第三步，新函数需要保留原函数的原型方法，并区分调用方式

```js
Function.prototype.myBind = function (thisArg) {
  if (typeof this !== "function")
    throw new TypeError("Bind must be called on a function");
  var targetFunction = this;
  var args = Array.prototype.slice.call(arguments, 1);
  function boundFunction() {
    return targetFunction.apply(
      // 如果bind之后的函数用 new 调用，那么原函数中的 this 指向的应该是对象实例
      this instanceof boundFunction
        ? this
        : // 如果以普通函数调用，原函数this指向bind绑定时传入的值
          thisArg,
      args.concat(Array.prototype.slice.call(arguments, 1))
    );
  }
  // 拷贝源函数的原型链
  boundFunction.prototype = this.prototype;

  return boundFunction;
};
```

#### [new](https://tc39.es/ecma262/multipage/ecmascript-language-expressions.html#sec-new-operator)

new 操作接受一个函数

- 创建一个新对象这个对象就是 this
- 设置对象的原型为构造函数的原型
- 将函数的执行上下文添加进 this
- 执行函数，如果返回值是一个对象就直接返回
- 如果不是对象就返回创建的 this

```js
function myNew(Constructor, ...args) {
  const newObj = {};

  Object.setPrototypeOf(newObj, Constructor.prototype);

  let result = Constructor.apply(newObj, args);

  return result instanceof Object ? result : newObj;
}
```