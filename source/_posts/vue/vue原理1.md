---
title: vue原理A
mathjax: true
categories:
  - Vue
tags:
  - Vue
  - 应用案例

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
 
