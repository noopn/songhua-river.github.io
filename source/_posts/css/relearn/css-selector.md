---
title: 选择器和优先级
mathjax: true
tags:
  - CSS
categories:
  - CSS
  - CSS总览
abbrlink: 1c4f93c6
date: 2020-09-21 13:57:28
---

### 选择器

![](0001.png)

#### 简单选择器

##### * 通配选择器

\* 通配选择器
\* 选择器选择所有元素。
\* 选择器也可以选择另一个元素内的所有元素

##### div svg|a 派生选择器

通过依据元素在其位置的上下文关系来定义样式，你可以使标记更加简洁。
在 CSS1 中，通过这种方式来应用规则的选择器被称为上下文选择器 (contextual selectors)，这是由于它们依赖于上下文关系来应用或者避免某项规则。在 CSS2 中，它们称为派生选择器，但是无论你如何称呼它们，它们的作用都是相同的。

派生选择器允许你根据文档的上下文关系来确定某个标签的样式。通过合理地使用派生选择器，我们可以使 HTML 代码变得更加整洁。

svg 和 HTML 中都有 a 元素，我们若要想区分选择 svg 中的 a 和 HTML 中的 a，就必须用带命名空间的类型选择器。

```
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>JS Bin</title>
  </head>
  <body>
  <svg width="100" height="28" viewBox="0 0 100 28" version="1.1"
      xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <desc>Example link01 - a link on an ellipse
    </desc>
    <a xlink:href="http://www.w3.org">
      <text y="100%">name</text>
    </a>
  </svg>
  <br/>
  <a href="javascript:void 0;">name</a>
  </body>
  </html>

  @namespace svg url(http://www.w3.org/2000/svg);
  @namespace html url(http://www.w3.org/1999/xhtml);
  svg|a {
    stroke:blue;
    stroke-width:1;
  }

  html|a {
    font-size:40px
  }
```
##### 类选择器

**注意** 类名的第一个字符不能使用数字！它无法在 Mozilla 或 Firefox 中起作用。

+ 选择具有相同类名的元素

```css
*.important {color:red;}
.important {color:red;}
```
+ 结合元素选择器

```css
/* 表示选择所有class为important的p元素 */
p.important {color:red;}
```

**注意** 除了p元素中包含class为important的元素，其他的元素都不会被选择，哪怕class为important

+ CSS 多类选择器

```css
.important.urgent {background:silver;}
```

**注意** 被选择的元素必须同时含有 important和urgent两个class名称才能被选择  

##### ID 选择器

ID 选择器前面有一个 # 号 - 也称为棋盘号或井号。 
[为什么一个HTML中ID要唯一](https://www.w3school.com.cn/xhtml/xhtml_structural_02.asp)

**注意** 

+ 类选择器和 ID 选择器可能是区分大小写的。这取决于文档的语言。HTML 和 XHTML 将类和 ID 值定义为区分大小写，所以类和 ID 值的大小写必须与文档中的相应值匹配。
+ 与类不同，在一个 HTML 文档中，ID 选择器会使用一次，而且仅一次。
+ 不能使用 ID 词列表 `#name#nickname`,ID 选择器不能结合使用，因为 ID 属性不允许有以空格分隔的词列表。
+ 如果存在重名ID,都会被选择

##### 属性选择器

+ 多属性选择

```css
/* 表示同时含有 href 和 title 属性 */
a[href][title] {color:red;}
a[href="https://songhua-river.github.io/"][title="songhua"] {color: red;}
```

+ 根据部分属性值选择

如果需要根据属性值中的词列表的某个词进行选择，则需要使用波浪号（~）。

```css
img[title~="figure"] {border: 1px solid gray;}
```

+ 子串匹配属性选择器

|     类型     |                    描述                    |
|:------------:|:------------------------------------------:|
| [abc^="def"] |   选择 abc 属性值以 "def" 开头的所有元素   |
| [abc$="def"] |   选择 abc 属性值以 "def" 结尾的所有元素   |
| [abc*="def"] | 选择 abc 属性值中包含子串 "def" 的所有元素 |

```css
a[href*="songhua-"] {color: red;}
```

+ 特定属性选择类型

**注意** 该值必须是整个单词，比如 lang="en"，或者后面跟着连字符，比如 lang="en-us"。

```css
*[lang|="en"] {color: red;}
img[src|="figure"] {border: 1px solid gray;}
```
##### 伪类

+ 锚伪类

```css
a:link {color: #FF0000}		/* 未访问的链接 */
a:visited {color: #00FF00}	/* 已访问的链接 */
a:hover {color: #FF00FF}	/* 鼠标移动到链接上 */
a:active {color: #0000FF}	/* 选定的链接 */
```

+ CSS2 - :first-child 伪类

```css
/* 匹配所有 <p> 元素中的第一个 <i> 元素 */
p > i:first-child { font-weight:bold;} 

/* 配所<p>元素中第一个子元素，下面的所有 <i> 元素： */
p:first-child i {
  color:blue;
  } 
```

**注意** 最常见的错误是认为 p:first-child 之类的选择器会选择 p 元素的第一个子元素。

+ CSS2 - :focus 伪类

**注意** 如果已规定 !DOCTYPE，那么 Internet Explorer 8 （以及更高版本）支持 :focus 伪类。
**注意** 伪类的名称对大小写不敏感。

+ CSS2 - :lang 伪类

```html
<html>
<head>

<style type="text/css">
/* :lang 类为属性值为 no 的 q 元素定义引号的类型 */
q:lang(no)
   {
   quotes: "~" "~"
   }
</style>

</head>

<body>
<p>文字<q lang="no">段落中的引用的文字</q>文字</p>
</body></html>
```

#### 后代选择器

后代选择器（descendant selector）又称为包含选择器。后代选择器可以选择作为某元素后代的元素。

在后代选择器中，规则左边的选择器一端包括两个或多个用空格分隔的选择器。选择器之间的空格是一种结合符（combinator）。每个空格结合符可以解释为“... 在 ... 找到”、“... 作为 ... 的一部分”、“... 作为 ... 的后代”，但是要求必须从右向左读选择器。

```css
div.sidebar {background:blue;}
div.maincontent {background:white;}
div.sidebar a:link {color:white;}
div.maincontent a:link {color:blue;}
```


#### 复杂选择器

##### 子元素选择器

与后代选择器相比，子元素选择器（Child selectors）只能选择作为某元素子元素的元素。

子结合符两边可以有空白符，这是可选的。下面的写法都没有问题

```css
h1 > strong
h1> strong
h1 >strong
h1>strong
``` 

如果您不希望选择任意的后代元素，而是希望缩小范围，只选择某个元素的子元素，请使用子元素选择器（Child selector）。

```css
/* 只选择h1元素的子元素，不包括孙元素及更深层的元素 */
h1 > strong {color:red;}
```

##### 相邻兄弟选择器

相邻兄弟选择器（Adjacent sibling selector）可选择紧接在另一元素后的元素，且二者有相同父元素。

如果需要选择紧接在另一个元素后的元素，而且二者有相同的父元素，可以使用相邻兄弟选择器（Adjacent sibling selector）。

相邻兄弟选择器使用了加号（+），即相邻兄弟结合符（Adjacent sibling combinator）。

**注意** 与子结合符一样，相邻兄弟结合符旁边可以有空白符。


```css
/* 表示紧跟在h1后面的p元素 */
h1 + p {margin-top:50px;}

/* 从二个li开始以及后面的所有li元素 */
li + li {font-weight:bold;}
```

##### 通用兄弟选择器 

位置无须紧邻，只须同层级，A~B 选择A元素之后所有同层级B元素。

```css
p ~ span  {color: red}
```

##### 列选择符

```css
/* 选择所有属于col.selected的<td>元素，哪怕这个<td>元素横跨多列。 */
col.selected || td {
    background-color: skyblue;
}
```

### 优先级

优先级计算规则

+ ID选择器权重为A
+ 类选择器，属性选择器，伪类选择器权重为B
+ 元素选择器，为元素选择器 权重为C
+ \* 通配选择器不参与计算

+ 否定伪类中的选择器权重计算和其他相同，但否定为类本身不参与计算

最终选择器的权重如下，N为足够大的一个数
<center>{% mathjax %}S = A * N^2+ B*N^1 + C* N^0{% endmathjax %}</center>