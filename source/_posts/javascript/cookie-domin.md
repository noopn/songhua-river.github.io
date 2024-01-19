---
title: Cookie的domain属性
mathjax: true
categories:
  - JavaScript
tags:
  - JavaScript

date: 2021-06-28 14:29:24
---

#### 一些概念

+ domain表示的是cookie所在的域，默认为请求的地址，如网址为www.test.com/test/test.aspx，那么domain默认为www.test.com。而跨域访问，如域A为t1.test.com，域B为t2.test.com，那么在域A生产一个令域A和域B都能访问的cookie就要将该cookie的domain设置为.test.com；如果要在域A生产一个令域A不能访问而域B能访问的cookie就要将该cookie的domain设置为t2.test.com。

+ path表示cookie所在的目录，asp.net默认为/，就是根目录。在同一个服务器上有目录如下：/test/,/test/cd/,/test/dd/，现设一个cookie1的path为/test/，cookie2的path为/test/cd/，那么test下的所有页面都可以访问到cookie1，而/test/和/test/dd/的子页面不能访问cookie2。这是因为cookie能让其path路径下的页面访问。

+ 浏览器会将domain和path都相同的cookie保存在一个文件里，cookie间用*隔开。

+ 含值键值对的cookie：含多个子键值对的cookie格式是name=key1=value1&key2=value2。可以理解为单键值对的值保存一个自定义的多键值字符串，其中的键值对分割符为&，当然可以自定义一个分隔符，但用asp.net获取时是以&为分割符。
