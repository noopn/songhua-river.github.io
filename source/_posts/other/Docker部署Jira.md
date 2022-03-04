---
layout: posts
title: Docker 部署Jira + 破解
date: 2022-03-04 22:00:05
categories: 
- 其他
tags:
- Docker
---


#### 创建必要目录

```bash
mkdir -p docker-compose/jira
```

#### 创建docker-compose.yml

+ 修改映射路径为当前文件夹下的相对路径
+ JIRA_PROXY_NAME = 域名
+ JIRA_PROXY_PORT = 外部端口
+ JIRA_PROXY_SCHEME = 协议
+ POSTGRES_PASSWORD 修改数据库密码

```yml
version: '3'

services:
  jira:
    depends_on:
      - postgresql

    image: teamatldocker/jira:8.19.0
    networks:
      - jiranet
    volumes:
      - ./jiradata:/var/atlassian/jira
    ports:
      - '1170:8080'
    environment:
      - 'JIRA_DATABASE_URL=postgresql://jira@postgresql/jiradb'
      - 'JIRA_DB_PASSWORD=w.521@@ong.COM'
      - 'SETENV_JVM_MINIMUM_MEMORY=2048m'
      - 'SETENV_JVM_MAXIMUM_MEMORY=4096m'
      - 'JIRA_PROXY_NAME=jira.iftrue.club'
      - 'JIRA_PROXY_PORT=1170'
      - 'JIRA_PROXY_SCHEME=http'
    logging:
      # limit logs retained on host to 25MB
      driver: "json-file"
      options:
        max-size: "500k"
        max-file: "50"

  postgresql:
    image: postgres:12-alpine
    networks:
      - jiranet
    volumes:
      - ./postgresqldata:/var/lib/postgresql/data
    environment:
      - 'POSTGRES_USER=jira'
      # CHANGE THE PASSWORD!
      - 'POSTGRES_PASSWORD=w.521@@ong.COM'
      - 'POSTGRES_DB=jiradb'
      - 'POSTGRES_ENCODING=UNICODE'
      - 'POSTGRES_COLLATE=C'
      - 'POSTGRES_COLLATE_TYPE=C'
    logging:
      # limit logs retained on host to 25MB
      driver: "json-file"
      options:
        max-size: "500k"
        max-file: "50"

volumes:
  jiradata:
    external: false
  postgresqldata:
    external: false

networks:
  jiranet:
```

#### 破解

+ [下载](https://github.com/xiaonandl/atlassian-agent) atlassian-agent.jar 文件压缩包，并解压

+ 将 `atlassian-agent.jar` 复制到容器内 `docker cp ./atlassian-agent.jar jira容器名称:/opt/jira`

+ 在 `docker-compose/jira` 目录下执行 `docker-compose up` 启动动容器

+ 进入容器 `docker exec -it jira` 容器名称 `/bin/bash`

+ 修改环境变量 `cd /opt/jira/bin vi setenv.sh`

![](0001.png)

export JAVA_OPTS 修改为 export JAVA_OPTS="-javaagent:/opt/jira/atlassian-agent.jar ${JAVA_OPTS}"

+ 重启容器, 在日志中可以看到 `========= agent working =========` 字样表示成功

+ 再次进入容器 执行 `java -jar atlassian-agent.jar -p jsm -m aaa@bbb.com -n my_name -o https://zhile.io -s ABCD-1234-EFGH-5678`

**特别注意 -p 参数设置，通过 java -jar atlassian-agent.jar 查看使用帮助，每种产品有不同的标识**

-m 邮箱任意填写
-n 名称任意填写
-o 网址任意填写
-s server id 再安装时查看

复制执行命令之后产生的激活码，复制到激活码的窗口完成激活。