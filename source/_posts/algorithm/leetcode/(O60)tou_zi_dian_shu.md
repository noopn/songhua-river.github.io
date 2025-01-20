---
title: O60.n个骰子的点数
mathjax: true
tags:
  - 算法
  - 关联题目
categories:
  - 算法
  - 关联题目
  

date: 2020-10-19 10:38:02
---

**[LeetCode](https://leetcode-cn.com/problems/nge-tou-zi-de-dian-shu-lcof/)**

> **注意**： 请仔细理解骰子点数，和点数和的概念。骰子点数表示当前第 n 个骰子的点数，为 1 到 6 之间的一个数。 点数和表示投出的 n 个骰子的点数之和。

#### 暴力解法

只有一个骰子的情况，循环每一个点数，存到数组中

数组的位置即数组的索引表示的是**点数和**，只有一个骰子的时候**点数和**为骰子点数本身,每种点数和出现的次数为1

```javascript
var arr = [];
for (var i = 1; i <= 6; i++) {
    arr[i] = 1;
}
```

当有两个骰子的时候，点数和最大为 12，即两个骰子都取最大点数 6 的时候

统计每种点数和出现的次数，需要两个嵌套循环，表示在两个骰子中各取一个点数加和

如果数组索引等于点数和的位置为 `undefined`,表示还没有这种点数和的情况，那就把当前位置赋值为1，表示这种点数和出现的次数为1

如果已经存在，就在原有的值上加1，表示又找到一种点数和相同的情况

```javascript
var arr = [];
for (var i = 1; i <= 6; i++) {
    for (var j = 1; j <= 6; j++) {
        var sum = i + j;
        if (arr[sum] === undefined) arr[sum] = 0;
        arr[sum] += 1;
    }
}
```

对于n个骰子，我们需要n层嵌套的循环，所以使用递归来实现不定层数的嵌套循环

```javascript
var arr = [];
var n = 2;

function recursion(loop, sum) {
  if (loop <= n) {
    for (var i = 1; i <= 6; i++) {
      recursion(loop + 1, sum + i);
      if (loop !== n) continue;
      if (arr[sum + i] === undefined) arr[sum + i] = 0;
      arr[sum + i]++;
    }
  }
}
recursion(1, 0)
```

需要注意的是如果当前层数不是第n层是不需要向数组中添加个数的

也就是递归到最底层，之后才开始计算各点数和

注意不能使用 `return` 而需要使用 `continue` 因为`return`使得函数直接退出，`for` 循环不能全部执行

下面的写法也可以写成

```javascript
var arr = [];
var n = 2;

function recursion(loop, sum) {
    if (loop > n) {
        if (arr[sum] === undefined) arr[sum] = 0;
        arr[sum]++;
        return arr;
    }
    for (var i = 1; i <= 6; i++) {
        recursion(loop + 1, sum + i);
    }
}
recursion(1, 0)
```

最后只要计算数组中的每个值，即点数和对应的次数在总次数中的占比就可以了

因为{% mathjax %}n{% endmathjax %}次嵌套，所以 总次数为 {% mathjax %}6^n{% endmathjax %}

```javascript
function twoSum(n) {
    var arr = [];
    var mount = Math.pow(6, n)

    function recursion(loop, sum) {
        if (loop > n) {
            if (arr[sum] === undefined) arr[sum] = 0;
            arr[sum]++;
            return arr;
        }
        for (var i = 1; i <= 6; i++) {
            recursion(loop + 1, sum + i);
        }
    }
    recursion(1, 0);
    var res = [];
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] !== undefined) {
            res.push(Number((arr[i] / mount).toFixed(5)))
        }
    }
    return res;
}
```

**复杂度分析**

+ 时间复杂度：{% mathjax %}O(6^n){% endmathjax %},指数时间复杂度而且容易超时。

+ 空间复杂度：{% mathjax %}O(6n)=>O(n){% endmathjax %} 点数和共有 {% mathjax %}6n{% endmathjax %} 种

#### 动态规划

```javascript
function twoSum(n) {
    var arr = [];
    var mount = Math.pow(6, n)

    function recursion(loop, sum) {
        if (loop > n) {
            if (arr[sum] === undefined) arr[sum] = 0;
            arr[sum]++;
            return arr;
        }
        for (var i = 1; i <= 6; i++) {
            recursion(loop + 1, sum + i);
        }
    }
    recursion(1, 0);
    var res = [];
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] !== undefined) {
            res.push(Number((arr[i] / mount).toFixed(5)))
        }
    }
    return res;
}
```

```javascript
function twoSum(n) {
    var sum = Math.pow(6, n);
    var f = [];
    f.push([], new Array(6 + 1).fill(1, 1));
    for (var i = 2; i <= n; i++) {
        if (f[i] === undefined) f[i] = [];
        for (var j = i; j <= 6 * i; j++) {
            if (f[i][j] === undefined) f[i][j] = 0
            for (var k = 1; k <= 6; k++) {
                f[i][j] += f[i - 1][j - k] || 0
            }
        }
    }
    var res = []
    var arr = f[n];
    var len = f[n].length
    for (var i = 0; i < len; i++) {
        if (arr[i] == undefined) continue;
        res.push(Number((arr[i] / sum).toFixed(5)));
    }
    return res;
}
```

