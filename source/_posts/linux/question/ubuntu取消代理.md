---
title: ubuntu取消代理
mathjax: true

date: 2021-04-01 09:46:11
categories:
  - Linux
  - 常见问题
tags:
  - Linux
---

# 

如果设置过代理可能导致pip3下载不可用，yarn安装错误

1. 查看当前使用代理，如果有，需要去掉。

```bash
env | grep -i proxy
```

2. 去掉相关代理

```bash
gedit /etc/enviroment 
```

3. 还有~/.bashrc /etc/profile中的代理，然后source两个文件。

```bash
source .bashrc
source /etc/profile
```

4. 如果还存在代理，运行：

```bash
unset http_proxy
unset https_proxy


export -n http_proxy
export -n https_proxy
export -n no_proxy
```