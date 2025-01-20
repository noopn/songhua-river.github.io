---
title: O11.旋转数字最小数字
mathjax: true
tags:
  - 算法
  - 关联题目
categories:
  - 算法
  - 关联题目
  

date: 2020-10-15 16:44:53
---

##### [LeetCode](https://leetcode-cn.com/problems/xuan-zhuan-shu-zu-de-zui-xiao-shu-zi-lcof/)

### 二分查找

![](0001.png)

通过上图直观的分析出旋转数字的一些特点

+ 最右边的值只能小于等于最左边的值

+ 如果一个值比最右边的值小，那么最小值一定在这个值左边或是这个值本身

+ 如果最左边的值比其中一个值大，那么最小值一定在这个值右边

```javascript
 var minArray = function (numbers) {
  var left = 0,
      right = numbers.length - 1,
      mid = Math.floor(right / 2);
  while (left < right) {
      if (numbers[mid] < numbers[right]) {
          right = mid;
      } else if (numbers[mid] === numbers[right]) {
          right--;
      } else if (numbers[mid] > numbers[right]) {
          left = mid + 1;
      }
      mid = Math.floor((left + right) / 2)
  }
  return numbers[left];
};
```

+ 什么左边的值比其中一个值大的时候，这个值不能是最小值
  
  因为我们先处理了右半区的比较，会使得最右边值先到达最小值


**复杂度分析**

+ 时间复杂度：

+ 空间复杂度：