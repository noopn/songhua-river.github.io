---
title: linux 架构
mathjax: true

date: 2020-10-13 22:19:40
categories:
- Linux
- 基础命令
tags: 
- Linux
---

![](0001.png)

+ 内核5大核心功能

+ 操作系统用于管理计算机资源，cpu资源，外围设备，内存

![](0002.jpg)

+ 程序在调用文件的读写时，需要调用内核的功能，也叫做内核模式

+ 用户在写自己的逻辑的时候，就是用户模式

![](0003.jpg)

+ Process mannagement (进程管理) linux多任务系统，进程管理用于调度cpu

+ Memory management 用于内存分配

+ File systems 读写文件，终端输入输出，保存文件，linux树状结构也是有文件系统维护

+ Device drivers 如何与硬件对接

+ Network 对上提供socket, ssh http 都是应用层协议

