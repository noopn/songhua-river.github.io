---
title: 普通规则
mathjax: true
tags:
  - CSS
categories:
  - CSS
  - CSS总览
abbrlink: c82bde21
date: 2020-09-21 13:57:28
---

### 规则组成
qualified rule 主要是由选择器和声明区块构成。声明区块又由属性和值构成。

{% pullquote mindmap mindmap-md %}
- 普通规则
  - [选择器](ttps://www.w3.org/TR/selectors-3/)
  - 声明列表
    - 属性
      - 普通属性
      - [变量属性](https://www.w3.org/TR/css-variables/)
    - 值
      - [值的类型](https://www.w3.org/TR/css-values-4/#numeric-types)
      - [函数](https://www.w3.org/TR/css-values-4/#functional-notations)
{% endpullquote %}

#### [选择器语法结构](https://www.w3.org/TR/selectors-3/#w3cselgrammar)

[https://www.w3.org/TR/selectors-3/](https://www.w3.org/TR/selectors-3/)
[https://www.w3.org/TR/selectors-4/](https://www.w3.org/TR/selectors-4/)

+ 根结构由逗号（COMMA）分隔的 selector选择器组成
```css
selectors_group
  : selector [ COMMA S* selector ]*
  ;
```

+ 选择器（selector）由简单选择器(simple_selector_sequence)与组合符(combinator)链接的
```css
selector
  : simple_selector_sequence [ combinator simple_selector_sequence ]*
  ;
```
+ 组合符有 + （PLUS）> (GREATER) ~(TILDE) 空格（S+）
  ```css
  combinator
    /* combinators can be surrounded by whitespace */
    : PLUS S* | GREATER S* | TILDE S* | S+
    ;
  ```
+ 简单选择器有 类型选择器（type_selector）通配符选择器（universal）# （HASH）. (CLASS) [type=''] (attrib) : (pseudo) :not (negation)
  ```css
  simple_selector_sequence
    : [ type_selector | universal ]
      [ HASH | class | attrib | pseudo | negation ]*
    | [ HASH | class | attrib | pseudo | negation ]+
    ;
  ```