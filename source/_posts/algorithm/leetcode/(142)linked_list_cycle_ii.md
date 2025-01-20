---
title: 142.形链表2
mathjax: true
tags:
  - 算法
  - 关联题目
categories:
  - 算法
  - 关联题目


date: 2020-10-10 14:50:49
---

##### [LeetCode](https://leetcode-cn.com/problems/linked-list-cycle-ii/)

### 暴力解法 哈希表

保存每一个节点判断

```javascript
var detectCycle = function(head) {
   var map = new Map();
   var cur = head;
    while(cur!==null){
        if(map.get(cur)===cur){
            return cur;
        }
        map.set(cur,cur);
        cur = cur.next;
    }
    return null;
};
```

**复杂度分析**

+ 时间复杂度： {% mathjax %}O(N){% endmathjax %}

+ 空间复杂度： {% mathjax %}O(N){% endmathjax %}

### 双指针

快慢指针同时移动，第一次相遇后，定义新指针为头节点，新指针和慢指针同时移动，再次相遇时的节点为入环节点

通过数学演变来确认双指针的正确性,如下图

![](0001.png)

+ 设慢指针的移动速度为{% mathjax %}v{% endmathjax %}，快指针的移动速度为{% mathjax %}2v{% endmathjax %},用 {% mathjax %}t{% endmathjax %}来表示走过的步数

+ 那么慢指针走到相遇点的时候走过{% mathjax %}vt = a+b{% endmathjax %},快指针走过了{% mathjax %}2vt = a+b+b+c{% endmathjax %}

+ 可以得到 {% mathjax %}2vt = 2(a+b) = a+b+b+c => a = c{% endmathjax %}

+ 所以从相遇点到入环点的步数和从头节点到入环的步数是相同的
 
```javascript
var detectCycle = function(head) {
    var fast = head;
    var slow = head;
    var res = head;
    while(fast!==null && fast.next!==null){
        fast = fast.next.next;
        slow = slow.next;
        if(slow===fast){
            while(res!==fast){
                res = res.next;
                fast = fast.next;
            }
            return res;
        }
    }
    return null;
};
```

**复杂度分析**

+ 时间复杂度： {% mathjax %}O(N){% endmathjax %}

+ 空间复杂度： {% mathjax %}O(1){% endmathjax %}
