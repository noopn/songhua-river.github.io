---
layout: posts
title: VMWare 配置桥接模式
mathjax: true
date: 2024-03-20 10:23:27
categories:
  - 其他
tags:
  - VMWare
---


#### 桥接模式配置

- **管理员模式启动VMware** 
  
- VMware虚拟网络管理中，选择桥接模式并选择当前网卡
  
  ![](001.png)

- 虚拟机网络配置，选择桥接模式
  
  ![](002.png)

- 虚拟机网络链接配置，选择手动模式
  ip 地址前三位相同，最后一位保证在当前网段唯一
  其他信息与宿主机保持一致

  ![](003.png)