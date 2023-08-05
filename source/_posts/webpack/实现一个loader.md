---
title: 实现一个loader
mathjax: true

date: 2021-08-18 17:05:21
categories:
  - webpack
tags:
  - 工程化
  - webpack
---

[WEEBPACK LOADER](https://webpack.js.org/contribute/writing-a-loader/)

#### 简单loader

配置webpack.config，webpace5提供默认的`entry`和`output`所以无需配置

```javascript
module.exports = {
  module:{
    rules:[{
      test:/\.js$/,
      use:['my-loader','my-loader1','my-loader2']
    }]
  },
  mode:'production',
  // webpack5 提供resolveLoader可以配置loader的查找目录
  resolveLoader: {
    modules: ['node_modules',path.resolve(__dirname,'loader')],
  },
}
```

实现loader `loader/my-loader` `loader/my-loader1` `loader/my-loader2`

```javascript
// 同步方法在loader解析时执行
// 也就是use数组中的loader从右向左执行
module.exports = function(content){
  console.log(111);
  return content;
}
// pitch 方法在loader加载时执行
// 也就是use数组中的loader从左向右执行
module.exports.pitch = function(){
  console.log('p111')
}
```

#### 同步loader和异步loader

同步写法

```javascript
module.exports = function(content){
  this.callback(null,content);
}
```

异步写法,仍然按顺序依次执行，不会改变loader执行顺序

```javascript
module.exports = function(content){
  var callback = this.async();
  setTimeout(()=>{
    callback(null,content)
  },3000)
}
```


#### 获取loader的options

为loader添加options

```javascript
{
module.exports = {
  module:{
    rules:[{
      test:/\.js$/,
      use:[{
         loader:'my-loader',
         options:{
          test:'1231'
         }        
      },'my-loader1','my-loader2']
    }]
  }
}
```

```javascript
const  { getOptions }  = require('loader-utils');
const  { validate }  = require('schema-utils');

const schema = {
  type: 'object',
  properties: {
    test: {
      type: 'string',
    }
  }
};

module.exports = function(content){
  const options = getOptions(this);

  console.log(options);
  validate(schema, options, {
    // 需要校验的loader名称
    name: 'my-loader',
    baseDataPath: 'options',
  });

  this.callback(null,content);
}
```


#### 实现一个loader

添加webpack.config.json配置

```JavaScript
const path = require('path');

module.exports = {
  module:{
    rules:[{
      test:/\.js$/,
      loader:'babelLoader',
      options:{
        "presets": ["@babel/preset-env"]
      }
    }]
  },
  mode:'production',
  resolveLoader: {
    modules: ['node_modules',path.resolve(__dirname,'loader')],
  },
}
```

loader

```javascript
const  { getOptions }  = require('loader-utils');
const  { validate }  = require('schema-utils');
const {promisify} = require('util')
const babel = require('@babel/core');

const schema = {
  type: 'object',
  properties: {
    persets:{
      type:'array'
    }
  }
};

module.exports = function(content){
  const options = getOptions(this);
  const callback = this.async();

  validate(schema, options, {
    // 需要校验的loader名称
    name: 'babelLoader',
    baseDataPath: 'options',
  });

  console.log(options);


  const transfrom =  promisify(babel.transform);
  transfrom(content,options)
    .then(({code}) =>callback(null,code))
}
```