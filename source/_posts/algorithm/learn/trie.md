---
title: 字典树
mathjax: true

date: 2020-10-13 14:54:38
tags:
  - 算法
  - 字典树
categories:
  - 算法
  - 常见算法与数学
---

#### 树的种类

二叉树，索引树，红黑树，btree,B+tree,字典树，哈夫曼

#### 结构特点

+ 一定会有一个根节点`root`

+ 每一个元素都被称为`node`

+ 除了`root`节点，其余的节点都会被分成n个互不相交的集合

+ 最末尾的节点，叫做叶子节点，其他节点叫子节点

+ 深度：从根节点到叶子节点的最多的个数

+ 度： 和深度的概念不同，分为出度（有多少个节点指向其他节点），和入度（有多少节点指向自己）

#### 字典树

Trie Tree 又称为单词查找树，哈希树的变种，常用于统计，查找搜索引擎中用于分词，词频统计（DF/IDF）,自动补全等机制。

查找效率高：其核心思想是利用公共前缀来减少查询时间。

对于英文可以按常规字典树进行处理，因为英文只有二十六个字母，最多有26层

但是对于中文不能直接使用，因为不同的文字过多，同一层级的分支过多

#### 字典树的实现

```javascript
class Trie {
    constructor() {
        // 根节点
        this.root = Object.create(null);
        // 叶子节点标识
        this.end = Symbol('end');
    }

    //创建一颗树的方法
    insert(str) {
        let root = this.root;
        for (let s of str) {

            if (root[s] === undefined) {
                root[s] = Object.create(null);
            }
            root = root[s];
        }
        root[this.end] = true;
    }
    //查找是否存在某个单词
    find(str) {
        let root = this.root;
        for (let s of str) {
            if (root[s] === undefined) {
                return false;
            }
            root = root[s];
        }
        // 可以查到字符串中的每个字符，且最后一个字母是一个结束符
        return !!root[this.end]
    }
}
```

对于如何可以查找出现次数最多的单词，只需要为节点增加更多的信息

把上面基础示例中的结束标识符，修改一下，把值改为单词的出现次数，通过递归找到出现次数最多的单词

```javascript
class Trie {
    constructor() {
        // 根节点
        this.root = Object.create(null);
        // 叶子节点标识
        this.$ = Symbol('$');
    }

    //创建一颗树的方法
    insert(str) {
        let root = this.root;
        for (let s of str) {

            if (root[s] === undefined) {
                root[s] = Object.create(null);
            }
            root = root[s];
        }
        if (!root[this.$]) root[this.$] = 0;
        root[this.$]++

    }
    findMost() {
        let root = this.root;
        //用于记录出现次数最多的单词
        let mostWord = [];
        let max = 0;

        const find = (word, root) => {
            if (root[this.$] && root[this.$] == max) {
                mostWord.push(word);
            }
            if (root[this.$] && root[this.$] > max) {
                max = root[this.$];
                mostWord = [word];
            }
            for (let s in root) {
                find(word + s, root[s]);
            }
        }
        find('', root);

        return {
            max,
            mostWord
        }
    }
}
```

通过字典树做自动提示

如果其中一个节点没有匹配到，返回null

如果最后一个节点之后还有子树，递归子树找出所有匹配字符串

```javascript
class Trie {
    constructor() {
        // 根节点
        this.root = Object.create(null);
        // 叶子节点标识
        this.$ = Symbol('$');
    }

    //创建一颗树的方法
    insert(str) {
        let root = this.root;
        for (let s of str) {

            if (root[s] === undefined) {
                root[s] = Object.create(null);
            }
            root = root[s];
        }
        // 不需要关心是否有多个
        root[this.$] = true;
    }
    auto(str) {
        const autonode = [];
        let root = this.root;

        if (!str) return autonode;
        for (let s of str) {
            console.log(s);
            if (root[s] === undefined) {
                return autonode;
            }
            root = root[s];
        }
        const each = (word, root) => {
            if (root[this.$]) autonode.push(word)
            for (let s in root) {
                each(word + s, root[s]);
            }
        }
        each(str + '', root)
        return autonode;
    }
}
```
