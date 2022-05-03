---
layout: posts
title: React源码分析 ⑦ commit阶段
mathjax: true
date: 2022-04-21 17:26:56
categories:
  - 源码分析
  - React
tags:
  - React
  - 源码分析
---

![](0001.png)

#### 预备工作

flushPassiveEffects 执行所有还没执行的副作用,因为执行的时候还可能产生额外的副作用,所以需要 while 判断. rootWithPendingPassiveEffect 表示是否有副作用标记

```js
do {
  flushPassiveEffects();
} while (rootWithPendingPassiveEffects !== null);

// 第一步执行所有的副作用销毁函数
// 一定要保证在执行副作用函数前,所有的销毁函数已经执行完成,但也有例外的情况
// 例如在兄弟组件中,一个组件的副作用销毁函数,是在兄弟组件的副作用创建函数中定义的
// 并且被添加在Ref 属性上通过引用的方式使用.

var unmountEffects = pendingPassiveHookEffectsUnmount;
for (var i = 0; i < unmountEffects.length; i += 2) {
  var destroy = _effect.destroy;
  destroy();
}

// 执行所有的副作用创建函数
var mountEffects = pendingPassiveHookEffectsMount;

for (var _i = 0; _i < mountEffects.length; _i += 2) {
  var _effect2 = mountEffects[_i];
  var create = effect.create;
  effect.destroy = create();
}

// 在副作用链表上 删除, 用于内存回收
while (effect !== null) {
  var nextNextEffect = effect.nextEffect;
  effect.nextEffect = null;
  effect = nextNextEffect;
}

// 如果与额外的副作产生则重新发起调度
flushSyncCallbackQueue();
```

将 rootFiber 添加到 effect 链表中, completeWork 中构建的 effect 链表只包涵它的子元素, 如果 rootFiber 有副作用需要把他添加到链表的最后. 最终的 effect 链表属于 rootFiber 的父元素

```js
if (finishedWork.flags > PerformedWork) {
  if (finishedWork.lastEffect !== null) {
    finishedWork.lastEffect.nextEffect = finishedWork;
    firstEffect = finishedWork.firstEffect;
  } else {
    firstEffect = finishedWork;
  }
} else {
  firstEffect = finishedWork.firstEffect;
}
```

#### commitBeforeMutationEffects

尽可能早的去调度 mutation effect

```js
while (nextEffect !== null) {
  var current = nextEffect.alternate;

  var flags = nextEffect.flags;

  // getSnapshotBeforeUpdate 将会执行
  if ((flags & Snapshot) !== NoFlags) {
    commitBeforeMutationLifeCycles(current, nextEffect);
  }

  if ((flags & Passive) !== NoFlags) {
    if (!rootDoesHavePassiveEffects) {
      rootDoesHavePassiveEffects = true;
      scheduleCallback(NormalPriority$1, function () {
        flushPassiveEffects();
        return null;
      });
    }
  }

  nextEffect = nextEffect.nextEffect;
}
```

#### commitMutationEffects

[为什么需要解绑 Ref ?](https://reactjs.org/docs/refs-and-the-dom.html#caveats-with-callback-refs)

如果 Ref 被定义为一个函数,在更新阶段会执行两次,第一次为 `null`,第二次会绑定 DOM 元素,这是因为每次渲染都会创建新的函数实例,所以 React 会先删除旧的 Ref 回收内存,再创建一个新的.

```ts
if (flags & Ref) {
  var current = nextEffect.alternate;
  if (current !== null) {
    var currentRef = current.ref;
    if (currentRef !== null) {
      if (typeof currentRef === "function") {
        currentRef(null);
      } else {
        currentRef.current = null;
      }
    }
  }
}
```

不同的 Tag 对应不同的 DOM 操作

```js
var primaryFlags = flags & (Placement | Update | Deletion | Hydrating);

    switch (primaryFlags) {
      case Placement:
        {
          commitPlacement(nextEffect);
          nextEffect.flags &= ~Placement;
          break;
        }

      case PlacementAndUpdate:
        {
          commitPlacement(nextEffect);
          nextEffect.flags &= ~Placement;
          var _current = nextEffect.alternate;
          commitWork(_current, nextEffect);
          break;
        }

      case Hydrating:
        {
          nextEffect.flags &= ~Hydrating;
          break;
        }

      case HydratingAndUpdate:
        {
          nextEffect.flags &= ~Hydrating;

          var _current2 = nextEffect.alternate;
          commitWork(_current2, nextEffect);
          break;
        }

      case Update:
        {
          var _current3 = nextEffect.alternate;
          commitWork(_current3, nextEffect);
          break;
        }

      case Deletion:
        {
          commitDeletion(root, nextEffect);
          break;
        }
    }

    resetCurrentFiber();
    nextEffect = nextEffect.nextEffect;
  }
```

##### commitPlacement 插入

```js
function commitPlacement(finishedWork) {
  // 找到当前插入节点的上级节点
  var parentFiber = getHostParentFiber(finishedWork); // Note: these two variables *must* always be updated together.

  var parent;
  var isContainer;
  var parentStateNode = parentFiber.stateNode;

  // 判断是不是跟节点
  switch (parentFiber.tag) {
    case HostComponent:
      parent = parentStateNode;
      isContainer = false;
      break;

    case HostRoot:
      parent = parentStateNode.containerInfo;
      isContainer = true;
      break;

    case HostPortal:
      parent = parentStateNode.containerInfo;
      isContainer = true;
      break;
  }

  // 如果上级节点标记了清除内容的副作用,则先清空文本
  if (parentFiber.flags & ContentReset) {
    resetTextContent(parent);

    parentFiber.flags &= ~ContentReset;
  }
  // 插入有两种情况,直接插入一个元素中,或插入兄弟节点前面,这里需要获取兄弟节点
  var before = getHostSibling(finishedWork);

  if (isContainer) {
    如果兄弟节点存在;
    /*
    如果兄弟节点存在
    if (container.nodeType === COMMENT_NODE) {
      container.parentNode.insertBefore(child, beforeChild);
    } else {
      container.insertBefore(child, beforeChild);
    }
    
    如果兄弟节点不存在
    if (container.nodeType === COMMENT_NODE) {
      parentNode = container.parentNode;
      parentNode.insertBefore(child, container);
    } else {
      parentNode = container;
      parentNode.appendChild(child);
    }
    */
    insertOrAppendPlacementNodeIntoContainer(finishedWork, before, parent);
  } else {
    insertOrAppendPlacementNode(finishedWork, before, parent);
  }
}
```

##### commitWork 更新

```js
function commitWork(current, finishedWork) {
  switch (finishedWork.tag) {
    case FunctionComponent:
    case ForwardRef:
    case MemoComponent:
    case SimpleMemoComponent:
    case Block: {
      // 有可能兄弟组件间的副作用会相互影响,例如在同一次 commit 阶段中
      // 一个组件的副作用销毁函数,不应该依赖与另一个组件的副作用创建函数,通过ref传递,因为执行时机问题造成不会执行
      {
        commitHookEffectListUnmount(Layout | HasEffect, finishedWork);
      }

      return;
    }

    case ClassComponent: {
      return;
    }

    case HostComponent: {
      var instance = finishedWork.stateNode;

      if (instance != null) {
        // Commit the work prepared earlier.
        var newProps = finishedWork.memoizedProps; // For hydration we reuse the update path but we treat the oldProps
        // as the newProps. The updatePayload will contain the real change in
        // this case.

        var oldProps = current !== null ? current.memoizedProps : newProps;
        var type = finishedWork.type; // TODO: Type the updateQueue to be specific to host components.

        var updatePayload = finishedWork.updateQueue;
        finishedWork.updateQueue = null;

        /*
          最终会调用原生节点上的设置属性
        if (value === null) {
          node.removeAttribute(_attributeName);
        } else {
          node.setAttribute(_attributeName,  '' + value);
        }
        */
        if (updatePayload !== null) {
          commitUpdate(instance, updatePayload, type, oldProps, newProps);
        }
      }

      return;
    }

    case HostText: {
      if (!(finishedWork.stateNode !== null)) {

      var textInstance = finishedWork.stateNode;
      var newText = finishedWork.memoizedProps;

      var oldText = current !== null ? current.memoizedProps : newText;
      commitTextUpdate(textInstance, oldText, newText);
      return;
    }
}
```

##### commitDeletion 删除

虽然只有当前的 Fiber 节点删除,但仍然需要遍历所有的子节点,因为可能子节点会执行 `componentWillUnmount`

```js
while (true) {
  if (node.tag === HostComponent || node.tag === HostText) {
    // 执行 commitUnmount
    // 遍历所有子节点,删除 Ref,或执行 componentWillUnmount
    // HostPortal 需要删除挂载元素
    // 执行 useEffect销毁函数
    commitNestedUnmounts(finishedRoot, node);

    //所有子节点卸载后才能安全的从 DOM 树中删除当前节点
    if (currentParentIsContainer) {
      removeChildFromContainer(currentParent, node.stateNode);
    } else {
      removeChild(currentParent, node.stateNode);
    } // Don't visit children because we already visited them.
  } else if (node.tag === HostPortal) {
    if (node.child !== null) {
      // When we go into a portal, it becomes the parent to remove from.
      // We will reassign it back when we pop the portal on the way up.
      currentParent = node.stateNode.containerInfo;
      currentParentIsContainer = true; // Visit children because portals might contain host components.

      node.child.return = node;
      node = node.child;
      continue;
    }
  } else {
    // Visit children because we may find more host components below.
    commitUnmount(finishedRoot, node);

    if (node.child !== null) {
      node.child.return = node;
      node = node.child;
      continue;
    }
  }

  if (node === current) {
    return;
  }

  while (node.sibling === null) {
    if (node.return === null || node.return === current) {
      return;
    }

    node = node.return;

    if (node.tag === HostPortal) {
      // When we go out of the portal, we need to restore the parent.
      // Since we don't keep a stack of them, we will search for it.
      currentParentIsValid = false;
    }
  }

  node.sibling.return = node.return;
  node = node.sibling;
}
```

#### commitLayoutEffects

执行前会将 current 指向 finishedWork, 在 `componentDidMount/Update.` 执行結束后, work-in-progress tree 已经变为最终的状态了,可以安全的指向 current

```js
root.current = finishedWork;
```

下一个阶段是 layout 节点,会在已经改变的树上读取 effect 执行,这也是为什么此时能获取到 DOM 的最新状态

```js
{
  switch (finishedWork.tag) {
    case FunctionComponent:
    case ForwardRef:
    case SimpleMemoComponent:
    case Block: {
      // 同步执行 layoutEffect
      {
        commitHookEffectListMount(Layout | HasEffect, finishedWork);
      }
      // 将 mutation effects 创建函数和销毁函数添加到队列中,并执行调度
      schedulePassiveEffects(finishedWork);
      return;
    }

    case ClassComponent:
      {
        var instance = finishedWork.stateNode;

        if (finishedWork.flags & Update) {
          if (current === null) {
            // current 不存在表示首次挂载
            instance.componentDidMount();
          } else {
            var prevProps =
              finishedWork.elementType === finishedWork.type
                ? current.memoizedProps
                : resolveDefaultProps(finishedWork.type, current.memoizedProps);
            var prevState = current.memoizedState; // We could update instance props and state here,
            // but instead we rely on them being set during last render.
            // TODO: revisit this when we implement resuming.

            // 组件更新
            instance.componentDidUpdate(
              prevProps,
              prevState,
              instance.__reactInternalSnapshotBeforeUpdate
            );
          }
        }
        commitUpdateQueue(finishedWork, updateQueue, instance);
      }

      return;
  }

  // 重新绑定 Ref
  if (flags & Ref) {
    var ref = finishedWork.ref;

    if (ref !== null) {
      var instance = finishedWork.stateNode;
      var instanceToUse;

      switch (finishedWork.tag) {
        case HostComponent:
          instanceToUse = getPublicInstance(instance);
          break;

        default:
          instanceToUse = instance;
      } // Moved outside to ensure DCE works with this flag

      if (typeof ref === "function") {
        ref(instanceToUse);
      } else {
        ref.current = instanceToUse;
      }
    }
  }
}
```

#### requestPaint

在上面三个阶段执行結束后,会执行请求绘制的方法, 通过 Scheduler 模块调度, 这也是 `useLayoutEffect` 会在 DOM 绘制前执行的原因

```js
requestPaint();

var rootDidHavePassiveEffects = rootDoesHavePassiveEffects;

if (rootDoesHavePassiveEffects) {
  // 在所有阶段执行结束后 root 节点上还有副作用, 先保存一个引用,在 layout 结束后再去调度
  rootDoesHavePassiveEffects = false;
  rootWithPendingPassiveEffects = root;
  pendingPassiveEffectsLanes = lanes;
  pendingPassiveEffectsRenderPriority = renderPriorityLevel;
} else {
  // We are done with the effect chain at this point so let's clear the
  // nextEffect pointers to assist with GC. If we have passive effects, we'll
  // clear this in flushPassiveEffects.
  nextEffect = firstEffect;

  while (nextEffect !== null) {
    var nextNextEffect = nextEffect.nextEffect;
    nextEffect.nextEffect = null;

    if (nextEffect.flags & Deletion) {
      detachFiberAfterEffects(nextEffect);
    }

    nextEffect = nextNextEffect;
  }
} // Read this again, since an effect might have updated it
```
