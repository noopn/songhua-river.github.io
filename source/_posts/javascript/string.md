---
title: 字符串
mathjax: true

date: 2020-10-17 14:11:53
categories:
- JavaScript
tags:
- JavaScript
- ES6基础
---

#### 字符的 Unicode 表示法

ES6 加强了对 Unicode 的支持，允许采用\uxxxx形式表示一个字符，其中xxxx表示字符的 Unicode 码点。 `"\u0061"==="a"`

这种表示法只限于码点在`\u0000~\uFFFF`之间的字符，对双字节的文字 `𠮷` 不能解析`"\u20BB7"`,因为对于超出范围的文字会解析成`\u20BB` 和 `7`，ES6 对这一点做出了改进,通过使用大括号的方式 `"\u{20BB7}"==="𠮷"`

+ 中文转Unicode的方法

```javascript
function toUnicode(str) {
    if (typeof str !== 'string') {
        throw new Error()
    }
    if (str === '') {
        return;
    }
    var res = '';
    for (var i = 0; i < str.length; i++) {
        res += '\\u' + str[i].charCodeAt().toString(16)
    }
    return res;
}
```

```javascript
function toUnicode(str) {
    if (typeof str !== 'string') {
        throw new Error()
    }
    if (str === '') {
        return;
    }
    let res = '';
    for (let s of str) {
        res += `\\u{${s.codePointAt().toString(16)}}`
    }
    return res;
}
```

+ Unicode转中文

```javascript
function toCh(str) {
    if (typeof str !== 'string') {
        throw new Error()
    }
    if (str === '') {
        return;
    }
    var reg = /\\u{([a-f0-9A-F]+)}/g;
    var res = '';

    while (reg.exec(str)) {
        res += String.fromCodePoint(parseInt(RegExp.$1, 16));
    }
    return res;
}
```

#### fromCodePoint codePointAt

ES5 提供String.fromCharCode()方法，用于从 Unicode 码点返回对应字符，但是这个方法不能识别码点大于0xFFFF的字符。

```javascript
String.fromCharCode(0x20BB7)
// "ஷ"
```

上面代码中，如果String.fromCodePoint方法有多个参数，则它们会被合并成一个字符串返回。

```javascript
String.fromCodePoint(0x20BB7)
// "𠮷"
String.fromCodePoint(0x78, 0x1f680, 0x79) === 'x\uD83D\uDE80y'
// true
```

**注意，fromCodePoint方法定义在String对象上，而codePointAt方法定义在字符串的实例对象上**

JavaScript 内部，字符以 UTF-16 的格式储存，每个字符固定为2个字节。对于那些需要4个字节储存的字符（Unicode 码点大于0xFFFF的字符），JavaScript 会认为它们是两个字符。

```javascript
var s = "𠮷";

s.length // 2
s.charAt(0) // ''
s.charAt(1) // ''
s.charCodeAt(0) // 55362
s.charCodeAt(1) // 57271
```

codePointAt()方法的参数，仍然是不正确的。比如，上面代码中，字符a在字符串s的正确位置序号应该是 1，但是必须向codePointAt()方法传入 2。解决这个问题的一个办法是使用for...of循环，因为它会正确识别 32 位的 UTF-16 字符。

```javascript
let s = '𠮷a';
for (let ch of s) {
  console.log(ch.codePointAt(0).toString(16));
}
// 20bb7
// 61
```

另一种方法也可以，使用扩展运算符（...）进行展开运算。

```javascript
let arr = [...'𠮷a']; // arr.length === 2
arr.forEach(
  ch => console.log(ch.codePointAt(0).toString(16))
);
// 20bb7
// 61
```

codePointAt()方法是测试一个字符由两个字节还是由四个字节组成的最简单方法。

```javascript
function is32Bit(c) {
  return c.codePointAt(0) > 0xFFFF;
}

is32Bit("𠮷") // true
is32Bit("a") // false
```

#### 字符串的遍历器接口

ES6 为字符串添加了遍历器接口，使得字符串可以被for...of循环遍历。

除了遍历字符串，这个遍历器最大的优点是可以识别大于0xFFFF的码点，传统的for循环无法识别这样的码点。

```javascript
let text = String.fromCodePoint(0x20BB7);

for (let i = 0; i < text.length; i++) {
  console.log(text[i]);
}
// " "
// " "
for (let i of text) {
  console.log(i);
}
// "𠮷"
```

#### 需要转移的字符

|码点|字符|
|---|---|
|U+005C|反斜杠（reverse solidus)|
|U+000D|回车（carriage return）||
|U+2029|段分隔符（paragraph separator）|
|U+000A|换行符（line feed）|

#### JSON.stringify()

具体来说，UTF-8 标准规定，0xD800到0xDFFF之间的码点，不能单独使用，必须配对使用。比如，\uD834\uDF06是两个码点，但是必须放在一起配对使用，代表字符𝌆。这是为了表示码点大于0xFFFF的字符的一种变通方法。单独使用\uD834和\uDFO6这两个码点是不合法的，或者颠倒顺序也不行，因为\uDF06\uD834并没有对应的字符。

JSON.stringify()的问题在于，它可能返回0xD800到0xDFFF之间的单个码点。

为了确保返回的是合法的 UTF-8 字符，ES2019 改变了JSON.stringify()的行为。如果遇到0xD800到0xDFFF之间的单个码点，或者不存在的配对形式，它会返回转义字符串，留给应用自己决定下一步的处理。

```javascript
JSON.stringify('\u{D834}') // ""\\uD834""
JSON.stringify('\uDF06\uD834') // ""\\udf06\\ud834""
```

#### 模板字符串

+ 如果在模板字符串中需要使用反引号，则前面要用反斜杠转义。

+ 如果使用模板字符串表示多行字符串，所有的空格和缩进都会被保留在输出之中。

+ 模板字符串中嵌入变量，需要将变量名写在${}之中。

+ 通过模板字符串编译模板

```javascript
let template = `
    <ul>
        <% for(let i=0; i < data.supplies.length; i++) { %>
            <li><%= data.supplies[i] %></li>
        <% } %>
    </ul>
`;

function complie(template) {
    let evalExpr = /<%=(.+?)%>/g;
    let expr = /<%([\s\S]+?)%>/g;

    template = template
        .replace(evalExpr, '`); \n  echo( $1 ); \n  echo(`')
        .replace(expr, '`); \n $1 \n  echo(`');
    template = 'echo(`' + template + '`);';
    
    const excu = `
        'use strict;'
        let html = '';
        function echo(exp) {
            html += exp
        }
        ${template}
        return html;
    `
    return function (data) {
        return Function('data',excu)(data);
    }
}
console.log(complie(template)({
    supplies: [1, 2, 3]
}))
```

#### 标签模板

它可以紧跟在一个函数名后面，该函数将被调用来处理这个模板字符串。这被称为“标签模板”功能（tagged template）。

```javascript
let a = 5;
let b = 10;

tag`Hello ${ a + b } world ${ a * b }`;
// 等同于
tag(['Hello ', ' world ', ''], 15, 50);
```

```javascript
function passthru(literals, ...values) {
  let output = "";
  let index;
  for (index = 0; index < values.length; index++) {
    output += literals[index] + values[index];
  }

  output += literals[index]
  return output;
}
```

+ 过滤 HTML 字符串，防止用户输入恶意内容。

```javascript
let message =
  SaferHTML`<p>${sender} has sent you a message.</p>`;

function SaferHTML(templateData) {
  let s = templateData[0];
  for (let i = 1; i < arguments.length; i++) {
    let arg = String(arguments[i]);

    // Escape special characters in the substitution.
    s += arg.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

    // Don't escape special characters in the template.
    s += templateData[i];
  }
  return s;
}
```

+ 多语言转换（国际化处理）。

```javascript
i18n`Welcome to ${siteName}, you are visitor number ${visitorNumber}!`
// "欢迎访问xxx，您是第xxxx位访问者！"
```

raw属性

tag函数的第一个参数strings，有一个raw属性，也指向一个数组。该数组的成员与strings数组完全一致。比如，strings数组是["First line\nSecond line"]，那么strings.raw数组就是["First line\\nSecond line"]。两者唯一的区别，就是字符串里面的斜杠都被转义了。比如，strings.raw 数组会将\n视为\\和n两个字符，而不是换行符。这是为了方便取得转义之前的原始模板而设计的。

```javascript
tag`First line\nSecond line`

function tag(strings) {
  console.log(strings.raw[0]);
  // strings.raw[0] 为 "First line\\nSecond line"
  // 打印输出 "First line\nSecond line"
}
```

#### String.raw()

ES6 还为原生的 String 对象，提供了一个raw()方法。该方法返回一个斜杠都被转义（即斜杠前面再加一个斜杠）的字符串，往往用于模板字符串的处理方法。

```javascript
String.raw`Hi\\n`
// 返回 "Hi\\\\n"

String.raw`Hi\\n` === "Hi\\\\n" // true
```

```javascript
// `foo${1 + 2}bar`
// 等同于
String.raw({ raw: ['foo', 'bar'] }, 1 + 2) // "foo3bar"
```

#### 实例方法：includes(), startsWith(), endsWith()

+ includes()：返回布尔值，表示是否找到了参数字符串。

+ startsWith()：返回布尔值，表示参数字符串是否在原字符串的头部。

+ endsWith()：返回布尔值，表示参数字符串是否在原字符串的尾部。

三个方法都支持第二个参数，表示开始搜索的位置。

endsWith的行为与其他两个方法有所不同。它针对前n个字符，而其他两个方法针对从第n个位置直到字符串结束。

```javascript
let s = 'Hello world!';

s.startsWith('world', 6) // true
s.endsWith('Hello', 5) // true
s.includes('Hello', 6) // false
```

#### repeat()

参数如果是小数，会被取整。如果repeat的参数是负数或者Infinity，会报错。参数NaN等同于 0。repeat的参数是字符串，则会先转换成数字。

```javascript
'x'.repeat(3) // "xxx"
```


#### 实例方法：padStart()，padEnd()

padStart()和padEnd()一共接受两个参数，第一个参数是字符串补全生效的最大长度，第二个参数是用来补全的字符串。

如果原字符串的长度，等于或大于最大长度，则字符串补全不生效，返回原字符串。

如果用来补全的字符串与原字符串，两者的长度之和超过了最大长度，则会截去超出位数的补全字符串。

如果省略第二个参数，默认使用空格补全长度。

```javascript
'xxx'.padStart(2, 'ab') // 'xxx'

'abc'.padStart(10, '0123456789')
// '0123456abc'

'x'.padStart(4) // '   x'
'x'.padEnd(4) // 'x   '

```

常见用途，补全字符串，提示时间格式

```javascript
'1'.padStart(10, '0') // "0000000001"

'12'.padStart(10, 'YYYY-MM-DD') // "YYYY-MM-12"
```

#### trimStart()，trimEnd()

ES2019 对字符串实例新增了trimStart()和trimEnd()这两个方法。它们的行为与trim()一致，trimStart()消除字符串头部的空格，trimEnd()消除尾部的空格。它们返回的都是新字符串，不会修改原始字符串。

