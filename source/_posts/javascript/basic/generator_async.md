---
title: Generator 异步
mathjax: true
categories:
  - JavaScript
  - 基础
tags:
  - JavaScript
  - ES6基础

date: 2020-11-02 09:13:11
---

es6 之前实现异步的方法

+ 回调函数
+ 事件监听
+ 发布/订阅
+ Promise 对象

#### 异步

所谓"异步"，简单说就是一个任务不是连续完成的，可以理解成该任务被人为分成两段，先执行第一段，然后转而执行其他任务，等做好了准备，再回过头执行第二段。

Promise 的最大问题是代码冗余，原来的任务被 Promise 包装了一下，不管什么操作，一眼看去都是一堆then，原来的语义变得很不清楚。


#### 错误处理

Generator 函数内部还可以部署错误处理代码，捕获函数体外抛出的错误。

使用指针对象的throw方法抛出的错误，可以被函数体内的try...catch代码块捕获。这意味着，出错的代码与处理错误的代码，实现了时间和空间上的分离

```javascript
function* gen(x){
  try {
    var y = yield x + 2;
  } catch (e){
    console.log(e);
  }
  return y;
}

var g = gen(1);
g.next();
g.throw('出错了');
// 出错了
```

#### 异步任务的封装

虽然 Generator 函数将异步操作表示得很简洁，但是流程管理却不方便（即何时执行第一阶段、何时执行第二阶段）。

```javascript
var fetch = require('node-fetch');

function* gen(){
  var url = 'https://api.github.com/users/github';
  var result = yield fetch(url);
  console.log(result.bio);
}

var g = gen();
var result = g.next();

result.value.then(function(data){
  return data.json();
}).then(function(data){
  g.next(data);
});
```

#### Thunk 函数的含义

编译器的“传名调用”实现，往往是将参数放到一个临时函数之中，再将这个临时函数传入函数体。这个临时函数就叫做 Thunk 函数。

#### JavaScript 语言的 Thunk 函数

"传值调用"（call by value），即在进入函数体之前，就计算x + 5的值（等于 6），再将这个值传入函数f。C 语言就采用这种策略。

“传名调用”（call by name），即直接将表达式x + 5传入函数体，只在用到它的时候求值。Haskell 语言采用这种策略。

```javascript
// Thunk版本的readFile（单参数版本）
var Thunk = function (fileName) {
  return function (callback) {
    return fs.readFile(fileName, callback);
  };
};

var readFileThunk = Thunk(fileName);
readFileThunk(callback);
```


#### Thunkify 

增加了重复执行的判断

```javascript
function thunkify(fn) {
  return function() {
    var args = new Array(arguments.length);
    var ctx = this;

    for (var i = 0; i < args.length; ++i) {
      args[i] = arguments[i];
    }

    return function (done) {
      var called;

      args.push(function () {
        if (called) return;
        called = true;
        done.apply(null, arguments);
      });

      try {
        fn.apply(ctx, args);
      } catch (err) {
        done(err);
      }
    }
  }
};
```

#### 基于Thunk自动流程管理

+ 实现自动执行，一定会自动调用`Generator`函数执行后的`next()`方法

通过`while`的判断是否需要执行下一步

```javascript
function run(fn) {
    const g = fn();
    let res = g.next();
    while (res.value) {
        res = g.next();
    }
};

function* g() {
    yield 1;
    yield 2;
    return 3
}
run(g);
```

结合函数式编程的思想，这里不应该通过循环实现，应该递归调用，考虑创建一个子函数 `next`用于递归调用

```javascript
function run(fn) {
    const g = fn();
    function next() {
        const res = g.next();
        if (!res.done) next()
    }
    next()
};

function* g() {
    yield 1;
    yield 2;
    return 3
}
run(g);
```

有返回值的情况

```javascript
function run(fn) {
    const g = fn();

    function next(val) {
        const res = g.next(val);
        if (!res.done) next(res.value)
    }
    next()
};

function* g() {
    const a = yield 2;
    const b = yield a * 2;
    const c = yield b * 2;
    return c * 2
}
run(g);
```

内部的next函数就是 Thunk 的回调函数。next函数先将指针移到 Generator 函数的下一步（gen.next方法），然后判断 Generator 函数是否结束（result.done属性），如果没结束，就将next函数再传入 Thunk 函数（result.value属性），否则就直接退出。

```javascript
const fs = require('fs');
const Thunk = function (fn) {
  return function (...args) {
    return function (callback) {
      return fn.call(this, ...args, callback);
    }
  };
};

const readFileThunk1 = Thunk(fs.readFile)('./1.txt');
const readFileThunk2 = Thunk(fs.readFile)('./2.txt');
const readFileThunk3 = Thunk(fs.readFile)('./3.txt');

function run(fn) {
  const g = fn();

  function next(err, data) {
    if (err) throw new Error();
    const res = g.next(data)
    if (!res.done) res.value(next)
  }
  next()
};

function* g() {
  const a = yield readFileThunk1;
  const b = yield readFileThunk2;
  const c = yield readFileThunk3;
}
console.log(run(g));
```

#### 基于Promise的自动执行器

```javascript
const fs = require('fs');

const readFile = function (path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, function (err, data) {
      if (err) return reject(err);
      resolve(data);
    })
  })
}


function run(fn) {
  const g = fn();

  function next(data) {
    const res = g.next(data);
    if (!res.done) res.value.then(data => next(data));
    return res.value;
  }
  next()
};

function* g() {
  const a = yield readFile('./1.txt');
  const b = yield readFile('./2.txt');
  const c = yield readFile('./3.txt');
  return 'end'
}
run(g)
```

#### co的实现

```javascript
function co(gen) {
    var ctx = this;
    var args = slice.call(arguments, 1);
    // 统一返回Promise对象
    return new Promise(function (resolve, reject) {
        //co 先检查参数gen是否为 Generator 函数。如果是，就执行该函数，得到一个内部指针对象；如果不是就返回，并将 Promise 对象的状态改为resolved。
        if (typeof gen === 'function') gen = gen.apply(ctx, args);
        if (!gen || typeof gen.next !== 'function') return resolve(gen);
        onFulfilled();
        //co 将 Generator 函数的内部指针对象的next方法，包装成onFulfilled函数。这主要是为了能够捕捉抛出的错误。
        function onFulfilled(res) {
            var ret;
            try {
                ret = gen.next(res);
            } catch (e) {
                return reject(e);
            }
            next(ret);
            return null;
        }

        function onRejected(err) {
            var ret;
            try {
                ret = gen.throw(err);
            } catch (e) {
                return reject(e);
            }
            next(ret);
        }

        function next(ret) {
            if (ret.done) return resolve(ret.value);
            //确保每一步的返回值，是 Promise 对象。
            var value = toPromise.call(ctx, ret.value);
            //使用then方法，为返回值加上回调函数，然后通过onFulfilled函数再次调用next函数。
            if (value && isPromise(value)) return value.then(onFulfilled, onRejected);
            //在参数不符合要求的情况下（参数非 Thunk 函数和 Promise 对象），将 Promise 对象的状态改为rejected，从而终止执行。
            return onRejected(new TypeError(
                'You may only yield a function, promise, generator, array, or object, ' +
                'but the following object was passed: "' + String(ret.value) + '"'));
        }
    });
}
```