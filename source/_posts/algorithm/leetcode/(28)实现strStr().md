---
title: 28. 实现 strStr()
mathjax: true

date: 2020-09-20 13:59:58
tags:
  - 算法
  - 关联题目
categories:
  - 算法
  - 关联题目
  
---

##### [LeetCode](https://leetcode-cn.com/problems/implement-strstr/)

**描述**：

给定一个 haystack 字符串和一个 needle 字符串，在 haystack 字符串中找出 needle 字符串出现的第一个位置 (从0开始)。如果不存在，则返回  -1。

**说明**：

+ 
    ```javascript
        输入: haystack = "hello", needle = "ll"
        输出: 2
    ```

+ 
    ```javascript
        输入: haystack = "aaaaa", needle = "bba"
        输出: -1
    ```
+ 当 needle 是空字符串时我们应当返回 0，这与C语言的 strstr() 以及 Java，javascript的 indexOf() 定义相符。

### 1.双指针

+ 首先，只有子串的第一个字符跟 needle 字符串第一个字符相同的时候才需要比较。

![](0001.png)

+ 其次，可以一个字符一个字符比较，一旦不匹配了就立刻终止。

![](0002.png)

+ 注意在遇到不匹配位时，重置指针的位置

![](0003.png)

+ 返回字串的开始位置

![](0004.png)

```javascript
    var strStr = function (haystack, needle) {
    if (needle == '') return 0;
    var i = 0,
        j = 0,
        haystackLength = haystack.length,
        needleLength = needle.length;
    while (i !== haystack.length) {
        // 剩余长度不足字串长度跳出
        if (haystackLength - i < needleLength) return -1;
        while (haystack[j + i] === needle[j]) {
            j++
            if (j === needleLength) {
                return i;
            }
        }
        //不满足时重置索引
        j = 0;
        i++;
    }
    return -1
};

```

**复杂度分析**

+ 时间复杂度：最坏时间复杂度 {% mathjax %}O((N−L)L){% endmathjax %}，最好  {% mathjax %}O(N){% endmathjax %}

+ 空间复杂度：{% mathjax %}O(1){% endmathjax %}

