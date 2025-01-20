---
layout: posts
title: nginx 证书自动续期
date: 2024-08-01 22:38:03
categories:
  - 其他
tags:
  - 证书
---

目标使用 acme.sh 提供的自动化工具实现证书自动续期。

#### 登录服务器

登录服务器并切换为 root 用户

#### 安装 acme.sh

其中会下载 github 资源，尽可能切换为可用网络直接安装

```bash
curl https://get.acme.sh | sh -s email=<替换自己的邮箱>
```

#### 域名授权/申请证书

整个过程参考 [ACME 自动化快速入门](https://docs.certcloud.cn/docs/edupki/acme/)

在 [https://freessl.cn/](https://freessl.cn/) 选择 ACME 自动化 注册账号并登录

首先添加域名并在购买的云服务器上验证，验证通过后申请证书。

选择相关域名后会提示申请证书命令。 例如：

```bash
bash /root/acme.sh/.acme.sh --issue -d <你的域名> --dns dns_dp --server https://acme.freessl.cn/v2/DV90/directory/xxxx-xxx
```

找到合适的目录执行脚本,证书文件会在当前执行目录中生成。 需要注意 .acme.sh 的路径是否可以访问， 如果无法找到该命令，可以切换为相对根路径的地址。

执行后会生成证书文件，如下

```bash
[Thu Aug  1 22:23:17 CST 2024] Your cert is in: /root/.acme.sh/home.iftrue.club_ecc/home.iftrue.club.cer             # 证书文件 对应 nginx 中 cert.pem
[Thu Aug  1 22:23:17 CST 2024] Your cert key is in: /root/.acme.sh/home.iftrue.club_ecc/home.iftrue.club.key         # 私钥文件 对应 nginx 中 cert.key
[Thu Aug  1 22:23:17 CST 2024] The intermediate CA cert is in: /root/.acme.sh/home.iftrue.club_ecc/ca.cer
[Thu Aug  1 22:23:17 CST 2024] And the full-chain cert is in: /root/.acme.sh/home.iftrue.club_ecc/fullchain.cer
```

#### 自动续期

执行 ACME 自动化快速入门中提示的脚本, 执行命令的位置需要在生成证书的路径下。

```bash
bash /root/acme.sh/.acme.sh --install-cert -d <你的域名>
--key-file /etc/nginx/conf.d/cert.key            # nginx 配置路径中证书的路径
--fullchain-file /etc/nginx/conf.d/cert.pem      # nginx 配置路径中私钥的路径
--reloadcmd "nginx -s reload"                    # 重启 nginx 命令
```

acme.sh 会在证书还有 30 天到到期时尝试自动续期。
