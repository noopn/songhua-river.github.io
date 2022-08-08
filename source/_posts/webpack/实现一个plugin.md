---
title: 实现一个plugin
mathjax: true
categories:
  - webpack
tags:
  - 工程化
  - webpack

date: 2021-08-26 21:24:13
---


#### 通过plugin拷贝额外资源

```javascript
const fs = require('fs');
const path = require('path');
const glob = require("glob")
const {promisify} = require('util');
const readFile = promisify(fs.readFile);

const {RawSource}  = require('webpack').sources;
const  { validate }  = require('schema-utils');

const schema = {
  "type": 'object',
  "properties": {
    "from": {
      "type": 'string',
    },
    "to": {
      "type": 'string',
    },
    "ignore": {
      "type": 'array',
    },
    // 不允许有其他属性
    "additionalProperties": false
  }
};

class CopyfilePlugin {
  constructor(options={}){
    // 验证参数
    validate(schema, options);
    this.options = options;
  }
  apply(compiler) {
    compiler.hooks.thisCompilation.tap('CopyfilePlugin',(compilation)=>{
      compilation.hooks.additionalAssets.tapAsync('CopyfilePlugin', (callback) => {

        const {from,to,ignore} = this.options;
        // 获取系统运行时的文件目录
        const {context} = compiler.options;
        // 获取from的绝对路径
        const fromRelative = path.resolve(context,from,'*.*');

        // 获取from文件夹的文件
        // 排除不需要的文件
        const filePaths =  glob.sync(fromRelative,{
          ignore:['**/index.html']
        })
        filePaths.forEach(async (filePath)=>{
          const file = await readFile(filePath);
          // 获取文件名称
          const filename = path.basename(filePath);
          // 添加额外的打包资源
          compilation.assets[filename] = new RawSource(file);
        })

        callback()
      });
    })
  }
}

module.exports  =CopyfilePlugin;
```