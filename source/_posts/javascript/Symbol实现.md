---
title: Symbol实现
mathjax: true
categories:
  - JavaScript
tags:
  - Symbol

date: 2021-02-20 14:04:05
---

#### Symbol类型的行为

##### 1.类型检测

Symbol 值通过 Symbol 函数生成，使用 typeof，结果为 "symbol"

##### 2.不能使用new

Symbol 函数前不能使用 new 命令，否则会报错。这是因为生成的 Symbol 是一个原始类型的值，不是对象。

##### 3.instanceof 的结果为 false

```javascript
var s = Symbol('foo');
console.log(s instanceof Symbol); // false
```

##### 4.参数接受

```javascript
var s1 = Symbol('foo');
console.log(s1); // Symbol(foo)
```

如果接受的是一个对象调用的则是对象的 toString 方法

##### 5.不能运算

Symbol 值不能与其他类型的值进行运算，会报错。

```javascript
var sym = Symbol('My symbol');
 
console.log("your symbol is " + sym); // TypeError: can't convert symbol to string
```

##### 6.可以转换为字符串

```javascript

var sym = Symbol('My symbol');
 
console.log(String(sym)); // 'Symbol(My symbol)'
console.log(sym.toString()); // 'Symbol(My symbol)'
```

##### 7.可以当作属性名

Symbol 值可以作为标识符，用于对象的属性名，可以保证不会出现同名的属性。

```javascript
var mySymbol = Symbol();
 
// 第一种写法
var a = {};
a[mySymbol] = 'Hello!';
 
// 第二种写法
var a = {
  [mySymbol]: 'Hello!'
};
 
// 第三种写法
var a = {};
Object.defineProperty(a, mySymbol, { value: 'Hello!' });
 
// 以上写法都得到同样结果
console.log(a[mySymbol]); // "Hello!"
```

##### 8.不能枚举

Symbol 作为属性名，该属性不会出现在 for...in、for...of 循环中，也不会被 Object.keys()、Object.getOwnPropertyNames()、JSON.stringify() 返回。但是，它也不是私有属性，有一个 Object.getOwnPropertySymbols 方法，可以获取指定对象的所有 Symbol 属性名。

```javascript
var obj = {};
var a = Symbol('a');
var b = Symbol('b');
 
obj[a] = 'Hello';
obj[b] = 'World';
 
var objectSymbols = Object.getOwnPropertySymbols(obj);
 
console.log(objectSymbols);
// [Symbol(a), Symbol(b)]
```

##### 9.Symbol.for

如果我们希望使用同一个 Symbol 值，可以使用 Symbol.for。它接受一个字符串作为参数，然后搜索有没有以该参数作为名称的 Symbol 值。如果有，就返回这个 Symbol 值，否则就新建并返回一个以该字符串为名称的 Symbol 值。

```javascript
var s1 = Symbol.for('foo');
var s2 = Symbol.for('foo');
 
console.log(s1 === s2); // true
```

##### 10.Symbol.keyFor

Symbol.keyFor 方法返回一个已登记的 Symbol 类型值的 key。

```javascript
var s1 = Symbol.for("foo");
console.log(Symbol.keyFor(s1)); // "foo"
 
var s2 = Symbol("foo");
console.log(Symbol.keyFor(s2) ); // undefined
```

#### polyfile分析

Symbol 返回一个独一无二的值，根据官方文档symbol的创建步骤

> Symbol ( [ description ] )

  When Symbol is called with optional argument description, the following steps are taken:

  If NewTarget is not undefined, throw a TypeError exception.
  If description is undefined, var descString be undefined.
  Else, var descString be ToString(description).
  ReturnIfAbrupt(descString).
  Return a new unique Symbol value whose [[Description]] value is descString.

+ 如果使用 new ，就报错
+ 如果 description 是 undefined，让 descString 为 undefined
+ 否则 让 descString 为 ToString(description)
+ 如果报错，就返回
+ 返回一个新的唯一的 Symbol 值，它的内部属性 [[Description]] 值为 descString

还需要定义一个 [[Description]] 属性，如果直接返回一个基本类型的值，是无法做到这一点的，所以我们最终还是返回一个对象

#### 第一版

```javascript
var SymbolPolyfill = function Symbol(description) {
      // 实现特性第 2 点：Symbol 函数前不能使用 new 命令
      if (this instanceof SymbolPolyfill) throw new TypeError('Symbol is not a constructor');

      // 实现特性第 4 点：如果 Symbol 的参数是一个对象，就会调用该对象的 toString 方法，将其转为字符串，然后才生成一个 Symbol 值。
      var descString = description === undefined ? undefined : String(description)

      // 实现第六点：可以转为字符串
      var symbol = Object.create({
        toString: function() {
          return 'Symbol(' + this.__Description__ + ')';
        },
        // 不能与其他值运算
        // 对于原生 Symbol，显式调用 valueOf 方法，会直接返回该 Symbol 值，
        // 而我们又无法判断是显式还是隐式的调用，所以这个我们就只能实现一半，要不然实现隐式调用报错，要不然实现显式调用返回该值，
        valueOf: function() {
          throw new Error('Cannot convert a Symbol value')
        }
      })

      Object.defineProperties(symbol, {
          '__Description__': {
              value: descString,
              writable: false,
              enumerable: false,
              configurable: false
          }
      });

      // 实现特性第 6 点，因为调用该方法，返回的是一个新对象，两个对象之间，只要引用不同，就不会相同
      return symbol;
  }
```

#### 第三版

当我们模拟的所谓 Symbol 值其实是一个有着 toString 方法的 对象，当对象作为对象的属性名的时候，就会进行隐式类型转换，还是会调用我们添加的 toString 方法，对于 Symbol('foo') 和 Symbol('foo')两个 Symbol 值，虽然描述一样，但是因为是两个对象，所以并不相等，但是当作为对象的属性名的时候，都会隐式转换为 Symbol(foo) 字符串，这个时候就会造成同名的属性。

```javascript
var a = SymbolPolyfill('foo');
var b = SymbolPolyfill('foo');
 
console.log(a ===  b); // false
 
var o = {};
o[a] = 'hello';
o[b] = 'hi';
 
console.log(o); // {Symbol(foo): 'hi'}
```

为了防止不会出现同名的属性，毕竟这是一个非常重要的特性，迫不得已，我们需要修改 toString 方法，让它返回一个唯一值，所以第 8 点就无法实现了，而且我们还需要再写一个用来生成 唯一值的方法，就命名为 generateName，我们将该唯一值添加到返回对象的 __Name__ 属性中保存下来。

```javascript
var generateName = (function(){
        var postfix = 0;
        return function(descString){
            postfix++;
            return '@@' + descString + '_' + postfix
        }
    })()
 
    var SymbolPolyfill = function Symbol(description) {
 
        if (this instanceof SymbolPolyfill) throw new TypeError('Symbol is not a constructor');
 
        var descString = description === undefined ? undefined : String(description)
 
        var symbol = Object.create({
            toString: function() {
                return this.__Name__;
            }
        })
 
        Object.defineProperties(symbol, {
            '__Description__': {
                value: descString,
                writable: false,
                enumerable: false,
                configurable: false
            },
            '__Name__': {
                value: generateName(descString),
                writable: false,
                enumerable: false,
                configurable: false
            }
        });
 
        return symbol;
    }

```

#### 第四版

```javascript
var generateName = (function(){
        var postfix = 0;
        return function(descString){
            postfix++;
            return '@@' + descString + '_' + postfix
        }
    })()
 
    var SymbolPolyfill = function Symbol(description) {
 
        if (this instanceof SymbolPolyfill) throw new TypeError('Symbol is not a constructor');
 
        var descString = description === undefined ? undefined : String(description)
 
        var symbol = Object.create({
            toString: function() {
                return this.__Name__;
            },
            valueOf: function() {
                return this;
            }
        })
 
        Object.defineProperties(symbol, {
            '__Description__': {
                value: descString,
                writable: false,
                enumerable: false,
                configurable: false
            },
            '__Name__': {
                value: generateName(descString),
                writable: false,
                enumerable: false,
                configurable: false
            }
        });
 
        return symbol;
    }

    // 遍历 forMap,查找该值对应的键值即可。
    var forMap = {};
 
    Object.defineProperties(SymbolPolyfill, {
        'for': {
            value: function(description) {
                var descString = description === undefined ? undefined : String(description)
                return forMap[descString] ? forMap[descString] : forMap[descString] = SymbolPolyfill(descString);
            },
            writable: true,
            enumerable: false,
            configurable: true
        },
        'keyFor': {
            value: function(symbol) {
                for (var key in forMap) {
                    if (forMap[key] === symbol) return key;
                }
            },
            writable: true,
            enumerable: false,
            configurable: true
        }
    });
```