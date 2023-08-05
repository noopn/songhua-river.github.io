---
title: 用户管理
mathjax: true

date: 2020-10-21 09:14:09
categories:
  - Linux
  - 基础命令
tags:
  - Linux
---

#### 创建用户／设置密码／删除用户

> 提示：创建用户 / 删除用户 / 修改其他用户密码 的终端命令都需要通过 `sudo` 执行

| 序号 | 命令 | 作用 | 说明 |
| --- | --- | --- | --- |
| 01 | useradd -m -g 组 新建用户名 | 添加新用户 |-m 自动建立用户家目录-g 指定用户所在的组，否则会建立一个和同名的组|
| 02 | passwd 用户名 | 设置用户密码 | 使用sudo运行，如果是普通用户，直接用 passwd 可以修改自己的账户密码|
| 03 | userdel -r 用户名 | 删除用户 | -r 选项会自动删除用户家目录 |
| 04 | cat /etc/passwd \| grep 用户名 | 确认用户信息 | 新建用户后，用户信息会保存在 /etc/passwd 文件中 |


> 提示：

  + 创建用户时，如果忘记添加 -m 选项指定新用户的家目录,**最简单的方法就是删除用户**。

  + 重新创建创建用户时,默认会创建一个和用户名同名的组名,用户信息保存在 /etc/passwd 文件中

#### 查看用户信息

| 序号 | 命令 | 作用 |
| --- | --- | --- |
| 01 | id [用户名] | 查看用户 UID 和 GID 信息,没写用户名默认是当前用户信息 |
| 02 | who | 查看当前所有登录的用户列表 |
| 03 | whoami | 查看当前登录用户的账户名 |

![](0002.png)

**passwd 文件**

+ /etc/passwd 文件存放的是用户的信息，由 6 个分号组成的 7 个信息，分别是
1. 用户名
2. 密码（x，表示加密的密码）
3. UID（用户标识）
4. GID（组标识）
5. 用户全名或本地帐号
6. 家目录
7. 登录使用的 Shell，就是登录之后，使用的终端命令，ubuntu 默认是 dash

![](0001.png)

**usermod**

+ usermod 可以用来设置 用户 的 主组 ／ 附加组 和 登录 Shell

+ 主组：通常在新建用户时指定，在 etc/passwd 的第 4 列 GID 对应的组

+ 附加组：在 etc/group 中最后一列表示该组的用户列表，用于指定 用户的附加权限

> 提示：设置了用户的附加组之后，需要重新登录才能生效！

修改用户的主组（passwd 中的 GID）

```bash
usermod -g 组 用户名
```

修改用户的附加组

```bash
usermod -G 组 用户名
```

修改用户登录 Shell

由于新建用户默认使用的shell是dash,会导致windows下终端中没有文件高亮，不能使用方向键，所以要修改新建用户的默认shell

> 提示：设置了用户登录 Shell之后，需要重新登录才能生效！

![](0003.png)

```bash
usermod -s /bin/bash 用户名
```

**which**

> /etc/passwd 是用于保存用户信息的文件

  /usr/bin/passwd 是用于修改用户密码的程序

which 命令可以查看执行命令所在位置，例如:

```bash
which ls
```

```bash
which useradd
///usr/sbin/useradd
```

bin 和 sbin

+ 在 Linux 中，绝大多数可执行文件都是保存在 /bin、/sbin、/usr/bin、/usr/sbin

+ /bin（binary）是二进制执行文件目录，主要用于具体应用

+ /sbin（system binary）是系统管理员专用的二进制代码存放目录，主要用于系统管理

+ /usr/bin（user commands for applications）后期安装的一些软件

+ /usr/sbin（super user commands for applications）超级用户的一些管理程序

> cd 这个终端命令是内置在系统内核中的，没有独立的文件，因此用 which 无法找到 cd 命令的位置

#### 切换用户

| 序号 | 命令 | 作用 | 说明 |
| --- | --- | --- | --- |
| 01 | su - 用户名 | 切换用户，并且切换目录 | - 可以切换到用户家目录，否则保持位置不变 |
| 02 | exit | 退出当前登录账户 | |

+ su 不接用户名，可以切换到 root，但是不推荐使用，因为不安全

+ exit 示意图如下：

![](0004.jpg)
