---
title: '@规则'
mathjax: true
abbrlink: 56ec7aea
date: 2020-09-20 18:41:38
tags:
  - CSS
categories:
  - CSS
  - CSS总览
---

### at 规则

@ 关键字和后续的一个区块组成，如果没有区块，则以分号结束。

#### @charset 

[https://www.w3.org/TR/css-syntax-3/#charset-rule](https://www.w3.org/TR/css-syntax-3/#charset-rule)

@charset 用于提示 CSS 文件使用的字符编码方式，它如果被使用，必须出现在最前面。这个规则只在给出语法解析阶段前使用，并不影响页面上的展示效果。

```css
  @charset "utf-8";
```

#### @import

[https://www.w3.org/TR/css-cascade-4/#at-import](https://www.w3.org/TR/css-cascade-4/#at-import)
[https://developer.mozilla.org/zh-CN/docs/Web/CSS/@import](https://developer.mozilla.org/zh-CN/docs/Web/CSS/@import)

@import 用于引入一个 CSS 文件，除了 @charset 规则不会被引入，@import 可以引入另一个文件的全部内容。

```css
  @import "mystyle.css";
  @import url("mystyle.css");
```

import 还支持 supports 和 media query 形式。

``` css
@import [ <url> | <string> ]
        [ supports( [ <supports-condition> | <declaration> ] ) ]?
        <media-query-list>? ;
```

```css
@import "common.css" screen, projection;
@import url('landscape.css') screen and (orientation:landscape);
```

#### @media

[https://www.w3.org/TR/css3-conditional/#at-media](https://www.w3.org/TR/css3-conditional/#at-media)
[https://developer.mozilla.org/zh-CN/docs/Web/CSS/@media](https://developer.mozilla.org/zh-CN/docs/Web/CSS/@media)

media query使用的规则，也是最常用的规则，它能够对设备的类型进行一些判断。在 media 的区块内，是普通规则列表。

#### @page

[https://www.w3.org/TR/css-page-3/#syntax-page-selector](https://www.w3.org/TR/css-page-3/#syntax-page-selector)
[https://developer.mozilla.org/zh-CN/docs/Web/CSS/@page](https://developer.mozilla.org/zh-CN/docs/Web/CSS/@page)

```css
@page {
  size: 8.5in 11in;
  margin: 10%;

  @top-left {
    content: "Hamlet";
  }
  @top-right {
    content: "Page " counter(page);
  }
}
```

#### @counter-style

[https://www.w3.org/TR/css-counter-styles-3/#the-counter-style-rule](https://www.w3.org/TR/css-counter-styles-3/#the-counter-style-rule)
[https://developer.mozilla.org/zh-CN/docs/Web/CSS/@counter-style](https://developer.mozilla.org/zh-CN/docs/Web/CSS/@counter-style)

counter-style 产生一种数据，用于定义列表项的表现。

```css
@counter-style triangle {
  system: cyclic;
  symbols: ‣;
  suffix: " ";
}
```
#### @key-frames

[https://www.w3.org/TR/css-animations-1/#csskeyframesrule](https://www.w3.org/TR/css-animations-1/#csskeyframesrule)
[https://developer.mozilla.org/zh-CN/docs/Web/CSS/@keyframes](https://developer.mozilla.org/zh-CN/docs/Web/CSS/@keyframes)

keyframes 产生一种数据，用于定义动画关键帧。

```css
@keyframes diagonal-slide {

  from {
    left: 0;
    top: 0;
  }

  to {
    left: 100px;
    top: 100px;
  }
}
```

#### @fontface

[https://www.w3.org/TR/css-fonts-3/#om-fontface](https://www.w3.org/TR/css-fonts-3/#om-fontface)
[https://developer.mozilla.org/zh-CN/docs/Web/CSS/@font-face](https://developer.mozilla.org/zh-CN/docs/Web/CSS/@font-face)

fontface 用于定义一种字体，icon font 技术就是利用这个特性来实现的。

```css

@font-face {
  font-family: Gentium;
  src: url(http://example.com/fonts/Gentium.woff);
}

p { font-family: Gentium, serif; }
```

#### @support

[https://www.w3.org/TR/css3-conditional/#at-supports](https://www.w3.org/TR/css3-conditional/#at-supports)
[https://developer.mozilla.org/zh-CN/docs/Web/CSS/@supports](https://developer.mozilla.org/zh-CN/docs/Web/CSS/@supports)

support 检查环境的特性，它与 media 比较类似。

```css
@supports (display: grid) {
  div {
    display: grid;
  }
}
```

#### @namespace

[https://www.w3.org/TR/css-namespaces-3/#declaration](https://www.w3.org/TR/css-namespaces-3/#declaration)
[https://developer.mozilla.org/zh-CN/docs/Web/CSS/@namespace](https://developer.mozilla.org/zh-CN/docs/Web/CSS/@namespace)

用于跟 XML 命名空间配合的一个规则，表示内部的 CSS 选择器全都带上特定命名空间

#### @viewport

[https://developer.mozilla.org/zh-CN/docs/Web/CSS/@viewport](https://developer.mozilla.org/zh-CN/docs/Web/CSS/@viewport)

已删除，使用meta标签代替

#### @document

CSS4

#### @font-feature-values