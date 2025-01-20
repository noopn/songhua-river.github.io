---
title: kmp算法
mathjax: true

date: 2021-08-15 18:41:59
tags:
  - 算法
  - kmp算法
categories:
  - 算法
  - 常见算法与数学
---

字符串匹配是计算机的基本任务之一。Knuth-Morris-Pratt算法（简称KMP）是最常用的之一。它以三个发明者命名，起头的那个K就是著名科学家Donald Knuth。

#### 匹配逻辑

![](0001.png)

kmp 算法的关键点在于，当匹配串（pattern）下一个字符不再匹配的时候，不会盲目的移动到原串的下一位继续从头判断，而是利用已知信息跳到一个合理的位置继续匹配。

#### 已知信息，前缀/后缀

首先，要了解两个概念："前缀"和"后缀"。 "前缀"指除了最后一个字符以外，一个字符串的全部头部组合；"后缀"指除了第一个字符以外，一个字符串的全部尾部组合。

以"ABCDABD"为例：

"A"的前缀和后缀都为空集，共有元素的长度为0；

"AB"的前缀为[A]，后缀为[B]，共有元素的长度为0；

"ABC"的前缀为[A, AB]，后缀为[BC, C]，共有元素的长度0；

"ABCD"的前缀为[A, AB, ABC]，后缀为[BCD, CD, D]，共有元素的长度为0；

"ABCDA"的前缀为[A, AB, ABC, ABCD]，后缀为[BCDA, CDA, DA, A]，共有元素为"A"，长度为1；

"ABCDAB"的前缀为[A, AB, ABC, ABCD, ABCDA]，后缀为[BCDAB, CDAB, DAB, AB, B]，共有元素为"AB"，长度为2；

"ABCDABD"的前缀为[A, AB, ABC, ABCD, ABCDA, ABCDAB]，后缀为[BCDABD, CDABD, DABD, ABD, BD, D]，共有元素的长度为0。

另一个重要的信息是，**对于匹配串的任意一个位置而言，由该位置发起的下一个匹配点位置其实与原串无关。** 

**AB**CD**AB**D 匹配串中的两个AB分别为匹配串的前缀和后缀，当最后一个D没有匹配的时候，他会跳转到第三个字符C的位置尝试匹配，因为他们有相同的前缀，因此合理跳转匹配额位置的本质就是找到上一个前缀和后缀的位置

因为匹配点与源串无关，所以可以预先准备出一个部分匹配表

#### 部分匹配表

首先需要两个指针来记录匹配位置

用一个next数组来保存部分匹配值

由于第一个匹配字符一定从索引`0`开始，所以吧比配置初始化为0，那么`i`为前一个字符，`j`为后一字符

```javascript
let i = 0, j = 1;

const next = [0]

for(;j < pattern.length;j++){

}

```


一但，下一个字符`pattern[j]`与上一个字符`pattern[i]`不在匹配，需要在之前遍历过的字符中查找与当前`pattern[j]`相同的字符

可以看做是，匹配串中一对相同的前缀和后缀,如果没有则继续向前查找，直到`i`指针回到初始位置

```javascript
while(i>0 &&　pattern[i]！==pattern[j]) {
  i = next[i-1]
}
```

有疑问的点可能在于，为什么不是依次判断之前每一个值，而是直接调到了匹配值的位置

`i`为`0`的意义是从`0`索引到`i`索引的这个字符串，找不到一对相同的前缀和后缀，因此下个位置必然没有可复用的子串，只需要跳到开头位置重新匹配。

如果`pattern[j]`与`pattern[i]`匹配，那么两个指针同时向后面移动，并记录新的位置

所以完整的代码为

```javascript
let i=0;j=1;
const next = [0];
for(;j < pattern.length;j++){
  while(i>0 &&　pattern[i]！==pattern[j]) {
    i = next[i-1]
  }
  if(pattern[i]===pattern[j]) i++
  next[j]=i;
}
```
#### 匹配实现

在拿到了部分匹配表之后，可以通过一个循环依次向后匹配

`m`为原字符串指针，`n`为匹配串指针

如果两个字符匹配，两个指针都向后移动一位

```javascript
let m=0;
let n=0;

for(;m<sourceString.length;m++){
  if (sourceString[m] === pattern[n]) n++
}

```

如果不同则需要利用匹配表移动到最近的可复用的匹配位置，如图一中的事例

当 `abeabf`中的`f`与原串不在匹配，通过匹配表`next[n-1]`查找之前的子串中是否有可复用的位置，如果复用位置不匹配，则继续回溯之前的位置

```javascript
while(n>0 && sourceString[m] === pattern[n]) n = next[n-1]
```

如果`n` 指针与匹配串长度相同，表示已经匹配成功则返回

完整的代码为

```javascript
let m = 0;
let n = 0;
for(;m<sourceString.length;m++) {
  while (n > 0 && sourceString[m] !== pattern[n]) {
    n = next[n - 1];
  }
  if (sourceString[m] === pattern[n]) n++
  if (n === pattern.length) return m - n + 1;
}
return -1;
```

#### kmp 

leetcode [28.实现 strStr()](https://leetcode-cn.com/problems/implement-strstr/)

```javascript
const kmp = (haystack, needle) => {
  if (needle.length == 0) return 0;
  const next = [0];
  for (let i = 0, j = 1; j < needle.length; j++) {
    while (i && needle[j] !== needle[i]) {
      i = next[i - 1];
    }
    if (needle[j] === needle[i]) i++;
    next[j] = i;
  }
  let m = 0;
  let n = 0;
  for(;m<sourceString.length;m++) {
    while (n > 0 && haystack[m] !== needle[n]) {
      n = next[n - 1];
    }
    if (haystack[m] === needle[n]) n++
    if (n === needle.length) return m - n + 1;
  }
  return -1;
}
```