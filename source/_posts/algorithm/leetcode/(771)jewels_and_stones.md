---
title: 771.宝石与石头
mathjax: true

date: 2020-10-02 09:12:46
categories:
tags:
---

##### [LeetCode]()

### 暴力解法

暴力法的思路很直观，遍历字符串 SS，对于 SS 中的每个字符，遍历一次字符串 JJ，如果其和 JJ 中的某一个字符相同，则是宝石。

```javascript
var numJewelsInStones = function (J, S) {
    var result = 0,
        i = 0,
        j = 0,
        jlen = J.length,
        slen = S.length;
    for (; i < slen; i++) {
        var s = S[i];
        for (j = 0; j < jlen; j++) {
            if (J[j] === s) {
                result++;
            }
        }
    }
    return result;
};
```

**复杂度分析**

+ 时间复杂度： {% mathjax %}O(mn){% endmathjax %}, {% mathjax %}m{% endmathjax %} 为字符串{% mathjax %}S{% endmathjax %}的长度，{% mathjax %}n{% endmathjax %}为字符串 {% mathjax %}J{% endmathjax %}的长度

+ 空间复杂度： {% mathjax %}O(1){% endmathjax %}

### 使用map结构

遍历字符串 JJ，使用哈希集合存储其中的字符，然后遍历字符串 SS，对于其中的每个字符，如果其在哈希集合中，则是宝石。

```javascript
var numJewelsInStones = function (J, S) {
    var map = {},
        result = 0,
        i = 0,
        j = 0,
        jlen = J.length,
        slen = S.length;
    for (;i<jlen;i++){
        map[J[i]] = J[i];
    }
    for(;j<slen;j++){
        if(S[j]===map[S[j]]){
            result++;
        }
    }
    return result;
};
```

```javascript
var numJewelsInStones = function (J, S) {
    var map = new Map(),
        result = 0,
        i = 0,
        j = 0,
        jlen = J.length,
        slen = S.length;
    for (;i<jlen;i++){
        map.set(J[i],J[i]);
    }
    for(;j<slen;j++){
        if(map.get(S[j])){
            result++;
        }
    }
    return result;
};
```

**复杂度分析**

+ 时间复杂度： {% mathjax %}O(m+n){% endmathjax %}, {% mathjax %}m{% endmathjax %} 为字符串{% mathjax %}S{% endmathjax %}的长度，{% mathjax %}n{% endmathjax %}为字符串 {% mathjax %}J{% endmathjax %}的长度

+ 空间复杂度： {% mathjax %}O(1){% endmathjax %}