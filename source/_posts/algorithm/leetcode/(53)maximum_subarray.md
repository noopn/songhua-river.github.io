---
title: 53.最大子序和
mathjax: true
tags:
  - 算法
  - 关联题目
  - 动态规划
categories:
  - 算法
  - 关联题目
  

date: 2020-09-24 11:20:56
---

##### [LeetCode](https://leetcode-cn.com/problems/maximum-subarray/)

### 暴力解法 窗口移动

+ 指定窗口大小，初始窗口大小为1。
+ 向右移动窗口并计算窗口内的元素和，直到窗口移动到数组尾部结束。
+ 在移动的过程中，比较窗口内的和是否比上一次大，如果比上一次大记录最大值。
+ 扩大窗口大小，并重复上面过程，直到窗口大小与数组大小相同，并返回最大值。

![](0001.png)

```javascript
var maxSubArray = function (nums) {
    var sum;
    for (var i = 0; i < nums.length; i++) {
        for (var j = 0; j + i < nums.length; j++) {
            var temp = 0;
            for (var k = 0; k < i + 1; k++) {
                temp += nums[j + k];
            }
            if (sum === undefined) sum = temp
            if (temp > sum) sum = temp;
        }
    }
    return sum;
};

```

**复杂度分析**

+ 时间复杂度：{% mathjax %}O(n^3){% endmathjax %},时间复杂度较高，数据量大的时候可能通不过测试。

+ 空间复杂度：{% mathjax %}O(1){% endmathjax %}


### 暴力解法优化

+ 不需要确认窗口大小，只需要每次遍历到数组结尾即可
+ 也可以理解为线改变窗口大小遍历，下一次移动启示位置之后重新遍历窗口大小

![](0002.png)

```javascript
var maxSubArray = function (nums) {
  var sum;
  for (var i = 0; i < nums.length; i++) {
      var temp = 0;
      for (var j = i; j < nums.length; j++) {
          temp += nums[j];
          if (temp > sum || sum === undefined) sum = temp;
      }
  }
  return sum;
};

```

**复杂度分析**

+ 时间复杂度：{% mathjax %}O(n^2){% endmathjax %}

+ 空间复杂度：{% mathjax %}O(1){% endmathjax %}


### 动态规划

我们用 {% mathjax %}a_i{% endmathjax %}代表 nums[i]，用 {% mathjax %}f(i){% endmathjax %} 代表以第 {% mathjax %}i{% endmathjax %} 个数结尾的「连续子数组的最大和」，那么很显然我们要求的答案就是：
<center>{% mathjax %} \max_{0 \leq i \leq n - 1} \lbrace f(i) \rbrace{% endmathjax %}</center>

因此我们只需要求出每个位置的 {% mathjax %}f(i){% endmathjax %}，然后返回 {% mathjax %}f{% endmathjax %} 数组中的最大值即可。那么我们如何求 {% mathjax %}f(1){% endmathjax %} 呢？我们可以考虑 {% mathjax %}a_i{% endmathjax %}单独成为一段还是加入{% mathjax %}f(i - 1){% endmathjax %}  对应的那一段，这取决于 {% mathjax %}a_i{% endmathjax %}和{% mathjax %}f(i - 1) + a_i{% endmathjax %}的大小，我们希望获得一个比较大的，于是可以写出这样的动态规划转移方程：
<center>{% mathjax %} f(i) = \max \{ f(i - 1) + a_i, a_i \} {% endmathjax %}</center>

关键在于{% mathjax %}f(i){% endmathjax %} 子数组最大值的求法，为什么两两比较的最大值是最终最大字串的值？
+ 首先需要舍弃索引的概念，并不需要通过索引区间记录哪个区间字串的和最大
+ 每一次的结果是基于上一次的最大值比较的,从长度等于1开始，所以取{% mathjax %}a_i{% endmathjax %}和{% mathjax %}f(i - 1) + a_i{% endmathjax %}中最大的就是子数组中的最大的原因就在于此，因为上一次的结果就是最优解（最大值），所以本次只需要比较一次就可以了
+ 最后每次更新保存最终最大值的变量就可以了

```javascript
var maxSubArray = function (nums) {
    var sum_endof_here = nums[0];
    var sum_far_from = nums[0];
    for (var i = 1; i < nums.length; i++) {
        // 只有在当前值大于之前的和时，之前的值才会被丢弃，
        // 否则前面的值无论怎样波动增大或减小，但此时此刻加上当前值，就是当前子数组的最大值
        sum_endof_here = Math.max(nums[i], nums[i] + sum_endof_here);
        sum_far_from = Math.max(sum_far_from, sum_endof_here);
    }
    return sum_far_from;
};
```

```javascript
var maxSubArray = function (nums) {
    var sum_endof_here = 0;
    var sum_far_from = nums[0];
    for (var i = 0; i < nums.length; i++) {
        // 等同于 if(sum_endof_here>0){}
       if(sum_endof_here+ nums[i]>nums[i]){
        sum_endof_here = sum_endof_here+ nums[i]
       }else{
        sum_endof_here = nums[i];
       }
       sum_far_from = Math.max(sum_far_from,sum_endof_here)
    }
    return sum_far_from;
};
```

+ 时间复杂度：{% mathjax %}O(n){% endmathjax %} 只需要遍历一次数组就可以得到结果。

+ 空间复杂度：{% mathjax %}O(1){% endmathjax %}


### 分治