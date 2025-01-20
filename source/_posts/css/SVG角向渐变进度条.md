---
layout: posts
title: SVG角向渐变进度条
date: 2024-07-01 15:41:37
categories:
  - CSS
  - SVG
tags:
  - CSS
  - SVG
---

## 实现基本环形进度条

利用 circle 元素， 设置 stroke-width 来实现环形。

```html
<circle
  class="animate-item"
  fill="none"
  stroke="red"
  stroke-width="20"
  cx="50"
  cy="50"
  r="40"
></circle>
```

如果想实现部分环形， 可以使用 [stroke-dasharray](/posts/66a993551b2e/#stroke-dasharray) [stroke-dashoffset](/posts/66a993551b2e/#stroke-dashoffset), 偏移描边,来实现部分圆环

```html
<circle
  class="animate-item"
  fill="none"
  stroke="red"
  stroke-width="20"
  cx="50"
  cy="50"
  r="40"
  stroke-dasharray="314 1000"
  stroke-dashoffset="200"
  stroke-linecap="round"
>
</circle>
```

因为 circle 的半径是 50，因此描边的路径长度是 `Math.PI * 2 * 50` 一个大于等于这个数值的描边就会可以覆盖整个圆环， 后面设置一个大一点的空白长度为 1000。

dashoffset 设置为 200 意味着描边向后偏移了 200, 那个对于第一段描边只剩下 314 - 200 的描边长度。

圆形绘制的起始点是 0 度角， 因此最终的效果如下。

![](001.png)

一般环形位置是从 90 度角开始的， 所以可以给 circle 加上 transform 变换。

```html
<circle
  class="animate-item"
  fill="none"
  stroke="red"
  stroke-width="20"
  cx="50"
  cy="50"
  r="40"
  stroke-dasharray="314 1000"
  stroke-dashoffset="200"
  stroke-linecap="round"
  transform="rotate(-90 50 50)"
>
</circle>
```

![](002.png)

## 使用渐变色

SVG 支持线性渐变和镜像渐变， 可以创建一个线性渐变元素。 作为圆环的描边属性值。

```html
<svg
  height="100"
  width="100"
  xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  version="1.1"
>
  <defs>
    <linearGradient
      x1="77.8982925%"
      y1="11.2647007%"
      x2="24.5398068%"
      y2="89.7549679%"
      id="linearGradient"
    >
      <stop stop-color="#002974" stop-opacity="0.21446132" offset="0%"></stop>
      <stop stop-color="#4DD7FF" offset="99.9125874%"></stop>
    </linearGradient>
  </defs>
  <circle
    class="animate-item"
    fill="none"
    stroke="url(#linearGradient)"
    stroke-width="20"
    cx="50"
    cy="50"
    r="40"
    stroke-dasharray="314 1000"
    stroke-dashoffset="200"
    stroke-linecap="round"
    transform="rotate(-90 50 50)"
  ></circle>
</svg>
```

这里使用了一个有倾斜角度的线性渐变模拟， 色环的角向渐变。

## 实现角向渐变色

虽然 SVG 不支持角向渐变， 但是可以使用 [pattern] 作为描边属性值。

首先准备一张角向渐变的图片。

![](003.png)

在 pattern 中定义并作为描边属性值使用。

```html
<svg
  height="100"
  width="100"
  xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  version="1.1"
>
  <defs>
    <pattern
      id="fill-img"
      patternUnits="userSpaceOnUse"
      width="100"
      height="100"
    >
      <image xlink:href="./01.png" x="0" y="0" width="100" height="100"></image>
    </pattern>
  </defs>
  <circle
    class="animate-item"
    fill="none"
    stroke="url(#fill-img)"
    stroke-width="20"
    stroke-miterlimit="1"
    cx="50"
    cy="50"
    r="40"
    stroke-dasharray="314 1000"
    stroke-dashoffset="200"
    stroke-linecap="round"
    transform="rotate(-74 50 50)"
  ></circle>
</svg>
```

![](005.png)

由于 line-cap 占据了一定的 stroke 长度，所以 rotate 中并没有旋转到 90 度， 为 line-cap 占据的位置空出一点空间。

但是当 dashoffset 为 0 时，效果如下， 因此需要给 pattern 一个 transform 属性，用于抵消 circle 旋转的偏移。

![](006.png)

```html
<pattern id="fill-img" patternUnits="userSpaceOnUse" width="100" height="100">
  <image
    xlink:href="./01.png"
    x="0"
    y="0"
    width="100"
    height="100"
    transform="rotate(74 50 50)"
  >
  </image>
</pattern>
```

最后添加动画属性, 初始时 dashoffset 在 314 的位置， 动画开始后将会回退到 0 的位置， 由此实现环形进度条动画效果。

```html
<style>
  .animate-item {
    transition: stroke-dashoffset 1.5s ease;
  }
</style>
<svg
  height="100"
  width="100"
  xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  version="1.1"
>
  <defs>
    <pattern
      id="fill-img"
      patternUnits="userSpaceOnUse"
      width="100"
      height="100"
    >
      <image
        xlink:href="./01.png"
        x="0"
        y="0"
        width="100"
        height="100"
        transform="rotate(74 50 50)"
      ></image>
    </pattern>
  </defs>
  <circle
    class="animate-item"
    fill="none"
    stroke="url(#fill-img)"
    stroke-width="20"
    stroke-miterlimit="1"
    cx="50"
    cy="50"
    r="40"
    stroke-dasharray="314 1000"
    stroke-dashoffset="314"
    stroke-linecap="round"
    transform="rotate(-74 50 50)"
  ></circle>
</svg>
<script>
  setTimeout(function () {
    document
      .querySelector(" .animate-item")
      .setAttribute("stroke-dashoffset", 0);
  }, 1000);
</script>
```

![](007.gif)
