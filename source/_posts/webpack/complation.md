---
title: webpack中complation用法
mathjax: true
categories:
  - webpack
tags:
  - 工程化
  - webpack

date: 2021-08-26 15:04:17
---


#### Compilation

[Compilation](https://webpack.docschina.org/api/compilation-hooks/) 模块会被 Compiler 用来创建新的 compilation 对象（或新的 build 对象）。 compilation 实例能够访问所有的模块和它们的依赖（大部分是循环依赖）。 它会对应用程序的依赖图中所有模块， 进行字面上的编译(literal compilation)。 在编译阶段，模块会被加载(load)、封存(seal)、优化(optimize)、 分块(chunk)、哈希(hash)和重新创建(restore)。

```javascript
const {RawSource}  = require('webpack').sources;
const fs = require('fs');
const {promisify} = require('util');
const readFile = promisify(fs.readFile);
const path = require('path');

class Plugin1 {
  apply(compiler) {
    compiler.hooks.thisCompilation.tap('Plugin2',(compilation)=>{
      // compilation也有自己的生命周期
      // 可以对compilation对象上的资源进行操作
      compilation.hooks.additionalAssets.tapAsync('Plugin2', async (callback) => {
        
        const file = await readFile(path.resolve(__dirname,'../src/b.txt'));

        // 添加额外的打包资源
        compilation.assets['b.txt'] = new RawSource(file);
        callback()
      });
    })
  }
}

module.exports = Plugin1;
```