---
layout: posts
title: SVG 属性
date: 2024-07-01 14:45:16
categories:
  - CSS
  - SVG
tags:
  - CSS
  - SVG
---

## [stroke-dasharray](https://developer.mozilla.org/zh-CN/docs/Web/SVG/Attribute/stroke-dasharray)

**stroke** 作为一个动词，有一画，划的意思。

在 SVG 中 stroke 作为一个描边属性，通过 stroke-dasharray 可以配置描边中的点和线的范式。换句话说它可以控制，描边中的线段与空白的规则。

作为一个外观属性，它也可以直接在写在 CSS 中。

```css
/* 虚线长10，间距10，后面重复，虚线长10，间距10 */
stroke-dasharray = '10'
/* 虚线长10，间距5，后面重复，虚线长10，间距5 */
stroke-dasharray = '10, 5'
/* 虚线长20，间距10，虚线长5 后面是 间距20，虚线10，间距5 一直到下一个重复周期*/
stroke-dasharray = '20, 10, 5'
```

## [stroke-dashoffset](https://developer.mozilla.org/zh-CN/docs/Web/SVG/Attribute/stroke-dashoffset)

stroke-dashoffset 属性指定了 dash 模式到路径开始的距离, 它是一个偏移量，可以向前或向后偏移描边。

另外这是一个数值型的属性，因此可以使用 css 动画控制， 来实现路径动画。 这是一个[角向渐变环形进度条](/posts/f88cc857f1db/)的例子。

## [pattern](https://developer.mozilla.org/zh-CN/docs/Web/SVG/Element/pattern)

使用预定义的图形对一个对象进行填充或描边，就要用到 pattern 元素。pattern 元素让预定义图形能够以固定间隔在 x 轴和 y 轴上重复（或平铺）从而覆盖要涂色的区域。先使用 pattern 元素定义图案，然后在给定的图形元素上用属性 fill 或属性 stroke 引用用来填充或描边的图案。
