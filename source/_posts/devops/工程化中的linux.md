---
title: 工程化常用命令
mathjax: true

date: 2020-12-02 16:52:11
categories:
  - DevOps
tags:
  - 工程化
  - DevOps
---

#### ps

查看进程

```bash
ps aux
```

#### kill pkill

```bash
kill -9 pid
```

pkill 后面可以直接写进程的名字

如果是一个服务使用 `systemctl stop`

#### w who

看谁正在连接系统

#### lsof 查看端口占用

```bash
#列出所有打开的文件:
lsof
备注: 如果不加任何参数，就会打开所有被打开的文件，建议加上一下参数来具体定位

# 查看谁正在使用某个文件
lsof   /filepath/file

#递归查看某个目录的文件信息
lsof +D /filepath/filepath2/
备注: 使用了+D，对应目录下的所有子目录和文件都会被列出

# 比使用+D选项，遍历查看某个目录的所有文件信息 的方法
lsof | grep ‘/filepath/filepath2/’

# 列出某个用户打开的文件信息
lsof  -u username
备注: -u 选项，u其实是user的缩写

# 列出某个程序所打开的文件信息
lsof -c mysql
备注: -c 选项将会列出所有以mysql开头的程序的文件，其实你也可以写成lsof | grep mysql,但是第一种方法明显比第二种方法要少打几个字符了

# 列出多个程序多打开的文件信息
lsof -c mysql -c apache

# 列出某个用户以及某个程序所打开的文件信息
lsof -u test -c mysql

# 列出除了某个用户外的被打开的文件信息
lsof   -u ^root
备注：^这个符号在用户名之前，将会把是root用户打开的进程不让显示

# 通过某个进程号显示该进行打开的文件
lsof -p 1

# 列出多个进程号对应的文件信息
lsof -p 123,456,789

# 列出除了某个进程号，其他进程号所打开的文件信息
lsof -p ^1

# 列出所有的网络连接
lsof -i

# 列出所有tcp 网络连接信息
lsof  -i tcp

# 列出所有udp网络连接信息
lsof  -i udp

# 列出谁在使用某个端口
lsof -i :3306

# 列出谁在使用某个特定的udp端口
lsof -i udp:55

# 特定的tcp端口
lsof -i tcp:80

# 列出某个用户的所有活跃的网络端口
lsof  -a -u test -i

# 列出所有网络文件系统
lsof -N

#域名socket文件
lsof -u

#某个用户组所打开的文件信息
lsof -g 5555

# 根据文件描述列出对应的文件信息
lsof -d description(like 2)

# 根据文件描述范围列出文件信息
lsof -d 2-3
```

#### 免密登陆

- 生成密钥对

  -t 指定密钥类型，默认是 rsa ，可以省略。
  -C 设置注释文字，比如邮箱。
  -f 指定密钥文件存储文件名。

  **如果想免密登录，密钥不要填写密码，否则必须验证密钥密码才能登录**

  ```bash
  ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

  # 或者创建使用 ed25519 加密算法的密钥
  ssh-keygen -t ed25519 -C "your_email@example.com"
  ```

- 上传共钥到服务器对应账号的 home 目录下.ssh 文件夹下面，公钥的权限为 600

  linux 执行以下命令

  ```bash
  ssh-copy-id -i mykey_rsa.pub you_user_name@xxx.xxx.xxx.xxx
  ```

  window 需要手动在服务器上创建文件,

  ```bash
  touch  ~/.ssh/authorized_keys

  # 或直接写入文件
  echo "your_public_key_here" >> ~/.ssh/authorized_keys

  # 修改权限
  chmod 600 authorized_keys
  ```

- 指定私钥登陆，私钥的权限为 600

  ```bash
  ssh -i 私钥 user@xxx.xxx.xxx.xxx
  ```

- 通过配置文件免密登陆，在本地服务器把私钥复制到 home 下的.ssh 文件夹下面

  创建名称为 config 的文件，配置单一服务器免密登陆

  ```bash
  Host tencent
    HostName 124.222.139.87
    User ubuntu
    IdentityFile ./.ssh/id_ed25519
    IdentitiesOnly yes


  # Host 别名
  # 　HostName IP
  # 　Port 端口
  # 　User 用户名
  # 　IdentitiesOnly yes
  #   IdentityFile ~/.ssh/user_rsa  (私钥路径)
  #   Protocal 2 (协议版本号)
  #   Compression yes
  #   ServerAliveInterval 60 （防止被踢配置，长时间没有操作会被踢掉，每隔60秒发一个信号）
  #   ServerAliveCountMax 20 (最大连接数)
  #   LogLevel INFO
  ```

  通配符配置

  ```bash
  Host app-produce
    HostName 192.168.1.10
    Port 22
    User appuser
    IdentityFile ~/.ssh/id_ed25519

  Host \*\_produce
    User commonuser
    IdentityFile ~/.ssh/id_ed25519
    Port 22
  ```

#### wget

wget 是一个从网络上自动下载文件的自由工具，支持通过 HTTP、HTTPS、FTP 三个最常见的 TCP/IP 协议 下载，并可以使用 HTTP 代理。"wget" 这个名称来源于 “World Wide Web” 与 “get” 的结合。

wget 可以在用户退出系统的之后在后台执行。这意味这你可以登录系统，启动一个 wget 下载任务，然后退出系统，wget 将在后台执行直到任务完成，相对于其它大部分浏览器在下载大量数据时需要用户一直的参与.

```bash
wget (选项) (参数)
```

其中选项如下：

-a<日志文件>：在指定的日志文件中记录资料的执行过程；

-A<后缀名>：指定要下载文件的后缀名，多个后缀名之间使用逗号进行分隔；

-b：进行后台的方式运行 wget；

-B<连接地址>：设置参考的连接地址的基地地址；

-c：继续执行上次终端的任务；

-C<标志>：设置服务器数据块功能标志 on 为激活，off 为关闭，默认值为 on；

-d：调试模式运行指令；

-D<域名列表>：设置顺着的域名列表，域名之间用“，”分隔；

-e<指令>：作为文件“.wgetrc”中的一部分执行指定的指令；

-h：显示指令帮助信息；

-i<文件>：从指定文件获取要下载的 URL 地址；

-l<目录列表>：设置顺着的目录列表，多个目录用“，”分隔；

-L：仅顺着关联的连接；

-r：递归下载方式；

-nc：文件存在时，下载文件不覆盖原有文件；

-nv：下载时只显示更新和出错信息，不显示指令的详细执行过程；

-q：不显示指令执行过程；

-nh：不查询主机名称；

-v：显示详细执行过程；

-V：显示版本信息；

--passive-ftp：使用被动模式 PASV 连接 FTP 服务器；

--follow-ftp：从 HTML 文件中下载 FTP 连接文件。

```bash
wget http://test.com/testfile.zip ->下载指定文件到当前文件夹
wget -O wordpress.zip http://test.com/download ->指定保存名字
wget --limit-rate=300k http://www.linuxde.net/testfile.zip ->限制下载速度
wget -c http://www.linuxde.net/testfile.zip ->断点续传
wget -b http://www.linuxde.net/testfile.zip ->后台下载

# 设置使用指定浏览器下载（伪装下载）
wget --user-agent="Mozilla/5.0 (Windows; U; Windows NT 6.1; en-US) AppleWebKit/534.16 (KHTML, like Gecko) Chrome/10.0.648.204 Safari/534.16" http://www.linuxde.net/testfile.zip

wget --spider url ->测试下载
wget --tries=40 URL ->设置重试次数为40
wget -i filelist.txt ->从filelist.txt获取下载地址

# 镜像网站
# --miror开户镜像下载。
# -p下载所有为了html页面显示正常的文件。
# --convert-links下载后，转换成本地的链接。
# -P ./LOCAL保存所有文件和目录到本地指定目录
wget --mirror -p --convert-links -P ./LOCAL URL

wget --reject=gif ur ->下载一个网站，但你不希望下载图片，可以使用这条命令
wget -o download.log URL ->把下载信息存入日志文件
wget -Q5m -i filelist.txt ->限制总下载文件大小
wget -r -A.pdf url ->下载指定格式文件

# FTP下载
wget ftp-url
wget --ftp-user=USERNAME --ftp-password=PASSWORD url
```
