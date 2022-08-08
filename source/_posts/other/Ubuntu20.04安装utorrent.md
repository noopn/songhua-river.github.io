---
title: Ubuntu20.04安装utorrent
mathjax: true
categories:
  - 其他
tags:
  - Ubuntu

date: 2021-07-20 19:45:36
---

[原文](https://www.linuxbabe.com/ubuntu/install-utorrent-ubuntu-20-04)

#### 安装

虽然官网显示的[最后版本](https://www.utorrent.com/downloads/linux)是ubuntu13.04,但是仍然可以安装

![](0001.png)


也可以使用下面的命令下载

64 bits

```
wget http://download-hr.utorrent.com/track/beta/endpoint/utserver/os/linux-x64-ubuntu-13-04 -O utserver.tar.gz
```

32 bits

```
wget http://download-hr.utorrent.com/track/beta/endpoint/utserver/os/linux-x64-ubuntu-13-04 -O utserver.tar.gz
```

下载完成后把文件解压到 `/opt`目录

```
sudo tar xvf utserver.tar.gz -C /opt/
```

安装所需要的依赖

[文件列表](http://archive.ubuntu.com/ubuntu/pool/main/o/openssl1.0/)

```bash
sudo apt install libssl-dev

wget http://archive.ubuntu.com/ubuntu/pool/main/o/openssl1.0/libssl1.0.0_1.0.2n-1ubuntu5.6_amd64.deb

sudo apt install ./libssl1.0.0_1.0.2n-1ubuntu5.3_amd64.deb
```

创建一个链接

```
sudo ln -s /opt/utorrent-server-alpha-v3_3/utserver /usr/bin/utserver
```

通过一下命令可以启动 utorrent server,默认utorrent server监听在 `0.0.0.0:8080` 端口，如果被占用，请先停止占用的服务，utorrent server 同样会使用10000 和 6881 端口，添加 `-daemon` 参数后服务会在后台运行

```bash
utserver -settingspath /opt/utorrent-server-alpha-v3_3/ -daemon
```

现在可以通过图形界面来访问

```bash
localhost:8080/gui
```

请注意url中必须有gui,默认的用户名为`admin`,密码不用填写，登录之后可以在设置中修改，账户信息和端口

![](0002.png)

再改配置后需要通过一下命令重启服务

```bash
sudo pkill utserver

utserver -settingspath /opt/utorrent-server-alpha-v3_3/ &
```

#### 配置自动启动服务

使用下面的命令创建一个系统服务

```bash
sudo nano /etc/systemd/system/utserver.service
```

把下面的配置添加到文件中，因为我们使用的是系统服务，所以不需要加`-daemon`

```bash
[Unit]
Description=uTorrent Server
After=network.target

[Service]
Type=simple
User=utorrent
Group=utorrent
ExecStart=/usr/bin/utserver -settingspath /opt/utorrent-server-alpha-v3_3/
ExecStop=/usr/bin/pkill utserver
Restart=always
SyslogIdentifier=uTorrent Server

[Install]
WantedBy=multi-user.target
```

按下 `Ctrl+O` ， 按下 `Enter`键保存文件，按 `Ctrl+X` 退出，然后重新加载

```bash
sudo systemctl daemon-reload
```

注意：以root权限运行 utorrent server是不被允许的，我们已经在server的文件中明确规定了utorrent server 必须以utorrent用户/组来运行，所以用下面的命令来添加这个用户

```bash
sudo adduser --system --group utorrent
```

启动服务

```bash
sudo systemctl start utserver
```

添加开机启动项

```bash
sudo systemctl enable utserver
```

检查服务

```bash
systemctl status utserver
```