---
title: 38. 外观数列
mathjax: true

date: 2020-09-23 18:03:52
tags:
  - 算法
  - 关联题目
categories:
  - 算法
  - 关联题目
  
---

##### [LeetCode](https://leetcode-cn.com/problems/count-and-say/)

**注意**

+ 处理边界情况，当`n==1`返回`'1'`

### 暴力解法  循环+使用栈结构

使用数组来处理统计字符个数

```javascript
var countAndSay = function (n) {
    if (n === 1) return '1';
    var res = '1',
        i = 1;
    for (; i < n; i++) {
        var str = '';
        var count = 0;
        var stack = [];
        for (var j = 0; j < res.length; j++) {
            if (stack[0] !== undefined && stack[0] !== res[j]) {
                str += stack.length + stack[0];
                stack = [];
            }
            stack.push(res[j])
        }
        if (stack.length) {
            str += stack.length + stack[0];
        }
        res = str;
    }
    return res;
};
```

### 优化 双指针

在处理字符个数时有个很通用且巧妙的解法，使用双指针来统计连续字符串出现的个数

[计数二进制子串](https://leetcode-cn.com/problems/count-binary-substrings/)

```javascript
var countAndSay = function (n) {
    if (n === 1) return '1';
    var res = '1';
    for (var i = 1; i < n; i++) {
        var j = 0;
        var temp = '';
        for (var k = 0; k < res.length; k++) {
            if (res[j] !== res[k]) {
                temp += String(k - j) + res[j];
                j = k;
            }
        }
        temp += String(k - j) + res[j];
        res = temp;
    }
    return res;
};
```

### 递归

可以把循环n时改为递归的形式

```javascript
var countAndSay = function (n) {
    if (n === 1) return '1';
    var res = countAndSay(n - 1);
    var j = 0;
    var temp = '';
    for (var k = 0; k < res.length; k++) {
        if (res[j] !== res[k]) {
            temp += String(k - j) + res[j];
            j = k;
        }
    }
    temp += String(k - j) + res[j];
    return temp
};
```
