---
layout: post
title: 简单Node部署
categories:
  - DevOps
tags:
  - DevOps
date: 2021-03-01 21:38:19
---

#### 创建非 root 账户

有些云服务器会禁止 root 用户登录， 但是如果分发的服务器使用 root 登录，可以创建一个非 root 账号， 防止权限过高导致误操作。

```bash
# root 用户下执行，添加一个 user1 用户
adduser user1

Adding user `user1' ...
Adding new group `user1' (1002) ...
Adding new user `user1' (1002) with group `user1' ...
Creating home directory `/home/user1' ...
Copying files from `/etc/skel' ...
New password:
Retype new password:
passwd: password updated successfully
Changing the user information for user1
Enter the new value, or press ENTER for the default
        Full Name []: sunzhiqi
        Room Number []:
        Work Phone []:
        Home Phone []:
        Other []:
Is the information correct? [Y/n]
```

将指定的用户（user）添加到 sudo 组中，从而授予该用户使用 sudo 命令的权限

```bash
gpasswd -a user1 sudo
```

**之前 root 用户登录的窗口不要关闭，如果新用户无法登录，可以使用 root 用户窗口重启 ssh 服务，再次尝试**

```bash
service ssh restart
```

#### 免密登录

如果使用 ssh 工具可以记住登录密码，如果使用命令行需要配置 [**免密登录**](/posts/de11f04658e7/#免密登陆)

#### 修改默认端口

**修改完成后需要同步修改本地的 config 免密登录配置文件，同时配置服务器防火墙放行端口**

```bash
vi /etc/ssh/sshd_config

#修改端口字段
# Port 22222
```

#### 禁用 root 登录

```bash
vi /etc/ssh/sshd_config

# 表示禁止密码登录，但是可以通过SSH登录
# 通常需要设置为no
#PermitRootLogin prohibit-password

# 使用密码登录，通常设置为no
# PasswordAuthentication yes

```

#### iptables 配置

```bash
sudo touch /etc/network/if-up.d/iptables.up
```

写入规则

```bash
*filter

# -A INPUT：向 INPUT 链添加规则，用于处理进入系统的数据包。
# -m state：指定使用 state 模块，state 模块允许基于连接状态来过滤数据包。
# --state ESTABLISHED,RELATED：允许已建立连接（ESTABLISHED）和相关连接（RELATED）的数据包通过。简单来说，允许已经建立的连接的数据包通过，例如响应来自客户端的请求。
# -j ACCEPT：匹配此规则的数据包将被接受（允许通过）。
-A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT


# -A OUTPUT：向 OUTPUT 链添加规则，用于处理从系统发送的数据包。
# -j ACCEPT：所有匹配此规则的数据包将被接受，即允许所有出站流量。
-A OUTPUT -j ACCEPT


# -A INPUT：向 INPUT 链添加规则，处理进入系统的数据包。
# -p tcp：指定使用 TCP 协议。
# --dport 443：指定目标端口为 443，这通常用于 HTTPS 流量。
# -j ACCEPT：匹配此规则的 TCP 数据包将被接受，允许 HTTPS 流量进入系统。
-A INPUT -p tcp --dport 443 -j ACCEPT


# -A INPUT：向 INPUT 链添加规则，处理进入系统的数据包。
# -p tcp：指定使用 TCP 协议。
# --dport 80：指定目标端口为 80，通常用于 HTTP 流量。
# -j ACCEPT：允许所有 HTTP 流量（目标端口 80）进入系统。
-A INPUT -p tcp --dport 80 -j ACCEPT


# -A INPUT：向 INPUT 链添加规则，处理进入系统的数据包。
# -p tcp：指定使用 TCP 协议。
# -m state：使用 state 模块来匹配连接状态。
# --state NEW：只允许新的连接通过，即连接尚未建立的流量。
# --dport 39999：指定目标端口为 39999。
# -j ACCEPT：允许目标端口为 39999 的新连接通过。
-A INPUT -p tcp -m state --state NEW --dport 22222 -j ACCEPT



# -A INPUT：向 INPUT 链添加规则，处理进入系统的数据包。
# -p icmp：指定使用 ICMP 协议，通常用于网络诊断，如 ping 命令。
# -m icmp：使用 ICMP 模块进行匹配。
# --icmp-type 8：指定 ICMP 类型为 8，这表示“回显请求”类型，通常是 ping 请求。
# -j ACCEPT：允许 ping 请求（ICMP 类型 8）进入系统。
-A INPUT -p icmp -m icmp --icmp-type 8 -j ACCEPT


# -A INPUT：将规则添加到 INPUT 链，表示处理进入系统的流量。
# -m limit 5/min：使用 limit 模块来限制日志记录的频率。这里表示每分钟最多记录 5 次 拒绝的连接请求。这样可以避免日志记录过多导致磁盘空间不足。
# -j LOG：指示 iptables 执行日志记录操作。
# --log-prefix "iptables denied: "：为每个被记录的日志条目添加前缀。日志条目将以 iptables denied: 开头，便于区分其他日志。
# --log-level 7：设置日志级别为 7。日志级别越高，记录的详细信息越多。级别 7 是最高级别，通常用于调试。
# 这条规则的作用是：记录所有被拒绝的连接请求，并且每分钟最多记录 5 次，并将日志保存到系统的日志文件中（通常是 /var/log/syslog 或 /var/log/messages）。
-A INPUT -m limit 5/min -j LOG --log-prefix "iptables denied: " --log-level 7

# 拒绝所有未被允许的入站流量，即如果流量没有匹配任何允许规则，则会被拒绝并发送一个拒绝消息。
-A INPUT -j REJECT


# 拒绝所有经过路由的流量。通常这种配置用于禁止路由器或网关机器转发流量。
-A FORWARD -j REJECT


# -A INPUT：将这条规则添加到 INPUT 链，表示处理进入系统的流量。
# -p tcp：指定协议为 TCP。
# --dport 80：指定目标端口为 80，即 HTTP 流量。
# -i eth0：表示该规则仅适用于 eth0 网络接口。也就是说，只有通过该接口的流量才会应用此规则。
# -m state：使用 state 模块来匹配数据包的连接状态。
# --state NEW：匹配所有 新的连接，即第一次尝试建立连接的流量。
# -m recent --set：使用 recent 模块，标记（--set）每个新连接的源 IP 地址。这会将源 IP 地址添加到一个最近连接的列表中。这个模块通常用于追踪和限制访问频率。
# 这条规则的作用是：对所有新的、来自 eth0 接口的 HTTP 请求进行标记，记录这些请求的源 IP 地址。
-A INPUT -p tcp --dport 80 -i eth0 -m state --state NEW -m recent --set



# -A INPUT：将规则添加到 INPUT 链，处理进入的流量。
# -p tcp：使用 TCP 协议。
# --dport 80：指定目标端口为 80，即 HTTP 流量。
# -i eth0：指定网络接口为 eth0。
# -m state：使用 state 模块来匹配数据包的连接状态。
# --state NEW：匹配所有新的连接。
# -m recent --update：使用 recent 模块来更新连接源 IP 的记录。
# --seconds 60：指定检查时间窗口为 60 秒。即在过去 60 秒内的请求将被视为重复的请求。
# --hitcount 150：如果源 IP 在 60 秒内的请求次数超过 150 次，则触发 DROP 动作。
# -j DROP：如果源 IP 地址的请求次数超过 150 次，就会被 丢弃，即拒绝这个源 IP 地址的流量。
# 这条规则的作用是：如果一个源 IP 地址在 60 秒内对端口 80 发起超过 150 次新连接，则丢弃该 IP 的请求。这通常用于 防止 DoS（拒绝服务）攻击 或者 流量过载，限制某个 IP 在短时间内过多的连接请求。
-A INPUT -p tcp --dport 80 -i eth0 -m state --state NEW -m recent --update --seconds 60 --hitcount 150 -j DROP


COMMIT
```

使用 iptables-restore 从 /etc/network/if-up.d/iptables.up 文件中加载并恢复防火墙规则

```bash
sudo iptables-restore < /etc/network/if-up.d/iptables.up
```

启动防火墙

```bash
sudo ufw enable

sudo ufw status
```

配置开机自动写入

```bash
# 创建文件
touch /etc/network/if-up.d/iptables

# 写入配置

#!/bin/sh
iptables-restore /etc/iptables.up

```

#### fail2ban

Fail2ban 是一个开源的入侵防护工具，主要用于防止基于暴力破解的攻击（如 SSH、HTTP、FTP 等服务的暴力登录尝试）。它通过监控日志文件，检测可疑行为（如多次失败的登录尝试），然后根据配置的规则采取措施，例如暂时或永久禁止攻击者的 IP 地址。

```bash
sudo apt install fail2ban
```

修改配置

```bash
vi /etc

# 换成自己的邮箱
destemail = root@localhost
```

启动服务

```bash
service fail2ban start
```

#### 配置 node 环境

安装必要依赖

```bash
sudo apt install vim openssl build-essential libssl-dev wget curl git
```

安装 [nvm](https://github.com/nvm-sh/nvm),指定默认版本

```bash
nvm alias default v20.xx
```

#### 设置系统文件参数

修改了 fs.inotify.max_user_watches 参数，增加每个用户可以监控的文件数（即文件监控器的数量）。

将此设置永久性地添加到 /etc/sysctl.conf 配置文件中，并应用该更改，使得新的文件监控数值生效。

```bash
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

#### 强制同步 cnpm

如果使用了 cnpm 源，导致有些包不是最新的，使用以下命令强制同步

```js
cnpm sync [package]
```

#### nginx

如果服务器预装了 apache2 需要先删除

```bash
# 删除 Apache2 服务的自动启动配置,它会删除 /etc/rc.d 目录下的相关启动链接。
update-rc.d -f apache2 remove

# 卸载 Apache2 软件包
sudo apt remove apache2
```

添加 nginx 配置文件

```conf
upstream node_learn {
    server 127.0.0.1:3000;  # 定义后端服务器
}

server {
    listen 80;
    server_name site.iftrue.club;  # 配置服务器监听端口和域名

    # 优化代理设置
    location / {
        proxy_set_header X-Real-IP $remote_addr;  # 设置请求头，传递真实的客户端 IP 地址
        proxy_set_header X-Forwarded-For $proxy_add_X_forwarded_for;  # 设置请求头，传递 X-Forwarded-For 头信息
        proxy_set_header Host $http_host;  # 保留原始请求的 Host 头
        proxy_set_header X-Nginx-Proxy true;  # 添加 X-Nginx-Proxy 头，标识请求是经过 Nginx 代理的
        proxy_pass http://node_learn;  # 转发请求到后端应用
        proxy_redirect off;  # 关闭代理重定向
        proxy_cache my_cache;  # 启用缓存
        proxy_cache_valid 200 1h;  # 缓存 200 状态的响应 1 小时
        proxy_cache_use_stale error timeout updating;  # 使用过期的缓存响应来应对错误或超时
    }

    # 静态资源代理和缓存
    location /assets/ {
        # 将静态资源代理到 Node.js 应用或提供本地静态文件
        proxy_pass http://node_learn/assets/;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_X_forwarded_for;
        proxy_set_header Host $http_host;
        proxy_set_header X-Nginx-Proxy true;
        proxy_cache my_cache;
        proxy_cache_valid 200 1d;  # 缓存静态资源 1 天
    }

    # 如果静态文件已经存储在磁盘中，可以使用 root 或 alias 来提供静态文件
    location /static/ {
        root /var/www/site.iftrue.club;  # 假设静态资源位于这个目录
        try_files $uri $uri/ =404;  # 如果找不到文件返回 404
    }

    # 你也可以为其他静态资源（如 CSS、JS）设置缓存
    location ~* \.(css|js|jpg|jpeg|png|gif|ico|woff|woff2|ttf|svg)$ {
        root /var/www/site.iftrue.club;
        try_files $uri $uri/ =404;
        expires 30d;  # 设置静态资源缓存 30 天
        add_header Cache-Control "public, no-transform";  # 设置缓存控制头
    }

    # 其他错误页面、重定向等配置
    error_page 404 /404.html;
    location = /404.html {
        root /usr/share/nginx/html;
        internal;
    }
}

```

如果需要隐藏响应头中的 nginx 版本信息配置 nginx.conf

```bash
# /etc/nginx/nginx.conf

# 取消此行注释
server_tokens off;
```

#### mysql

```bash
# 安装服务
sudo apt install -y mysql-server

# 检查服务是否启动
systemctl status mysql

# 执行MySQL安全脚本mysql_secure_installation，提高MySQL的安全性
# 该脚本允许设置或更改root密码策略、移除匿名用户、禁止root远程登录、删除测试数据库等。
sudo mysql_secure_installation

# 首次登录没有密码
sudo mysql -u root -p

#给root用户设置密码
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password'; FLUSH PRIVILEGES;EXIT;

# 创建对应的数据库

CREATE DATABASE my_database
CHARACTER SET utf8mb4
COLLATE utf8mb4_general_ci;
# 查看所有数据库
SHOW DATABASES;

# 删除数据库
DROP DATABASE database_name;
# 修改字符集和排序
ALTER DATABASE database_name
CHARACTER SET utf8mb4
COLLATE utf8mb4_general_ci;

# 创建新用户
# 'localhost'：表示该用户只能从本地机器连接到数据库。如果希望该用户可以从任何主机连接，可以使用 '%'，如 'new_user'@'%'。
CREATE USER 'new_user'@'localhost' IDENTIFIED BY 'your_password';
# 查看所有用户
SELECT User, Host FROM mysql.user;


#ALL PRIVILEGES：赋予所有权限。
# my_database.*：指示该用户可以对 my_database 数据库中的所有表进行操作。
# 'localhost'：表示该用户只能从本地连接。
GRANT ALL PRIVILEGES ON my_database.* TO 'new_user'@'localhost';
# 如果希望用户只具备某些操作的权限（例如只读权限），可以单独授予特定权限
GRANT SELECT ON my_database.* TO 'new_user'@'localhost';
GRANT SELECT, INSERT ON my_database.* TO 'new_user'@'localhost';


# 可以访问所有数据库
# GRANT ALL PRIVILEGES ON *.* TO 'new_user'@'localhost';


# 刷新权限
FLUSH PRIVILEGES;


# 查看端口
SHOW VARIABLES LIKE 'port';

cat /etc/mysql/mysql.conf.d/mysqld.cnf

```

#### pm2

```bash
npm install -g pm2

# 启动服务
pm2 start server.js

# 应用列表
pm2 list

# 应用详细信息
pm2 show [appName]
```

#### 配置 pm2 ecosystem.json

```json
{
  "apps": [
    {
      "name": "node-learn",
      "script": "bin/www",
      "env": {
        "NODE_ENV": "development"
      },
      "env_production": {
        "NODE_ENV": "production"
      }
    }
  ],
  "deploy": {
    "production": {
      // 远程服务器上用于执行部署的用户。这个用户将有权限操作目标服务器进行部署工作。
      "user": "ubuntu",
      // 部署目标服务器的 IP 地址。这里设置了一个服务器的 IP 地址
      // 表示要将代码部署到这个服务器。
      "host": ["192.168.48.171"],
      // 通过 SSH 连接远程服务器时使用的端口号
      "port": "22",
      // 这是你要部署的 Git 分支。origin/master 表示远程仓库的 master 分支
      "ref": "origin/main",
      // 这是 Git 仓库的 URL，表示从哪里拉取代码。
      "repo": "git@git.oschina.net:wolf18387/backend-website.git",
      // 这是部署目标路径，代码将被拉取到这个路径下。
      // 所有应用文件将被放置在服务器的 /www/website/production 目录下。
      "path": "/www/node-learn",
      // 这个选项用于 SSH 连接时禁用 SSH 主机密钥检查。
      // 这通常用于自动化部署，避免因首次连接服务器时需要确认主机密钥而中断部署。
      "ssh_options": "StrictHostKeyChecking=no",
      // 部署前的准备脚本
      "pre-setup": "rm -rf /www/node-learn/*",
      // 部署前的准备脚本，在拉取代码后执行
      // 在服务器上执行的脚本
      // 如果使用的是nvm安装的node需要加上 source ~/.nvm/nvm.sh
      // 需要指定环境变量 export NODE_ENV=production deploy.env 只会在 deploy 阶段加载
      "post-setup": "source ~/.nvm/nvm.sh && npm install && export NODE_ENV=production && npx sequelize-cli db:migrate && npx sequelize-cli db:seed:all",

      "post-deploy": "source ~/.nvm/nvm.sh && npm install && pm2 startOrRestart ecosystem.json --env production",
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

#### 执行部署

**部署前确认各个服务器之间可以互相免密访问，本地=>生产服务器=>git 服务器, 将主机加入目标主机的 known hosts 中**

**确认服务器的目录是否有写入权限**

**windows 环境会执行失败，需要在 linux 虚拟机中执行**

```bash
#  设置远程环境,创建应用目录,初始化 Git 仓库,执行 pre-setup 钩子
#  current 当前服务运行的文件夹会软连接到source文件夹上
#  source clone下来的源代码
#  shared 配置文件等
#  只应该在初始化的时候执行一次
npx pm2 deploy production setup

```

部署成功后可以登录服务器检查部署情况

```bash
pm2 list

pm2 logs
```
