---
layout: posts
title: docker 安装 gitlab
date: 2022-03-04 22:17:00
categories: 
- 其他
tags:
- gitlab
---

#### docker-compose.yml

只需要准备好证书文件，配置.yml文件即可使用

> /docker/gitlab/docker-compose.yml

```bash
version: '3'
services:
  gitlab:
    image: 'gitlab/gitlab-ee:latest'
    container_name: gitlab
    restart: always
    environment:
      GITLAB_OMNIBUS_CONFIG: |
        external_url 'https://gitlab.iftrue.club:4917'
        gitlab_rails['gitlab_shell_ssh_port'] = 2222
        nginx['redirect_http_to_https'] = true
        nginx['ssl_certificate'] = "/etc/gitlab/trusted-certs/gitlab.iftrue.club.pem"
        nginx['ssl_certificate_key'] = "/etc/gitlab/trusted-certs/gitlab.iftrue.club.key"

    ports:
      - '4917:4917'
      - '2222:22'
    volumes:
      - './config:/etc/gitlab'
      - './logs:/var/log/gitlab'
      - './data:/var/opt/gitlab'

```

启动服务，需要等待一段时间

```bash
docker-compose up -d
```

#### 获取/修改 初始密码

```bash
docker exec -it  gitlab /bin/bash
```

查看初始密码，安装gitlab后24小时会自动删除

```bash
cat /etc/gitlab/initial_root_password
```

修改初始密码

```bash
gitlab-rails console                   # 进入命令行
u=User.where(id:1).first               # 查找root用户
u.password='12345678'                  # 修改密码
u.password_confirmation='12345678'     # 确认密码
u.save                                 # 保存配置
```
