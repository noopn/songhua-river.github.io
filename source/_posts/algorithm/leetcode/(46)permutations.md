---
title: 46.全排列
mathjax: true
tags:
  - 算法
  - 关联题目
categories:
  - 算法
  - 关联题目


date: 2020-10-15 13:38:05
---

##### [LeetCode](https://leetcode-cn.com/problems/permutations/)

### 回溯法

![](0001.png)

![](0002.png)

```javascript
function permute(nums) {
  const res = [];
  const  set = new Set();
  function dfs(set){
      if(set.size===nums.length){
          res.push([...set]);
      }
      for(let k of nums){
          if(set.has(k)){
              continue;
          }
          set.add(k);
          dfs(set);
          set.delete(k)
      }
  }
  dfs(set);
  return res;
};
```

### 位置交换

回溯法在进入下一次递归时，并没有标注循环位置，所以`nums`中的元素每一个都要通过`Set`集合判断一次

如果不使用`Set`数据结构，时间复杂度更高

位置交换，是通过在一次循环把第一个元素更换为其他剩余元素，在第一个元素固定下来后，后面的元素进行全排列

```javascript
function swap(arr, a, b) {
    const temp = arr[a];
    arr[a] = arr[b];
    arr[b] = temp;
}
function permute(nums) {
    const res = [];
    function dfs(n) {
        if (n === nums.length - 1) {
            res.push([...nums]);
        }
        for (let i = n; i < nums.length; i++) {
            swap(nums, i, n)
            dfs(n + 1);
            swap(nums, i, n)
        }
    }
    dfs(0);
    return res;
};
```
### 位置交换稍微调整

发现在最后只有一个元素的时候，还是进行了递归

所以提前判断剩余数组是否满足递归条件，如果只剩下一个元素就结束递归

使用一下es6数组元素交换的方法

```javascript
function permute(nums) {
  const res = [];
  function dfs(n) {
      for (let i = n; i < nums.length; i++) {
          [nums[i], nums[n]] = [nums[n], nums[i]];
          if (n + 1 > nums.length - 1) {
              res.push([...nums]);
              continue;
          }
          dfs(n + 1);
          [nums[i], nums[n]] = [nums[n], nums[i]];
      }
  }
  dfs(0);
  return res;
};
```


**复杂度分析**

+ 时间复杂度：{% mathjax %}O(n!){% endmathjax %}

+ 空间复杂度：{% mathjax %}O(n){% endmathjax %}