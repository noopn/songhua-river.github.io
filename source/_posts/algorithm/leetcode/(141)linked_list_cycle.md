---
title: 141.环形链表
mathjax: true
tags:
  - 算法
  - 关联题目
categories:
  - 算法
  - 关联题目
  

date: 2020-10-09 09:31:00
---

##### [LeetCode](https://leetcode-cn.com/problems/linked-list-cycle/)


### 暴力解法 哈希表

把每一个遇到的节点都保存下来

+ 如果当前节点为`null`表示没有环，返回`false`

+ 如果在map中当前节点存在则表示有环，否则存下当前节点

```javascript
var hasCycle = function (head) {
    var map = new Map();
    while(head!==null){
        if(map.get(head)===head){
            return true;
        }
        map.set(head,head);
        head = head.next;
    }
    return false;
};
```

**复杂度分析**

+ 时间复杂度：{% mathjax %}O(N){% endmathjax %}，其中 {% mathjax %}N{% endmathjax %} 是链表中的节点数。最坏情况下我们需要遍历每个节点一次。

+ 空间复杂度：{% mathjax %}O(N){% endmathjax %}，其中 {% mathjax %}N{% endmathjax %} 是链表中的节点数。主要为哈希表的开销，最坏情况下我们需要将每个节点插入到哈希表中一次。


### 快慢指针

「Floyd 判圈算法」(又称龟兔赛跑算法)。

```javascript
var hasCycle = function (head) {
    var fast = head;
    var slow = head;
    while (fast !== null && fast.next !== null) {
        fast = fast.next.next;
        slow = slow.next;
        if (fast === slow) return true;
    }
    return false;
};
```

```javascript
var hasCycle = function (head) {
    if (head===null || head.next===null) return false;
    var fast = head.next;
    var slow = head;
    while (fast!==slow) {
        if (fast===null || fast.next===null) return false;
        fast = fast.next.next;
        slow = slow.next;
    }
    return true;
};
```

**复杂度分析**

+ 时间复杂度：{% mathjax %}O(N){% endmathjax %},当链表中不存在环时，快指针将先于慢指针到达链表尾部，链表中每个节点至多被访问两次。当链表中存在环时，每一轮移动后，快慢指针的距离将减小一。而初始距离为环的长度，因此至多移动 {% mathjax %}N{% endmathjax %} 轮。

+ 空间复杂度：{% mathjax %}O(1){% endmathjax %}，我们只使用了两个指针的额外空间。