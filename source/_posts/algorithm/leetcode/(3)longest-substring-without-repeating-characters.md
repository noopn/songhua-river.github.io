---
title: 3. 无重复字符的最长子串
mathjax: true
tags:
  - 算法
  - 关联题目
categories:
  - 算法
  - 关联题目


date: 2020-11-04 20:56:03
---

**[LeetCode](https://leetcode-cn.com/problems/longest-substring-without-repeating-characters/)**

> **注意**


### 暴力解法

```javascript
var lengthOfLongestSubstring = function (s) {
    if (s.length == 0) return 0;
    var len = 1;
    for (var i = 0; i < s.length; i++) {
        var str = s[i];
        for (var j = i + 1; j < s.length; j++) {
            var nstr = s[j];
            var mark = false;
            for (var k = 0; k < str.length; k++) {
                if (str[k] === nstr) {
                    mark = true;
                    break
                }
            }
            if (mark === false) {
                str += nstr;
                if (str.length > len) len = str.length;
            } else {
                break;
            }

        }
    }
    return len;
};
```


**复杂度分析**

+ 时间复杂度：{% mathjax %}O(n^3){% endmathjax %}

+ 空间复杂度：{% mathjax %}O(1){% endmathjax %}

#### 暴力解法优化

通过map缓存已经查找过的值

```javascript
 */
var lengthOfLongestSubstring = function (s) {
    if (s.length == 0) return 0;
    var len = 1;
    for (var i = 0; i < s.length; i++) {
        var map = {
            length: 1
        };
        map[s[i]] = true;
        for (var j = i + 1; j < s.length; j++) {
            var nstr = s[j];
            if (!map[nstr]) {
                map[nstr] = true;
                map.length++;
                if (map.length > len) len = map.length
            } else {
                break;
            }
        }
    }
    return len;
};
```


**复杂度分析**

+ 时间复杂度：{% mathjax %}O(n^2){% endmathjax %},

+ 空间复杂度：{% mathjax %}O(n){% endmathjax %},时间换空间


#### 窗口移动

+ 如果下一个字符和之前的字符重复，则重复字符之前的字符都被舍弃

+ 每次读取新字符，判断一次当前位置到舍弃位置的长度是否比之前的总长度大

```javascript
var lengthOfLongestSubstring = function (s) {
    if (s == '') return 0;
    if (s == ' ') return 1;
    var map = {
        start: 0,
        end: 0,
        len: 0
    }
    for (var i = 0; i < s.length; i++) {
        if (map[s[i]] !== undefined && map[s[i]] > map.start) {
            map.start = map[s[i]];
        }
        map[s[i]] = i + 1;
        map.end = i + 1;
        map.len = Math.max(map.end - map.start, map.len)
    }
    return map.len;
};
```


**复杂度分析**

+ 时间复杂度：{% mathjax %}O(n){% endmathjax %},

+ 空间复杂度：{% mathjax %}O(n){% endmathjax %},时间换空间


#### 优化窗口移动

```javascript
var lengthOfLongestSubstring = function (s) {
    let map = new Map(),
        //i为上面方法的start指针
        i = 0,
        j = 0,
        max = 0;
    for (j = 0; j < s.length; j++) {
        if (map.has(s[j])) {
            //如果存在，当前这个值对应的索引不能比start指针小
            i = Math.max(map.get(s[j]) + 1, i)
        }
        map.set(s[j], j);
        max = Math.max(max, j - i + 1)
        console.log(map, i, max);

    }
    return max;
};
```