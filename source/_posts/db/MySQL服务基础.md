---
title: MySQl 服务基础
mathjax: true
categories:
  - 数据库
tags:
  - 数据库
  - MySQL

date: 2021-12-01 15:13:50
---

#### MySQL 服务启动和停止

查看系统内是否有 mysql 服务

```bash
ps aux | grep mysql
```

停止 mysql 服务

```bash
sudo service mysql stop
```

启动 mysql 服务

```bash
sudo service mysql start
```

重启 mysql 服务

```bash
sudo service mysql restart
```

#### 登录与退出

登录命令，属性和属性值之间可以省略空格

```bash
mysql -h主机名 -P端口号 -u有户名 -p密码
```

退出 `exit`

#### 常见命令

查看当前所有数据库

```bash
show databases;
```

打开指定的库

```bash
use 库名;
```

查看当前所在库

```bash
select database();
```

查看所有表

```bash
show tables;
```

查看其他库的所有表

```bash
show tables from 库名;
```

创建表

```bash
create table 表名 {
  列名 列类型，
  ...
}
```

查看表结构

```bash
desc 表名;
```

查看表结构

```bash

// 进入mysql服务器中
select version();

// 在命令行中
mysql --version
mysql -V
```

#### 语法规范

- 不区分大小写，建议关键字大写，表名，列名小写
- 每条命令`;`结尾
- 命令可以换行
- 注释
  单行注释: `#注释文字`
  单行注释: `-- 注释文字`
  多行注释: `/* 注释文字 */`
