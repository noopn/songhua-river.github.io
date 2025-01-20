---
title: 动态规划
mathjax: true
tags:
  - 算法
  - 动态规划
categories:
  - 算法
  - 常见算法与数学

date: 2020-10-02 16:44:34
---

#### 什么样的问题可以使用动态规划

- 计数

  - 到达一个位置有多少中走法
  - 有多少种方式选出 k 个数使其和使 sum

- 求最大值最小值

  - 从左下角到右下角路径的最大数字和
  - 最长上升子序列长度

- 存在性 博弈性
  - 取石子游戏，先手是否必胜
  - 能不能选出 k 个数使其和是 sum

#### 问题描述

一起提动态规划，可能最先想到的就是硬币问题，这也是动态规划的最常见问题。

你有三种硬币，面值分别为 2 元，5 元，7 元，每种硬币数量足够多。买一本书须要 27 元，如何使用最少的硬币组合正好可以付清 27 元

从直觉上我们可能会这样尝试：

- 因为要最够少的硬币，那就尽量选择大的面额

- 拿 3 个 7 元硬币，还剩 6 元，发现如果使用 5 元硬币不能凑够 6 元，所以选择用 3 个两元硬币

- 我想到的结果是 2 元，2 元，2 元，7 元，7 元，7 元 6 枚硬币

- 但正确的结果是 5 元，5 元，5 元，5 元，7 元 5 枚硬币

**问题所在**

我们通过直觉的分析，并不是正确的思路，因为不能通过数学的方式证明。

下面来学习一下动态规划，通常动态规划有四个组成部分

#### 确定状态

**①** 状态是动态规划中最重要的概念

**②** 常见的，动态规划解题时会创建一个数组，数组的每个元素`f[i]`或者`f[i][j]`代表什么,类似数学中的{% mathjax %}X{% endmathjax %} {% mathjax %}Y{% endmathjax %} {% mathjax %}Z{% endmathjax %}

**③** 确定状态时关键的两个概念

&ensp;&ensp;1） 最后一步

&ensp;&ensp;以题目为例，随算我们不知道最少的方式是什么，但它肯定是由 {% mathjax %}a_1,a_2,...a_k{% endmathjax %} 这么多硬币加一起组成的，这些硬币加在一起的面值是 27

&ensp;&ensp;其中一定会有一枚**最后取到的硬币**{% mathjax %} a_k {% endmathjax %}

&ensp;&ensp;除去这枚硬币，前面的硬币面值是 {% mathjax %} 27 - a_k {% endmathjax %}

&ensp;&ensp;这其中有两个非常重要的关键点：

![](0001.jpg)

&ensp;&ensp;&ensp;&ensp;a. 不关心前面{% mathjax %} k-1 {% endmathjax %} 枚硬币如何拼出 {% mathjax %} 27 - a_k {% endmathjax %}的面值，可能有 1 种方法，也可能有 100 种，虽然现在不知道{% mathjax %}a_k {% endmathjax %}（最后一枚硬币面值）,{% mathjax %} K {% endmathjax %}(最少使用的硬币数量)，但可以肯定的是我们用了{% mathjax %} k-1 {% endmathjax %}枚硬币，拼出了{% mathjax %} 27 - a_k {% endmathjax %} 的面值。

&ensp;&ensp;&ensp;&ensp;b. 为什么前面一定是{% mathjax %} k-1 {% endmathjax %}枚硬币，而不能更少？ 因为我们假设的是最优策略，如果前面可以用少于{% mathjax %} k-1 {% endmathjax %}枚硬币，组成{% mathjax %} 27 - a_k {% endmathjax %} 的面值，那么加上最后一枚硬币，总硬币的数量还是小于{% mathjax %} K {% endmathjax %},与最初假设的最优策略{% mathjax %} K {% endmathjax %} 枚硬币相违背。换句话说，对于拼出{% mathjax %} 27 - a_k {% endmathjax %}的面值，需要使用 {% mathjax %} k-1 {% endmathjax %} 枚硬币，这仍然是一个最优策略。

&ensp;&ensp;2） 子问题

&ensp;&ensp;通过上面的分析问题变成，拼出{% mathjax %} 27 - a_k {% endmathjax %}的面值，最少需要多少硬币

&ensp;&ensp;原问题是拼出{% mathjax %} 27 {% endmathjax %}的面值，最少需要多少硬币

&ensp;&ensp;可以发现问题本身没有变化，但是规模更小，这就是子问题的意义

&ensp;&ensp;为了简化定义，设定状态 {% mathjax %} f(X)= {% endmathjax %} 最少用多少硬币拼出{% mathjax %}X{% endmathjax %}

> 回顾一下如何抽象出状态的：我们先考虑最后一步，提取出除了最后一步之后的子问题，发现子问题和原问题，都是求最少硬币数量，原问题求的是拼除{% mathjax %} 27 {% endmathjax %}的最少硬币数量，子问题是拼出{% mathjax %} 27 - a_k {% endmathjax %}的最少硬币数量。所以我们用{% mathjax %} f {% endmathjax %} 表示最少硬币数量的结果，用 {% mathjax %} X {% endmathjax %} 表示需要求解的面值。

&ensp;&ensp;到目前为止，我们还是不知道最后那个{% mathjax %} a_k {% endmathjax %}的硬币是多少，但它只可能是 2，5，或者 7，所以：

&ensp;&ensp;如果 {% mathjax %} a_k = 2 {% endmathjax %},则 {% mathjax %} f(27) = f(27-2) + 1 {% endmathjax %} 最后一枚硬币为 2

&ensp;&ensp;如果 {% mathjax %} a_k = 5 {% endmathjax %},则 {% mathjax %} f(27) = f(27-5) + 1 {% endmathjax %} 最后一枚硬币为 5

&ensp;&ensp;如果 {% mathjax %} a_k = 7 {% endmathjax %},则 {% mathjax %} f(27) = f(27-7) + 1 {% endmathjax %} 最后一枚硬币为 7

&ensp;&ensp;所以需要的最少硬币数，就是上面三种情况中的最小值

<center>{% mathjax %} f(27) = min(f(27-2) + 1,f(27-5) + 1,f(27-7) + 1) {% endmathjax %}</center>
&ensp;&ensp;
<center>{% mathjax %} f(X) = min(f(X-a_1) + 1,f(X-a_2) + 1,...,f(X-a_k) + 1) {% endmathjax %}</center>

**递归求解**

通过上面的分析，找到了最小硬币数量的表示方法

从硬币总额的角度思考：

a. 如果求解总额`>=7`,最后一个硬币，可以是 2，5，7

b. 如果求解总额`>=5`,最后一个硬币，可以是 2，5

c. 如果求解总额`>=2`,最后一个硬币，可以是 2

b. 边界情况总额是 0， 结果返回 0，0 元需要 0 枚硬币

```javascript
function fn(x) {
  if (x === 0) return 0;
  var res = Infinity;
  if (x >= 7) {
    res = Math.min(fn(x - 2) + 1, fn(x - 5) + 1, fn(x - 7) + 1);
  } else if (x >= 5) {
    res = Math.min(fn(x - 2) + 1, fn(x - 5) + 1);
  } else if (x >= 2) {
    res = fn(x - 2) + 1;
  }
  return res;
}
```

从最后一枚硬币角度考虑：

```javascript
function fn(x) {
  if (x === 0) return 0;
  var res = Infinity;
  //最后一枚硬币是7
  if (x >= 7) {
    res = Math.min(fn(x - 7) + 1, res);
  }
  if (x >= 5) {
    res = Math.min(fn(x - 5) + 1, res);
  }
  if (x >= 2) {
    res = Math.min(fn(x - 2) + 1, res);
  }
  return res;
}
```

存在的问题：递归做了大量的重复计算，指数级的时间复杂度，所以需要通过将已经计算的结果保存下来，并改变计算顺序，这就是动态规划的状态转移方程

![](0002.jpg)

#### 转移方程

转移方程通常在分析子问题的时候已经分析清楚，对于任意 X

![](0003.jpg)

但是想避免使用递归还需要下面的两个分析过程

#### 初始条件和边界情况

- 如果{% mathjax %}X-2{% endmathjax %},{% mathjax %}X-5{% endmathjax %},{% mathjax %}X-7{% endmathjax %}小于 0 怎么办

- 用正无穷来表示不能拼出某个值 {% mathjax %}f(-1) = +\infty{% endmathjax %}

<center>{% mathjax %} f(1) = min(f(-1) + 1,f(-2) + 1) = +\infty {% endmathjax %}</center>

- 初始条件{% mathjax %} f(0) = 0 {% endmathjax %}，用转移方程算不出来的需要定义，{% mathjax %} f(0) = min(f(-2) + 1,f(-5) + 1,f(-7) + 1)) === +\infty {% endmathjax %},所以需要定义边界情况{% mathjax %} f(0) = 0 {% endmathjax %}。

#### 计算顺序

计算顺序的分析是解决避免递归问题的根本原因。

递归是从大到小计算的在计算 {% mathjax %} f(X) {% endmathjax %} 时，{% mathjax %} f(X-2)，f(X-5)，f(X-7) {% endmathjax %} 都不知道，要只有执行到{% mathjax %} f(0) {% endmathjax %},才能得到第一个计算结果，且直接过程中没有保存执行结果，导致每一个结果都需要重复计算。可以通过缓存计算结果优化递归。

所以我们可以从小到大计算从而避免递归，动态规划计算顺序的核心思路就是**下一次计算时所用的值，在上一步已经计算过且被缓存**

初始条件{% mathjax %} f(0)=0 {% endmathjax %}

依次计算{% mathjax %} f(1)， f(2) ...，f(a_k-7),...,f(a_k-5),...f(a_k-2),f(a_k-1){% endmathjax %}

当计算到{% mathjax %} f(X) {% endmathjax %} 时，{% mathjax %} f(X-2)，f(X-5)，f(X-7) {% endmathjax %} 都已经计算过，且能拿到计算结果。

| F(i)  | 最小硬币数量                                                            |
| ----- | ----------------------------------------------------------------------- |
| F(0)  | 0 //金额为 0 不能由硬币组成                                             |
| F(1)  | 1 //{% mathjax %}F(1)=min(F(1-2),F(1-5),F(1-7))+1=0{% endmathjax %}     |
| F(2)  | 1 //{% mathjax %}F(2)=min(F(2-2),F(2-5),F(2-7))+1=1{% endmathjax %}     |
| F(3)  | 2 //{% mathjax %}F(3)=min(F(3-2),F(3-5),F(3-7))+1=0 {% endmathjax %}    |
| F(4)  | 2 //{% mathjax %}F(4)=min(F(4-2),F(5),F(4-7))+1=2 {% endmathjax %}      |
| ...   | ...                                                                     |
| F(27) | 3 //{% mathjax %}F(27)=min(F(27-2),F(27-5),F(27-7))+1=5{% endmathjax %} |

**动态规划求解**

```javascript
function fn(x) {
  if (x === 0) return 0;
  var stack = [0],
    i = 1;
  for (; i <= x; ++i) {
    stack[i] = Math.min(
      (stack[i - 2] === undefined ? Infinity : stack[i - 2]) + 1,
      (stack[i - 5] === undefined ? Infinity : stack[i - 5]) + 1,
      (stack[i - 7] === undefined ? Infinity : stack[i - 7]) + 1
    );
  }
  if (stack[i - 1] === Infinity) {
    return -1;
  }
  return stack[i - 1];
}
```

```javascript
function fn(x) {
  if (x === 0) return 0;
  var stack = [0],
    i = 1;
  for (; i <= x; ++i) {
    // 如果硬币面额数量不确定，其实就是循环两两比较
    stack[i] = Math.min(
      stack[i - 2] === undefined ? Infinity : stack[i - 2] + 1,
      stack[i] === undefined ? Infinity : stack[i]
    );
    stack[i] = Math.min(
      stack[i - 5] === undefined ? Infinity : stack[i - 5] + 1,
      stack[i] === undefined ? Infinity : stack[i]
    );
    stack[i] = Math.min(
      stack[i - 7] === undefined ? Infinity : stack[i - 7] + 1,
      stack[i] === undefined ? Infinity : stack[i]
    );
  }
  if (stack[i - 1] === Infinity) {
    return -1;
  }
  return stack[i - 1];
}
```

#### 相关题目详解

**最值型动态规划**

[零钱兑换](/posts/8a3cb899)

[乘积最大子数组](posts/a3d8317e)

**求和型动态规划**

[不同路径](/posts/a42081a0)

[n 个骰子的点数](/posts/d6da309c)

**存在型动态规划**

[跳跃游戏](/posts/d94019be/)
