---
title: Proxy
mathjax: true

date: 2020-10-22 12:54:48
categories:
- JavaScript
tags:
- JavaScript
- ES6基础
---

#### 简介

Proxy 用于修改某些操作的默认行为，等同于在语言层面做出修改，所以属于一种“元编程”（meta programming），即对编程语言进行编程。

可以理解成 Proxy 代理了点运算符，和赋值运算符

通用用法： ES6 原生提供 Proxy 构造函数，用来生成 Proxy 实例。

```javascript
var object = { proxy: new Proxy(target, handler) };
```

`proxy`对象是`obj`对象的原型，`obj`对象本身并没有time属性，所以根据原型链，会在`proxy`对象上读取该属性，导致被拦截。

```javascript
var proxy = new Proxy({}, {
  get: function(target, propKey) {
    return 35;
  }
});

let obj = Object.create(proxy);
obj.time // 35
```

#### get()

`get` 方法用于拦截某个属性的读取操作，可以接受三个参数，依次为**目标对象、属性名和 `proxy` 实例本身**（严格地说，是操作行为所针对的对象），其中最后一个参数可选。

**如果一个属性不可配置（configurable）且不可写（writable），则 Proxy 不能修改该属性，否则通过 Proxy 对象访问该属性会报错。**

```javascript
const target = Object.defineProperties({}, {
  foo: {
    value: 123,
    writable: false,
    configurable: false
  },
});

const handler = {
  get(target, propKey) {
    return 'abc';
  }
};

const proxy = new Proxy(target, handler);

proxy.foo
// TypeError: Invariant check failed
```

#### set()

`set`方法用来拦截某个属性的赋值操作，可以接受四个参数，依次为目标对象、属性名、属性值和 `Proxy` 实例本身，其中最后一个参数可选。

**严格模式下，set代理如果没有返回true，就会报错。**

#### has()

**如果原对象不可配置或者禁止扩展，这时has()拦截会报错。**

**has()拦截只对in运算符生效，对for...in循环不生**

```javascript
var obj = { a: 10 };
Object.preventExtensions(obj);

var p = new Proxy(obj, {
  has: function(target, prop) {
    return false;
  }
});

'a' in p // TypeError is thrown
```

#### construct()

**construct()方法返回的必须是一个对象，否则会报错。**

```javascript
const p = new Proxy(function() {}, {
  construct: function(target, argumentsList) {
    return 1;
  }
});

new p() // 报错
// Uncaught TypeError: 'construct' on proxy: trap returned non-object ('1')
```

**由于construct()拦截的是构造函数，所以它的目标对象必须是函数，否则就会报错。**

```javascript
const p = new Proxy({}, {
  construct: function(target, argumentsList) {
    return {};
  }
});

new p() // 报错
// Uncaught TypeError: p is not a constructor
```

**construct()方法中的this指向的是handler，而不是实例对象。**

```javascript
const handler = {
  construct: function(target, args) {
    console.log(this ===  handler);
    return new target(...args);
  }
}

let p = new Proxy(function () {}, handler);
new p() // true
```

#### deleteProperty()

目标对象自身的不可配置（configurable）的属性，不能被deleteProperty方法删除，否则报错。

