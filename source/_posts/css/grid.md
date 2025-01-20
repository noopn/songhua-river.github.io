---
layout: posts
title: CSS Grid 布局
date: 2024-05-30 16:32:55
categories:
  - CSS
tags:
  - CSS
---

#### grid 网格布局

可以设置元素 display 属性为 `grid` ,`inline-grid`,`inline-grid` 可以让 grid 元素保持内联的特性。[\[CSS 新世界中相关章节\]](https://minioo.iftrue.club:9348/docs/CSS%E6%96%B0%E4%B8%96%E7%95%8C.pdf#page=379)

##### 应用于容器的属性

###### 网格数量与尺寸

`grid-template-columns` 和 `grid-template-rows`属性主要用来指定网格的数量和尺寸等信息。[\[CSS 新世界 6.3.1\]](https://minioo.iftrue.club:9348/docs/CSS%E6%96%B0%E4%B8%96%E7%95%8C.pdf#page=381)

`grid-template: [grid-template-rows] / [grid-template-columns]` 是缩写。

[尺寸可用的 9 种数据类型](https://minioo.iftrue.club:9348/docs/CSS%E6%96%B0%E4%B8%96%E7%95%8C.pdf#page=384),其中 [fr](https://minioo.iftrue.club:9348/docs/CSS%E6%96%B0%E4%B8%96%E7%95%8C.pdf#page=387) 是单词 fraction 的缩写表示分数，按比例划分可自动分配的尺寸。
