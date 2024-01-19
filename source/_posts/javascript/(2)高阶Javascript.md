---
title: 2.进阶
mathjax: true

date: 2020-10-30 12:34:24
categories:
  - JavaScript
tags:
  - 函数式编程
---

为什么说JavaScript是适合函数式的编程语言
JavaScript语言的多范型开发
不可变性和变化的对策
理解高阶函数和一等函数
闭包和作用域的概念探讨
闭包的实际使用

#### 函数式与面向对象

面向对象的关键是创建继承层次结构（如继承Person的Student对象）并将方法与数据紧密的绑定在一起。函数式编程则更倾向于通过广义的多态函数交叉应用于不同的数据类型，同时避免使用this

#### 属性保护

![](0001.jpg)

试用递归来冻结数属性

```javascript
var isObject = (val) => val && typeof val === 'object';
function deepFreeze(obj) {
  if(isObject(obj) //遍历所有属性并递归调用Object.freeze()（使用第3章介绍的map）
    && !Object.isFrozen(obj)) { //跳过已经冻结过的对象，冻结没有被冻结过的对象
    Object.keys(obj). //跳过所有的函数，即使从技术上说，函数也可以被修改，但是我们更希望注意在数据的属性上
  forEach(name => deepFreeze(obj[name])); //递归地自调用（第3章会介绍递归）
    Object.freeze(obj); //冻结根对象
  }
return obj;
}
```

**R.lensProp** 保证对象属性的不可变性

#### 函数

需要区分表达式（如返回一个值的函数）和语句（如不返回值的函数）。命令式编程和过程式程序大多是由一系列有序的语句组成的，而函数式编程完全依赖于表达式，因此无值函数在该范式下并没有意义。

+ 一等函数

+ 高阶函数


#### 闭包作用域


