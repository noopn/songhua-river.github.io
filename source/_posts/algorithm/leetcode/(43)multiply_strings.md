---
title: 43.字符串相乘
mathjax: true
tags:
  - 算法
  - 关联题目
categories:
  - 算法
  - 关联题目


date: 2020-10-19 10:03:43
---

**[LeetCode](https://leetcode-cn.com/problems/multiply-strings/)**

#### BigInt

不能和Math对象中的方法一起使用；不能和任何Number实例混合运算。

```javascript
var multiply = function(num1, num2) {
  return BigInt(num1) * BigInt(num2) + '';
}
```

#### 竖向相乘

算法是通过两数相乘时，乘数某位与被乘数某位相乘，与产生结果的位置的规律来完成。具体规律如下：

+ 乘数 `num1` 位数为 `M`，被乘数 `num2` 位数为 `N`， `num1 * num2` 结果 `res` 最大总位数为 `M+N`

+ `num1[i] * num2[j]` 的结果为 `tmp`(位数为两位，"0x","xy"的形式)，其第一位位于 `res[i+j]`，第二位位于 `res[i+j+1]`

![](0001.png)

```javascript
var multiply = function (num1, num2) {
    const stack = new Array(num1.length + num2.length).fill(0);
    let res = '';
    for (let i = num1.length - 1; i >= 0; i--) {
        for (let j = num2.length - 1; j >= 0; j--) {
            const sum = stack[i + j + 1] + num1[i] * num2[j];
            stack[i + j + 1] = sum % 10;
            stack[i + j] += sum / 10 >> 0;
        }
    }
    let make = false;
    for (let i = 0; i < stack.length; i++) {
        if (!make && stack[i] === 0) {
            continue;
        }
        make = true;
        res += stack[i];
    }
    return res || '0'
};
```

把边界情况与0相乘单独处理

```javascript
var multiply = function (num1, num2) {
    if (num1 === '0' || num2 === '0') {
        return '0'
    }
    const stack = new Array(num1.length + num2.length).fill(0);
    let res = '';
    for (let i = num1.length - 1; i >= 0; i--) {
        for (let j = num2.length - 1; j >= 0; j--) {
            const sum = stack[i + j + 1] + num1[i] * num2[j];
            stack[i + j + 1] = sum % 10;
            stack[i + j] += sum / 10 >> 0;
        }
    }
    for (let i = 0; i < stack.length; i++) {
        if (i == 0 && stack[i] === 0) {
            continue;
        }
        res += stack[i];
    }
    return res;
};
```

**复杂度分析**

+ 时间复杂度：{% mathjax %}O(MN){% endmathjax %},{% mathjax %}M,N{% endmathjax %} 分别为 `num1` 和 `num2` 的长度。

+ 空间复杂度：{% mathjax %}O(M+N){% endmathjax %} 用于存储计算结果。

#### 多项式相乘

