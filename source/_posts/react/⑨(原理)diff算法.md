---
title: React原理 diff算法
mathjax: true
categories:
  - React
tags:
  - React

date: 2021-10-02 23:13:09
---


#### 随机树差异 

查找两个随机树之间的最小差异是一个O(n^3)问题。

如你所想，这么高复杂度的算法是无法满足我们的需求的。React使用了一种更为简单且直观的算法使得算法复杂度优化至O(n)。

React只会逐层对比两颗随机树。这大大降低了diff算法的复杂度。并且在web组件中很少会将节点移动到不同的层级，经常只会在同一层级中移动。

![](0001.png)

#### diff 策略

+ Web UI 中 DOM 节点跨层级的移动操作特别少，可以忽略不计。

+ 拥有相同类的两个组件将会生成相似的树形结构，拥有不同类的两个组件将会生成不同的树形结构。

+ 对于同一层级的一组子节点，它们可以通过唯一 id 进行区分。

#### tree diff

基于策略一，React 对树的算法进行了简洁明了的优化，即对树进行分层比较，两棵树只会对同一层次的节点进行比较。

既然 DOM 节点跨层级的移动操作少到可以忽略不计，针对这一现象，React 通过 updateDepth 对 Virtual DOM 树进行层级控制，只会对相同颜色方框内的 DOM 节点进行比较，即同一个父节点下的所有子节点。当发现节点已经不存在，则该节点及其子节点会被完全删除掉，不会用于进一步的比较。这样只需要对树进行一次遍历，便能完成整个 DOM 树的比较。


如下图，A 节点（包括其子节点）整个被移动到 D 节点下，由于 React 只会简单的考虑同层级节点的位置变换，而对于不同层级的节点，只有创建和删除操作。当根节点发现子节点中 A 消失了，就会直接销毁 A；当 D 发现多了一个子节点 A，则会创建新的 A（包括子节点）作为其子节点。此时，React diff 的执行情况：create A -> create B -> create C -> delete A。

![](0002.png)

由此可发现，当出现节点跨层级移动时，并不会出现想象中的移动操作，而是以 A 为根节点的树被整个重新创建，这是一种影响 React 性能的操作，因此 React 官方建议不要进行 DOM 节点跨层级的操作。


#### component diff

+ React 是基于组件构建应用的，对于组件间的比较所采取的策略也是简洁高效。

+ 如果是同一类型的组件，按照原策略继续比较 virtual DOM tree。

+ 如果不是，则将该组件判断为 dirty component，从而替换整个组件下的所有子节点。

+ 对于同一类型的组件，有可能其 Virtual DOM 没有任何变化，如果能够确切的知道这点那可以节省大量的 diff 运算时间，因此 React 允许用户通过 shouldComponentUpdate() 来判断该组件是否需要进行 diff。


如下图，当 component D 改变为 component G 时，即使这两个 component 结构相似，一旦 React 判断 D 和 G 是不同类型的组件，就不会比较二者的结构，而是直接删除 component D，重新创建 component G 以及其子节点。虽然当两个 component 是不同类型但结构相似时，React diff 会影响性能，但正如 React 官方博客所言：不同类型的 component 是很少存在相似 DOM tree 的机会，因此这种极端因素很难在实现开发过程中造成重大影响的。

![](0003.png)


#### diff过程

+ 判断新的子元素中是否有重复的key，如果有则抛出警告。方法是通过创建一个Set对象，判断key时候已经存在。

```javascript
for (var i = 0; i < newChildren.length; i++) {
    var child = newChildren[i];
    knownKeys = warnOnInvalidKey(child, knownKeys, returnFiber);
}
```

+ 利用循环新的子元素数组，遍历老的子元素Fiber
然后通过调用 updateSlot ，updateSlot 内部会判断当前的 tag 和 key 是否匹配，如果匹配复用老 fiber 形成新的 fiber ，如果不匹配，返回 null ，此时 newFiber 等于 null 。跳出循环。
如果是处于更新流程，找到与新节点对应的老 fiber ，但是不能复用 alternate === null ，那么会删除老 fiber 。

```javascript
 for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {  
    if (oldFiber.index > newIdx) {
        nextOldFiber = oldFiber;
        oldFiber = null;
    } else {
        nextOldFiber = oldFiber.sibling;
    }
    const newFiber = updateSlot(returnFiber,oldFiber,newChildren[newIdx],expirationTime,);
    if (newFiber === null) { break }
    // ..一些其他逻辑
    }  
    if (shouldTrackSideEffects) {  // shouldTrackSideEffects 为更新流程。
        if (oldFiber && newFiber.alternate === null) { 
            /* 找到了与新节点对应的fiber，但是不能复用，那么直接删除老节点 */
            deleteChild(returnFiber, oldFiber);
        }
    }
}
```

+ 当第一步结束完 newIdx === newChildren.length 此时证明所有 newChild 已经全部被遍历完，那么剩下没有遍历 oldFiber 也就没有用了，那么调用 deleteRemainingChildren 统一删除剩余 oldFiber 。

```javascript
if (newIdx === newChildren.length) {
  // We've reached the end of the new children. We can delete the rest.
  deleteRemainingChildren(returnFiber, oldFiber);
  return resultingFirstChild;
}
```

+ 当经历过第一步，oldFiber 为 null ， 证明 oldFiber 复用完毕，那么如果还有新的 children ，说明都是新的元素，只需要调用 createChild 创建新的 fiber 。

```javascript
if(oldFiber === null){
   for (; newIdx < newChildren.length; newIdx++) {
       const newFiber = createChild(returnFiber,newChildren[newIdx],expirationTime,)
       // ...
   }
}
```

+ 针对移动元素的场景

mapRemainingChildren 返回一个 map ，map 里存放剩余的老的 fiber 和对应的 key (或 index )的映射关系。

接下来遍历剩下没有处理的 Children ，通过 updateFromMap ，判断 mapRemainingChildren 中有没有可以复用 oldFiber ，如果有，那么复用，如果没有，新创建一个 newFiber 。

复用的 oldFiber 会从 mapRemainingChildren 删掉。

```javascript
const existingChildren = mapRemainingChildren(returnFiber, oldFiber);
if (_newFiber2 !== null) {
    if (shouldTrackSideEffects) {
        if (_newFiber2.alternate !== null) {
        // The new fiber is a work in progress, but if there exists a
        // current, that means that we reused the fiber. We need to delete
        // it from the child list so that we don't add it to the deletion
        // list.
        existingChildren.delete(_newFiber2.key === null ? newIdx : _newFiber2.key);
        }
    }

    lastPlacedIndex = placeChild(_newFiber2, lastPlacedIndex, newIdx);

    if (previousNewFiber === null) {
        resultingFirstChild = _newFiber2;
    } else {
        previousNewFiber.sibling = _newFiber2;
    }

    previousNewFiber = _newFiber2;
    }
}

if (shouldTrackSideEffects) {
    // Any existing children that weren't consumed above were deleted. We need
    // to add them to the deletion list.
    existingChildren.forEach(function (child) {
    return deleteChild(returnFiber, child);
    });
}
```

**位置交换** `lastPlacedIndex`初始化为0，如果一个新元素的索引大于`lastPlacedIndex`表示他从后面一动到前面，那么位置保持不变，如果新元素的索引小于`lastPlacedIndex`表示需要移动到后面，会被打上移动的flag,最后通过`previousNewFiber`(他保存着上一次的最后节点)和`sibling`将Fiber链表链接

```javascript
function placeChild(newFiber, lastPlacedIndex, newIndex) {
    newFiber.index = newIndex;

    if (!shouldTrackSideEffects) {
      // Noop.
      return lastPlacedIndex;
    }

    var current = newFiber.alternate;

    if (current !== null) {
      var oldIndex = current.index;

      if (oldIndex < lastPlacedIndex) {
        // This is a move.
        newFiber.flags = Placement;
        return lastPlacedIndex;
      } else {
        // This item can stay in place.
        return oldIndex;
      }
    } else {
      // This is an insertion.
      newFiber.flags = Placement;
      return lastPlacedIndex;
    }
  }
}
```