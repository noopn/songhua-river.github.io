---
title: Object新增方法
mathjax: true

date: 2020-10-20 09:52:50
categories:
- JavaScript
tags:
- JavaScript
- ES6基础
---

#### Object.is()

用来比较两个值是否严格相等，与严格比较运算符（===）的行为基本一致。

不同之处只有两个：一是+0不等于-0，二是NaN等于自身。

```javascript
Object.defineProperty(Object, 'is', {
  value: function(x, y) {
    if (x === y) {
      // x===y 是前提，x!==0排除为零的情况，如果xy为0通过转为Infinity判断
      return x !== 0 || 1 / x === 1 / y;
    }
    // 针对NaN的情况， NaN!==NaN
    return x !== x && y !== y;
  },
  configurable: true,
  enumerable: false,
  writable: true
});
```

#### Object.assign()

将源对象（source）的所有可枚举属性，复制到目标对象（target）。Object.assign()方法的第一个参数是目标对象，后面的参数都是源对象。**并不会返回新对象**

**只拷贝源对象的自身属性（不拷贝继承属性），也不拷贝不可枚举的属性（enumerable: false）。Symbol属性虽然不能被 Object.keys 等方法枚举，但是可以被拷贝**

由于`undefined`和`null`无法转成对象，所以如果它们作为参数，就会报错。 如果非对象参数出现在源对象的位置（即非首参数），那么处理规则有所不同。首先，这些参数都会转成对象，如果无法转成对象，就会跳过。这意味着，如果`undefined`和`null`不在首参数，就不会报错。

```javascript
Object.assign(undefined) // 报错
Object.assign(null) // 报错

let obj = {a: 1};
Object.assign(obj, undefined) === obj // true
Object.assign(obj, null) === obj // true
```

其他类型的值（即数值、字符串和布尔值）不在首参数，也不会报错。但是，除了字符串会以数组形式，拷贝入目标对象，其他值都不会产生效果。因为只有字符串的包装对象，会产生可枚举属性。

```javascript
Object(true) // {[[PrimitiveValue]]: true}
Object(10)  //  {[[PrimitiveValue]]: 10}
Object('abc') // {0: "a", 1: "b", 2: "c", length: 3, [[PrimitiveValue]]: "abc"}
```

**注意点**

+ 浅拷贝

+ 同名属性的替换

+ 数组的处理
  
  `Object.assign()` 可以用来处理数组，但是会把数组视为对。`Object.assign()`把数组视为属性名为 0、1、2 的对象，因此源数组的 0 号属性4覆盖了目标数组的 0 号属性1。

```javascript
Object.assign([1, 2, 3], [4, 5])
// [4, 5, 3]
```

+ 取值函数的处理

`Object.assign()` 只能进行值的复制，如果要复制的值是一个取值函数，那么将求值后再复制。

```javascript
const source = {
  get foo() { return 1 }
};
const target = {};

Object.assign(target, source)
// { foo: 1 }
```

#### Object.create()

`Object.create()` 是一个ES5的方法，经常与 `Object.assign` 混用

`Object.create()` 创建一个新对象，使用现有的对象来提供新创建的对象的__proto__。

```javascript
Object.create(proto[, propertiesObject])

// proto 新创建对象的原型对象。

// propertiesObject 可选。需要传入一个对象，该对象的属性类型参照Object.defineProperties()的第二个参数。如果该参数被指定且不为 undefined，该传入对象的自有可枚举属性(即其自身定义的属性，而不是其原型链上的枚举属性)将为新创建的对象添加指定的属性值和对应的属性描述符。
```

**propertiesObject参数是 null 或非原始包装对象，则抛出一个 TypeError 异常。**

#### 常见用途

+ 为对象添加属性

+ 为对象添加方法

+ 克隆对象

  如果想要保持继承链

```javascript
function clone(origin) {
  let originProto = Object.getPrototypeOf(origin);
  return Object.assign(Object.create(originProto), origin);
}
```

+ 合并多个对象

```javascript
const merge =
  (target, ...sources) => Object.assign(target, ...sources);
```

+ 属性指定默认值

```javascript
Object.assign({}, DEFAULTS, options);
```

#### Object.getOwnPropertyDescriptors()

返回指定对象所有自身属性（非继承属性）的描述对象。

```javascript
function getOwnPropertyDescriptors(obj) {
  const result = {};
  for (let key of Reflect.ownKeys(obj)) {
    result[key] = Object.getOwnPropertyDescriptor(obj, key);
  }
  return result;
}
```

该方法的引入目的，主要是为了解决Object.assign()无法正确拷贝get属性和set属性的问题。Object.getOwnPropertyDescriptors()方法配合Object.defineProperties()方法，就可以实现正确拷贝。

```javascript
const merge = (target, source) => Object.defineProperties(
    target,
    Object.getOwnPropertyDescriptors(source)
)
```

Object.getOwnPropertyDescriptors()方法的另一个用处，是配合Object.create()方法，将对象属性克隆到一个新对象。这属于浅拷贝。

```javascript
const shallowClone = (obj) => Object.create(
  Object.getPrototypeOf(obj),
  Object.getOwnPropertyDescriptors(obj)
);
```

```javascript
let mix = (object) => ({
  with: (...mixins) => mixins.reduce(
    (c, mixin) => Object.create(
      c, Object.getOwnPropertyDescriptors(mixin)
    ), object)
});
```

#### __proto__属性

`__proto__` 本质上是一个内部属性，而不是一个正式的对外的 API，只是由于浏览器广泛支持，才被加入了 ES6.

无论从语义的角度，还是从兼容性的角度，都不要使用这个属性，而是使用下面的`Object.setPrototypeOf()`（写操作）、`Object.getPrototypeOf()`（读操作）、`Object.create()`（生成操作）代替。

实现上，`__proto__`调用的是`Object.prototype.__proto__`，具体实现如下。

```javascript
Object.defineProperty(Object.prototype, '__proto__', {
  get() {
    let _thisObj = Object(this);
    return Object.getPrototypeOf(_thisObj);
  },
  set(proto) {
    if (this === undefined || this === null) {
      throw new TypeError();
    }
    if (!isObject(this)) {
      return undefined;
    }
    if (!isObject(proto)) {
      return undefined;
    }
    let status = Reflect.setPrototypeOf(this, proto);
    if (!status) {
      throw new TypeError();
    }
  },
});

function isObject(value) {
  return Object(value) === value;
}
```

如果一个对象本身部署了__proto__属性，该属性的值就是对象的原型。

```javascript
Object.getPrototypeOf({ __proto__: null })
```

#### Object.setPrototypeOf()

```javascript
function setPrototypeOf(obj, proto) {
  obj.__proto__ = proto;
  return obj;
}
```

如果第一个参数不是对象，会自动转为对象。但是由于返回的还是第一个参数，所以这个操作不会产生任何效果。

```javascript
Object.setPrototypeOf(1, {}) === 1 // true
Object.setPrototypeOf('foo', {}) === 'foo' // true
Object.setPrototypeOf(true, {}) === true // true
```


#### Object.getPrototypeOf()

如果参数不是对象，会被自动转为对象。

```javascript
// 等同于 Object.getPrototypeOf(Number(1))
Object.getPrototypeOf(1)
// Number {[[PrimitiveValue]]: 0}

// 等同于 Object.getPrototypeOf(String('foo'))
Object.getPrototypeOf('foo')
// String {length: 0, [[PrimitiveValue]]: ""}

// 等同于 Object.getPrototypeOf(Boolean(true))
Object.getPrototypeOf(true)
// Boolean {[[PrimitiveValue]]: false}

Object.getPrototypeOf(1) === Number.prototype // true
Object.getPrototypeOf('foo') === String.prototype // true
Object.getPrototypeOf(true) === Boolean.prototype // true
```

#### Object.keys()，Object.values()，Object.entries()

`Object.entries`实现

```javascript
// Generator函数的版本
function* entries(obj) {
  for (let key of Object.keys(obj)) {
    yield [key, obj[key]];
  }
}

// 非Generator函数的版本
function entries(obj) {
  let arr = [];
  for (let key of Object.keys(obj)) {
    arr.push([key, obj[key]]);
  }
  return arr;
}
Object.from
```


#### Object.fromEntries()

Object.fromEntries()方法是Object.entries()的逆操作，用于将一个键值对数组转为对象。

```javascript
// 例一
const entries = new Map([
  ['foo', 'bar'],
  ['baz', 42]
]);

Object.fromEntries(entries)
// { foo: "bar", baz: 42 }

// 例二
const map = new Map().set('foo', true).set('bar', false);
Object.fromEntries(map)
// { foo: true, bar: false }
```
