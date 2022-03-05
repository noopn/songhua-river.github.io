---
title: webpack中complier用法
mathjax: true
categories:
  - webpack
tags:
  - 工程化
  - webpack

date: 2021-08-26 14:53:59
---


#### tapable

[tapbale](https://github.com/webpack/tapable)暴露了很多钩子，可以为webpack插件创建时使用

```javascript
const {SyncHook,SyncBailHook,AsyncParallelHook,AsyncSeriesHook} = require('tapable')

class Lesson {
  constructor(){
    // 初始化hooks容器
    // 数组中的参数为绑定钩子回调函数的字段描述
    this.hooks = {
      // 同步hooks,任务依次被执行
      go:new SyncHook(['address']),
      // 同步hooks,一旦其中一个有返回值，后面的hooks就停止执行
      go1:new SyncBailHook(['address']),
      // 异步钩子，并行执行
      go2:new AsyncParallelHook(['name','age']),
      // 异步钩子，并行串行
      go3:new AsyncSeriesHook(['name','age']),
    }
  }
  // 添加事件，可以同时绑定多个事件
  tap(){
    this.hooks.go1.tap('class',(address)=>{
      console.log('class',address)
    })
    this.hooks.go1.tap('class1',(address)=>{
      console.log('class1',address)
    })

    // 异步钩子的两种写法
    this.hooks.go2.tapAsync('class3',(name,age,cb)=>{
      setTimeout(() => {
        console.log('class3',name,age);
        cb()
      },2000);
    })

    this.hooks.go2.tapPromise('class4',(name,age)=>{
      return new Promise((resolve,reject)=>{
        setTimeout(() => {
          console.log('class4',name,age);
        },1000);
      })
    })
  }
  //触发hooks
  start(){
    this.hooks.go1.call('触发时间时候传入的参数')
    this.hooks.go2.callAsync('Gavin',18)
  }
}

const l = new Lesson();
l.tap();
l.start();
```


#### Compiler

[Compiler](https://webpack.docschina.org/api/compiler-hooks/) 模块是 webpack 的主要引擎，它通过 CLI 传递的所有选项， 或者 Node API，创建出一个 compilation 实例。 它扩展(extend)自 Tapable 类，用来注册和调用插件。 大多数面向用户的插件会首先在 Compiler 上注册。


在插件中使用不同的生命周期钩子来处理资源

```javascript
class Plugin1 {
  apply(compiler) {
    compiler.hooks.initialize.tap('initialize',()=>{
      console.log('编译器对象初始化')
    })
    
    compiler.hooks.emit.tapAsync(
      'emit',
      (compilation, callback) => {
        setTimeout(() => {
          console.log('出发emit事件');
          callback();
        }, 2000);
      }
    );
    compiler.hooks.afterEmit.tapPromise(
      'afterEmit',
      (compilation, callback) => {
        return new Promise((resolve,reject)=>{
          setTimeout(() => {
            console.log('出发afterEmit事件')
          }, 1000);
        })
      }
    );
  }
}

module.exports = Plugin1;
```