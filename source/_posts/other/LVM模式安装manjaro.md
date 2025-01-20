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

如果使用 window 环境下的虚拟机安装， 在 **启用或关闭 windows 功能** 配置中，关闭 windows 沙箱， Hyper-v 两个配置， 这功能可能导致虚拟死机。

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

分配成功后使用以下命令查看分区信息：

```bash
sudo pvs
sudo vgs
sudo lvs

# 查看详细信息

sudo pvdisplay
sudo vgdisplay
sudo lvdisplay
```

删除分区

```bash
sudo pvremove /dev/something
sudo vgremove something
sudo lvremove /dev/something
```

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


## 手动挂载分区

系统安装成功后，可能需要挂载更多自定义分区, 首先创建一个 workspace lv分区

查看分区信息

```bash
sudo blkid

#指定分区
sudo blkid /dev/sda1
```

添加信息到 /etc/fstab, 实现自动挂载

![](0013.png)


## 扩容 lvm 

- 扩容虚拟磁盘， vmware 磁盘设置中增加磁盘容量。
  
- 使用 gdisk 为剩余磁盘创建分区，创建成功后磁盘可能无法使用，使用以下命令刷新分区表
  
  ```bash
  sudo partprobe
  ```
- 使用 pvcreate 将新的分区创建为新的pv

- 扩容 vg 将新的 pv 添加至 指定卷组
  
  ```bash
  vgextend vgdisk /dev/sda3

  vgs #查看容量
  ```

- 扩容 lv
  
  -l +  ：指定逻辑卷的LE个数，如 -l +200  一般一个为 4M
  -L + ：表示增加多少空间，如 -L +15G ，单位有bBsSkKmMgGtTpPeE
  -l +100%FREE	：表示增加vg的全部可用空间

  
  ```bash
  lvextend -L +15G /dev/vgname/lvname
  ```

- 扩展文件系统
  
  ```bash
  resize2fs /dev/something
  ```