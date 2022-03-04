---
layout: post
title: Class 类
abbrlink: 885dbafa
date: 2020-11-16 08:47:26
categories:
- JavaScript
- 基础
tags:
- JavaScript
- ES6基础
---


#### 修改返回的this对象

constructor方法默认返回实例对象（即this），完全可以指定返回另外一个对象。

```javascript
class Foo {
  constructor() {
    return Object.create(null);
  }
}

new Foo() instanceof Foo
// false
```

#### Class 表达式

```javascript
const MyClass = class Me {
  getClassName() {
    return Me.name;
  }
};
```

上面代码使用表达式定义了一个类。需要注意的是，这个类的名字是Me，但是Me只在 Class 的内部可用，指代当前类。在 Class 外部，这个类只能用MyClass引用。

如果类的内部没用到的话，可以省略Me

采用 Class 表达式，可以写出立即执行的 Class。

```javascript
let person = new class {
  constructor(name) {
    this.name = name;
  }

  sayName() {
    console.log(this.name);
  }
}('张三');

person.sayName(); // "张三"
```

#### 注意

+ ES6 实际上把整个语言升级到了严格模式。
+ 类不存在变量提升（hoist），这一点与 ES5 完全不同。必须保证子类在父类之后定义。
+ name属性总是返回紧跟在class关键字后面的类名。
+ Generator 方法

```javascript
class Foo {
  constructor(...args) {
    this.args = args;
  }
  * [Symbol.iterator]() {
    for (let arg of this.args) {
      yield arg;
    }
  }
}

for (let x of new Foo('hello', 'world')) {
  console.log(x);
}
```

+ 自动绑定this

```javascript
function selfish (target) {
  const cache = new WeakMap();
  const handler = {
    get (target, key) {
      const value = Reflect.get(target, key);
      if (typeof value !== 'function') {
        return value;
      }
      if (!cache.has(value)) {
        cache.set(value, value.bind(target));
      }
      return cache.get(value);
    }
  };
  const proxy = new Proxy(target, handler);
  return proxy;
}

const logger = selfish(new Logger());
```

#### 私有方法和私有属性

内部使用Proxy禁止内部属性的访问

#### new.target 属性

new是从构造函数生成实例对象的命令。ES6 为new命令引入了一个new.target属性，该属性一般用在构造函数之中，返回new命令作用于的那个构造函数。如果构造函数不是通过new命令或Reflect.construct()调用的，new.target会返回undefined，因此这个属性可以用来确定构造函数是怎么调用的。

**需要注意的是，子类继承父类时，new.target会返回子类。**利用这个特点，可以写出不能独立使用、必须继承后才能使用的类。

#### 继承

子类必须在constructor方法中调用super方法，否则新建实例时会报错。这是因为子类自己的this对象，必须先通过父类的构造函数完成塑造，得到与父类同样的实例属性和方法，然后再对其进行加工，加上子类自己的实例属性和方法。如果不调用super方法，子类就得不到this对象。

**另一个需要注意的地方是，在子类的构造函数中，只有调用super之后，才可以使用this关键字，否则会报错。这是因为子类实例的构建，基于父类实例，只有super方法才能调用父类实例。**


####  获取父类

`Object.getPrototypeOf`方法可以用来从子类上获取父类。因此，可以使用这个方法判断，一个类是否继承了另一个类。

```javascript
Object.getPrototypeOf(ColorPoint) === Point
// true
```

#### super 关键字

super这个关键字，既可以当作函数使用，也可以当作对象使用。在这两种情况下，它的用法完全不同。

+ 作为函数使用

**super()只能用在子类的构造函数之中，用在其他地方就会报错。**

**super虽然代表了父类A的构造函数，但是返回的是子类B的实例，即super内部的this指的是B的实例，因此super()在这里相当于A.prototype.constructor.call(this)。**

```javascript
class A {
  constructor() {
    console.log(new.target.name);
  }
}
class B extends A {
  constructor() {
    super();
  }
}
new A() // A
new B() // B
```

+ 作为对象使用

super作为对象时，在普通方法中，指向父类的原型对象；在静态方法中，指向父类。

**super在普通方法之中，指向A.prototype，所以super.p()就相当于A.prototype.p()。**，由于super指向父类的原型对象，所以定义在父类实例上的方法或属性，是无法通过super调用的。

**ES6 规定，在子类普通方法中通过super调用父类的方法时，方法内部的this指向当前的子类实例。**，由于this指向子类实例，所以如果通过super对某个属性赋值，这时super就是this，赋值的属性会变成子类实例的属性。

```javascript
  this.x = 2;
  super.x = 3;
  console.log(super.x); // undefined
  console.log(this.x); // 3
```

**如果super作为对象，用在静态方法之中，这时super将指向父类，而不是父类的原型对象。**

**在子类的静态方法中通过super调用父类的方法时，方法内部的this指向当前的子类，而不是子类的实例。**

由于对象总是继承其他对象的，所以可以在任意一个对象中，使用super关键字。

```javascript
var obj = {
  toString() {
    return "MyObject: " + super.toString();
  }
};

obj.toString(); // MyObject: [object Object]
```

#### 类的 prototype 属性和__proto__属性

```javascript
class A {}

A.__proto__ ===Function.prototype

A.prototype.__proto__=== Object.prototype

```

继承的实现方式

```javascript
class A {
}

class B {
}

// B 的实例继承 A 的实例
Object.setPrototypeOf(B.prototype, A.prototype);

// B 继承 A 的静态属性
Object.setPrototypeOf(B, A);

const b = new B();
```

```javascript
Object.setPrototypeOf(B.prototype, A.prototype);
// 等同于
B.prototype.__proto__ = A.prototype;

Object.setPrototypeOf(B, A);
// 等同于
B.__proto__ = A;
```

#### mixIn

```javascript
function mix(...mixIns) {
    class Mix {
        constructor() {
            for (let mixIn of mixIns) {
                copy(this, new mixIn())
            }
        }
    }
    for (let mixIn of mixIns) {
        copy(Mix, mixIn);
        copy(Mix.prototype, mixIn.prototype)
    }
    return Mix
}

function copy(target, source) {
    for (let key of Reflect.ownKeys(source)) {
        if (
            key !== 'constructor' &&
            key !== 'name' &&
            key !== 'prototype'
        ) {
            const desc = Object.getOwnPropertyDescriptor(source, key);
            Object.defineProperty(target, key, desc);
        }
    }
}

class A extends mix(B) {

}
```