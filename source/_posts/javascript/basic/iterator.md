---
title: Iterator
mathjax: true

date: 2020-10-29 22:44:37
categories:
  - JavaScript
  - 基础
tags:
  - JavaScript
  - ES6基础
---

#### 概念

ES6在原有`Array`,`Object`增加了`Map`,`Set`,共有4种用于表示集合的数据解构

遍历器（Iterator）是一种接口，为各种不同的数据结构提供统一的访问机制。任何数据结构只要部署 Iterator 接口，就可以完成遍历操作

Iterator 的作用有三个：

+ 一是为各种数据结构，提供一个统一的、简便的访问接

+ 二是使得数据结构的成员能够按某种次序排列

+ 三是 ES6 创造了一种新的遍历命令for...of循环，Iterator 接口主要供for...of消费。

Iterator 的遍历过程是这样的。

+ 创建一个指针对象，指向当前数据结构的起始位置。也就是说，遍历器对象本质上，就是一个指针对象。

+ 第一次调用指针对象的next方法，可以将指针指向数据结构的第一个成员。

+ 第二次调用指针对象的next方法，指针就指向数据结构的第二个成员。

+ 不断调用指针对象的next方法，直到它指向数据结构的结束位置。

每一次调用next方法，都会返回数据结构的当前成员的信息。具体来说，就是返回一个包含value和done两个属性的对象。其中，value属性是当前成员的值，done属性是一个布尔值，表示遍历是否结束。

#### 默认 Iterator 接口

当使用for...of循环遍历某种数据结构时，该循环会自动去寻找 Iterator 接口。

ES6 规定，默认的 Iterator 接口部署在数据结构的`Symbol.iterator`属性.

一种数据结构只要部署了 Iterator 接口，我们就称这种数据结构是“可遍历的”（iterable）。

原生具备 Iterator 接口的数据结构如下。

+ Array
+ Map
+ Set
+ String
+ TypedArray
+ 函数的 arguments 对象
+ NodeList 对象


对象（Object）之所以没有默认部署 Iterator 接口，是因为对象的哪个属性先遍历，哪个属性后遍历是不确定的，需要开发者手动指定。本质上，遍历器是一种线性处理，对于任何非线性的数据结构，部署遍历器接口，就等于部署一种线性转换。不过，严格地说，对象部署遍历器接口并不是很必要，因为这时对象实际上被当作 Map 结构使用，ES5 没有 Map 结构，而 ES6 原生提供了。

#### 调用场合

+ 解构赋值

+ 扩展运算符

+ yield*

数组的遍历会调用遍历器接口，所以任何接受数组作为参数的场合，其实都调用了遍历器接口

+ for...of
+ Array.from()
+ Map(), Set(), WeakMap(), WeakSet()（比如new Map([['a',1],['b',2]])）
+ Promise.all()
+ Promise.race()

#### 结合Generator函数

```javascript
let obj = {
  * [Symbol.iterator]() {
    yield 'hello';
    yield 'world';
  }
};
```

#### 遍历器对象的 return()，throw()

return()方法的使用场合是，如果for...of循环提前退出（通常是因为出错，或者有break语句），就会调用return()方法。如果一个对象在完成遍历前，需要清理或释放资源，就可以部署return()方法。

return()方法必须返回一个对象，这是 Generator 语法决定的。

throw()方法主要是配合 Generator 函数使用，一般的遍历器对象用不到这个方法。

#### 与其他遍历语法

`forEach`无法中途跳出

`for...in`循环有几个缺点。数组的键名是数字，但是`for...in`循环是以字符串作为键名“0”、“1”、“2”等等。

`for...in`循环不仅遍历数字键名，还会遍历手动添加的其他键，甚至包括原型链上的键。某些情况下，`for...in`循环会以任意顺序遍历键名。

`for...of`有着同for...in一样的简洁语法，但是没有for...in那些缺点。不同于forEach方法，它可以与break、continue和return配合使用。提供了遍历所有数据结构的统一操作接口。