---
title: 152.乘积最大子数组
mathjax: true
tags:
  - 算法
  - 关联题目
  - 动态规划
categories:
  - 算法
  - 关联题目


date: 2020-10-14 13:04:27
---

##### [LeetCode](https://leetcode-cn.com/problems/maximum-product-subarray/)

### 动态规划

#### 确定状态

**最后一步**

只考虑最后一步，为  {% mathjax %} Max * nums[n] {% endmathjax %} ，{% mathjax %} nums[n] {% endmathjax %}很好理解，就是最后一个元素，{% mathjax %} Max {% endmathjax %}稍稍复杂一点

因为本题不是求和，较小的值在下一次计算后（加上一个数或减去一个数）仍然是较小的值，但是乘法收到正负符号的影响，一个负数乘以另一个负数，可以是一个正数，所以这个{% mathjax %} Max {% endmathjax %} 应该考虑正负的情况

**子问题**

由上面的分析，原问题为数组 {% mathjax %} num[0],num[1],...,num[n] {% endmathjax %}子数组城际的最大值，除去最后一步之后子问题为 {% mathjax %} num[0],num[1],...,num[n-1] {% endmathjax %} 子数组的乘积最大值

所以用 {% mathjax %} f[j] {% endmathjax %} 来表示子数组乘积最大值

#### 转移方程

根据确定状态的分析 {% mathjax %} f[j] = Max * num[n] {% endmathjax %}，{% mathjax %} Max {% endmathjax %} 为上一步的最大值，考虑到正负符号的影响，应该同时保存最大值和最小值，因为最小值乘以 {% mathjax %} nums[n] {% endmathjax %} 可能变为最大值

{% mathjax %} f[j] = [ min(f[j-1][0]*nums[j],f[j-1][1]*nums[j],nums[j]),max(f[j-1][0]*nums[j],f[j-1][1]*nums[j],nums[j])]{% endmathjax %}

#### 初始条件和边界情况

初始化 {% mathjax %} f[0] = f[[num[0],[num[0]]] {% endmathjax %}

{% mathjax %} res = [num[0] {% endmathjax %} 用于记录最大值

#### 计算顺序

{% mathjax %} f[1]，f[2]，...,f[n] {% endmathjax %}

```javascript
 var maxProduct = function (nums) {
    var n = nums.length,
        // 初始化第一个
        // 考虑到f[1]依赖f[0]的结果至少要初始化一组数据
        f = [
            [nums[0], nums[0]]
        ],
        i = 1,
        res = nums[0];
    for (; i < n; i++) {
        if (f[i - 1][0] == 0) {
            f[i] = [nums[i], nums[i]]
        } else {
            var min = Math.min(f[i - 1][0] * nums[i], f[i - 1][1] * nums[i], nums[i]);
            var max = Math.max(f[i - 1][0] * nums[i], f[i - 1][1] * nums[i], nums[i]);
            f[i] = [min, max];
        }
        if (f[i][1] > res) res = f[i][1];
    }
    return res
};
```

#### 优化

+ 删除无用的代码

```javascript
if (f[i - 1][0] == 0) {
    f[i] = [nums[i], nums[i]]
}
```

最初考虑到`num[i+1]===0`的情况，会将`f[i+1]`最小值，最大值都变为0，会使后面的循环计算都为0，但无需有这种担心，因为`Math.min(f[i - 1][0] * nums[i], f[i - 1][1] * nums[i], nums[i]);` 最大值最小值的计算都有`nums[i]`的比较，并不会使后面的运算一直为0

这里还需要考虑为什么需要用`nums[i]`，对于数组`[-2,-3,0,2-2]`

| 循环   | 值                                                                  |
|--------|---------------------------------------------------------------------|
| 初始化 | f[0] = [-2,-2]，最大值最小值都为第一个数                            |
| 1      | f[1] = [6,-3]，有最小值并不是乘积得出的情况，而是元素本身就是最小值 |
| 2      | f[2] = [0,0]，遇到零的情况 |
| 3      | f[3] = [2,0]，最大值为元素本身，并不是乘积 |
| 4      | f[4] = [0,-4] |

```javascript
var maxProduct = function (nums) {
    var n = nums.length,
        f = [
            [nums[0], nums[0]]
        ],
        i = 1,
        res = nums[0];
    for (; i < n; i++) {
            var min = Math.min(f[i - 1][0] * nums[i], f[i - 1][1] * nums[i], nums[i]);
            var max = Math.max(f[i - 1][0] * nums[i], f[i - 1][1] * nums[i], nums[i]);
            f[i] = [min, max];
        if (f[i][1] > res) res = f[i][1];
    }
    return res
};
```

+ 优化数储存，可以发现我们每次存下来的最大值最小值，只会用在下一次的计算中，所以并不需要额外的空间把每一个结果保存下来，只需要三个变量

|变量|作用|
|---|---|
|max|临时储存上一次的最大值|
|min|临时储存上一次的最小值|
|res|保存最终结果的最大值|

```javascript
var maxProduct = function (nums) {
    var n = nums.length,
        max = nums[0],
        min = nums[0],
        i = 1,
        res = nums[0];
    for (; i < n; i++) {
        var _min = Math.min(min * nums[i], max * nums[i], nums[i]);
        var _max = Math.max(min * nums[i], max * nums[i], nums[i]);
        // 防止相互影响
        min = _min;
        max = _max;
        if (max > res) res = max;
    }
    return res
};
```
+ 通过判断是否负数，交换两个元素

  初始化时`min=1`,`max=1`,巧妙的从下表为0的位置遍历

```javascript
var maxProduct = function (nums) {
    var n = nums.length,
        max = 1,
        min = 1,
        res=-Infinity;
    for (var i=0; i < n; i++) {
        if(nums[i]< 0){
            var temp = max;
            max = min;
            min = temp;
        }
        var min = Math.min(min* nums[i], nums[i]);
        var max = Math.max(max*nums[i], nums[i]);
        if (max > res) res = max;
    }
    return res
};
```

**复杂度分析**

+ 时间复杂度：程序一次循环遍历了 {% mathjax %} nums {% endmathjax %}，故渐进时间复杂度为 {% mathjax %} O(n) {% endmathjax %}。

+ 空间复杂度：优化后只使用常数个临时变量作为辅助空间，与 {% mathjax %} n {% endmathjax %} 无关，故渐进空间复杂度为  {% mathjax %} O(1) {% endmathjax %}