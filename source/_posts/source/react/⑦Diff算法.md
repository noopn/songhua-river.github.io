---
layout: posts
title: React源码分析 ⑦ Diff 算法
date: 2022-03-28 15:40:23
categories:
  - 源码分析
  - React
tags:
  - React
  - 源码分析
---

#### 设计动机

调用 React 的 render() 方法，会创建一棵由 React 元素组成的树。在下一次 state 或 props 更新时，相同的 render() 方法会返回一棵不同的树。React 需要基于这两棵树之间的差别来判断如何高效的更新 UI，以保证当前 UI 与最新的树保持同步。

将一棵树转换成另一棵树的最小操作次数,即使使用最优的算法，该算法的复杂程度仍为 {% mathjax %} O(n^3) {% endmathjax %}，其中 n 是树中元素的数量。

如果在 React 中使用该算法，那么展示 1000 个元素则需要 10 亿次的比较。这个开销实在是太过高昂。于是 React 在以下两个假设的基础之上提出了一套 {% mathjax %} O(n) {% endmathjax %} 的启发式算法：

- 两个不同类型的元素会产生出不同的树；
- 开发者可以通过设置 key 属性，来告知渲染哪些子元素在不同的渲染下可以保存不变；

换一种说法就是 :

- 只对同级比较，跨层级的 dom 不会进行复用
- 不同类型节点生成的 dom 树不同，此时会直接销毁老节点及子孙节点，并新建节点
- 可以通过 key 来对元素 diff 的过程提供复用的条件

#### 单节点 Diff

- key 和 type 相同表示可以复用节点
- type 不同直接标记删除节点，然后新建节点
- key 相同 type 不同，标记删除该节点和兄弟节点，然后新创建节点

```jsx
// eg1
const A = <span key="a">0</span>;
const B = <span kay="a">1</span>;

// eg2
const A = <span key="a">0</span>;
const B = <span kay="b">1</span>;
```

还记得 [reconcileChildren](/posts/7db523698f9f/#reconcileChildren) 方法么, 它是双缓存 Fiber 构建时候调用的方法,因为**新的节点是单节点**,所以会进入 `reconcileSingleElement`

```js
//                              div Fiber    span 0 Fiber      span 1 JSXElement
function reconcileSingleElement(
  returnFiber,
  currentFirstChild,
  element,
  lanes
) {
  var key = element.key;
  var child = currentFirstChild;

  while (child !== null) {
    // TODO: If key === null and child.key === null, then this only applies to the first item in the list.

    if (child.key === key) {
      switch (child.tag) {
        case Fragment: {
          if (element.type === REACT_FRAGMENT_TYPE) {
            deleteRemainingChildren(returnFiber, child.sibling);
            var existing = useFiber(child, element.props.children);
            existing.return = returnFiber;
            return existing;
          }

          break;
        }

        case Block:

        default: // key 相同 type 相同 eg1
        {
          if (
            child.elementType === element.type ||
            // Keep this check inline so it only runs on the false path:
            isCompatibleFamilyForHotReloading(child, element)
          ) {
            // 因为新的节点是单节点,所以新的fiber节点不会再有兄弟节点
            // 在重用之前兄弟节点标记为删除
            deleteRemainingChildren(returnFiber, child.sibling);
            // 通过 createWorkInProgress clone节点
            // _existing3.sibling = null 因为上面的删除只是标记,而在链表中需要真正删除sibling属性
            // 官方注释为: 在这里把 sibling 赋值为 null, 因为返回节点前很容易忘记赋值
            var _existing3 = useFiber(child, element.props);

            // ref 属性相关操作,重新为ref节点赋值
            _existing3.ref = coerceRef(returnFiber, child, element);
            _existing3.return = returnFiber;

            // 返回 clone 的节点
            return _existing3;
          }

          break;
        }
      } // Didn't match.

      // key 相同 type 不同,节点本身和兄弟节点全部标记为删除, eg3
      // ke 相同表示两个节点是对应的,所以兄弟节点无效标记为删除
      // 但是type类型不同所以不能复用所以节点本身也需要标记为删除
      deleteRemainingChildren(returnFiber, child);
      break;
    } else {
      // 如果 key 不相同,直接将这个节点删掉 eg2
      deleteChild(returnFiber, child);
    }
    // 看兄弟节点是否可以通过 key 相同复用,例如
    // current [a, p, span]
    // new     p
    // 兄弟节点中有一个 p 节点可以复用
    child = child.sibling;
  }

  // 如果没有节点可以复用, 就通过 JSXElement 创建一个新的 Fiber 节点
  if (element.type === REACT_FRAGMENT_TYPE) {
    var created = createFiberFromFragment(
      element.props.children,
      returnFiber.mode,
      lanes,
      element.key
    );
    created.return = returnFiber;
    return created;
  } else {
    var _created4 = createFiberFromElement(element, returnFiber.mode, lanes);

    _created4.ref = coerceRef(returnFiber, currentFirstChild, element);
    _created4.return = returnFiber;
    return _created4;
  }
}
```

#### 多节点 diff

react 用 3 次循环实现了 react diff 算法, 下面是整个方法中的全局变量

```js
// Diff结果的第一个节点
var resultingFirstChild = null;
// 新的子元素数组的集合
var knownKeys = new Set();
// 上次可复用的位置
var lastPlacedIndex = 0;
// 当前对比的老的元素
var oldFiber = currentFirstChild;
// 保存老的节点中下一个需要对比的元素
var nextOldFiber = null;
// 计数器,记录新元素遍历到的位置
var newIdx = 0;
```

**第一次循环**

- 用 `newChildren[newIdx]` 与 `oldFiber` 比较
  - 如果新元素是 reactElement
    - key 相同,type 相同, 则会使用 useFiber 复用节点
    - key 相同,type 不同, 通过 JSXElement 创建新的节点
    - key 不同, 直接跳出循环,可能存在移动,用下一个循环处理
  - 如果新元素是文本元素
    - 由于文本元素没有 key,所以老的节点如果有 key,那么元素类型一定不同,直接跳出循环,等待下一个循环处理
    - 如果老的节点没有 key, 是否 `tag=HostText`,如果是则 useFiber 复用节点,如果不是 createFiberFromText 创建节点
  - 如果新元素是数组
    - 老元素没有 key, 直接跳出循环
    - 老元素有 key 且 `oldFiber.tag===Fragment`, 通过 createFiberFromFragment 创建新的子元素
    - 老元素有 key 且 `oldFiber.tag!==Fragment`, useFiber 复用节点

在复用或创建节点的同时也会传入新的 props 属性, 新的属性在 <a href="/posts/3aa5257401aa/#diffProperties">diffProperties</a> 的时候会被解析,并添加到 updateQueue 中

如果不需要跳出循环, 通过 `newFiber.alternate === null` 判断返回的节点是复用的还是新建的,因为新建的节点没有 `alternate`,如果是新建的节点, oldFiber 的服级节点上删除 oldFiber, 因为已经有了新节点,且老的节点也没有被使用

下一步是给新的 Fiber 添加位置信息,调用 placeChild 方法, `newFiber.index = newIndex`, 并给 lastPlacedIndex 赋值
如果是新建的节点,会被标记为插入, lastPlacedIndex 不变,因为这个位置不能复用,如果是复用节点的 `index < lastPlacedIndex`,说明节点被移动了会打上移动的标记, 如果 `index >= lastPlacedIndex` 节点位置不需要移动, 因为所有小于这个节点位置的元素都会被移动到后面.

总结: 第一个循环主要处理属性的更新, key 不同则循环结束

**第二次循环**

如果 `oldFiber` 已经遍历到头, `newChildren` 还有剩余, 则会进入第二个循环, 将 `newChildren` 剩余的子元素,全部新建,并且标记为插入

**第三次循环**

如果第一次循环提前跳出, `oldFiber`, `newChildren` 都有剩余则会进入第三次循环

首先把 `oldFiber` 转换成 map 格式,方便用 key 迅速查找对应的节点,如果新元素的 key 在 map 中存在则复用节点,如果不存在则新建节点

调用第一次循环中的 placeChild , 为元素排序

![](0001.png)

```js
function reconcileChildrenArray(
  returnFiber,
  currentFirstChild,
  newChildren,
  lanes
) {
  {
    // First, validate keys.
    var knownKeys = null;

    for (var i = 0; i < newChildren.length; i++) {
      var child = newChildren[i];
      knownKeys = warnOnInvalidKey(child, knownKeys, returnFiber);
    }
  }

  var resultingFirstChild = null;
  var previousNewFiber = null;
  var oldFiber = currentFirstChild;
  var lastPlacedIndex = 0;
  var newIdx = 0;
  var nextOldFiber = null;

  for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
    if (oldFiber.index > newIdx) {
      nextOldFiber = oldFiber;
      oldFiber = null;
    } else {
      nextOldFiber = oldFiber.sibling;
    }

    var newFiber = updateSlot(
      returnFiber,
      oldFiber,
      newChildren[newIdx],
      lanes
    );

    if (newFiber === null) {
      // TODO: This breaks on empty slots like null children. That's
      // unfortunate because it triggers the slow path all the time. We need
      // a better way to communicate whether this was a miss or null,
      // boolean, undefined, etc.
      if (oldFiber === null) {
        oldFiber = nextOldFiber;
      }

      break;
    }

    if (shouldTrackSideEffects) {
      if (oldFiber && newFiber.alternate === null) {
        // We matched the slot, but we didn't reuse the existing fiber, so we
        // need to delete the existing child.
        deleteChild(returnFiber, oldFiber);
      }
    }

    lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);

    if (previousNewFiber === null) {
      // TODO: Move out of the loop. This only happens for the first run.
      resultingFirstChild = newFiber;
    } else {
      // TODO: Defer siblings if we're not at the right index for this slot.
      // I.e. if we had null values before, then we want to defer this
      // for each null value. However, we also don't want to call updateSlot
      // with the previous one.
      previousNewFiber.sibling = newFiber;
    }

    previousNewFiber = newFiber;
    oldFiber = nextOldFiber;
  }

  if (newIdx === newChildren.length) {
    // We've reached the end of the new children. We can delete the rest.
    deleteRemainingChildren(returnFiber, oldFiber);
    return resultingFirstChild;
  }

  if (oldFiber === null) {
    // If we don't have any more existing children we can choose a fast path
    // since the rest will all be insertions.
    for (; newIdx < newChildren.length; newIdx++) {
      var _newFiber = createChild(returnFiber, newChildren[newIdx], lanes);

      if (_newFiber === null) {
        continue;
      }

      lastPlacedIndex = placeChild(_newFiber, lastPlacedIndex, newIdx);

      if (previousNewFiber === null) {
        // TODO: Move out of the loop. This only happens for the first run.
        resultingFirstChild = _newFiber;
      } else {
        previousNewFiber.sibling = _newFiber;
      }

      previousNewFiber = _newFiber;
    }

    return resultingFirstChild;
  } // Add all children to a key map for quick lookups.

  var existingChildren = mapRemainingChildren(returnFiber, oldFiber); // Keep scanning and use the map to restore deleted items as moves.

  for (; newIdx < newChildren.length; newIdx++) {
    var _newFiber2 = updateFromMap(
      existingChildren,
      returnFiber,
      newIdx,
      newChildren[newIdx],
      lanes
    );

    if (_newFiber2 !== null) {
      if (shouldTrackSideEffects) {
        if (_newFiber2.alternate !== null) {
          // The new fiber is a work in progress, but if there exists a
          // current, that means that we reused the fiber. We need to delete
          // it from the child list so that we don't add it to the deletion
          // list.
          existingChildren.delete(
            _newFiber2.key === null ? newIdx : _newFiber2.key
          );
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

  return resultingFirstChild;
}
```

#### 属性 Diff

```js
function diffProperties(
  domElement,
  tag,
  lastRawProps,
  nextRawProps,
  rootContainerElement
) {
  // lastRawProps {children:'内容'}
  // nextRawProps {children:'内容改变'}

  var updatePayload = null;
  var lastProps;
  var nextProps;

  // 这些元素类型,会被添加上特有的元素默认属性
  switch (tag) {
    case "input":
      lastProps = getHostProps(domElement, lastRawProps);
      nextProps = getHostProps(domElement, nextRawProps);
      updatePayload = [];
      break;

    case "option":
      lastProps = getHostProps$1(domElement, lastRawProps);
      nextProps = getHostProps$1(domElement, nextRawProps);
      updatePayload = [];
      break;

    case "select":
      lastProps = getHostProps$2(domElement, lastRawProps);
      nextProps = getHostProps$2(domElement, nextRawProps);
      updatePayload = [];
      break;

    case "textarea":
      lastProps = getHostProps$3(domElement, lastRawProps);
      nextProps = getHostProps$3(domElement, nextRawProps);
      updatePayload = [];
      break;

    default:
      lastProps = lastRawProps;
      nextProps = nextRawProps;

      if (
        typeof lastProps.onClick !== "function" &&
        typeof nextProps.onClick === "function"
      ) {
        // TODO: This cast may not be sound for SVG, MathML or custom elements.
        trapClickOnNonInteractiveElement(domElement);
      }

      break;
  }

  // 验证一些特殊属性,是否合法 例如 dangerouslySetInnerHTML
  assertValidProps(tag, nextProps);
  var propKey;
  var styleName;
  var styleUpdates = null;

  for (propKey in lastProps) {
    // 如果旧的属性没有,而新的属性有,那个就跳出直接分析新的属性
    if (
      nextProps.hasOwnProperty(propKey) ||
      !lastProps.hasOwnProperty(propKey) ||
      lastProps[propKey] == null
    ) {
      continue;
    }

    if (propKey === STYLE) {
      var lastStyle = lastProps[propKey];
      // 如果是style属性,提取出属性的key
      for (styleName in lastStyle) {
        if (lastStyle.hasOwnProperty(styleName)) {
          if (!styleUpdates) {
            styleUpdates = {};
          }

          styleUpdates[styleName] = "";
        }
      }
    } else if (propKey === DANGEROUSLY_SET_INNER_HTML || propKey === CHILDREN);
    else if (
      propKey === SUPPRESS_CONTENT_EDITABLE_WARNING ||
      propKey === SUPPRESS_HYDRATION_WARNING
    );
    else if (propKey === AUTOFOCUS);
    else if (registrationNameDependencies.hasOwnProperty(propKey)) {
      // This is a special case. If any listener updates we need to ensure
      // that the "current" fiber pointer gets updated so we need a commit
      // to update this element.
      if (!updatePayload) {
        updatePayload = [];
      }
    } else {
      // For all other deleted properties we add it to the queue. We use
      // the allowed property list in the commit phase instead.
      (updatePayload = updatePayload || []).push(propKey, null);
    }
  }

  for (propKey in nextProps) {
    var nextProp = nextProps[propKey];
    var lastProp = lastProps != null ? lastProps[propKey] : undefined;

    // 如果新的属性值为假,或者没有变化,就跳出循环
    if (
      !nextProps.hasOwnProperty(propKey) ||
      nextProp === lastProp ||
      (nextProp == null && lastProp == null)
    ) {
      continue;
    }

    if (propKey === STYLE) {
      {
        if (nextProp) {
          // Freeze the next style object so that we can assume it won't be
          // mutated. We have already warned for this in the past.
          Object.freeze(nextProp);
        }
      }

      if (lastProp) {
        // Unset styles on `lastProp` but not on `nextProp`.
        for (styleName in lastProp) {
          if (
            lastProp.hasOwnProperty(styleName) &&
            (!nextProp || !nextProp.hasOwnProperty(styleName))
          ) {
            if (!styleUpdates) {
              styleUpdates = {};
            }

            styleUpdates[styleName] = "";
          }
        } // Update styles that changed since `lastProp`.

        for (styleName in nextProp) {
          if (
            nextProp.hasOwnProperty(styleName) &&
            lastProp[styleName] !== nextProp[styleName]
          ) {
            if (!styleUpdates) {
              styleUpdates = {};
            }

            styleUpdates[styleName] = nextProp[styleName];
          }
        }
      } else {
        // Relies on `updateStylesByID` not mutating `styleUpdates`.
        if (!styleUpdates) {
          if (!updatePayload) {
            updatePayload = [];
          }

          updatePayload.push(propKey, styleUpdates);
        }

        styleUpdates = nextProp;
      }
    } else if (propKey === DANGEROUSLY_SET_INNER_HTML) {
      var nextHtml = nextProp ? nextProp[HTML$1] : undefined;
      var lastHtml = lastProp ? lastProp[HTML$1] : undefined;

      if (nextHtml != null) {
        if (lastHtml !== nextHtml) {
          (updatePayload = updatePayload || []).push(propKey, nextHtml);
        }
      }
    }
    //  会以数组的形式,同时插入 key 和 value ['children','内容改变']
    else if (propKey === CHILDREN) {
      if (typeof nextProp === "string" || typeof nextProp === "number") {
        (updatePayload = updatePayload || []).push(propKey, "" + nextProp);
      }
    } else if (
      propKey === SUPPRESS_CONTENT_EDITABLE_WARNING ||
      propKey === SUPPRESS_HYDRATION_WARNING
    );
    else if (registrationNameDependencies.hasOwnProperty(propKey)) {
      if (nextProp != null) {
        // We eagerly listen to this even though we haven't committed yet.
        if (typeof nextProp !== "function") {
          warnForInvalidEventListener(propKey, nextProp);
        }

        if (propKey === "onScroll") {
          listenToNonDelegatedEvent("scroll", domElement);
        }
      }

      if (!updatePayload && lastProp !== nextProp) {
        // This is a special case. If any listener updates we need to ensure
        // that the "current" props pointer gets updated so we need a commit
        // to update this element.
        updatePayload = [];
      }
    } else if (
      typeof nextProp === "object" &&
      nextProp !== null &&
      nextProp.$$typeof === REACT_OPAQUE_ID_TYPE
    ) {
      // If we encounter useOpaqueReference's opaque object, this means we are hydrating.
      // In this case, call the opaque object's toString function which generates a new client
      // ID so client and server IDs match and throws to rerender.
      nextProp.toString();
    } else {
      // For any other property we always add it to the queue and then we
      // filter it out using the allowed property list during the commit.
      (updatePayload = updatePayload || []).push(propKey, nextProp);
    }
  }

  if (styleUpdates) {
    {
      validateShorthandPropertyCollisionInDev(styleUpdates, nextProps[STYLE]);
    }

    (updatePayload = updatePayload || []).push(STYLE, styleUpdates);
  }

  return updatePayload;
}
```
