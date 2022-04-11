---
layout: posts
title: VMWare 使用SSH链接
mathjax: true
date: 2022-04-10 13:59:18
categories:
  - 其他
tags:
  - VMWare
  - Linux
---


#### SSH客户端与服务端

openssh-client 客户端,如果想通过 ssh 链接其他服务器需要安装客户端

ssh-server 服务端,如果想让其他机器通过 ssh 链接本机,需要在本机开机 ssh 服务,即安装服务端

Ubuntu server版 默认没有安装 ssh-client
Ubuntu 桌面版    默认没有安装 ssh-server

Ubuntu 安装 ssh 客户端或服务端

```bash
$ sudo apt-get update //更新软件源
$ sudo apt-get install openssh-client //安装openssh-client
$ sudo apt-get install openssh-server //安装openssh-server
$ sudo service ssh start //启动ssh服务
```

centOS 安装 ssh

```bash
# 搜索 ssh 包名
yum search openssh

yum install openssh-clients.x86_64
yum install openssh-server.x86_64
```

检查虚拟机是否安装了 ssh-server

```bash
ps -e | grep ssh
# 1512 00:00:00 sshd
```

#### VMWare 配置

##### 查询 IP

查询宿主机和虚拟机的 ip 备用

![](0002.png) 

宿主机IP

![](0003.png) 

虚拟机IP


##### 建立映射

接下来就需要将宿主机和虚拟机的IP映射起来。

打开VMware的虚拟网络编辑器（编辑>虚拟网络编辑器）：

![](0004.png)

[检查子网Ip(Subnet IP) 和 子网掩码(Subnet mask)](/posts/964c11e46f74/), 正常情况下无需修改

如果保存时报错 **子网ip和子网掩码不匹配**,请检查子网IP, 格式为 xxx.xxx.xxx.0 他与子网掩码 255.255.255.0 对应

不可以写为 `xxx.xxx.xxx.120` 等其他数字,这表示具体子网中的一个网络设备,并不是子网IP

配置完成后可以使用 ssh 工具链接

```bash
ssh root@192.168.255.128
```