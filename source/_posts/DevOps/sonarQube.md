---
title: sonarQube
mathjax: true
categories:
  - DevOps
tags:
  - DevOps
abbrlink: f6475fcf
date: 2020-12-04 16:40:25
---

#### Java 环境

ubuntu 版本

![](0002.png)

![](0003.png)

```bash
sudo dpkg -i jdk-11.0.9_linux-x64_bin.deb
```

查看安装路径

```bash
dpkg -L jdk-11.0.9
```

配置环境变量 ~/.bashrc

```bash
export JAVA_HOME=/usr/lib/jvm/jdk-11.0.9
export CLASSPATH=.:$JAVA_HOME/lib/dt.jar:$JAVA_HOME/lib/tools.jar
export PATH=$PATH:$JAVA_HOME/bin
```



服务端： 规则放在服务端，提供一些web hook 和 Jenkins 集成

客户端：在客户端执行，首先去服务端拉取规则 ☝ ，根据规则扫描代码，在本地生成报表， 把报表上传到服务器 ☝ 。


#### 下载 sonarQube

![](0001.png)

把下在好的安装包放到opt文件夹下

```bash
sudo mv sonarqube-8.5.1.38104.zip  /opt/
```

进入文件夹 解压

```bash
sudo unzip sonarqube-8.5.1.38104.zip
```

按照[官方文档](https://docs.sonarqube.org/latest/setup/install-server/)配置wrapper.conf 

启动服务，前提是安装好下面的java环境
首先进入bin文件夹

```bash
cd /opt/sonarqube-8.5.1.38104/bin
```

进入对应的命令版本文件夹

```bash
cd linux-x86-64
```

执行 sonar.sh 查看自命令， 第一次运行使用 cnosole 自命令，便于查看报错


```bash
cd linux-x86-64 

sudo ./sonar.sh start
```

**报错1**

如果启动时候 遇到 Unable to start JVM: No such file or directory (2)

以root身份设置 /opt/sonarqube-8.5.1.38104/conf/wrapper.conf

wrapper.java.command=/path/to/my/jdk/bin/java 设置未java安装环境

**报错2**

sonarqube can not run elasticsearch as root

1.使用 useradd 添加用户
2.sudo chown -R 新建的用户 sonarqube安装目录  （给安装目录修改所有者）
3.su 新建的用户  （切换用户）
4.切换到命令执行文件夹  ./sonar.sh start

**报错3**

Elastic search max virtual memory areas vm.max_map_count [65530] is too low

```bash
sudo sysctl -w vm.max_map_count=262144
```

**报错4**

404 错误

访问的时候需要访问 sonar.proptyies 中 sonar.web.context=/sonarqube 定义的文件夹

##### 使用

使用 admin/admin 默认密码登陆

