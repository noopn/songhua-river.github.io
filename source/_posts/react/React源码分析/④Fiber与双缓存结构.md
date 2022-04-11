---
layout: posts
title: React源码分析 ④ Fiber与双缓存结构
date: 2022-03-06 13:24:56
categories:
  - React
  - React源码分析
tags:
  - React
---

先创建一个组件,下面这个了例子在大部分的章节都会用到

```javascript
const App: React.FC = () => {
  const [content, setContent] = useState('内容');
  return (
    <>
      <h1 onClick={() => setContent('内容改变')} role="presentation">
        标题
      </h1>
      <p>{content}</p> 2020.01.01
    </>
  );
};
```

#### mount阶段

准备 workInProgress 节点,此节点为 rootFiber节点的一个副本,无论是更新还是挂载阶段都会先创建这个节点,然后从这个节点头部开始,递归处理每一个节点,最终形成一个fiber链表,对整个链表处理之后会交换两个Fiber树

<strong id='createWorkInProgress'>createWorkInProgress</strong><span id="prepareFreshStack"/>

```javascript
function prepareFreshStack(root, lanes) {
  workInProgressRoot = root;
  // 传入rootFiber
  workInProgressRoot = root;
  workInProgress = createWorkInProgress(root.current, null);
  workInProgressRootRenderLanes = subtreeRenderLanes = workInProgressRootIncludedLanes = lanes;
  workInProgressRootExitStatus = RootIncomplete;
  workInProgressRootFatalError = null;
  workInProgressRootSkippedLanes = NoLanes;
  workInProgressRootUpdatedLanes = NoLanes;
  workInProgressRootPingedLanes = NoLanes;
}

function createWorkInProgress(current, pendingProps) {
  var workInProgress = current.alternate;

  // workInProgress 不存在则创建新的节点 
  if (workInProgress === null) {
    // 我们使用了双缓冲池技术因为我们知道只需要最多两个版本的树
    // 我们存放没有使用的节点以便复用,这是延时创建避免被从不会更新任务,占用额外的对象.
    // 这也允许我们在需要的时候回收的内存.

    // 克隆出新的rootFiber节点
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

递归处理的开始,在<strong id='performUnitOfWork'>performUnitOfWork</strong> 中传入刚刚克隆出的rootFiber节点

```javascript
function workLoopSync() {
  // Already timed out, so perform work without checking if we need to yield.
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}

function performUnitOfWork(unitOfWork) {
  // 当前正被处理的这个是Fiber的镜像,任何操作都不应该依赖于它
  // 但在这里依赖它,意味在处理进程中不需要额外的字段

  // 这个是原始的 rootFiber 节点
  var current = unitOfWork.alternate;
  
  // 一个全局current变量指向当前被处理的节点
  setCurrentFiber(unitOfWork);
  var next;

  next = beginWork(current, unitOfWork, subtreeRenderLanes);

  // 处理结束后清空current=null指针
  resetCurrentFiber();
  unitOfWork.memoizedProps = unitOfWork.pendingProps;

  // complete 阶段
  if (next === null) {
    completeUnitOfWork(unitOfWork);
  } else {
    workInProgress = next;
  }
}
```

<strong id='beginWork'>beginWork</strong> 简单来说这个方法就是从根节点解析,如果节点不存在就创建对应的 fiber 节点,如果存在就判断是复用还是重新创建, 并通过 return, sibling 等指针链接各个 fiber 节点
最终构建出一颗 Fiber 树, 而这个 Fiber 树与原始的 Fiber 树之间通过 alternate 指针相连. 注意 beginWork 处理的都是 js 对象, 对真正 DOM 元素的创建是在 completeWork 中进行的.

第一个节点是rootFiber节点,因为它的镜像节点已经在克隆rootFiber节点的时候通过 alternate 指针与原始的rootFiber相关联,所以会进入 `if(current!==null)` 分支, 最终 didReceiveUpdate 标记为 false

```javascript
// current 为 alternate 节点,也就是原始的 Fiber 树中的镜像节点
// workInProgress 为当前正在处理的节点
// subtreeRenderLanes 为当前正处理的节点的优先级
function beginWork(current, workInProgress, renderLanes) {
  if (current !== null) {
    var oldProps = current.memoizedProps;
    var newProps = workInProgress.pendingProps;
    // props改变
    // 上下文对象改变
    // Force a re-render if the implementation changed due to hot reload
    // 这三个状态改变会被标记为 didReceiveUpdate 更新
    if (oldProps !== newProps || hasContextChanged() || ( 
     workInProgress.type !== current.type )) {
      // If props or context changed, mark the fiber as having performed work.
      // This may be unset if the props are determined to be equal later (memo).
      didReceiveUpdate = true;
    }
    //  
    else if (!includesSomeLane(renderLanes, updateLanes)) {
      didReceiveUpdate = false; 
      // This fiber does not have any pending work. Bailout without entering
      // the begin phase. There's still some bookkeeping we that needs to be done
      // in this optimized path, mostly pushing stuff onto the stack.

      switch (workInProgress.tag) {
        case HostRoot:
        // 不同的 fiber 类型用不同的函数处理
        // 没有对 fiber 进行操作,只是处理上下文
      }
      // 如果节点可以复用,会通过这个函数处理
      return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
    } else {
     if ((current.flags & ForceUpdateForLegacySuspense) !== NoFlags) {
        // This is a special case that only exists for legacy mode.
        // See https://github.com/facebook/react/pull/19216.
        didReceiveUpdate = true;
      } else {
        // An update was scheduled on this fiber, but there are no new props
        // nor legacy context. Set this to false. If an update queue or context
        // consumer produces a changed value, it will set this to true. Otherwise,
        // the component will assume the children have not changed and bail out.
        didReceiveUpdate = false;
      }
  } else {
    didReceiveUpdate = false;
  } 

  switch (workInProgress.tag) {
    // updateHostRoot(...)
    // updateHostComponent(...)
  }
}

```

会跳出if条件,进入到下面的switch处理

```javascript

function updateHostRoot(current, workInProgress, renderLanes) {
  var updateQueue = workInProgress.updateQueue;

  // 把一些原始rootFiber上的属性,复制到 workInProgress
  cloneUpdateQueue(current, workInProgress);
  
  // render方法调用时传入的App jsxElement,被添加到updateQueue
  // 这个方法会将App从update对象中取出,放到memoizedState中
  processUpdateQueue(workInProgress, nextProps, null, renderLanes);
  var nextState = workInProgress.memoizedState; 

  // nextChildren 为render方法传入的 App 组件
  var nextChildren = nextState.element;

  // 如果和之前的组件相同,则复用该节点
  if (nextChildren === prevChildren) {
    resetHydrationState();
    return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
  }
  // 进入协调子节点的方法
  //           原始rootFiber, 当前处理的rootFiber, App节点
  reconcileChildren(current, workInProgress, nextChildren, renderLanes);

  return workInProgress.child;
}
```

<strong id='reconcileChildren'>reconcileChildren</strong>


```javascript
function reconcileChildren(current, workInProgress, nextChildren, renderLanes) {
  if (current === null) {
    // If this is a fresh new component that hasn't been rendered yet, we
    // won't update its child set by applying minimal side-effects. Instead,
    // we will add them all to the child before it gets rendered. That means
    // we can optimize this reconciliation pass by not tracking side-effects.
    workInProgress.child = mountChildFibers(workInProgress, null, nextChildren, renderLanes);
  } else {
    // If the current child is the same as the work in progress, it means that
    // we haven't yet started any work on these children. Therefore, we use
    // the clone algorithm to create a copy of all the current children.
    // If we had any progressed work already, that is invalid at this point so
    // let's throw it out.

    workInProgress.child = reconcileChildFibers(workInProgress, current.child, nextChildren, renderLanes);
  }
}
```

这两个协调节点的处理函数都是通过一个函数生成的,区别就是mountChildFibers不会处理副作用,reconcileChildFibers会在fiber节点上添加副作用的标识,标记删除或更新等操作

```javascript
var reconcileChildFibers = ChildReconciler(true);
var mountChildFibers = ChildReconciler(false);
```

由于原始节点current存在, 会进入 reconcileChildFibers,根据不同的子元素类型使用不同的处理方法,[**Diff算法**](/posts/bb4fc484e4b2/)也发生在这里

<strong id='#reconcileChildFibers'>reconcileChildFibers</strong>

```javascript
function reconcileChildFibers(returnFiber, currentFirstChild, newChild, lanes) {

  // This function is not recursive.
  // If the top level item is an array, we treat it as a set of children,
  // not as a fragment. Nested arrays on the other hand will be treated as
  // fragment nodes. Recursion happens at the normal flow.
  // Handle top level unkeyed fragments as if they were arrays.
  // This leads to an ambiguity between <>{[...]}</> and <>...</>.
  // We treat the ambiguous cases above the same.

  // 这个条件用于判断是否是Fragment,如果是顶层的Fragment会直接从props中取出,把他当作子元素
  var isUnkeyedTopLevelFragment = typeof newChild === 'object' && newChild !== null && newChild.type === REACT_FRAGMENT_TYPE && newChild.key === null;

  if (isUnkeyedTopLevelFragment) {
    newChild = newChild.props.children;
  }

  var isObject = typeof newChild === 'object' && newChild !== null;

  if (isObject) {
    switch (newChild.$$typeof) {
      case REACT_ELEMENT_TYPE:
        return placeSingleChild(reconcileSingleElement(returnFiber, currentFirstChild, newChild, lanes));

      case REACT_PORTAL_TYPE:
        return placeSingleChild(reconcileSinglePortal(returnFiber, currentFirstChild, newChild, lanes));
    }
  }

  if (typeof newChild === 'string' || typeof newChild === 'number') {
    return placeSingleChild(reconcileSingleTextNode(returnFiber, currentFirstChild, '' + newChild, lanes));
  }

  if (isArray$1(newChild)) {
    return reconcileChildrenArray(returnFiber, currentFirstChild, newChild, lanes);
  }
  return deleteRemainingChildren(returnFiber, currentFirstChild);
}
```

最终reconcileSingleElement会使用 App 生成新的 fiber 节点,并通过return指针与rootFiber相连

```javascript
function reconcileSingleElement(returnFiber, currentFirstChild, element, lanes) {
  /*
    在这个函数中会判断组件的tag类型,需要注意的函数组件并不会一开始就被标记为FunctionComponent
    因为函数可能没有继承React.Component 是用户自己的行为,所以会在处理这个节点的时候单独判断
    
    type会按照以下顺序判断
    type是否是一个函数,如果是原型链上有没有isReactComponent 如果有就是类组件
    type是否是一个字符串, 如果是就是HTMLElement
    type是不是内置的类型,例如 REACT_FRAGMENT_TYPE 等
    如果都不是会被标记为 mountIndeterminateComponent=2 表示一个待定的组件
  */
  var _created4 = createFiberFromElement(element, returnFiber.mode, lanes);
  _created4.return = returnFiber;
  return _created4;
}
```

placeSingleChild 会把节点的flag标记为 Placement 标识这是需要插入的元素

```javascript
newFiber.flags = Placement;
```
最后通过 `return workInProgress.child` 返回下一个 fiber , 也就是刚刚创建的 AppFiber, 现在链表的结构

![](0004.png)

回到 <a href="#performUnitOfWork"> performUnitOfWork </a>方法,next现在为 App fiber,`next!==null` 表示还有 App Fiber 这个节点需要处理,所以并不会进入 complete 这个分支,下面经过 workLoopSync 再次进入 performUnitOfWork 方法

由于React.createElement 创建 virtualDOM 的是否并不会分析组件类型,只能简单区是否是 html 元素, 不能区分是函数组件还是类组件, 所以这里会进入 `tag=2` 的分支,用于处理一个不确定的组件

```javascript
switch (workInProgress.tag) {
  case IndeterminateComponent:
    {
      return mountIndeterminateComponent(current, workInProgress, workInProgress.type, renderLanes);
    }
}

function mountIndeterminateComponent(_current, workInProgress, Component, renderLanes) {
  
  // 首先会尝试执行这个函数,拿到函数的返回值
  var value = renderWithHooks(null, workInProgress, Component, props, context, renderLanes);
  
  // 判断是否具有类组件的行为,如果有则按类组件处理不,并重新标记tag
  if (typeof value === 'object' && value !== null && typeof value.render === 'function' && value.$$typeof === undefined) {
    //...
    workInProgress.tag = ClassComponent;
    //...
  } else{
    // 如果不是类组件才会标记为函数组件
    workInProgress.tag = FunctionComponent;
  }

  // 再次调用协调函数
  reconcileChildren(null, workInProgress, value, renderLanes);
}
```

和上次调用<a href='#reconcileChildren'>reconcileChildren</a>的时候不同,这次传入的 current=null, 也就是这个节点还没有镜像节点,所以会使用 mountChildFibers 处 理

因为这两个方法只是区分是否是初次挂载,所以大致的流程相同,进入 <a href='#reconcileChildFibers'>reconcileChildFibers</a> 会检查到这是一个 Fragment 节点,所以直接取出它的子元素,是一个由 `h1`,`p`,`文本元素` 三个 virtualDOM 组成的数组, 进入 `reconcileChildrenArray` 多节点的 Diff 算法就发生在这里

最终这个方法会将三个子节点通过 sibling 指针相连,并返回头节点 `h1`, 作为下一个工作单元,现在链表的结构为

![](0005.png)


再次处理的是 `h1` 节点, 因为初次挂载它的 `alternate` 也没有构建,所以直接进入对应的 `case` 处理

在处理 h1 Fiber 的时候会检查是不是存在唯一的文本子节点,如果存在子元素为`null`

```javascript
function updateHostComponent(current, workInProgress, renderLanes) {
  if (isDirectTextChild) {
    // 我们把Host Node 唯一字节点当作一个特殊用例,这是一个常见的问题,不会当作一个子节点处理
    // 在执行环境中会处理,依然可以获取这个props,这可以避免用另一个Fiber遍历处理
    nextChildren = null;
  }
  return workInProgress.child;
}
```

h1 的 beginWork 结束之后会进入 completeWork, 因为 h1 有为文本子节点,并不会算作他的子元素,所以他的 child = null

需要注意的是,completeWork 并不一定在所有的节点的 beginWork 执行完成后才会执行,当一个节点没有子节点需要处理的时候,就会进入 completeWork, 

#### complete阶段

completeWork 最重要的目的之一就是对比新老节点,把 fiber 对应的真实 DOM 元素创建出来或添加更新属性, 并与 fiber 节点相关联,另一个目的是 [构建 Effects 链表](/posts/3aa5257401aa/) 

这个方法会遍历传入元素的 siblings 兄弟元素,如果没有会返回父级元素,一直递归到根节点

```js
function completeUnitOfWork(unitOfWork) {
    // Attempt to complete the current unit of work, then move to the next
    // sibling. If there are no more siblings, return to the parent fiber.
  var completedWork = unitOfWork;

  do {
    
    next = completeWork(current, completedWork, subtreeRenderLanes);

    // 结束执行后有一段处理 Effect 链表的逻辑 
    // ...
    var siblingFiber = completedWork.sibling;

    if (siblingFiber !== null) {
      // If there is more work to do in this returnFiber, do that next.
      workInProgress = siblingFiber;
      return;
    } // Otherwise, return to the parent

    completedWork = returnFiber; 
    // Update the next thing we're working on in case something throws.

    workInProgress = completedWork;
  } while (completedWork !== null); // We've reached the root.

}
```

completeWork 与 beginWork 方法设计类似,不同的 fiber 类型,会进入不同的  case 处理,但以下的节点类型会返回 null,这些类型的 Fiber 节点都没有真实的 DOM 元素与之对应

```js
case IndeterminateComponent:
case LazyComponent:
case SimpleMemoComponent:
case FunctionComponent:
case ForwardRef:
case Fragment:
case Mode:
case Profiler:
case ContextConsumer:
case MemoComponent:
  return null;
```

当 `h1` 元素首次进入, 会进入对应的 HostComponent 处理,这时的 alternate 节点还没有渲染,所以 `current=null`, 会进入 else 分支

```javascript
case HostComponent:
  {
    var type = workInProgress.type;

    if (current !== null && workInProgress.stateNode != null) {
      updateHostComponent$1(current, workInProgress, type, newProps, rootContainerInstance);
    }else{
      // 会直接调用原生的DOM方法创建元素
      // domElement = ownerDocument.createElement(type);
      var instance = createInstance(type, newProps, rootContainerInstance, currentHostContext, workInProgress);
      
      // 如果元素还有其他子元素例如 <h1><span/><span/></h1>
      // 会循环遍历子元素,将子元素的原生DOM,插入到 h1 的原生DOM中
      appendAllChildren(instance, workInProgress, false, false);
      // 重新赋值 stateNode 指针,指向原生DOM
      workInProgress.stateNode = instance; 
      // Certain renderers require commit-time effects for initial mount.
      // (eg DOM renderer supports auto-focus for certain elements).
      // Make sure such renderers get scheduled for later work.

      // 通过原生DOM方法将props中的属性添加在原生DOM上
      // node.addAttribute(_attributeName);
      // 如果是点击事件,则会加入到事件系统的队列中
      if (finalizeInitialChildren(instance, type, newProps, rootContainerInstance)) {

        // 添加更新的副作用 workInProgress.flags |= Update;
        markUpdate(workInProgress);
      }
    }
  }
  return null;
}
```


跳出 complete 后,下一个节点是 `p`,与 `h1` 类似,还是会先进入 beginWork, 由于没有子节点,所以紧接着进入completeWork, 当最后一个文本节点处理之后会执行 `completedWork = returnFiber` 也就是对 AppFiber 执行 completeWork, 所以直接返回 null,最终所有的节点都遍历之后形成的链表为

![](0006.png)

![](0007.png)


#### update阶段

点击h1标签状态更新,依然会进入 <a href='#createWorkInProgress'>createWorkInProgress</a> 第一个节点是 RootFiber,alternate已经存在,如果不存在则创建一个 `FiberInWorkProgress` 并用alternate相连

与render阶段相同都会进入 <a href='#beginWork'>beginWork</a> , 第一个节点为 FiberRoot, 与首次渲染不同,这次的 `renderLanes!==updateLanes` 表示这个节点需要渲染,但是当前节点不需要更新,这也就意味这这个节点可以复用,会进入下面的复用的逻辑

会直接克隆当前节点,并返回子节点 App 

```javascript
function bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes) {

  // 
  if (!includesSomeLane(renderLanes, workInProgress.childLanes)) {
    // The children don't have any work either. We can skip them.
    // TODO: Once we add back resuming, we should check if the children are
    // a work-in-progress set. If so, we need to transfer their effects.
    return null;
  } else {
    // 当前的节点不需要更新但是子节点需要更新,克隆子节点继续
    // 会再次调用 createWorkInProgress 克隆当前节点的子节点,并通过 alternate 指针,与原节点相连
    cloneChildFibers(current, workInProgress);
    return workInProgress.child;
  }
}
```

现在的 Fiber 树结构为

![](0011.png)

下面进入的是App节点, 因为这个节点需要更新,但是又没有新的属性或上下文,所以会进入下面的分支,
把是否收到更新标记为 false,并重新构建此节点

```javascript
if ((current.flags & ForceUpdateForLegacySuspense) !== NoFlags) {
  // This is a special case that only exists for legacy mode.
  // See https://github.com/facebook/react/pull/19216.
  didReceiveUpdate = true;
} else {
  // An update was scheduled on this fiber, but there are no new props
  // nor legacy context. Set this to false. If an update queue or context
  // consumer produces a changed value, it will set this to true. Otherwise,
  // the component will assume the children have not changed and bail out.

  // 这个Fiber上有一个更新被调度,但是没有新的属性或上下文,就设置为false
  // 如果一个更新队列或上下文,消费了一个改变的值,会被设置为true
  // 否则组件则会假定子元素没有改变并跳出
  didReceiveUpdate = false;
}
```

这一次的 App 节点已经不是 mount 时候无法确定的节点,而是一个 FunctionComponent,会进入对应的 case 处理

```javascript
function updateFunctionComponent(current, workInProgress, Component, nextProps, renderLanes) {

  var context;
  var nextChildren;

  setIsRendering(true);

  // 会在创建 virtualDOM 时检查是否更新,如果是 didReceiveUpdate 标记为true
  nextChildren = renderWithHooks(current, workInProgress, Component, nextProps, context, renderLanes);
  
  // 如果节点不需要更新则会继续走复用节点的逻辑
  if (current !== null && !didReceiveUpdate) {
    bailoutHooks(current, workInProgress, renderLanes);
    return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
  } // React DevTools reads this flag.


  // 否则创建新的Fiber节点并返回
  workInProgress.flags |= PerformedWork;
  reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  return workInProgress.child;
}
```


h1 更新阶段, 会进入 if 分支执行 updateHostComponent, 并且因为 props 发生改变,didReceiveUpdate 会被标记为 true. h1 的文本发生了改变,但由于这是它的唯一文本节点所以不需要额外处理,只当作节点更新即可.

下面会紧接着进入 h1 的 completeWork, 进入对应的 case 进行处理, `updateHostComponent$1` 中会调用 `diffProperties` 进行[属性的Diff](/posts/bb4fc484e4b2/#属性Diff), 最终把 Diff 后的属性添加到 updateQueue 中 


```js
case HostComponent:
  {
    var rootContainerInstance = getRootHostContainer();
    var type = workInProgress.type;

    if (current !== null && workInProgress.stateNode != null) {
      
      // 执行属性Diff算法
      // var updatePayload = diffProperties(domElement, type, oldProps, newProps);
      // workInProgress.updateQueue = updatePayload;
      updateHostComponent$1(current, workInProgress, type, newProps, rootContainerInstance);

      if (current.ref !== workInProgress.ref) {
        markRef$1(workInProgress);
      }
    } else {
      var instance = createInstance(type, newProps, rootContainerInstance, currentHostContext, workInProgress);
      appendAllChildren(instance, workInProgress, false, false);
      workInProgress.stateNode = instance; 
      // Certain renderers require commit-time effects for initial mount.
      // (eg DOM renderer supports auto-focus for certain elements).
      // Make sure such renderers get scheduled for later work.
    }

    return null;
  }
  
```

以下一个进来的 `p` 节点为例, 新的文本是 `内容改变`, 旧的文本是 `内容`,与 h1 的处理过程类似,最后会执行 RootFiber 的 completeWork 会给 fiber 添加 snapshot 副作用标记

```js
// Schedule an effect to clear this container at the start of the next commit.
// This handles the case of React rendering into a container with previous children.
// It's also safe to do for updates too, because current.child would only be null
// if the previous render was null (so the the container would already be empty).
workInProgress.flags |= Snapshot;
```

最终依次处理所有节点之后,生成一个新的 Fiber 树

![](0010.png)

#### 双缓存结构

在内存中构建并直接替换的技术叫做双缓存。

当首次 update 结束,这时产生的两个 Fiber 树就是,Fiber 树的双缓存结构

当 render 阶段执行结束之后会进入 commitRoot

```javascript
function performSyncWorkOnRoot(root) {
  // 原 rootFiber 的镜像节点,也就是 workInProgress
  var finishedWork = root.current.alternate;
  root.finishedWork = finishedWork;
  root.finishedLanes = lanes;
  // 提交阶段结束之后会重新复制current
  // root.current = finishedWork;
  // FiberRoot的 current 指针会指向最新构建的 Fiber 树
  // 并将原有的 Fiber 树回收 workInProgress = null
  commitRoot(root);
}
```