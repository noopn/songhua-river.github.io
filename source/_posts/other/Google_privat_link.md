---
title: 'Google 搜索提示您的连接不是私密连接 NET::ERR_CERT_AUTHORITY_INVALID'
mathjax: true

date: 2020-10-01 13:39:03
categories: 
- 其他
tags:
- 浏览器
---

# 

+ Google 浏览器搜索报错，但是可以使用翻译等功能，但不能搜索。

![](0001.jpg)

**原因**

+ chrome将你输入的字符转换成google搜索指令时出错所致。新版chrome为增强安全性，对非https的地址会报如上错误。

+ 也可能是运营商网络原因

**解决办法**

删除原来的goole搜索引擎，手动输入一个新的即可。

+ 进入设置

![](0002.jpg)

+ 进入管理搜索引擎

![](0003.jpg)

+ 点击添加

![](0004.jpg)

+ 填入下面几项

搜索引擎： **`Goolge`** 或任意名字

关键字： **`www.google.com.hk`**

网址格式： **`https://www.google.com.hk/search?q=%s&{google:RLZ}{google:originalQueryForSuggestion}{google:assistedQueryStats}{google:searchFieldtrialParameter}{google:iOSSearchLanguage}{google:searchClient}{google:sourceId}{google:instantExtendedEnabledParameter}{google:contextualSearchVersion}ie={inputEncoding}`**

![](0005.jpg)

+ 保存并选**设为默认选项**

![](0006.jpg)