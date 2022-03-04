---
title: vue原理
mathjax: true
categories:
  - Vue
tags:
  - Vue
  - 应用案例
abbrlink: c62f768f
date: 2021-02-02 08:28:18
---

#### 目录分析

+ dist 打包出各种不同的规范文件，其中runtime(程序运行起来的状态)文件只包括运行时，runtime包括事件，响应式数数，vdom,
  complier在线运行时对模板文件编译（在线编译） 

+ src
  + compiler 目录是编译模板
  + core 核心文件
    + keep-alive
    + vue 全局api use mixin
    + event lifecycle
    + observer 双向数据绑定 dep
  + entries 生产打包的入口
  + platforms 是核心模块对应在各平台上的模块
  + server 处理服务端渲染
  + sfc 目录处理单文件 .vue
  + shared 提供全局用到的工具函数
 
#### 双向数据绑定

![](0001.png)

##### OBSERVER

Observer会观察两种类型的数据，Object 与 Array，对于Array类型的数据，由于 JavaScript 的限制， Vue 不能检测变化,会先重写操作数组的原型方法，重写后能达到两个目的，当数组发生变化时，触发 notify
如果是 push，unshift，splice 这些添加新元素的操作，则会使用observer观察新添加的数据，重写完原型方法后，遍历拿到数组中的每个数据 使用observer观察它而对于Object类型的数据，则遍历它的每个key，使用 defineProperty 设置 getter 和 setter，当触发getter的时候，observer则开始收集依赖，而触发setter的时候，observe则触发notify。