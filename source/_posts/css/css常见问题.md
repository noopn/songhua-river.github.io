---
layout: posts
title: CSS 常见问题
date: 2024-04-29 16:32:55
categories:
  - CSS
tags:
  - CSS
---

#### BFC 及其应用

block formatting context (块级格式化上下文)， BFC 元素可以隔离子元素对外部元素的影响。[\[CSS 世界中相关章节\]](https://minioo.iftrue.club:9348/docs/CSS%E4%B8%96%E7%95%8C.pdf#page=175)

如果一个元素是块级元素，满足以下任一情况会触发 BFC:

- `<html>` 元素
- float 的值不为 none
- overflow 的值为 auto、scroll 或 hidden；
- display 的值为 table-cell,table-row,table-caption 和 inline-block 中的任何一个；
- position 的值不为 relative 和 static。

BFC 可以解决以下问题：

- 避免 margin 重叠，将元素的外层元素变成 BFC 元素，因为 BFC 的隔离性，可以避免子元素与外层元素 margin 重叠
  但是如果 BFC 元素有上下 margin, 仍然会与外层元素边距重叠

- 可以让文字环绕图片时，文字自动填充图片右侧空间，而无需设置固定的宽度。如果想要文字于图片保持距离，可使用 margin 等，但是不能使用 `p` 标签的 `margin-left`

  ```html
  <style>
    img {
      width: 100px;
      height: 100px;
      float: left;
    }
    p {
      overflow: hidden;
    }
  </style>
  <div class="a">
    <img src="./01.png" alt="" />
    <p>xx</p>
  </div>
  ```

  - 使用 `display:table-cell` 实现自适应的两栏布局，由于 `table-cell` 的特性是宽度不会超过父容器的宽度，所以可以给一个很大的宽度

  ```html
  <style>
    .wrapper {
      width: 100%;
    }
    img {
      width: 100px;
      float: left;
    }
    .right {
      display: table-cell;
      word-break: break-all;
      width: 9999px;
    }
  </style>
  <div class="wrapper">
    <img src="./01.png" alt="" />
    <div class="right">xxxx</div>
  </div>
  ```

#### overflow 不同值得区别

overflow 属性原本的作用指定了块容器元素的内容溢出时是否需要裁剪。[\[CSS 世界中相关章节\]](https://minioo.iftrue.club:9348/docs/CSS%E4%B8%96%E7%95%8C.pdf#page=179)

- 注意剪裁得部分是
- 除非 overflow-x 和 overflow-y 的属性值都是 visible，否则 visible 会当成 auto 来解析
- `<html>` `<textarea>` 默认会有滚动条，因为 auto 作为默认值。
- 滚动条的产生会影响表格等样式，方法 1 可以空出右边的滚动条的宽度，方法 2 可以不设最后一列宽度
- body 设置为 absolute, 宽度 100vw,可以解决滚动条晃动的问题。

#### 三栏布局

- float 实现，主要元素的排列顺序

  ```html
  <style>
    .container {
      width: 100%;
      overflow: hidden;
    }
    .left {
      float: left;
      width: 20%;
    }
    .right {
      float: right;
      width: 20%;
    }
    .center {
      margin-left: 20%;
      margin-right: 20%;
      background: lightgray;
    }
  </style>
  <div class="container">
    <div class="left">Left</div>
    <div class="right">Right</div>
    <div class="center">Center</div>
  </div>
  ```

- flex 实现

  ```html
  <style>
    .container {
      display: flex;
    }
    .left {
      flex: 0 0 20%;
    }
    .center {
      flex: 1;
    }
    .right {
      flex: 0 0 20%;
    }
  </style>
  <div class="container">
    <div class="left">Left</div>
    <div class="center">Center</div>
    <div class="right">Right</div>
  </div>
  ```

- grid 布局

  ```html
  <style>
    .container {
      display: grid;
      grid-template-columns: 20% 1fr 20%;
    }
  </style>
  <div class="container">
    <div class="left">Left</div>
    <div class="center">Center</div>
    <div class="right">Right</div>
  </div>
  ```

- 使用 absolute 绝对定位布局

- 使用 table 布局

  table 中未设置宽度的单元格会自动占据剩余的空间

  ```html
  <style>
    .container {
      display: table;
      width: 100%;
    }
    .left,
    .right {
      min-width: 100px;
    }
  </style>
  <table class="container">
    <thead>
      <tr>
        <td width="100px"></td>
        <td></td>

        <td width="100px"></td>
      </tr>
    </thead>
    <table class="container">
      <tbody>
        <tr>
          <td class="cell left">Left</td>
          <td class="cell center">Center</td>
          <td class="cell right">Right</td>
        </tr>
      </tbody>
    </table>
  </table>
  ```

  使用 div 也可以由同样的效果

  ```html
  <style>
    .container {
      display: table;
      width: 100%;
    }

    .left,
    .right {
      min-width: 100px;
    }

    .cell {
      display: table-cell;
    }
  </style>
  <div class="container">
    <div class="cell left">Left</div>
    <div class="cell center">Center</div>
    <div class="cell right">Right</div>
  </div>
  ```

- float + bfc

  ```html
  <style>
    .wrapper {
      clear: both;
    }

    .middle {
      width: 100%;
      float: left;
    }

    .main {
      margin-left: 100px;
      margin-right: 100px;
    }

    .left {
      float: left;
      width: 100px;
      margin-left: -100%;
    }

    .right {
      float: right;
      width: 100px;
      margin-left: -100%;
    }
  </style>
  <div class="wrapper">
    <div class="middle">
      <div class="main">中间</div>
    </div>
    <div class="left">左栏</div>
    <div class="right">右栏</div>
  </div>
  ```

#### calc 函数

通常配合变量使用，实现动态计算效果。[\[CSS 新世界 4.5\]](https://minioo.iftrue.club:9348/docs/CSS%E6%96%B0%E4%B8%96%E7%95%8C.pdf#page=280) [\[兼容性\]](https://developer.mozilla.org/en-US/docs/Web/CSS/calc#browser_compatibility)
