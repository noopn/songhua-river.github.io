---
title: 55.跳跃游戏
mathjax: true
tags:
  - 算法
  - 关联题目
categories:
  - 算法
  - 关联题目


date: 2020-10-12 13:55:33
---

##### [LeetCode](https://leetcode-cn.com/problems/jump-game/)

### [动态规划详解](/posts/68932b1a)

#### 确定状态

##### 最后一步

考虑青如果能跳到最后一个位置{% mathjax %}n-1{% endmathjax %},

那必须满足这样的关系：

+ 如果是从位置{% mathjax %}i{% endmathjax %}上跳过来，必须能先跳到位置{% mathjax %}i{% endmathjax %}

+ 位置{% mathjax %}i{% endmathjax %}上表示的步数大小必须大于或等于从{% mathjax %}i{% endmathjax %}到最后位置{% mathjax %}n-1{% endmathjax %},即{% mathjax %}a_i>=n-1+i{% endmathjax %}

##### 子问题

把能否跳到位置{% mathjax %}n-1{% endmathjax %}的问题，转化位能否跳到位置{% mathjax %}i{% endmathjax %}的问题

且{% mathjax %}i< n-1{% endmathjax %} 问题规模缩小

##### 状态

最终可以确定状态： {% mathjax %}f[j]{% endmathjax %}表示能否到最后位置{% mathjax %}n-1{% endmathjax %}

#### 转移方程

+ 通过最后一步的分析, 位置{% mathjax %}i{% endmathjax %}必须能到达，且位置 {% mathjax %}i{% endmathjax %} 的步数与位置{% mathjax %}i{% endmathjax %}的和必须大于等于最后位置的索引 {% mathjax %}j{% endmathjax %},所以有 {% mathjax %} f[i]==true\quad\&\&\quad a_i+n-1 \geq j => f[j] = true {% endmathjax %}

+ 如何找到 {% mathjax %}f[i]==true{% endmathjax %} 是通过循环 {% mathjax %}For_{0 \leq i < j}{% endmathjax %} ,只要可以找到一个满足的条件，那么{% mathjax %}f[j]=true{% endmathjax %}

+ 最终转移方程为 {% mathjax %}f[j]=OR_{0 \leq i < j}(f[i] \quad AND \quad i+ a[i] \geq j){% endmathjax %}

**注意:**为什么不能只找最近的{% mathjax %}f[i]{% endmathjax %}进行判断？因为能否到达 {% mathjax %}n-1{% endmathjax %} 受之前所有能到达位置的影响，而且最近的可到达位置，并不一定能到最终位置，例如 `[3,0,0,5,0,0,1,0,1]`

#### 初始条件和边界情况

位置0为`true`

#### 运算顺序

+ 设 {% mathjax %}f[i]{% endmathjax %} 表示青蛙不能跳到石头 {% mathjax %}j{% endmathjax %}

+ {% mathjax %}f[j]=OR_{0 \leq i < j}(f[i] \quad AND \quad i+ a[i] \geq j){% endmathjax %}

+ 初始化 `f[0]==true`

+ 计算 `f[1],f[2]....,f[n-1]`

+ 返回结果为 `f[n-1]`

```javascript
var canJump = function (nums) {
    var f = [true],
        n = nums.length;
    for (var j = 1; j < n; j++) {
        f[j] = false;
        for (var i = 0; i < j; i++) {
            if (f[i] && i + nums[i] >= j) {
                f[j] = true;
                break;
            }
        }
    }
    return f[n - 1];
};
```

**复杂度分析**

+ 时间复杂度：{% mathjax %}O(n^2){% endmathjax %},每次需要重复遍历已经遍历过的元素所以，{% mathjax %}O(n) = O(1 + 2 + ... n) => O(\frac{n(1+n)}{2}) => O(n^2) {% endmathjax %}

+ 空间复杂度：{% mathjax %}O(n){% endmathjax %}