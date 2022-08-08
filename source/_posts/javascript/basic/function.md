---
title: 函数
mathjax: true
categories:
  - JavaScript
  - 基础
tags:
  - JavaScript
  - ES6基础

date: 2020-10-27 20:07:38
---


#### 与解构赋值默认值结合使用

参数mustBeProvided的默认值等于throwIfMissing函数的运行结果（注意函数名throwIfMissing之后有一对圆括号），这表明参数的默认值不是在定义时执行，而是在运行时执行。如果参数已经赋值，默认值中的函数就不会运行。

```javascript
function throwIfMissing() {
  throw new Error('Missing parameter');
}

function foo(mustBeProvided = throwIfMissing()) {
  return mustBeProvided;
}

foo()
// Error: Missing parameter
```

#### 函数的 length 属性

没有默认值的时候，函数的`length`属性是形式参数的个数

指定了默认值以后，函数的length属性，将返回没有指定默认值的参数个数。也就是说，指定了默认值后，length属性将失真。

这是因为length属性的含义是，该函数预期传入的参数个数。某个参数指定默认值以后，预期传入的参数个数就不包括这个参数了。同理，后文的 rest 参数也不会计入length属性。

```javascript
(function(...args) {}).length // 0
```

如果设置了默认值的参数不是尾参数，那么length属性也不再计入后面的参数了。

```javascript
(function (a = 0, b, c) {}).length // 0
(function (a, b = 1, c) {}).length // 1
```

#### 作用域

**一旦设置了参数的默认值，函数进行声明初始化时，参数会形成一个单独的作用域**

```javascript
var x = 1;
function foo(x, y = function() { x = 2; }) {
  var x = 3;
  y();
  console.log(x);
}

foo() // 3
x // 1
```

上面代码中，函数foo的参数形成一个单独作用域。这个作用域里面，首先声明了变量x，然后声明了变量y，y的默认值是一个匿名函数。这个匿名函数内部的变量x，指向同一个作用域的第一个参数x。函数foo内部又声明了一个内部变量x，该变量与第一个参数x由于不是同一个作用域，所以不是同一个变量，因此执行y后，内部变量x和外部全局变量x的值都没变。

如果将var x = 3的var去除，函数foo的内部变量x就指向第一个参数x，与匿名函数内部的x是一致的，所以最后输出的就是2，而外层的全局变量x依然不受影响。

```javascript
var x = 1;
function foo(x, y = function() { x = 2; }) {
  x = 3;
  y();
  console.log(x);
}

foo() // 2
x // 1
```

#### rest

rest 参数之后不能再有其他参数

函数的length属性，不包括 rest 参数

#### 严格模式

ES2016 做了一点修改，规定只要函数参数使用了默认值、解构赋值、或者扩展运算符，那么函数内部就不能显式设定为严格模式，否则会报错。

#### name

函数的name属性，返回该函数的函数名。

Function构造函数返回的函数实例，name属性的值为anonymous。

```javascript
(new Function).name // "anonymous"
```

```javascript
function foo() {};
foo.bind({}).name // "bound foo"

(function(){}).bind({}).name // "bound "
```

#### 箭头函数

如果箭头函数的代码块部分多于一条语句，就要使用大括号将它们括起来，并且使用`return`语句返回。

```javascript
let foo = () => { a: 1 };
foo() // undefined
```

上面代码中，原始意图是返回一个对象`{ a: 1 }`，但是由于引擎认为大括号是代码块，所以执行了一行语句`a: 1`。这时，a可以被解释为语句的标签，因此实际执行的语句是`1;`，然后函数就结束了，没有返回值。

**如果箭头函数只有一行语句，且不需要返回值，可以采用下面的写法，就不用写大括号了。**

```javascript
let fn = () => void doesNotReturn();
```

#### 箭头函数注意点

+ 函数体内的`this`对象，就是定义时所在的对象，而不是使用时所在的对象。

+ 不可以当作构造函数，也就是说，不可以使用`new`命令，否则会抛出一个错误。

+ 不可以使用`arguments`对象，该对象在函数体内不存在。如果要用，可以用 `rest` 参数代替。

+ 不可以使用`yield`命令，因此箭头函数不能用作 `Generator` 函数。

不适用的场景

+ 定义对象的方法，且该方法内部包括`this`

+ 需要动态this的时候，也不应使用箭头函数

```javascript
var button = document.getElementById('press');
button.addEventListener('click', () => {
  this.classList.toggle('on');
});
```

#### 尾调用优化

尾调用（Tail Call）是函数式编程的一个重要概念，就是指某个函数的最后一步是调用另一个函数。

即只保留内层函数的调用帧。如果所有函数都是尾调用，那么完全可以做到每次执行时，调用帧只有一项，这将大大节省内存。这就是“尾调用优化”的意义。

**只有不再用到外层函数的内部变量，内层函数的调用帧才会取代外层函数的调用帧，否则就无法进行“尾调用优化”。**

目前只有 Safari 浏览器支持尾调用优化，Chrome 和 Firefox 都不支持。


#### 尾递归

“尾调用优化”对递归操作意义重大，所以一些函数式编程语言将其写入了语言规格。ES6 亦是如此，第一次明确规定，所有 ECMAScript 的实现，都必须部署“尾调用优化”。这就是说，ES6 中只要使用尾递归，就不会发生栈溢出（或者层层递归造成的超时），相对节省内存。

```javascript
function Fibonacci2 (n , ac1 = 1 , ac2 = 1) {
  if( n <= 1 ) {return ac2};

  return Fibonacci2 (n - 1, ac2, ac1 + ac2);
}
```

尾递归的两种形式：

柯里化（currying）

```javascript
function currying(fn, n) {
  return function (m) {
    return fn.call(this, m, n);
  };
}

function tailFactorial(n, total) {
  if (n === 1) return total;
  return tailFactorial(n - 1, n * total);
}

const factorial = currying(tailFactorial, 1);

factorial(5) // 120
```

ES6 的函数默认值

```javascript
function factorial(n, total = 1) {
  if (n === 1) return total;
  return factorial(n - 1, n * total);
}

factorial(5) // 120
```

#### 严格模式

ES6 的尾调用优化只在严格模式下开启，正常模式是无效的。

这是因为在正常模式下，函数内部有两个变量，可以跟踪函数的调用栈。

+ `func.arguments`：返回调用时函数的参数。

+ `func.caller`：返回调用当前函数的那个函数。

尾调用优化发生时，函数的调用栈会改写，因此上面两个变量就会失真。严格模式禁用这两个变量，所以尾调用模式仅在严格模式下生效。

```javascript
function restricted() {
  'use strict';
  restricted.caller;    // 报错
  restricted.arguments; // 报错
}
restricted();
```


**尾递归的实现**

`tco`函数是尾递归优化的实现，它的奥妙就在于状态变量`active`。
默认情况下，这个变量是不激活的。一旦进入尾递归优化的过程，这个变量就激活了。然后，每一轮递归`sum`返回的都是`undefined`，所以就避免了递归执行；而`accumulated`数组存放每一轮sum执行的参数，总是有值的，这就保证了`accumulator`函数内部的while循环总是会执行。这样就很巧妙地将“递归”改成了“循环”，而后一轮的参数会取代前一轮的参数，保证了调用栈只有一层。

```javascript
function tco(f) {
    var value; //记录返回值
    var args = []; //记录参数
    var active = false; //记录执行状态
    // 通过返回新函数，形成闭包共享状态
    return function accumulator() {
        //每次目标函数执行前保存参数
        args.push(arguments);
        //上一次执行的状态
        if (!active) {
            active = true;
            // 因为每次执行前缓存了参数，所以下一次执行时一定会有参数
            // 通过while实现递归的效果
            while (args.length) {
                value = f.apply(this, args.shift());
            }
            active = false;
        }
    }
}

var sum = tco(function (x, y) {
    if (y > 0) {
        return sum(x + 1, y - 1)
    } else {
        console.log(x);
        return x
    }
});
```

#### 函数参数的尾逗号

ES2017 允许函数的最后一个参数有尾逗号（trailing comma）。函数参数与数组和对象的尾逗号规则，保持一致了。