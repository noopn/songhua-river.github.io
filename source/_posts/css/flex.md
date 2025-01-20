---
layout: posts
title: CSS Flex 布局
date: 2024-04-30 16:32:55
categories:
  - CSS
tags:
  - CSS
---

#### flex 弹性布局

可以设置元素 display 属性为 `flex` 或 `inline-flex`, `inline-flex` 可以让 flex 元素保持内联的特性。[\[CSS 新世界中相关章节\]](https://minioo.iftrue.club:9348/docs/CSS%E6%96%B0%E4%B8%96%E7%95%8C.pdf#page=347)

##### 弹性设置

- flex-grow：当有剩余空间时，元素延伸占据剩余空间的规则

- flex-shrink：剩余空间不足时，元素收缩的规则

- flex-basis: 元素基础宽度，类似于 `width` 但如果设置了 `auto` 以外的值,优先级别 `width` 高.
  
  `flex-basis` 属性下的最小尺寸是由内容决定的，而 `width` 属性下的最小尺寸是 `width` 属性的计算值决定的。也就是内容过长的时候，设置了 `width` 可能溢出，而设置了 `flex-basis` 宽度是最小内容宽度。
