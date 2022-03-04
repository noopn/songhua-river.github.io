---
layout: post
title: stream模块
categories:
  - Node
tags:
  - Node
abbrlink: 4a21a07
date: 2021-01-07 18:53:23
---

#### 相关概念

流有起点和终点，逐端读取文件,大文件

为什么要使用？

可以逐渐读取，内存效率

把大的文件拆分成一块一块，时间效率

一个简单的读写留的例子：

```javascript
//文件模块
const fs = require('fs');
//创建读取数据流 
const rs = fs.createReadStream('./yarn.lock')
//创建写入数据流 
const ws = fs.createWriteStream('./yarn.copy.lock')

rs.on('data', chunk => {
  ws.write(chunk)
})

rs.on('end', () => {
  ws.end()
})
```

使用这种方法不能保证读写一直，所以需要使用pipe

注意只有可读流才有pipe方法

```javascript
//文件模块
const fs = require('fs');
//创建读取数据流 
const rs = fs.createReadStream('./yarn.lock')
//创建写入数据流 
const ws = fs.createWriteStream('./yarn.copy.lock')
rs.pipe(ws)
```

#### 流的类型

+ 可读流

```javascript
const rs = fs.createReadStream('./yarn.lock', {
  //设置编码方式
  encoding: 'utf8',
  //设置缓冲区大小,六个字节
  highWaterMark: 6
})

rs.on('data', (chunk) => {
  console.log(chunk)
})
```

两种调用方式，自动调用(flowing)还是手动调用(pause)

使用`stream.on("data",()=>{})` 为自动模式，读取的时候会不断触发 `data` 方法,resume pipe 都是自动模式

```javascript
rs.on('readable', (chunk) => {
  console.log(chunk)
})
//手动读取数据
rs.read()
```

+ 可写流

```javascript
const fs = require('fs');
const ws = fs.createWriteStream('a.txt')
ws.write('xxx');

ws.on('finish', () => {
  ws.end()
})
```

+ Duplex: 双工流  net.socket

+ transform: 转换流 文件压缩

```javascript
//文件模块
const stream = require('stream');
const transform = stream.Transform({
  //自定义转换方法
  transform(chunk, encoding, cb) {
    //大小写转换，放到缓冲区
    this.push(chunk.toString().toLowerCase())
  }
})
transform.write('D');
console.log(transform.read().toString());
```

stream对象都是EventEmitter的实例，所以可以发布事件

+ 流的链式操作

```javascript
const fs = require('fs');
const zlib = require('zlib');

fs.createReadStream('a.txt')
  .pipe(zlib.createGunzip)
  .pipe(fs.createWriteStream('a.zip'))
```

+ 使用readline逐行读取

```javascript
const fs = require('fs');
const readline = require('readline')
const path = require('path');
const filePath = path.resolve(__dirname,'./yarn.lock');
const rs = fs.createReadStream(filePath);
const rl = readline.createInterface({
  input:rs
})
rl.on('line',(l)=>{
  console.log(l)
})
```

