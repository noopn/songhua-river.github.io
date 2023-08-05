---
title: Ubuntu20.04安装VMwarePlayer
mathjax: true
categories:
  - 其他
tags:
  - Ubuntu

date: 2021-09-01 12:50:57
---

#### workstation 和 player之间有什么区别

![](0007.png)


#### 前期准备

安装 `build-essential`

```bash
sudo apt install build-essential
```

#### 下载 VMware Player

[VMware Workstation Player](https://www.vmware.com/products/workstation-player.html)

#### 安装 VMware Player

添加可执行权限

```bash
sudo chmod a+x ./VMware-Player-xxx.bundle
```

安装

```bash
sudo ./VMware-Player-xxx.bundle
```

或

```bash
sudo sh VMware-Player-xxx.bundle
```

#### 启动

按步骤安装 

![](0001.png)

#### 在BIOS中开启虚拟化技术

一般为BIOS中，【Configuration】选项下的【Intel Virtual Technology】

#### 为 vmnet 和 vmmon 服务创建私有密钥

官方文档中解决找不到/dev/vmmon的问题

["Cannot open /dev/vmmon: No such file or directory" error when powering on a VM (2146460)](https://kb.vmware.com/s/article/2146460)

最后一步执行需要用root权限执行,并输入密码

```bash
sudo su
mokutil –import MOK.der
```

重启电脑，在UEFI BIOS中选择Enroll MOK

![](0002.png)

![](0003.png)

![](0004.png)

![](0005.png)

![](0006.png)


重启后就可以正常使用