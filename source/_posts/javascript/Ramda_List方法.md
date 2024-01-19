---
layout: post
title: Ramda List 方法源码分析
categories:
  - JavaScript
tags:
  - 函数式编程
  - Ramda

date: 2021-01-19 12:57:53
---

#### [adjust](https://ramda.cn/docs/#adjust)

判断索引的合法性

定义开始节点，其实就是抽象了计算真实索引的计算

```javascript
var adjust = _curry3(function adjust(idx, fn, list) {
  if (idx >= list.length || idx < -list.length) {
    return list;
  }
  var start = idx < 0 ? list.length : 0;
  var _idx = start + idx;
  var _list = _concat(list);
  _list[_idx] = fn(list[_idx]);
  return _list;
});
```


#### [all](https://ramda.cn/docs/#all)

[_dispatchable](/posts/2b6baf0c/#dispatchable)

```javascript
var all = _curry2(_dispatchable(['all'], _xall, function all(fn, list) {
  var idx = 0;
  while (idx < list.length) {
    if (!fn(list[idx])) {
      return false;
    }
    idx += 1;
  }
  return true;
}));
export default all;
```