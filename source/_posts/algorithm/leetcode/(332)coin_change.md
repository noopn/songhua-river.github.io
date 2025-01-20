---
title: 332.零钱兑换
mathjax: true
tags:
  - 算法
  - 关联题目
  - 动态规划
categories:
  - 算法
  - 关联题目


date: 2020-10-02 21:36:06
---

##### [LeetCode](https://leetcode-cn.com/problems/coin-change/)

##### [动态规划详解](/posts/68932b1a/)

### 动态规划

**注意**

+ 边界情况`amount===0`时返回0，0元需要0枚硬币

+ `stack[i - coins[j]]` `stack[i]` 需要判断为`undefined`的情况，因为JavaScript中`Math.min(undefined)===NaN`需要特殊处理，用`Infinity`占位，在使用`Math.min(1,Infinity)` 可以取得最小值

+ 返回时需要判断不能匹配的情况，如果当前位置为`Infinity`表示不能匹配

```javascript
var coinChange = function (coins, amount) {
    // 边界情况
    if (amount === 0) return 0;
    // 初始化
    var stack = [0],
        n = coins.length,
        i, j, a, b;
    for (i = 1; i <= amount; i++) {
        //f[i] = min{f(i-coins[0]),f(i-coins[1]),...,f(i-coins[j])}
        for (j = 0; j < n; j++) {
            a = stack[i - coins[j]] === undefined ? Infinity : stack[i - coins[j]];
            b = stack[i] === undefined ? Infinity : stack[i];
            stack[i] = Math.min(a, b)
        }
    }
    if (stack[i - 1] === Infinity) {
        return -1;
    }
    return stack[i - 1]
};
```

另一种优雅的边界处理方式

+ 默认`stack[i] = Infinity` 避免了上面判断 `stack[i] === undefined`的情况

+ `i >= coins[j]` 时才会比较，如果硬币的面额比需要凑出的总金额还要大，显然不需要比较，从而避免上面`stack[i - coins[j]] === undefined`的情况

+ `stack[i - coins[j]] !== Infinity` 表示如果上一步的结果是`Infinity`,也就是上一步没有办法凑出指定面额，那下一步也凑不出指定面额，在Javascript中虽然可以不写这一步，只会增加依次赋值操作，但在其他语言中如 C++,如果不加判断`Integer.MAX_VALUE+1`可能会溢出

```javascript
function coinChange(coins, amount) {
    if (amount === 0) return 0;
    var stack = [0],
        n = coins.length,
        i, j;
    for (i = 1; i <= amount; ++i) {
        stack[i] = Infinity;
        for (j = 0; j < n; j++) {
            if (i >= coins[j] && stack[i - coins[j]] !== Infinity) {
                stack[i] = Math.min(stack[i - coins[j]] + 1, stack[i])
            }
        }
    }
    if (stack[i - 1] === Infinity) {
        return -1;
    }
    return stack[i - 1];
}
```
**复杂度分析**

+ 时间复杂度：{% mathjax %}O(Sn){% endmathjax %}，其中 {% mathjax %}S{% endmathjax %} 是金额，{% mathjax %}n{% endmathjax %} 是面额数。我们一共需要计算 {% mathjax %}O(S){% endmathjax %} 个状态，{% mathjax %}S{% endmathjax %} 为题目所给的总金额。对于每个状态，每次需要枚举 n{% mathjax %}n{% endmathjax %}个面额来转移状态，所以一共需要 {% mathjax %}O(Sn){% endmathjax %} 的时间复杂度。

+ 空间复杂度：{% mathjax %}O(S){% endmathjax %} 数组长度等于金额的大小
