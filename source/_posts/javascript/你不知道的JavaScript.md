---
title: 你不知道的JavaScript
mathjax: true

date: 2020-11-14 21:07:30
categories:
  - JavaScript
tags:
  - JavaScript
  - 应用案例
---

##### 变量提升

如果在函数声明后有同名的变量被定义，但是没有赋值，则不会被覆盖，如果同名变量被赋值这函数声明被覆盖

```javascript
function a() {
    alert(10)
}
var a;
console.log(a);//function a(){}
a = 1;
console.log(a)//1
```

```javascript
alert(a)
a();
var a = 3;

function a() {
    alert(10)
}
alert(a)
a = 6;
a();
```

等价于

```javascript
var a
function a() {
    alert(10)
}
alert(a)//function a(){}
a();
a = 3;
alert(a)//3
a = 6;
a();//TypeError
```

`alert`会把函数转为字符串`function a(){...}`,对象会调用`toString`方法转为`[object Object]`

```javascript
var x = 1,
    y = 0,
    z = 0;

function add(x) {
    return (x = x + 1);
}
y = add(x);
console.log(y)

function add(x) {
    return (x = x + 3);
}
z = add(x);
console.log(z)
```

等价于

```javascript
function add(x) {
    return (x = x + 1);
}
// 上面函数被覆盖
function add(x) {
    return (x = x + 3);
}      
var x = 1,
    y = 0,
    z = 0;
y = add(x);
console.log(y)
z = add(x);
console.log(z)
```

##### this指向

在构造函数中，如果在`this`指定属性前访问，会返回`undefined`

```javascript
function go() {
    console.log(this.a);
    this.a = 30;
}
new go()//undefined
```

如果在原型连上定义，则会去原型链上查找，找不到会返回`undefined`,**但是不会去查找全局作用域，因为通过 new 操作符，this 指向生成的对象实例**

```javascript
function go() {
    console.log(this.a);
    this.a = 30;
}
go.prototype.a = 40
new go()//40
```

```javascript
this.a = 20;

function go() {
    console.log(this.a);
    this.a = 30;
}
go.prototype.a = 40;
var test = {
    a: 50,
    init: function (fn) {
        fn();
        console.log(this.a);
        return fn;
    }
};

//在执行new构造函数时，this.a还没有被赋值，所以去原型链上查找返回40
//在读取对象实例的a属性时，this.a 已经被赋值，所以返回30
console.log((new go()).a); //40 30

//在init方法中fn没有被具体对象调用，所以fn执行时，go方法中this指向全局，返回20
//在下一步中对this.a赋值，this指向window对象所以把全局的a修改为30
//init中的this指向调用init方法的test对象返回50
test.init(go);//20 50

//再次执行fn即go方法，这时this.a已经被修改为30
//init中的this还是指向test对象返回test.a = 50
var p = test.init(go);//30 50

//用一个p变量接受最后返回的go方法，在调用时相当于window调用，最终返回被修改后的a属性为30
p();//30
```

**一些常见的变量**

可以通过`self`判断时否时windows环境

```javascript
self.self===self
```

由于`self`变量经常被修改所以又创建了一个新变量表示全局对象 `globalThis`,也是为了和 Node 环境靠拢

```javascript
self === globalThis
top === globalThis
parent===globalThis
```

##### 严格模式

函数中的严格模式只对函数作用域生效，如果在函数中调用其他函数，其他函数不受严格模式影响 **ES6不建议使用局部严格模式**

##### 参数传递

js中基本类型时按值传递的，引用类型是按地址传递的，形参和实参没有关系

```javascript
function test(m) {
    m = {
        v: 5
    }
}
var m = {
    k: 30
};
test(m);
alert(m.v);//undefined
```

##### 块级作用域

```javascript
{
    function init(){}
    init = 4
}
console.log(init);// function init(){}
```

```javascript
// 在块级作用域中，如果在函数声明前变量已经定义，则函数声明和后面的赋值都不会执行
{
    init = 6
    function init() {}
    init = 4
    // 如果重新定义会报错Identifier 'init' has already been declared
    // const init = 7
    init = 7
    console.log(init); //7
}
console.log(init);//6
```

类似于函数的声明不能覆盖变量的定义

```javascript
var init = 1;
function init() {}
console.log(init)
```

##### 条件语句中的函数声明

```javascript
function init(){
    console.log(1);
}
if(false){
    function init(){
        console.log(2);
    }
}
init()
```

变量被提升，函数不会被提升，等价于：

```javascript
function init(){
    console.log(1);
}
var init;
if(false){
    function init(){
        console.log(2);
    }
}
init()
```

如果在函数体内部，会被提升至作用域顶端

```javascript
function init(){
    console.log(1);
}
(function(){
  if(false){
      function init(){
          console.log(2);
      }
  }
  init()
})
```

等价于

```javascript
function init(){
    console.log(1);
}
(function(){
  var init;
  if(false){
      function init(){
          console.log(2);
      }
  }
  init() //TypeError
})
```

##### 继承

```javascript
function extend(sup, sub) {
    var F = function () {}
    F.prototype = sup.prototype;
    F.prototype.constructor = sub;
    sub.prototype = new F();
    const stck = Object.keys(Super);
    for (var i = 0; i < stck.length; i++) {
        sub[stck[i]] = sup[stck[i]]
    }
}

function Super() {
    this.color = 'red'
}
Super.prototype.init = function () {}
Super.time = Date.now();

function Sub() {
    Super.call(this);
}
extend(Super, Sub);
console.log(new Sub())
```


##### 正则的拷贝

```javascript
/** Used to match `RegExp` flags from their coerced string values. */
var reFlags = /\w*$/;

/**
 * @private
 * @param {Object} regexp The regexp to clone.
 * @returns {Object} Returns the cloned regexp.
 */
function cloneRegExp(regexp) {
    var result = new regexp.constructor(regexp.source, reFlags.exec(regexp));
    result.lastIndex = regexp.lastIndex;
    return result;
}
const reg = /foo/g
let reg2 = cloneRegExp(reg) // /foo/g
console.log(reg2);
```

##### 柯理化

实现 before after

```javascript
function test(a, b, c) {
  console.log('test', a, b, c);
  return 'test';
}

Function.prototype.after = function (cb) {
  const _this = this;
  return function _after() {
    if (_this.name !== '_before') {
      cb();
      const res = _this.apply(_this, arguments);
      return res;
    }
    const res = _this.apply(_this, arguments);
    cb(res);
  }
}

Function.prototype.before = function (cb) {
  const _this = this;
  function _before() {
    if (_this.name === '_after') {
      const res = _this.apply(_this, arguments);
      cb(res);
      return
    }
    const res = cb();
    _this.apply(_this, arguments);
    return res;
  }
  return _before
}

test
  .before(function () {
    console.log('before');
    return 10;
  })
  .after(function (res) {
    console.log('after');
  })
  (1, 2, 3)
```

##### 反柯理化

从字面讲，意义和用法跟函数柯里化相比正好相反，扩大适用范围，创建一个应用范围更广的函数。使本来只有特定对象才适用的方法，扩展到更多的对象。或者说让一个对象去借用一个原本不属于他的方法。

```javascript
//简单实现
var uncurrying = (fn) => (context,...rest)=>fn.apply(context,rest);

//使用call.apply省略context参数
//调用fn的call方法，和Funcion的call方法是同理的，省略了一步原型链查找的过程
//call方法需要执行call执行时候的上下文即fn函数，并把其他参数分别传入
//加上apply方法，重指定call执行时候的上下文，并且call方法的参数可以用数组的形式传入 也就是rest包含[context,...rest]
var uncurrying = fn => (...rest)=> fn.call.apply(fn,rest)

var uncurrying = fn => (...rest)=> Function.prototype.call.apply(fn,rest)

//也可以直接挂载在Function上面
Function.prototype.uncurrying = function (){
    return this.call.bind(this)
}
```

使用场景

```javascript
//借用自己
var un = Function.prototype.uncurrying.uncurrying();
var a = un(Array.prototype.map)([1,2],function(i){console.log(i)});

//改变函数的执行上下文
function sayHi () {
    return "Hello " + this.value +" "+[].slice.call(arguments);
}
var sayHiuncurrying=sayHi.uncurrying();
console.log(sayHiuncurrying({value:'world'},"hahaha"));

//借用方法
var obj = {
    push:function(v){
          return  Array.prototype.push.uncurrying()(this,v)
    } 
}
obj.push('first');
```

