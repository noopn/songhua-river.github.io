---
title: O53.0～n-1中缺失的数字
mathjax: true

date: 2020-11-01 19:38:05
tags:
  - 算法
  - 关联题目
categories:
  - 算法
  - 关联题目
  
---

**[LeetCode](https://leetcode-cn.com/problems/que-shi-de-shu-zi-lcof/)**

> **注意**

  + 清楚题目的意思，有一个数字不在数组中，是返回这个数字的本身，而不是索引。`[0]`长度为1，取值范围是`[0,1]`其中1不在数组中，所以返回1



#### 暴力解法

```javascript
var missingNumber = function(nums) {
    var i=0;
    var len = nums.length;
    for(var i=0;i<len;i++){
        if(nums[i]!==i){
            return i;
        }
    }
    return i;
};
```

**复杂度分析**

+ 时间复杂度：{% mathjax %}O(n){% endmathjax %}

+ 空间复杂度：{% mathjax %}O(1){% endmathjax %}


#### 二分法

```javascript
var missingNumber = function (nums) {
    var left = 0;
    var right = nums.length-1;
    var middle = Math.floor((left + right) / 2)
    while (left <= right) {
        if (nums[middle] === middle) {
            left = middle + 1;
        } else {
            right = middle-1;
        }
        middle = Math.floor((left + right) / 2)
    }
    return left
};
```
**复杂度分析**

+ 时间复杂度：{% mathjax %}O(logn){% endmathjax %}

+ 空间复杂度：{% mathjax %}O(1){% endmathjax %}