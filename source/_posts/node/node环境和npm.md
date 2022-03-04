---
layout: post
title: node和npm
abbrlink: 1128db1b
date: 2021-01-06 20:05:53
categories:
  - Node
tags:
  - Node
---

#### REPL 交互式显示

在命令行工具中输入node,进入交互式环境

+ linux ctrl+d 退出
+ tab 键补全
+ .help 查看帮助

#### npm

升级npm `npm install -g npm`

查询可安装的包 `npm serch xxx` 

#### node模块化

文件和模块是一一对应的，一个node文件就是一个模块

这个文件可能是JavaScript代码，JSON或者编译过的c/c++ 扩展

Node.js 中存在4类模块（原生模块和3种文件模块）

**builtin module**: Node中以c++形式提供的模块，如tcp_wrap、contextify等

**constants module**: Node中定义常量的模块，用来导出如signal, openssl库、文件访问权限等常量的定义。如文件访问权限中的O_RDONLY，O_CREAT、signal中的SIGHUP，SIGINT等。

**native module**: Node中以JavaScript形式提供的模块，如http,https,fs等。有些native module需要借助于builtin module实现背后的功能。如对于native模块buffer ,还是需要借助builtin node_buffer.cc中提供的功能来实现大容量内存申请和管理，目的是能够脱离V8内存大小使用限制。

**3rd-party module**: 以上模块可以统称Node内建模块，除此之外为第三方模块，典型的如express模块。

+ module.exports和exports的区别

```javascript

var circle = require('./circle.js');  
console.log( 'The area of a circle of radius 4 is ' + circle.area(4)); 

var PI = Math.PI;  
exports.area = function (r) {  
  return PI * r * r;  
};  
```

如果你的模块属于“模块实例（module instances）”，就像官方文档中给出的示例那样，那么exports足以满足要求。

但是事实上，require()返回的是module.exports，exports只是module.exports的一个引用，exports的作用只在module.exports没有指定的时候，收集属性并附加到module.exports。

```javascript
module.exports = '孙悟空';  
exports.name = function() {  
    console.log('我是白骨精');  
};
```

这个模块会完全忽略exports.name，因为module.exports被指定了另一个对象。你的模块不一定是模块实例（module instances），你的模块可以是任意的，你设置成module.exports的Javascript对象。如果你不显示的指定module.exports，那么返回的将是exports和exports附加的值。

也可以这样认为，一个模块刚开始的时候，module.exports和exports是一样的，exports只是module.exports的一个别名，两者都是{}。

当你给module.exports指定一个对象的时候，两者就不再一样的，而模块导出的一定是module.exports。

