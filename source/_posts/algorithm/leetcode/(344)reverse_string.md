---
title: 344.反转字符串
mathjax: true
tags:
  - 算法
  - 关联题目
categories:
  - 算法
  - 关联题目
  

date: 2020-10-09 10:43:28
---

##### [LeetCode](https://leetcode-cn.com/problems/reverse-string/)

**注意**


### 原生API

```javascript
var reverseString = function(){
    return s.reverse();
}
```

### 循环

从前向后两两交换字母位置,`n`为数组`s`的长度，那么只需要`n/2`次就可以调换所有的顺序

```javascript
var reverseString = function (s) {
    var len = s.length,
        middle = Math.ceil(s.length / 2),
        i = 0;
    for (; i < middle; i++) {
        var temp = s[i];
        s[i] = s[len - i - 1];
        s[len - i - 1] = temp;
    }
    return s;
};
```
### 双指针

与循环方法相似，需要`left`,`right`两个指针，分别向中间移动，当两个指针相等时，交换完成

```javascript
var reverseString = function (s) {
    var left = 0,
        right = s.length - 1;
    while (left <= right) {
        var temp = s[left];
        s[left] = s[right];
        s[right] = temp;
        left++;
        right--;
    }
    return s;
}
```

**复杂度分析**

+ 时间复杂度：{% mathjax %}O(n){% endmathjax %} 只需要遍历 {% mathjax %}n/2{% endmathjax %} 次。

+ 空间复杂度：{% mathjax %}O(1){% endmathjax %} 不需要额外空间