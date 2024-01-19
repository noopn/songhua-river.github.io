---
title: 解构赋值
mathjax: true

date: 2020-10-16 10:35:19
categories:
- JavaScript
tags:
- JavaScript
- ES6基础
---

#### 数组的解构赋值

+ 如果解构不成功，变量的值就等于undefined

+ 对于 Set 结构，也可以使用数组的解构赋值。

```javascript
let [foo, [[bar], baz]] = [1, [[2], 3]];
foo // 1
bar // 2
baz // 3

let [ , , third] = ["foo", "bar", "baz"];
third // "baz"

let [x, , y] = [1, 2, 3];
x // 1
y // 3

let [head, ...tail] = [1, 2, 3, 4];
head // 1
tail // [2, 3, 4]


let [x, y, ...z] = ['a'];
x // "a"
y // undefined
z // []

let [x, y, z] = new Set(['a', 'b', 'c']);
```

+ 如果等号的右边是可遍历的结构（Iterator），会报错

```javascript
// 报错
let [foo] = 1;
let [foo] = false;
let [foo] = NaN;
let [foo] = undefined;
let [foo] = null;
let [foo] = {};
```

```javascript
function* fibs() {
  let a = 0;
  let b = 1;
  while (true) {
    yield a;
    [a, b] = [b, a + b];
  }
}

let [first, second, third, fourth, fifth, sixth] = fibs();
sixth // 5
```

+ 默认值， 只有结构元素严格等于`undefined`才会使用默认值

```javascript
let [x = 1] = [undefined];
x // 1

let [x = 1] = [null];
x // null
```

如果默认值是表达式，只有赋值时才会执行

```javascript
function f() {
  console.log('aaa');
}
//f不会执行
let [x = f()] = [1];

//等价于
let x;
if ([1][0] === undefined) {
  x = f();
} else {
  x = [1][0];
}
```

可以使用其他变量但这个变量必须已经声明

```javascript
let [x = 1, y = x] = [];     // x=1; y=1
```

#### 对象的解构赋值

对象的解构与数组有一个重要的不同。数组的元素是按次序排列的，变量的取值由它的位置决定；而对象的属性没有次序，变量必须与属性同名，才能取到正确的值。

对象的解构赋值是下面形式的简写,真正被赋值的是后者，而不是前者。

```javascript
let { foo: baz } = { foo: 'aaa', bar: 'bbb' };
baz // "aaa"
foo // error: foo is not defined
```

+ 注意模式和变量的区别， 这时p是模式，不是变量，因此不会被赋值。如果p也要作为变量赋值，可以写成下面这样。

```javascript
let obj = {
  p: [
    'Hello',
    { y: 'World' }
  ]
};

let { p, p: [x, { y }] } = obj;
x // "Hello"
y // "World"
p // ["Hello", {y: "World"}]
```

+ 嵌套赋值

```javascript
let obj = {};
let arr = [];

({ foo: obj.prop, bar: arr[0] } = { foo: 123, bar: true });

obj // {prop:123}
arr // [true]


// 报错
let {foo: {bar}} = {baz: 'baz'};
```

+ 对象的解构赋值可以取到继承的属性。

```javascript
const obj1 = {};
const obj2 = { foo: 'bar' };
Object.setPrototypeOf(obj1, obj2);

const { foo } = obj1;
foo // "bar"
```

+ **如果要将一个已经声明的变量用于解构赋值，必须非常小心。**

```javascript
// 错误的写法
let x;
{x} = {x: 1};
// SyntaxError: syntax error

// 正确的写法
let x;
({x} = {x: 1});
```

+ 由于数组本质是特殊的对象，因此可以对数组进行对象属性的解构。

```javascript
let arr = [1, 2, 3];
let {0 : first, [arr.length - 1] : last} = arr;
first // 1
last // 3
```

#### 字符串结构赋值

+ 字符串被转换成了一个类似数组的对象。

+ 还可以对这个属性解构赋值。

```javascript
const [a, b, c, d, e] = 'hello';

let {length : len} = 'hello';
```

#### 数值和布尔值的解构赋值

+ 解构赋值的规则是，只要等号右边的值不是对象或数组，就先将其转为对象。

```javascript
let {toString: s} = 123;
s === Number.prototype.toString // true

let {toString: s} = true;
s === Boolean.prototype.toString // true
```

+ 由于undefined和null无法转为对象，所以对它们进行解构赋值，都会报错。

```javascript
let { prop: x } = undefined; // TypeError
let { prop: y } = null; // TypeError
```

#### 函数参数的解构赋值

注意默认值的设置方式

```javascript
function move({x = 0, y = 0} = {}) {
  return [x, y];
}

move({x: 3, y: 8}); // [3, 8]
move({x: 3}); // [3, 0]
move({}); // [0, 0]
move(); // [0, 0]

function move({x, y} = { x: 0, y: 0 }) {
  return [x, y];
}

move({x: 3, y: 8}); // [3, 8]
move({x: 3}); // [3, undefined]
move({}); // [undefined, undefined]
move(); // [0, 0]
```

#### 圆括号问题

变量声明语句，模式不能使用圆括号。

```javascript
let {x: (c)} = {};//错误
```
函数参数不能使用圆括号

```javascript
// 报错
function f([(z)]) { return z; }
```

赋值语句的模式报错

```javascript
// 全部报错
({ p: a }) = { p: 42 };
([a]) = [5];
// 报错
[({ p: a }), { x: c }] = [{}, {}];
```

可以使用圆括号的情况只有一种：赋值语句的非模式部分，可以使用圆括号。

```javascript
[(b)] = [3]; // 正确
({ p: (d) } = {}); // 正确
[(parseInt.prop)] = [3]; // 正确
```


#### 常见使用方式

+ 交换变量的值

```javascript
let x = 1;
let y = 2;

[x, y] = [y, x];
```

+ 从函数返回多个值

+ 函数参数的定义

+ 提取 JSON 数据

+ 函数参数的默认值

+ 遍历 Map 结构

```javascript
const map = new Map();
map.set('first', 'hello');
map.set('second', 'world');

for (let [key, value] of map) {
  console.log(key + " is " + value);
}
// first is hello
// second is world
```

+ 获取引入模块的方法
