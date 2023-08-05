---
title: 终端控制
mathjax: true
categories:
  - Linux
  - 基础命令
tags:
  - Linux

date: 2020-10-07 13:41:41
---


#### 终端窗口字体大小

`ctrl + shift + =` **放大**终端窗口字体

`ctrl + -` **缩小**终端窗口字体

#### 命令格式

parameter 参数
options 选项
`[]` 表示可选

```
command [-options] [parameter]
```

#### 查阅命令帮助信息

+ 显示command 命令的帮助信息

```
command --help
```

+ 查询command命令的使用手册 man是manual手册的意思，包含命令的详细信息

```
man command
```

显示内容较多时可以使用操作键

|操作键|功能|
|---|---|
|空格键|显示手册下一屏|
|Enter键|一次滚动手册的一行|
|b键|回滚一屏|
|f键|前滚一屏|
|q键|退出|

#### 自动补全

打出文件/目录/命令之后，按下`tab`键

+ 如果没有歧义（包含输入字母有唯一的对应），系统会自动补全

+ 如果有多个包含当前输入字母的 文件/目录/命令，再次按下`tab`键会自动提示

#### 曾经使用过的命令

按 上/下 光标键可以在曾经使用过的命令之间切换

如果想退出按`ctrl+c`

#### 快捷方式

|按键|作用|
|---|---|
|ctrl+c|结束正在运行的程序 ping,telent 等|
|ctrl+d|结束输入或退出shell|
|ctrl+s|暂停屏幕输出|
|ctrl+q|恢复屏幕输出|
|ctrl+l|清屏 等同于 clear|
|ctrl+a/ctrl+e|快速移动光标到行首/行尾|