---
layout: posts
title: LVM模式安装manjaro
mathjax: true
date: 2023-07-03 09:54:34
categories: 其他
tags:
  - Linux
  - Manajro
---

## 安装流程

首先对物理磁盘分区，对于 UEFI 引导方式，需要划分 efi 分区 并把磁盘挂载到 /boot/efi 路径

**注意**： 所有的分区和格式化操作都需要在命令行中执行， manjaro 的 GUI 只用来挂载分区

- 启动前将系统的引导方式修改为 UEFI,进入系统时选择专有驱动的选项启动方式

![](0001.png)

![](0002.png)

- 使用 fdisk 查看磁盘信息

![](0003.png)

- 格式化磁盘为 GPT 格式，划分出 500M 作为 efi 分区，剩余空间给 LVM 使用

![](0004.png)

- 分区成功后将 efi 分区格式化为 FAT32 格式

![](0005.png)

![](0006.png)

- 将剩余的空间转为 LVM, 创建出 /dev/vgdisk/lvhome 分区，并将 lvhome 分区格式化为 ext4

![](0007.png)

- 通过 GUI 界面将分区挂载到指定路径，**挂载磁盘时一定不要重新格式化磁盘**

![](0008.png)

![](0009.png)

![](0010.png)

![](0011.png)

## 错误处理

- 开机时提示一下错误，可能是遗留的 bug,解决方案如下

![](0012.png)

```bash
# /etc/default/grub
GRUB_SAVDEFAULT=false

update-grub
```
