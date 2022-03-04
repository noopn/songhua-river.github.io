---
layout: posts
title: docker 安装 nextcloud
date: 2022-03-04 22:14:00
categories: 
- 其他
tags:
- Docker
- nextcloud
---

#### 配置文件

> /docker/nextCloud/docker-compose.yml

```bash
version: '3'

services:
  db:
    image: mariadb:10.5
    command: --transaction-isolation=READ-COMMITTED --binlog-format=ROW
    restart: always
    volumes:
      - ./db:/var/lib/mysql
    environment:
      - MYSQL_ROOT_PASSWORD=myPassword # db.env环境变量中的相同
    env_file:
      - db.env

  redis:
    image: redis:alpine
    restart: always

  app:
    image: nextcloud:apache
    restart: always
    volumes:
      - ./nextcloud:/var/www/html
    environment:
      - VIRTUAL_HOST=nextcloud.iftrue.club
      - LETSENCRYPT_HOST=nextcloud.iftrue.club
      - LETSENCRYPT_EMAIL=sunzhiqi@live.com
      - MYSQL_HOST=db
      - REDIS_HOST=redis
    env_file:
      - db.env
    depends_on:
      - db
      - redis
    networks:
      - proxy-tier
      - default

  cron:
    image: nextcloud:apache
    restart: always
    volumes:
      - ./nextcloud:/var/www/html
    entrypoint: /cron.sh
    depends_on:
      - db
      - redis

  proxy:
    build: ./proxy
    restart: always
    ports:
      - 7186:80
      - 37186:443
    labels:
      com.github.jrcs.letsencrypt_nginx_proxy_companion.nginx_proxy: "true"
    volumes:
      - ./certs:/etc/nginx/certs:ro
      - ./vhost.d:/etc/nginx/vhost.d
      - ./html:/usr/share/nginx/html
      - /var/run/docker.sock:/tmp/docker.sock:ro
    networks:
      - proxy-tier

  letsencrypt-companion:
    image: nginxproxy/acme-companion
    restart: always
    volumes:
      - ./certs:/etc/nginx/certs
      - ./acme:/etc/acme.sh
      - ./vhost.d:/etc/nginx/vhost.d
      - ./html:/usr/share/nginx/html
      - /var/run/docker.sock:/var/run/docker.sock:ro
    networks:
      - proxy-tier
    depends_on:
      - proxy

# self signed
#  omgwtfssl:
#    image: paulczar/omgwtfssl
#    restart: "no"
#    volumes:
#      - certs:/certs
#    environment:
#      - SSL_SUBJECT=servhostname.local
#      - CA_SUBJECT=my@example.com
#      - SSL_KEY=/certs/servhostname.local.key
#      - SSL_CSR=/certs/servhostname.local.csr
#      - SSL_CERT=/certs/servhostname.local.crt
#    networks:
#      - proxy-tier

volumes:
  db:
  nextcloud:
  certs:
  acme:
  vhost.d:
  html:

networks:
  proxy-tier:
```


> /docker/nextCloud/db.env

```bash
MYSQL_PASSWORD=myPassword
MYSQL_DATABASE=nextcloud
MYSQL_USER=nextcloud
```

> /docker/nextCloud/proxy/Dockerfile

```bash
FROM nginxproxy/nginx-proxy:alpine
COPY uploadsize.conf /etc/nginx/conf.d/uploadsize.conf
```

> /docker/nextCloud/proxy/uploadsize.conf

```bash
client_max_body_size 10G;
proxy_request_buffering off;
```

#### 启动

```bash
cd /docker/nextCloud
docker-compose
```