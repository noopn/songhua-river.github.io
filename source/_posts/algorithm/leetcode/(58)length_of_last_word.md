---
title: 58. 最后一个单词的长度
mathjax: true
tags:
  - 算法
  - 关联题目
  - 字符串
categories:
  - 算法
  - 关联题目

date: 2020-10-01 11:26:28
---

##### [LeetCode](https://leetcode-cn.com/problems/length-of-last-word/)

### 解法一

+ 因为是从查找最后一个单词，考虑从后向前匹配

+ 因为有以一个或多个空字符串结尾的情况，所以如果先遇到空字符串则跳过，从遇到的第一个字符串开始基数，再次遇到空格则返回结果

+ 注意边界的处理，如果字符串为空，返回0

```javascript
var lengthOfLastWord = function (s) {
    // 边界处理
    if (s === '') return 0
    var i = s.length - 1;
    var res = 0;
    for (; i >= 0; i--) {
        if (s[i] === ' ' && res !== 0) {
            return res;
        }
        else if(s[i] !== ' '){
            res++;
        }
        //跳过空字符串的情况
    }
    return res;
};
```

**复杂度分析**

+ 时间复杂度：{% mathjax %}O(n){% endmathjax %}

+ 空间复杂度：{% mathjax %}O(1){% endmathjax %}

### 方法二

```javascript
var lengthOfLastWord = function(s) {
    if(s==='') return 0
    return s.trim().split(' ').pop().length;
};
```