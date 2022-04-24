---
layout: posts
title: React源码分析 ③ render阶段执行流程
date: 2022-03-17 15:21:34
categories:
  - 源码分析
  - React
tags:
  - React
  - 源码分析
---

![](0001.png)

#### render

传入 JSXElement 对象和挂载节点.

何验证根节点是否合法,挂载节点为真,且必须是以下节点之一

```js
function isValidContainer(node) {
  return !!(
    node &&
    (node.nodeType === ELEMENT_NODE 
    ||node.nodeType === DOCUMENT_NODE
    ||node.nodeType === DOCUMENT_FRAGMENT_NODE
    ||(node.nodeType === COMMENT_NODE 
      &&node.nodeValue === " react-mount-point-unstable "
    ))
  );
}
```

挂载节点必须是首次挂载,已经挂载过的节点不能再次执行 `React.render(element,container)`,首次挂载之后会给元素打上一个标记 `__reactContainer$xxx` 是一个自定义字符串后面是随机数, 用这个标记来判断元素是否挂载过

而且 `internalContainerInstanceKey = FiberRoot` 会被赋值为 FiberRoot

#### legacyRenderSubtreeIntoContainer(null, element, container, false, callback)

首先尝试清空挂载节点中的内容,如果挂载节点中有其他的节点已经通过render渲染过,会提示错误

```js
while (rootSibling = container.lastChild) {
  container.removeChild(rootSibling);
}
```

这里创建出 `FiberFoot`和`RootFiber`两个节点, 并且通过指针相互引用

![](0002.png)

`container._reactRootContainer = new ReactDOMBlockingRoot()` 挂载元素上会打上一个标记, 赋值为 RootFiber 构造函数的实例,而 render 方法 `_reactRootContainer` 中与`__reactContainer$xxx` 共同判断节点是否挂载过

对于已经渲染过的节点会通过 `_reactRootContainer` 直接复用 `FiberRoot`, 并执行 `updateContainer` 批量更新, 如果是首次渲染则执行 `unbatchedUpdates`非批量更新,立即调用 `updateContainer`,同步执行尽快展示元素.


#### updateContainer(element, container, parentComponent, callback)

在首次执行前会标记上下文环境,因为也可能是程序运行之后,人为调用非批量更新,所以这个方法可能重复执行

```js
// 保存之前的上下文
var prevExecutionContext = executionContext;
// 删除掉批量更新的标记
executionContext &= ~BatchedContext;
// 添加非批量更新的标记
executionContext |= LegacyUnbatchedContext;
```

下面这里定义了几个比较关键的变量

`requestUpdateLane` 传入了 FiberRoot, <span id="requestUpdateLane">计算出更新优先级为 1 (SyncLane)</span>

```js
// 计算一个时间戳
var eventTime = requestEventTime();

// 计算更新优先级
var lane = requestUpdateLane(container.current);

// 创建更新对象并添加到更新队列中
var update = {
  eventTime: eventTime,
  lane: lane,
  tag: UpdateState,
  // element 是 render 方法中传入的 JSXElement 对象
  payload: {element:element},
  callback: null,
  next: null
};

// updateQueue 是一个对象

var updateQueue = {
  baseState:null
  effects:null
  firstBaseUpdate:null
  lastBaseUpdate:null
  shared:{pending: null}
}

// 如果这是第一个更新,会被处理成循环链表
if (updateQueue.pending === null) {
  update.next = update;
} else {
// 如果有了正在等待的更新,则链接到循环链表中
  update.next = pending.next;
  pending.next = update;
}
updateQueue.share.pending = update;
```

#### scheduleUpdateOnFiber(fiber, lane, eventTime)

`checkForNestedUpdates()` 检查是否嵌套的更新过多

拿到上 RootFiber [计算出的更新优先级](/posts/d9523506ae81/#requestUpdateLane), 与 `fiber` 上的优先级合并,如果当前节点不是根节点会一直递归到根节点. 首次执行时 fiber = FiberRoot

```js
var root = markUpdateLaneFromFiberToRoot(fiber, lane);
```

在 FiberRoot 上更新 pendingLanes

```js
function markRootUpdated(root, updateLane, eventTime) {
  root.pendingLanes |= updateLane;
  var higherPriorityLanes = updateLane - 1; // Turns 0b1000 into 0b0111
  // 处于当前优先级左边的会通过&被删除掉
  // 其实就是删除了较低的优先级
  root.suspendedLanes &= higherPriorityLanes;
  root.pingedLanes &= higherPriorityLanes;
  var eventTimes = root.eventTimes;
  var index = laneToIndex(updateLane);
  eventTimes[index] = eventTime;
}
```

获取当前的执行优先级 `var priorityLevel = getCurrentPriorityLevel()` 这个优先级与 lane 是有区别的

检查上下文环境,准备分析构建 Fiber 树

```js
// 如果传出的优先级是同步的
if (lane === SyncLane) {
  if (
  // 检查是非批量更新的状态
  (executionContext & LegacyUnbatchedContext) !== NoContext && 
  // 检查还没有开始渲染
  (executionContext & (RenderContext | CommitContext)) === NoContext) {
    // Register pending interactions on the root to avoid losing traced interaction data.
    schedulePendingInteractions(root, lane);
    // This is a legacy edge case. The initial mount of a ReactDOM.render-ed
    // root inside of batchedUpdates should be synchronous, but layout updates
    // should be deferred until the end of the batch.

    performSyncWorkOnRoot(root);
  } else {
    ensureRootIsScheduled(root, eventTime);
    schedulePendingInteractions(root, lane);

    if (executionContext === NoContext) {
      // Flush the synchronous work now, unless we're already working or inside
      // a batch. This is intentionally inside scheduleUpdateOnFiber instead of
      // scheduleCallbackForFiber to preserve the ability to schedule a callback
      // without immediately flushing it. We only do this for user-initiated
      // updates, to preserve historical behavior of legacy mode.
      resetRenderTimer();
      flushSyncCallbackQueue();
    }
  }
} else {
  // Schedule a discrete update but only if it's not Sync.
  if ((executionContext & DiscreteEventContext) !== NoContext && ( // Only updates at user-blocking priority or greater are considered
  // discrete, even inside a discrete event.
  priorityLevel === UserBlockingPriority$2 || priorityLevel === ImmediatePriority$1)) {
    // This is the result of a discrete event. Track the lowest priority
    // discrete update per root so we can flush them early, if needed.
    if (rootsWithPendingDiscreteUpdates === null) {
      rootsWithPendingDiscreteUpdates = new Set([root]);
    } else {
      rootsWithPendingDiscreteUpdates.add(root);
    }
  } // Schedule other updates after in case the callback is sync.


  ensureRootIsScheduled(root, eventTime);
  schedulePendingInteractions(root, lane);
}
```

#### performSyncWorkOnRoot(fiberRoot)

执行 `renderRootSync(root, lanes)`

执行结束后,赋值 finishWork 为最新的 Fiber 树,并进入提交节点,渲染元素

```js
var finishedWork = root.current.alternate;
root.finishedWork = finishedWork;
root.finishedLanes = lanes;
commitRoot(root);
```

#### renderRootSync(root, lanes)

这个方法可以算是[构建 Fiber 树](/posts/7db523698f9f/)的起点

```js
function renderRootSync(root, lanes) {
  // 缓存执行环境
  var prevExecutionContext = executionContext;
  // 执行环境标记为渲染环境
  executionContext |= RenderContext;
  // 调用 createWorkInProgress 创建新的 RootFiber 作为 WorkInProgress
  prepareFreshStack(root, lanes);

  do {
    try {
      workLoopSync();
      break;
    } catch (thrownValue) {
      handleError(root, thrownValue);
    }
  } while (true);

  workInProgressRoot = null;
  workInProgressRootRenderLanes = NoLanes;
  return workInProgressRootExitStatus;
}
```