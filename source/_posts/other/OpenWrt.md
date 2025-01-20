---
layout: posts
title: OpenWrt 安装与设置
mathjax: true
date: 2024-11-04 13:59:26
categories: 其他
tags:
  - OpenWrt
---

#### 下载固件

[OpenWrt](https://openwrt.org/) 官方版本，所有的第三方版本都是基于官方的自定义编译，
[immortalwrt](https://downloads.immortalwrt.org/) 是针对国内用户编译的第三方版本，推荐优先使用。[\[GitHub\]](https://github.com/immortalwrt/immortalwrt)

点击 All Downloads

![](001.png)

选择适配的 x86 版本

> SquashFS 和 Ext4 是两种不同的文件系统，各自有不同的特点和应用场景：
>
> - SquashFS 只读的文件系统，经过压缩后可以节省存储空间。默认情况下不支持直接写入，因此需要将可写数据放在单独的 Overlay 文件系统上。
> - Ext4 一种常用的可读写文件系统，支持动态修改。

![](002.png)

由于 OpenWrt 并不会将所有硬盘剩余空间作为根路径，因此不同的文件格式对应不同的磁盘组成，在安装后需要对根分区扩容。

- Ext4: `/boot` + `/`根分区(读写) + 剩余未分区磁盘
- SquashFS： `/boot` + `/rom`(只读) + `/`根分区(读写) + 剩余未分区磁盘

#### 安装

参考[官方安装文档](https://openwrt.org/docs/guide-user/installation/openwrt_x86#installation)，采用写入镜像文件方式，由于 OpenWrt 没有提供安装引导，所以需要用 [微 PE](https://www.wepe.com.cn/) 或 老毛桃[https://www.laomaotao.net/] 等工具制作一个 WinPE 启动盘, 将用到的固件，和固件写入工具保存到启动盘中，当进入 WinPE 系统后是用写入工具写入镜像。

> Windows Preinstallation Environment（Windows PE），Windows 预安装环境，是带有有限服务的最小 Win32 子系统，基于以完整 Windows 环境或者保护模式运行的 Windows 3.x 及以上内核。这类系统一般很小。它包括了运行 Windows 安装程序及脚本、连接网络共享、自动化基本过程以及执行硬件验证所需的最小功能。

另外需要下载一个镜像写入工具 [Win32 Disk Imager](https://win32diskimager.org/) 或 [balenaEtcher](https://etcher.balena.io/)

将镜像写入工具, 解压出的 OpenWrt 镜像(.iso)文件, 复制到制作好的 WinPE 启动 U 盘中。

![](003.png)

将 U 盘插入到软路由中(软路由需要接上鼠标，键盘，显示器)，开机时入到软路由的 BIOS，将默认的固态硬盘启动改为 U 盘启动。

![](004.png)

保存重启后，进入 WinPE 系统，首先使用 WinPE 自带的 DiskGenius 工具，删除软路由硬盘的所有分区并保存。打开写入工具，选择磁盘和镜像并写入。

![](005.png)

写入成功后，重启系统再次进入 BIOS,将 U 盘启动修改回硬盘启动，保存并再次重启。

启动成功后，会看见有命令行信息，如果卡住不动，尝试按一下回车键，这样会进入 OpenWrt 系统。

首次登录提示修改密码，执行 `passwd` 命令，修改 root 账户密码，此密码也是网页登录的密码。

![](006.png)

修改网络配置信息，执行命令 `vi /etc/config/network`,

将 interface lan 的 option device 修改为 eth1, option ipaddr 修改为内网不会冲突的 IP 地址例如 `192.168.100.1` 或 `10.10.0.1`
将 interface wan 和 interface wan6 的 option device 修改为 eth0

> wan 口表示外网，也就是网络运营商的网线，通常更习惯将第一个网口作为插入外网网线，后面插入的都是内网设备，这样更有条理性

![](007.png)

保存后重启设备,访问前需要重新连接一下设备：

- 软路由插入电源并开机
- 运营商光猫的网线，链接到软路由的 eth0 网口。
- wifi 路由器需要在管理后台，设置为 AP 有线中继模式，用一个网线将软路由的 eth1 网口，链接到路由器的第一个网口。
- 其他内网设备可以通过网线连接软路由或路由器，也可以直接通过 wifi 网络链接.

这是虽然不能上网，单已经可以通过内网中其他设备访问 `/etc/config/network` 中设置的 lan 口的 ipaddr 访问到 OpenWrt 的 UI 界面。

#### wan 口配置

最先的配置一定是软路由可以上网，输入账号密码进入到软路由的 UI 界面，点击菜单 **网络** => **接口** 点击 wan 口的编辑按钮，协议切换为 PPPoE ，输入账号密码，即可上网。

> 此方式是通过 PPPoE 拨号上网，需要致电运营商，将网络改为桥接模式，并提供账号密码。

![](008.png)

#### 磁盘扩容

在菜单 **状态** => **概览** 中可以看到，磁盘空间只有几百 M, 这是因为 OpenWrt 默认不会将剩余空间作为根节点。

参考 [官方的扩容操作](https://openwrt.org/docs/guide-user/installation/openwrt_x86#expanding_root_partition), 首先通过命令行或软件库安装需要的依赖:

- 为根分区扩容

  ```bash
  # 安装软件包
  opkg update
  opkg install parted

  # 查看磁盘名称和分区编号
  root@ImmortalWrt:~# parted -l -s
  Warning: Not all of the space available to /dev/nvme0n1 appears to be used, you can fix the GPT to use all of the space (an extra 249389199 blocks) or continue with the current setting?
  Model: CHE SHI-128G (nvme)
  Disk /dev/nvme0n1: 128GB
  Sector size (logical/physical): 512B/512B
  Partition Table: gpt
  Disk Flags:

  Number Start End Size File system Name Flags
  128 17.4kB 262kB 245kB bios_grub
  1 262kB 33.8MB 33.6MB fat16 legacy_boot
  2 33.8MB 348MB 315MB ext4

  # 调整磁盘的大小
  # -f：表示不提示用户进行确认，直接强制执行命令。
  # -s：表示静默模式，不显示额外的输出，仅显示执行的结果。
  # /dev/nvme0n1 resizepart 2 表示磁盘的第二个分区
  # 20% 调整为磁盘总大小的 20%。 可以用 KB、MB、GB、TB 等单位（如 500MB 或 1TB）。
  root@ImmortalWrt:~# parted -f -s /dev/nvme0n1 resizepart 2 20%
  Warning: Not all of the space available to /dev/nvme0n1 appears to be used, you can fix the GPT to use all of the space (an extra 249389199 blocks) or continue with the current setting?
  Fixing, due to --fix

  # 重新查看调整后的大小
  root@ImmortalWrt:~# parted -l -s
  Model: CHE SHI-128G (nvme)
  Disk /dev/nvme0n1: 128GB
  Sector size (logical/physical): 512B/512B
  Partition Table: gpt
  Disk Flags:

  Number Start End Size File system Name Flags
  128 17.4kB 262kB 245kB bios_grub
  1 262kB 33.8MB 33.6MB fat16 legacy_boot
  2 33.8MB 25.6GB 25.6GB ext4

  #重启设备
  root@ImmortalWrt:~# reboot

  ```

- 为根文件系统扩容

  > 在 OpenWrt 中，循环设备（loop device）是一种特殊的虚拟块设备，用于将普通文件当作磁盘分区来挂载和访问。通常在嵌入式系统或文件有限的环境中使用循环设备来实现存储扩展或虚拟存储。
  > 将 ISO 镜像或其他磁盘镜像文件挂载到系统中，像读取实际磁盘分区一样访问其中的内容。
  > 可以在一个文件中创建文件系统（例如 ext4、squashfs），然后通过循环设备挂载它来使用，适合存储插件、应用或数据。

  ```bash
  # 安装软件包
  opkg update
  opkg install losetup resize2fs

  # 将一个块设备分区 /dev/nvme0n1p2 关联到循环设备 /dev/loop0
  # losetup：用于配置和管理循环设备（loop device），通常将文件或分区映射到一个虚拟设备（/dev/loopX），从而通过循环设备访问该文件或分区。
  # /dev/loop0：这是一个循环设备（第 0 号）。通常情况下，循环设备用来模拟文件系统或其他磁盘映像，使其表现得像一个物理设备。
  # /dev/nvme0n1p2：这是一个物理 NVMe 存储设备上的第 2 个分区。通过将其关联到 /dev/loop0，可以在逻辑上将这个分区当作一个循环设备来访问。(需要按实际情况修改此路径)
  # 2> /dev/null：将标准错误重定向到 /dev/null，也就是说，如果 losetup 遇到错误，错误信息不会显示在终端中。

  # 可通过命令 `losetup -a` 查看关联的结果
  # 如果有错误可使用 `losetup -d /dev/loop[X]` 删除关联项，重新关联
  root@ImmortalWrt:~# losetup /dev/loop0 /dev/nvme0n1p2 2> /dev/null

  # 扩展根文件系统
  # 使用 resize2fs 工具来强制调整文件系统的大小，以匹配 /dev/loop0 设备的大小
  root@ImmortalWrt:~#  resize2fs -f /dev/loop0


  # 重启设备
  root@ImmortalWrt:~# reboot
  ```

#### ttyd

ttyd 是一个在线的命令行工具，安装 luci-i18n-ttyd-zh-cn 中文版本，会显示在系统菜单中，如果不显示重启设备。

#### passwall

安装 passwall 插件， **如果安装时提示 无法执行 opkg install 命令:SyntaxError: Unexpected end of JSON input 尝试更换其他的软件源再次尝试**

导入 x2ray 分享链接后，**一定要把节点配置中 \[域名\] 和 \[WebSocket Host\] 都设置为分享链接中的域名，并在基本设置中开启主开关，选择节点后才能使用**。如果配置正确还是不能使用，重新启动后再次使用。

![](0010.png)

#### DDns

由于家庭网络等外界因素，导致 IP 会不定时的修改，如果想要无论何时都能让 绑定的域名解析到当前 IP 上就需要 DDns 服务。

DDns 服务会定时在后台检测当前 IP 是否修改，如果 IP 已经发生变动，DDns 服务会发送请求通知域名服务商，重新绑定域名解析的 IP 地址，从而实现动态域名解析。

在 OpenWrt 软件库中安装 ddns-go 和 luci-i18n-ddns-go-zh-cn 软件包, 可以方便的选择常用的运营商进行配置。

启用 ddns-go 服务并打开 web 界面， 跳转到 [腾讯云 DNDSPOD](https://console.dnspod.cn/account/token/apikey) 创建密钥。

IPv4 中选择通过网卡获取 IP， 并添加域名。

![](0011.png)

在运营商的域名解析页面，添加一条记录，先默认填入软路由的内网地址。

![](0012.png)

点击保存可以看到域名已经被正确的解析

![](0013.png)

#### 外网访问内网应用

本设置的目的是使用不同的二级域名访问内网的各个应用，由于 OpenWrt 的防火墙只提供网络层的接口转发，而域名访问属于应用层，需要使用 nginx 作为反向代理工具代理域名请求并指向内网地址.[\[说明文档\]](https://openwrt.org/docs/guide-user/services/webserver/nginx)

完整的请求过程是，外网的 https 请求进入防火墙，防火墙放行 => 软路由配置 nginx 监听指定域名和端口的请求 => 转发请求到内网的其他服务器

- 在 **系统** => **软件包** 中安装 luci-nginx luci-ssl-nginx, 由于 luci-nginx 默认配置中包括强制将 http 重定向为 https 所以在软件安装后 OpenWrt 需要重新刷新登录。
  但是我们不想使用 https 访问 OpenWrt 的 UI 界面，因为很多插件都在软路由中部署了服务，通过不同的接口访问，如果软路由使用 https 会直接影响这些插件的使用
  首先要进入到软路由的后台取消重定向到 https 的设置

  > 如果使用 ssh 工具登录时提示以下错误
  >
  > ```bash
  > [user@hostname ~]$ ssh root@pong
  > @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  > @    WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!     @
  > @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  > IT IS POSSIBLE THAT SOMEONE IS DOING SOMETHING NASTY!
  > Someone could be eavesdropping on you right now (man-in-the-middle attack)!
  > It is also possible that a host key has just been changed.
  > The fingerprint for the RSA key sent by the remote host is
  > 6e:45:f9:a8:af:38:3d:a1:a5:c7:76:1d:02:f8:77:00.
  > Please contact your system administrator.
  > Add correct host key in /home/hostname /.ssh/known_hosts to get rid of this message.
  > Offending RSA key in /var/lib/sss/pubconf/known_hosts:4
  > RSA host key for pong has changed and you have requested strict checking.
  > Host key verification failed.
  > ```
  >
  > 可以使用以下命令
  >
  > ```bash
  > # 移除 known_hosts 此 ip 的所有记录值
  > ssh-keygen -R 192.168.3.10
  > # 也可以使用
  > rm ~/.ssh/known_hosts
  > ```
  >
  > 如果使用的是 ttyd 插件，可以在 ttyd 配置中开启 ssl, 证书的默认路径是
  >
  > ```bash
  >   /etc/nginx/conf.d/_lan.crt
  >   /etc/nginx/conf.d/_lan.key
  > ```

  luci-nginx 使用 cui 统一了系统的配置，会通过 `/etc/config/nginx` 配置文件和模板文件(`/etc/nginx/uci.conf.template`) 生成 `/etc/nginx/uci.conf` 文件， `uci.conf` 文件最终会被 nginx 使用，并且 nginx 每次重启前都会重新生成此文件，因此不要手动更改生成的 `/etc/nginx/uci.conf` 文件中的内容。

  修改 `/etc/config/nginx` 配置文件中的内容，注释掉 \_lan 和 \_redirect2ssl 添加一个新的配置 http_lan

  ```bash
  config main global
        option uci_enable 'true'

  #config server '_lan'
  #       list listen '443 ssl default_server'
  #       list listen '[::]:443 ssl default_server'
  #       option server_name '_lan'
  #       list include 'restrict_locally'
  #       list include 'conf.d/*.locations'
  #       option uci_manage_ssl 'self-signed'
  #       option ssl_certificate '/etc/nginx/conf.d/_lan.crt'
  #       option ssl_certificate_key '/etc/nginx/conf.d/_lan.key'
  #       option ssl_session_cache 'shared:SSL:32k'
  #       option ssl_session_timeout '64m'
  #       option access_log 'off; # logd openwrt'

  #config server '_redirect2ssl'
  #       list listen '80'
  #       list listen '[::]:80'
  #       option server_name '_redirect2ssl'
  #       option return '302 https://$host$request_uri'

  config server 'http_lan'
          list listen '80'
          list listen '[::]:80'
          #注意不要添加这个配置规则
          #因为限制了对nginx的访问地址为内网设备，会导致外网访问失效。
          #list include 'restrict_locally'
          list include 'conf.d/*.locations'
  ```

  使用命令 `service nginx reload` 重启 nginx, 这样就恢复了 http 访问

  > 重启过程中会提示错误, 可以按照提示使用 nginx -T -c '/etc/nginx/uci.conf' 命令测试配置文件
  >
  > ```bash
  > root@ImmortalWrt:~# service nginx reload
  > nginx_init: NOT using conf file!
  > show config to be used by: nginx -T -c '/etc/nginx/uci.conf'
  > ```
  >
  > 如果文件报错会提示具体错误，并指明所在位置

- 配置 _.conf 文件，检查生成的 uci.conf 文件可以看到内部仍然引用 `/etc/nginx/conf.d/_.conf`配置。
新建一个`openwrt.conf` 配置文件，写入以下的内容

  ```bash
  server {
    # 运营商通常会禁用 80 443 端口
    # 如果外网访问，需要指定其他端口
    listen      9348 ssl;
    listen [::]:9348 ssl;
    # 内网环境可以使用443端口
    listen      443 ssl;
    listen [::]:443 ssl;
    server_name qb.iftrue.club;

    location / {
        proxy_pass http://192.168.48.189:10095;
        # 如果根据不同的端添加不同的请求头可以拆分成多个server配置
        proxy_set_header X-Forwarded-Host $host:$server_port;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # qbittorrent 软件需要添加这个响应头，否则文件请求会401
        # https://github.com/qbittorrent/qBittorrent/issues/17134
        # proxy_set_header X-Forwarded-Host $host:$server_port;

        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
   }
  }
  ```

- 配置证书
  首先修改 uci 模板 `/etc/nginx/uci.conf.template`,在 http 模块中添加 ssl 通用配置

  ```bash
  ssl_certificate /etc/nginx/conf.d/_lan.crt;
  ssl_certificate_key /etc/nginx/conf.d/_lan.key;

  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_prefer_server_ciphers on;
  ssl_session_cache shared:SSL:10m;
  ssl_session_timeout 10m;
  ```

  将证书传到服务器的执行目录下

  > 如果使用 scp 命令包错 `ash: /usr/libexec/sftp-server: not found`, 需要在软件包中安装 sftp-server

#### sing-box 代理工具

比 v2ray 系更全面的服务端协议支持，比 clash 系更丰富的服务端配置。

#### 去广告

- DNS 去广告，对广告的域名污染，大部分 DNS 工具都可是实现，但是不容易统一配置且效果一般，一般软件的 DNS 模块也不一定一直启用。
- HOST 去广告，在 DNS 解析后，代理工具会对 IP 嗅探，如果发现是广告域名就会根据分流规则将其屏蔽

#### MinIO

参考[安装文档](https://www.truenas.com/docs/truenasapps/stableapps/minioapp/), 挂载点配置需要开启 ACL, 文件默认保存 export 目录下。

Nginx 配置参考[MinIO 配置文档](https://min.io/docs/minio/linux/integrations/setup-nginx-proxy-with-minio.html), 需要添加`chunked_transfer_encoding off;`

#### NextCloud

- dataSet 创建
  父文件夹需要有以下权限 `user:www-data`,`group:www-data`,`user:netdata`,`group:docker`,`user:root`,`group:root`,`user:apps`
  user 文件夹需要有以下权限 `user:www-data`,`group:www-data`,`user:apps`
  data 文件夹需要有以下权限 `user:www-data`,`group:www-data`,`user:apps`
  db 文件夹需要有以下权限 `user:netdata`,`group:docker`,`user:root`,`group:root`,`user:apps`

- APT Packages 需要添加 `ffmpeg` `smbclient`
- host 需要填写真实访问的域名
- Database Password 注意不要有 `#@?&` 等特殊符号
- Certificate ID 选择默认证书，避免 nextCloud 提示警告，如果前端有 nginx 代理，需要使用 https
- 在 config/config.php 中添加 [maintenance_window_start](https://docs.nextcloud.com/server/30/admin_manual/configuration_server/background_jobs_configuration.html#parameters) 消除调度任务的警告