---
title: co模块
mathjax: true
categories:
  - JavaScript
tags:
  - JavaScript
  - Node

date: 2021-01-14 13:37:56
---


#### 简介

基于生成器的nodej和浏览器控制流，使用promises，让您以一种很好的方式编写非阻塞代码。

可以让Generator函数的自动执行。不用编写Generator函数的执行器。



#### API

**co(fn\*).then( val => )**

通过解析一个Generator，Generator函数，或任何返回Generator的函数，并返回一个Promise

```javascript
co(function* () {
  return yield Promise.resolve(true);
}).then(function (val) {
  console.log(val);
}, function (err) {
  console.error(err.stack);
});

```

**var fn = co.wrap(fn\*)**

把`generator`转换为一个普通函数并返回`Promise`

```javascript
var fn = co.wrap(function* (val) {
  return yield Promise.resolve(val);
});
 
fn(true).then(function (val) {
 
});
```

#### 执行逻辑

+ `co(fn)` 执行传入`co`模块的 generator 函数 fn 

+ 把 fn 执行的结果 res，包装成 promise 对象

`const gen = fn(); const res = gen.next()`  `const rp =  toPromise(res.value)`

+ 如果是合法的 promise 这继续调用 fn 的 next 方法

`rp.then((value)=> res.next())`

co其实是一个返回promise对象的函数， 内部通过递归的方式调用 generator 的 next 方法

#### 源码分析

工具方法

```javascript
// sllice 引用
var slice = Array.prototype.slice;

// isObject
function isObject(val) {
  return Object == val.constructor;
}

//导出方法
module.exports = co['default'] = co.co = co;

//判断是否是promise对象，只要是实现了thenable的对象都可以视为promise对象
function isPromise(obj) {
  return 'function' == typeof obj.then;
}

function isGenerator(obj) {
  return 'function' == typeof obj.next && 'function' == typeof obj.throw;
}

// 是否是generator函数
function isGeneratorFunction(obj) {
  // 一定是GeneratorFunction构造函数的实例
  // (function(){}).constructor === Function => true
  var constructor = obj.constructor;
  if (!constructor) return false;
  if ('GeneratorFunction' === constructor.name || 'GeneratorF方法
function thunkToPromise(fn) {
  var ctx = this;
  return new Promise(function (resolve, reject) {
    fn.call(ctx, function (err, res) {
      if (err) return reject(err);
      if (arguments.length > 2) res = slice.call(arguments, 1);
      resolve(res);
    });
  });
}

// arrayToPromise yeildable数组转换为promise
function arrayToPromise(obj) {
  // 每一项都转换为promise
  // 第二个参数为toPromise执行时的this值
  return Promise.all(obj.map(toPromise, this));
}

// objectToPromise yieldables对象转为promise
function objectToPromise(obj){
  // 借用 function Object(){}
  var results = new obj.constructor();
  var keys = Object.keys(obj);
  var promises = [];
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    // 每一项转为promise
    var promise = toPromise.call(this, obj[key]);
    if (promise && isPromise(promise)) defer(promise, key);
    // 其他情况直接返回key值
    else results[key] = obj[key];
  }
  return Promise.all(promises).then(function () {
    return results;
  });

  function defer(promise, key) {
    // 提前在results中定义key
    results[key] = undefined;
    promises.push(promise.then(function (res) {
      // 提前一步拿到结果
      // 通常自己的写法为这里直接返回promise
      // 在promise.all 中在遍历结果生成result,这样写法更简洁一点
      results[key] = res;
    }));
  }
}

//把yeild转为Promise对象
function toPromise(obj) {
  // 如果为假直接返回
  if (!obj) return obj;
  //如果已经是promise直接返回
  if (isPromise(obj)) return obj;
  // 如果是generator函数 通过co函数栈为promise
  if (isGeneratorFunction(obj) || isGenerator(obj)) return co.call(this, obj);
  // this通过next方法中toPromise.call(ctx, ret.value)来绑定
  if ('function' == typeof obj) return thunkToPromise.call(this, obj);
  if (Array.isArray(obj)) return arrayToPromise.call(this, obj);
  if (isObject(obj)) return objectToPromise.call(this, obj);
  return obj;
}
```


co 核心方法

```javascript
function co(gen) {
  var ctx = this;
  var args = slice.call(arguments, 1)

  // 把任何东西包装成promise, 从而避免promise调用链

  // 内存泄漏的问题
  // https://github.com/tj/co/issues/180
  return new Promise(function(resolve, reject) {
    
    // 执行Generator函数，返回Generator
    if (typeof gen === 'function') gen = gen.apply(ctx, args);

    // 如果没有next方法，则直接返回
    if (!gen || typeof gen.next !== 'function') return resolve(gen);


    onFulfilled();

    /**
     * @param {Mixed} res
     * @return {Promise}
     * @api private
     * 通过 try catch 捕获执行时错误
     */

    function onFulfilled(res) {
      var ret;
      try {
        ret = gen.next(res);
      } catch (e) {
        return reject(e);
      }
      next(ret);
    }

    /**
     * @param {Error} err
     * @return {Promise}
     * @api private
     */

    function onRejected(err) {
      var ret;
      try {
        ret = gen.throw(err);
      } catch (e) {
        return reject(e);
      }
      next(ret);
    }

    /**
     * Get the next value in the generator,
     * return a promise.
     *
     * @param {Object} ret
     * @return {Promise}
     * @api private
     */

    
    function next(ret) {
      if (ret.done) return resolve(ret.value);
      var value = toPromise.call(ctx, ret.value);
      // 如果可以包装成promise, 通过thenable方法继续调用onFulfilled，执行下一个next, 并把promise的值传入，当作上一个next的结果
      if (value && isPromise(value)) return value.then(onFulfilled, onRejected);
      // 抛出错误
      return onRejected(new TypeError('You may only yield a function, promise, generator, array, or object, '
        + 'but the following object was passed: "' + String(ret.value) + '"'));
    }
  });
}
```

co.wrap(fn*)

```javascript
// 通过柯理化函数，返回一个包含co执行结果的正常函数

co.wrap = function (fn) {
  createPromise.__generatorFunction__ = fn;
  return createPromise;
  function createPromise() {
    return co.call(this, fn.apply(this, arguments));
  }
};
```