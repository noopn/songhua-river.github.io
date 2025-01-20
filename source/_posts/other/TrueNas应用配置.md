---
layout: posts
title: TrueNas 应用配置
mathjax: true
date: 2025-01-19 10:31:33
categories: 其他
tags:
  - TrueNas
---

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

#### 虚拟机配置

**Nas 服务器开机虚拟化功能**,配置以下字段,其余字段可以保持默认

Boot Method ： UEFI

CPU Mode : Host Passthrough

Select Disk Type : VirtIO
virtIO 是一个优化的虚拟磁盘驱动程序，专为虚拟化环境设计，提供更高的性能和较低的开销。它支持更高的数据传输速率，特别适用于 I/O 密集型的应用场景。

Adapter Type：VirtIO

**如果安装后提示 CD-ROM 加载错误，可以删除 CD-ROM 设备后重试**
