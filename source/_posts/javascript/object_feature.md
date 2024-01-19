---
title: Object新特性
mathjax: true

date: 2020-10-18 14:23:49
categories:
- JavaScript
tags:
- JavaScript
- ES6基础
---


#### 属性的简洁表示法

```javascript
const foo = 'bar';
const baz = {foo};
```

#### 属性名表达式

性名表达式如果是一个对象，默认情况下会自动将对象转为字符串`[object Object]`

```javascript
let propKey = 'foo';

let obj = {
  [propKey]: true,
  ['a' + 'bc']: 123
};
```

#### 方法的 name 属性

函数的name属性，返回函数名。对象方法也是函数，因此也有name属性。

如果对象的方法使用了取值函数（getter）和存值函数（setter），则name属性不是在该方法上面，而是该方法的属性的描述对象的get和set属性上面，返回值是方法名前加上get和set。

```javascript
const obj = {
  get foo() {},
  set foo(x) {}
};

obj.foo.name
// TypeError: Cannot read property 'name' of undefined

const descriptor = Object.getOwnPropertyDescriptor(obj, 'foo');

descriptor.get.name // "get foo"
descriptor.set.name // "set foo"
```

有两种特殊情况：bind方法创造的函数，name属性返回bound加上原函数的名字；Function构造函数创造的函数，name属性返回anonymous。

```javascript
(new Function()).name // "anonymous"

var doSomething = function() {
  // ...
};
doSomething.bind().name // "bound doSomething"
```

如果对象的方法是一个 Symbol 值，那么name属性返回的是这个 Symbol 值的描述。

```javascript
const key1 = Symbol('description');
const key2 = Symbol();
let obj = {
  [key1]() {},
  [key2]() {},
};
obj[key1].name // "[description]"
obj[key2].name // ""
```

####  属性的可枚举性和遍历

##### 可枚举性

对象的每个属性都有一个描述对象（Descriptor），用来控制该属性的行为。Object.getOwnPropertyDescriptor方法可以获取该属性的描述对象。

```javascript
let obj = { foo: 123 };
Object.getOwnPropertyDescriptor(obj, 'foo')
//  {
//    value: 123,
//    writable: true,
//    enumerable: true,
//    configurable: true
//  }
```


有四个操作会忽略enumerable为false的属性。

+ `for...in`循环：只遍历对象自身的和继承的可枚举的属性。

+ `Object.keys()`：返回对象自身的所有可枚举的属性的键名。

+ `JSON.stringify()`：只串行化对象自身的可枚举的属性。

+ `Object.assign()`： 忽略`enumerable`为`false`的属性，只拷贝对象自身的可枚举的属性。

`Class` 的原型的方法都是不可枚举的。

```javascript
Object.getOwnPropertyDescriptor(class {foo() {}}.prototype, 'foo').enumerable
// false
```

操作中引入继承的属性会让问题复杂化，大多数时候，我们只关心对象自身的属性。所以，尽量不要用`for...in`循环，而用`Object.keys()`代替。

##### 属性的遍历

+ `for...in`循环遍历对象自身的和继承的可枚举属性（不含 Symbol 属性）。

+ `Object.keys`返回一个数组，包括对象自身的（不含继承的）所有可枚举属性（不含 Symbol 属性）的键名。

+ `Object.getOwnPropertyName`s返回一个数组，包含对象自身的所有属性（不含 Symbol 属性，**但是包括不可枚举属性**）的键名。

+ `Object.getOwnPropertySymbols`返回一个数组，包含对象自身的所有 Symbol 属性的键名。

+ `Reflect.ownKeys`返回一个数组，包含对象自身的（不含继承的）所有键名，不管键名是 Symbol 或字符串，也不管是否可枚举。

以上的 5 种方法遍历对象的键名，都遵守同样的属性遍历的次序规则。

+ 首先遍历所有数值键，按照数值升序排列。

+ 其次遍历所有字符串键，按照加入时间升序排列。

+ 最后遍历所有 Symbol 键，按照加入时间升序排列。

#### super 关键字

`super` 指向当前对象的原型对象。

`super`关键字表示原型对象时，只能用在对象的方法之中，用在其他地方都会报错。

也不可以直接调用`super`对象，只能调用`super`下面的方法

```javascript
// 报错
const obj = {
  foo: super.foo
}

// 报错
const obj = {
  foo: () => super.foo
}

// 报错
const obj = {
  foo: function () {
    return super.foo
  }
}

//报错
const obj = {
    fn(){
        return super === obj.__proto__
    }
}
```

```javascript
let obj = {
    fn() {
        return super.a === this.__proto__.a
    }
}
obj.__proto__.a = 1;
console.log(obj.fn()) //true
```

#### 解构赋值

扩展运算符的解构赋值，不能复制继承自原型对象的属性。

```javascript
const o = Object.create({ x: 1, y: 2 });
o.z = 3;

let { x, ...newObj } = o;
let { y, z } = newObj;
x // 1
y // undefined
z // 3
```

ES6 规定，变量声明语句之中，如果使用解构赋值，扩展运算符后面必须是一个变量名，而不能是一个解构赋值表达式

```javascript
let { x, ...{ y, z } } = o;
// SyntaxError: ... must be followed by an identifier in declaration contexts
```

#### 对象的扩展运算符

如果扩展运算符后面不是对象，则会自动将其转为对象。

扩展运算符后面是整数1，会自动转为数值的包装对象Number{1}。由于该对象没有自身属性，所以返回一个空对象。

```javascript
// 等同于 {...Object(1)}
{...1} // {}
```

对象的扩展运算符等同于使用Object.assign()方法。

```javascript
// 写法一
const clone1 = {
  __proto__: Object.getPrototypeOf(obj),
  ...obj
};

// 写法二
const clone2 = Object.assign(
  Object.create(Object.getPrototypeOf(obj)),
  obj
);

// 写法三
const clone3 = Object.create(
  Object.getPrototypeOf(obj),
  Object.getOwnPropertyDescriptors(obj)
)
```

**取值函数get在扩展a对象时会自动执行，导致报错。**

```javascript
let a = {
  get x() {
    throw new Error('not throw yet');
  }
}

let aWithXGetter = { ...a }; // 报错
```

#### 链判断运算符

```javascript
a?.b
// 等同于
a == null ? undefined : a.b

a?.[x]
// 等同于
a == null ? undefined : a[x]

a?.b()
// 等同于
a == null ? undefined : a.b()

a?.()
// 等同于
a == null ? undefined : a()
```

```javascript
const firstName = message?.body?.user?.firstName || 'default';
const fooValue = myForm.querySelector('input[name=foo]')?.value
```

#### Null 判断运算符

ES2020 引入了一个新的 Null 判断运算符??。它的行为类似||，但是只有运算符左侧的值为null或undefined时，才会返回右侧的值。

```javascript
const animationDuration = response.settings?.animationDuration ?? 300;
```

