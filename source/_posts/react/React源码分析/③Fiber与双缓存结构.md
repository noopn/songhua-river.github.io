---
layout: posts
title: React源码分析 ③ Fiber与双缓存结构
date: 2022-03-06 13:24:56
categories:
  - React
  - 源码分析
tags:
  - React
---

#### 创建根节点

先创建一个组件,下面这个了例子在大部分的章节都会用到

```javascript
const App = () => {
  return (
    <>
      <h1>标题</h1>
      <p>内容</p> 2020.01.01
    </>
  );
};
```

在调用了 render 方法之后, 最先创建出 [`FiberRoot`](/posts/720c1388e434/#FiberRoot),`RootFiber` 两个根节点

`RootFiber`的构造函数就是最常说的 [`Fiber`](/posts/720c1388e434/#Fiber) 的构造函数

这两个节点通过 `stateNode`, `current` 两个指针相连

![](0001.png)

```javascript
//                      根节点的DOM元素,  全局标记 var LegacyRoot = 0;
function createFiberRoot(containerInfo, tag,                       hydrate, hydrationCallbacks) {
  // 创建FiberRoot
  var root = new FiberRootNode(containerInfo, tag, hydrate);
  // 创建RootFiber
  var uninitializedFiber = createHostRootFiber(tag);
  // 通过指针相连
  root.current = uninitializedFiber;
  uninitializedFiber.stateNode = root;
  initializeUpdateQueue(uninitializedFiber);
  return root;
}
```

在初次创建 RootFiber 的时候,还会判断当前的执行模式并打上一个 mode 标记
调用`createHostRootFiber` 时候 `tag=0` 也就是 `LegacyRoot`因此 `mode=0`

```javascript
//                            0
function createHostRootFiber(tag) {
  var mode;
  //              全局变量2
  if (tag === ConcurrentRoot) {
    mode = ConcurrentMode | BlockingMode | StrictMode;
    //                  全局变量1
  } else if (tag === BlockingRoot) {
    mode = BlockingMode | StrictMode;
  } else {
    mode = NoMode;
  }
  return createFiber(HostRoot, null, null, mode);
}
```

#### 准备构建Fiber树

赋值全局变量`executionContext`默认值为0,表示没有当前上下文中没有任务在工作

```javascript
function unbatchedUpdates() {

  // 备份当前的上下文
  var prevExecutionContext = executionContext;

  // 标记不是批量更新的上下文
  executionContext &= ~BatchedContext;
  // 标记Legacy模式非批量更新的上下文
  executionContext |= LegacyUnbatchedContext;

  updateContainer(
    // React.createElement 创建 virtual DOM
    children,
    // render时创建FiberRoot根节点
    fiberRoot,
    // 默认是null
    parentComponent,
    callback
  );
}

```

```javascript
function updateContainer(element, container, parentComponent, callback) {
  var current$1 = container.current;
  var eventTime = requestEventTime();
  var lane = requestUpdateLane(current$1);
  callback = callback === undefined ? null : callback;
  enqueueUpdate(current$1, update);
  scheduleUpdateOnFiber(current$1, lane, eventTime);
  return lane;
}
```

在这个函数里做了如下几件事情:

- 获取一个时间戳 `eventTime` 通过 Performance Api 获取程序执行到当前语句的时间,如果不支持则内部调用 `Date.now()`代替
- 获取一个优先级 `var lane = requestUpdateLane(RootFiber)` 通过 RootFiber 上的`mode`计算后返回一个同步任务值,也就是`SyncLane = 1`
- 用以上两个变量,创建`Update`更新对象, 并添加`UpdateState`更新标记
  ```javascript
  function createUpdate(eventTime, lane) {
    var update = {
      eventTime: eventTime,
      lane: lane,
      tag: UpdateState,
      payload: null,
      callback: null,
      next: null
    };
    return update;
  }
  ```
  随后把更新对象插入到更新队列中

  ```javascript
  //  React.createElement创建的VirtualDOM.  上一步创建的update对象
  function enqueueUpdate(fiber,            update              ) {
    var updateQueue = fiber.updateQueue;

    if (updateQueue === null) {
      // 只会发生在Fiber节点被卸载
      return;
    }
    // 初始化为 {pending:null}
    var sharedQueue = updateQueue.shared;
    // 初始化为 null
    var pending = sharedQueue.pending;
    
    // update 首尾相连形成环形链表
    if (pending === null) {
      // This is the first update. Create a circular list.
      update.next = update;
    } else {
      update.next = pending.next;
      pending.next = update;
    }
    
    // 等待执行的更新对象,为当前的update对象
    sharedQueue.pending = update;
  }
  ```
  
+ 初始化 `workInProgress`

  对子节点的操作都发生在 `workInProgress`对象上,可以理解为`workInProgress`是对克隆出的`RootFiber`的引用

  ```javascript
  workInProgressRoot = root;
  // 通过`root.current` 也就是 RootFiber 克隆出一个新的 RootFiber,赋值给`workInProgress`
  workInProgress = createWorkInProgress(root.current, null);
  ```

  ```javascript
  function createWorkInProgress(current, pendingProps) {
    // workInProgress 不存在则创建新的节点
    var workInProgress = current.alternate;

    if (workInProgress === null) {
      // 我们使用了双缓冲池技术因为我们知道只需要最多两个版本的树
      // 我们存放没有使用的节点以便复用,这是延时创建避免被从不会更新任务,占用额外的对象.
      // 这也允许我们在需要的时候回首额外的内存.
      workInProgress = createFiber(current.tag, pendingProps, current.key, current.mode);
      workInProgress.elementType = current.elementType;
      workInProgress.type = current.type;
      workInProgress.stateNode = current.stateNode;
      // workInProgress 通过alternate属性链接原始的 FiberRoot 对象
      workInProgress.alternate = current;
      current.alternate = workInProgress;
    } else { }

    return workInProgress;
  }
  ```

到目前位置Fiber树的结构为

![](0002.png)

#### render阶段Fiber树构建

从 `RootFiber`节点遍历处理当前节点,处理好之后下一个节点会赋值给 `workInProgress`,循环遍历每一个节点

```javascript
while (workInProgress !== null) {
  performUnitOfWork(workInProgress);
}
```

```javascript
function performUnitOfWork(unitOfWork) {
  // 当前正被处理的这个是Fiber的镜像,任何操作都不应该依赖于它
  // 但在这里依赖它,意味在处理进程中不需要额外的字段

  var current = unitOfWork.alternate;
  // 把全局的current指向RootFiber, 它与WorkInProgress 构成了双缓存的两个指针
  setCurrentFiber(unitOfWork);
  var next;

  if ( (unitOfWork.mode & ProfileMode) !== NoMode) {
    startProfilerTimer(unitOfWork);
    next = beginWork$1(current, unitOfWork, subtreeRenderLanes);
    stopProfilerTimerIfRunningAndRecordDelta(unitOfWork, true);
  } else {
    next = beginWork$1(current, unitOfWork, subtreeRenderLanes);
  }

  resetCurrentFiber();
  unitOfWork.memoizedProps = unitOfWork.pendingProps;

  if (next === null) {
    // If this doesn't spawn new work, complete the current work.
    completeUnitOfWork(unitOfWork);
  } else {
    workInProgress = next;
  }

  ReactCurrentOwner$2.current = null;
}
```

在执行 `beginWork` 之前的树的结构为

![](0003.png)

下面就进入到了beginWork,根据不同的Fiber类型,使用不同的处理函数

因为 `workInProgress` 是 `RootFiber`  tag为3, 进入对应的分支

```javascript
function beginWork(current, workInProgress, renderLanes) {
  switch (workInProgress.tag) {
  //...
      case HostRoot:
      return updateHostRoot(current, workInProgress, renderLanes);
  }
}
```

由于 `workInProgress` 还没有child属性,所以通过 `processUpdateQueue()`方法将更新队列中的 `{element:{type:App}}` 取出

```javascript
var nextProps = workInProgress.pendingProps;
var prevState = workInProgress.memoizedState;
var prevChildren = prevState !== null ? prevState.element : null;
cloneUpdateQueue(current, workInProgress);
processUpdateQueue(workInProgress, nextProps, null, renderLanes);
var nextState = workInProgress.memoizedState; // Caution: React DevTools currently depends on this property

// App()
var nextChildren = nextState.element;

if (nextChildren === prevChildren) {
  resetHydrationState();
  return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
}

reconcileChildren(current, workInProgress, nextChildren, renderLanes);
```

用`App`子元素创建Fiber节点, `return`指向父级节点

```javascript
  function reconcileSingleElement(returnFiber, currentFirstChild, element, lanes) {
    var key = element.key;
    var child = currentFirstChild;

   var _created4 = createFiberFromElement(element, returnFiber.mode, lanes);
    _created4.ref = coerceRef(returnFiber, currentFirstChild, element);
    _created4.return = returnFiber;
    return _created4;
  }
  // child 指针指向新创建的App Fiber
  workInProgress.child = reconcileSingleElement();
  return workInProgress.child;
```

现在的链表结构为

![](0004.png)

回到`beginWork`方法, 现在的`next=workInProgress.child` 也就是 App Fiber, 由于 `next!==null` 所以不会执行 `completeUnitOfWork`,继续处理 App Fiber 子元素

同理 App Fiber 的 child `<h1>`也没有构建 (Fragment 会被忽略), 则会调用`<h1>` tag 对应的处理函数, 现在链表的结构为

![](0005.png)

在处理 h1 Fiber 的时候会检查是不是存在唯一的文本子节点,如果存在子元素为`null`

```javascript
function updateHostComponent(current, workInProgress, renderLanes) {
  if (isDirectTextChild) {
    // 我们把Host Node 唯一字节点当作一个特殊用例,这是一个常见的问题,不会当作一个子节点处理
    // 在执行环境中会处理,依然可以获取这个props,这可以避免用另一个Fiber处理,并遍历
    nextChildren = null;
  }
  return workInProgress.child;
}
```

由于当前的 `next==null` 会进入 `completeUnitOfWork`, 现在只需要关注查找sibling的过程,下一个兄弟节点是 `<p>`节点

```javascript
function completeUnitOfWork(unitOfWork) {
  var completedWork = unitOfWork;
    // 如果有兄弟元素直接调出,继续调用beginWork
    var siblingFiber = completedWork.sibling;
    if (siblingFiber !== null) {
      workInProgress = siblingFiber;
      return;
    } 
    // Update the next thing we're working on in case something throws.
    completedWork = returnFiber; 
    workInProgress = completedWork;
  } while (completedWork !== null); 
  // 跳出的条件是遍历到了根节点
}
```

由于`<p>`节点有唯一文本节点,因此处理过后`next==null`,链表为

![](0006.png)

最后还剩下一个文本字节点,但不是 APP Fiber 的唯一子节点,所以需要单独处理

处理之后,就没有其他的兄弟节点需要处理了,会执行 `completeUnitOfWork` 中 `returnFiber` 的赋值操作,最终遍历到根节点

![](0007.png)

在提交阶段,会执行如下代码, 把最新构建的树,指向 `root.current`,最终形成如下的链表

```javascript
function performSyncWorkOnRoot(root) {
  var finishedWork = root.current.alternate;
  root.finishedWork = finishedWork;
  root.finishedLanes = lanes;
  commitRoot(root);
}

root.current = root.finishedWork;
```

![](0008.png)

#### update阶段Fiber树构建

点击h1标签状态更新,依然会进入 `createWorkInProgress` 第一个节点是 RootFiber,alternate已经存在,如果不存在则创建一个FiberInWorkProgress并用alternate相连

```javascript
function createWorkInProgress(current, pendingProps) {
  // alternate 存在为渲染结束交换之后的RootFiber
  var workInProgress = current.alternate;

  if (workInProgress === null) {
  } else {
    workInProgress.pendingProps = pendingProps; // Needed because Blocks store data on type.

    workInProgress.type = current.type; 
    workInProgress.flags = NoFlags; // The effect list is no longer valid.

    workInProgress.nextEffect = null;
    workInProgress.firstEffect = null;
    workInProgress.lastEffect = null;
  }
  return workInProgress;
}
```

与render阶段相同都会进入beginWork, 会把当前节点的子节点和子节点的兄弟节点克隆到 workInProgress 上.

![](0009.png)

下面与render阶段类似,依次处理每个节点并于原节点 alternate 相连

![](0010.png)
