---
title: 62.不同路径
mathjax: true
tags:
  - 算法
  - 关联题目
categories:
  - 算法
  - 关联题目


date: 2020-10-08 20:29:48
---

##### [LeetCode](https://leetcode-cn.com/problems/unique-paths/)

### [动态规划解法](/posts/68932b1a)

#### 确定状态

##### 最后一步

无论机器人用多少种方式到达右下角，最后的一步只能是向下或者向右

右下角的坐标为 {% mathjax %}(m-1,n-1){% endmathjax %}

那么它的上一步一定是在 {% mathjax %}(m-2,n-1){% endmathjax %} 或 {% mathjax %}(m-1,n-2){% endmathjax %}

##### 子问题

如果有{% mathjax %}X{% endmathjax %}种方式走到 {% mathjax %}(m-2,n-1){% endmathjax %}，有{% mathjax %}Y{% endmathjax %} 种方式走到{% mathjax %}(m-1,n-2){% endmathjax %}，那么走到{% mathjax %}(m-1,n-1){% endmathjax %}的方式为{% mathjax %}X+Y{% endmathjax %}种

> 为什么可以是{% mathjax %}X+Y{% endmathjax %}种

满足加法需要保证两点:

+ 无重复，机器人不坑能从{% mathjax %}(m-2,n-1){% endmathjax %}的位置走到{% mathjax %}(m-1,n-2){% endmathjax %}的位置，不会有重复路线

+ 无遗漏，机器人只能从其他两个位置走到最终位置，在没有其他的方式

所以问题就可以转化为有多少种方式走到{% mathjax %}(m-2,n-1){% endmathjax %}或{% mathjax %}(m-1,n-2){% endmathjax %}的位置，并求两者之和

子问题缩小了元问题的规模，可以忽略最右边一列，或最下面一列，这也是子问题的作用

##### 状态

最终可以确定状态： `f[i][j]`为机器人有多少种方式走到右下角`(i,j)`

#### 转移方程

![](0001.png)

#### 初始条件和边界情况

+ 初始条件： `f[0][0]=1`机器人只有一种方式到左上角，也就是不动

+ 边界条件： 第一行和第一列只有一种走法，一直向右或一直向下,因为第一行没有上面的格子，不能从上面走到下面，第一列没有左边的格子，不能从左边走到右边，所以`f[0->i][0]=1` `f[0][0->j]=1`，其他的格子都可以使用状态转移方程

#### 计算顺序

+ `f[0][0]=1`

+ 计算第0行： `f[0][0]`,`f[0][1]`,...,`f[0][j-1]`

+ 计算第1行： `f[1][0]`,`f[1][1]`,...,`f[1][j-1]`

+ 计算第i-1行： `f[i-1][0]`,`f[i-1][1]`,...,`f[i-1][j-1]`

计算顺序并是不里所当然，或是为了循环方便，如下图所示:

![](0002.png)

B格子在计算`i-1`行时刚刚算过，A格子在上面一步计算`i-2`行时计算过，所以可以计算出`f[i-1][j-2]`为最终返回结果

```javascript
var uniquePaths = function (m, n) {
    var i, j, arr = [];
    for (i = 0; i < m; i++) {
        for (j = 0; j < n; j++) {
            if (i === 0 || j === 0) {
                Array.isArray(arr[i]) ? arr[i][j] = 1 : arr[i] = [1]
            } else {
                arr[i][j] = arr[i - 1][j] + arr[i][j - 1];
            }
        }
    }
    return arr[i - 1][j - 1];
};
```

**复杂度分析**

+ 时间复杂度：{% mathjax %}O(mn){% endmathjax %}

+ 空间复杂度：{% mathjax %}O(mn){% endmathjax %}