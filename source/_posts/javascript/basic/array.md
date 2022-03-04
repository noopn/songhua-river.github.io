---
title: Array
mathjax: true
abbrlink: a10ceeb7
date: 2020-10-18 11:13:43
categories:
- JavaScript
- 基础
tags:
- JavaScript
- ES6基础
---


#### 扩展运算符

扩展运算符（spread）是三个点（...）。它好比 rest 参数的逆运算，将一个数组转为用逗号分隔的参数序列。

**只有函数调用时，扩展运算符才可以放在圆括号中，否则会报错**

```javascript
(...[1, 2])
// Uncaught SyntaxError: Unexpected number

console.log((...[1, 2]))
// Uncaught SyntaxError: Unexpected number

console.log(...[1, 2])
// 1 2
```

```javascript
function f(v, w, x, y, z) { }
const args = [0, 1];
f(-1, ...args, 2, ...[3]);
```

```javascript
const arr = [
  ...(x > 0 ? ['a'] : []),
  'b',
];
```

代替apply

```javascript
// ES5 的写法
Math.max.apply(null, [14, 3, 77])

// ES6 的写法
Math.max(...[14, 3, 77])

// 等同于
Math.max(14, 3, 77);
```

```javascript
// ES5
new (Date.bind.apply(Date, [null, 2015, 1, 1]))
// ES6
new Date(...[2015, 1, 1]);
```

#### 扩展运算符的应用

+ 复制数组

+ 合并数组

+ 与解构赋值结合

  如果将扩展运算符用于数组赋值，只能放在参数的最后一位，否则会报错。

```javascript
const [...butLast, last] = [1, 2, 3, 4, 5];
// 报错
```
+ 扩展运算符还可以将字符串转为真正的数组。

  能够正确识别四个字节的 Unicode 字符。

```javascript
[...'hello']
// [ "h", "e", "l", "l", "o" ]
```

```javascript
'x\uD83D\uDE80y'.length // 4
[...'x\uD83D\uDE80y'].length // 3
```

+ 任何定义了遍历器（Iterator）接口的对象，都可以用扩展运算符转为真正的数组。

+ Map 和 Set 结构，Generator 函数

```javascript
let map = new Map([
  [1, 'one'],
  [2, 'two'],
  [3, 'three'],
]);

let arr = [...map.keys()]; // [1, 2, 3]
```

```javascript
const go = function*(){
  yield 1;
  yield 2;
  yield 3;
};

[...go()] // [1, 2, 3]
```

#### Array.from()

Array.from方法用于将两类对象转为真正的数组：类似数组的对象（array-like object）和可遍历（iterable）的对象（包括 ES6 新增的数据结构 Set 和 Map）。

**任何有length属性的对象，都可以通过Array.from方法转为数组，而此时扩展运算符就无法转换。**

```javascript
Array.from({ length: 3 });
// [ undefined, undefined, undefined ]
```

Array.from还可以接受第二个参数，作用类似于数组的map方法，用来对每个元素进行处理，将处理后的值放入返回的数组。

如果map函数里面用到了this关键字，还可以传入Array.from的第三个参数，用来绑定this。

**使用第三个参数时不能写箭头函数**

```javascript
Array.from({
    0: "a",
    1: "b",
    "c": "c",
    length: 4
}, function (val) {
    return `${val}_XX_${this.z}`
}, {
    z: 100
})
```

#### Array.of()

这个方法的主要目的，是弥补数组构造函数Array()的不足。因为参数个数的不同，会导致Array()的行为有差异。

```javascript
Array() // []
Array(3) // [, , ,]
Array(3, 11, 8) // [3, 11, 8]
```

```javascript
function ArrayOf(){
  return [].slice.call(arguments);
}
```

#### 数组实例的 copyWithin()

数组实例的copyWithin()方法，在当前数组内部，将指定位置的成员复制到其他位置（会覆盖原有成员），然后返回当前数组。也就是说，使用这个方法，会修改当前数组。

```javascript
Array.prototype.copyWithin(target, start = 0, end = this.length)
```

+ target（必需）：从该位置开始替换数据。如果为负值，表示倒数。

+ start（可选）：从该位置开始读取数据，默认为 0。如果为负值，表示从末尾开始计算。

+ end（可选）：到该位置前停止读取数据，默认等于数组长度。如果为负值，表示从末尾开始计算。

```javascript
// 将3号位复制到0号位
[].copyWithin.call({length: 5, 3: 1}, 0, 3)
// {0: 1, 3: 1, length: 5}
```

#### find() 和 findIndex()

find() 数组成员依次执行该回调函数，直到找出第一个返回值为true的成员,如果没有符合条件的成员，则返回undefined。

findIndex() 返回第一个符合条件的数组成员的位置，如果所有成员都不符合条件，则返回-1。

第二个参数，用来绑定回调函数的this对象。

indexOf方法无法识别数组的NaN成员，但是findIndex方法可以借助Object.is方法做到。

```javascript
[NaN].findIndex(y => Object.is(NaN, y))
```

#### 数组实例的 fill()

接受第二个和第三个参数，用于指定填充的起始位置和结束位置。

**注意：如果第一个参数为引用类型，填入的所有值都为同一个对象**

```javascript
['a', 'b', 'c'].fill(7, 1, 2)
```

#### 数组实例的 entries()，keys() 和 values()

ES6 提供三个新的方法——entries()，keys()和values()——用于遍历数组。

它们都返回一个遍历器对象，可以用for...of循环进行遍历，唯一的区别是keys()是对键名的遍历、values()是对键值的遍历，entries()是对键值对的遍历。

#### 数组实例的 includes()

Array.prototype.includes方法返回一个布尔值，表示某个数组是否包含给定的值，与字符串的includes方法类似。ES2016 引入了该方法。

该方法的第二个参数表示搜索的起始位置，默认为0。如果第二个参数为负数，则表示倒数的位置，如果这时它大于数组长度（比如第二个参数为-4，但数组长度为3），则会重置为从0开始。

```javascript
[NaN].includes(NaN)
// true
```

Map 和 Set 数据结构有一个has方法，需要注意与includes区分。

Map 结构的has方法，是用来查找键名的，比如Map.prototype.has(key)、WeakMap.prototype.has(key)、Reflect.has(target, propertyKey)。
Set 结构的has方法，是用来查找值的，比如Set.prototype.has(value)、WeakSet.prototype.has(value)。

#### 数组实例的 flat()，flatMap()

flat()默认只会“拉平”一层

```javascript
[1, [2, [3]]].flat(Infinity)
```

如果原数组有空位，flat()方法会跳过空位。

```javascript
[1, 2, , 4, 5].flat()
// [1, 2, 4, 5]
```

#### 数组的空位

数组的空位指，数组的某一个位置没有任何值。比如，Array构造函数返回的数组都是空位。

```javascript
0 in [undefined, undefined, undefined] // true
0 in [, , ,] // false
```

ES5 对空位的处理，已经很不一致了，大多数情况下会忽略空位。

+ forEach(), filter(), reduce(), every() 和some()都会跳过空位。

+ map()会跳过空位，但会保留这个值

+ join()和toString()会将空位视为undefined，而undefined和null会被处理成空字符串。

ES6 则是明确将空位转为undefined。


```javascript
Array.from(['a',,'b'])
// [ "a", undefined, "b" ]

[...['a',,'b']]
// [ "a", undefined, "b" ]

new Array(3).fill('a') // ["a","a","a"]

let arr = [, ,];
for (let i of arr) {
  console.log(1);
}
// 1
// 1
```

entries()、keys()、values()、find()和findIndex()会将空位处理成undefined。

```javascript
// entries()
[...[,'a'].entries()] // [[0,undefined], [1,"a"]]

// keys()
[...[,'a'].keys()] // [0,1]

// values()
[...[,'a'].values()] // [undefined,"a"]

// find()
[,'a'].find(x => true) // undefinedq

// findIndex()
[,'a'].findIndex(x => true) // 0
```

#### Array.prototype.sort() 的排序稳定性

早先的 ECMAScript 没有规定，Array.prototype.sort()的默认排序算法是否稳定，留给浏览器自己决定，这导致某些实现是不稳定的。
ES2019 明确规定，Array.prototype.sort()的默认排序算法必须稳定。这个规定已经做到了，现在 JavaScript 各个主要实现的默认排序算法都是稳定的。

