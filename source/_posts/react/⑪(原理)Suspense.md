---
title: React原理 Suspense lazy
mathjax: true
categories:
  - React
tags:
  - React

date: 2021-10-02 21:29:26
---

#### lazy

> /react/packages/react/src/ReactLazy.js

lazy的本质是返回一个包含thenable的对象

```javascript
function lazyInitializer<T>(payload: Payload<T>): T {
  if (payload._status === Uninitialized) {
    const ctor = payload._result;
    const thenable = ctor();
    // Transition to the next state.
    // This might throw either because it's missing or throws. If so, we treat it
    // as still uninitialized and try again next time. Which is the same as what
    // happens if the ctor or any wrappers processing the ctor throws. This might
    // end up fixing it if the resolution was a concurrency bug.
    thenable.then(
      moduleObject => {
        if (payload._status === Pending || payload._status === Uninitialized) {
          // Transition to the next state.
          const resolved: ResolvedPayload<T> = (payload: any);
          resolved._status = Resolved;
          resolved._result = moduleObject;
        }
      },
      error => {
        if (payload._status === Pending || payload._status === Uninitialized) {
          // Transition to the next state.
          const rejected: RejectedPayload = (payload: any);
          rejected._status = Rejected;
          rejected._result = error;
        }
      },
    );
    if (payload._status === Uninitialized) {
      // In case, we're still uninitialized, then we're waiting for the thenable
      // to resolve. Set it as pending in the meantime.
      const pending: PendingPayload = (payload: any);
      pending._status = Pending;
      pending._result = thenable;
    }
  }
  if (payload._status === Resolved) {
    const moduleObject = payload._result;
   
    return moduleObject.default;
  } else {
    throw payload._result;
  }
}

export function lazy<T>(
  ctor: () => Thenable<{default: T, ...}>,
): LazyComponent<T, Payload<T>> {
  const payload: Payload<T> = {
    // We use these fields to store the result.
    _status: -1,
    _result: ctor,
  };

  const lazyType: LazyComponent<T, Payload<T>> = {
    $$typeof: REACT_LAZY_TYPE,
    _payload: payload,
    _init: lazyInitializer,
  };
  
  return lazyType;
}
```

#### Render阶段

在`beginWork`中遇到`LazyComponent`类型组件，会调用`mountLazyComponent` 方法处理

```javascript
function mountLazyComponent(_current, workInProgress, elementType, updateLanes, renderLanes) {
  if (_current !== null) {
    // A lazy component only mounts if it suspended inside a non-
    // concurrent tree, in an inconsistent state. We want to treat it like
    // a new mount, even though an empty version of it already committed.
    // Disconnect the alternate pointers.
    _current.alternate = null;
    workInProgress.alternate = null; // Since this is conceptually a new fiber, schedule a Placement effect

    workInProgress.flags |= Placement;
  }

  var props = workInProgress.pendingProps;
  var lazyComponent = elementType;
  var payload = lazyComponent._payload;
  var init = lazyComponent._init;

  // 第一次挂载组件时，因为promise状态不是完成状态，会抛出错误被上层的try catch捕获
  var Component = init(payload);

  workInProgress.type = Component;
  // 如果已经加载成功，分析出异步组件的类型
  var resolvedTag = workInProgress.tag = resolveLazyComponentTag(Component);

  // 合并异步组件的props和通过lazy创建组件时传入的props
  var resolvedProps = resolveDefaultProps(Component, props);
  var child;

  // 根据不同的组件类型处理，如果没有则抛出错误
  switch (resolvedTag) {
      //...
  }
  {
    throw Error( "Element type is invalid. Received a promise that resolves to: " + Component + ". Lazy element type must resolve to a class or function." + hint );
  }
}
```

下面是Suspense如何被创建并影响lazy创建的异步组件

React并没有直接创建Suspense组件，最开始的时候Suspense组件只是一个标识用于导出 `REACT_SUSPENSE_TYPE as Suspense`

**节点类型的创建，在初始只会创建出根节点的 fiber，后续的创建在 beginWork 入口，进入 reconcile 过程，会判断节点可复用性，然后不能复用的就通过 createFiberFromTypeAndProps 创建新节点。**

```javascript
function createFiberFromSuspense(pendingProps, mode, lanes, key) {
  var fiber = createFiber(SuspenseComponent, pendingProps, key, mode); // TODO: The SuspenseComponent fiber shouldn't have a type. It has a tag.
  // This needs to be fixed in getComponentName so that it relies on the tag
  // instead.

  fiber.type = REACT_SUSPENSE_TYPE;
  fiber.elementType = REACT_SUSPENSE_TYPE;
  fiber.lanes = lanes;
  return fiber;
}
```

`beginWork`中发现是Suspense类型会执行 `updateSuspenseComponent`

第一次执行创建子节点 `workInProgress.child = mountChildFibers `

第二次执行，建立节点间联系

```javascript
fallbackChildFragment.return = workInProgress;

primaryChildFragment.sibling = fallbackChildFragment;

workInProgress.child = primaryChildFragment;

return fallbackChildFragment
```

由于第一次执行的时候lazy组件抛出错误，会被`renderRootSync`捕获

```javascript
function renderRootSync(root, lanes) {
  do {
    try {
      workLoopSync();
      break;
    } catch (thrownValue) {
      handleError(root, thrownValue);
    }
  } while (true);
}
```

```javascript
function handleError(root, thrownValue) {
  do {
    try {
      ...
      // 继续执行
      throwException(...);
      // 这里完成时   会将wip设置为自己的父节点  也就是 suspense 节点
      workInProgress = completeUnitOfWork(workInProgress);
    } catch (yetAnotherThrownValue) {
      ...
      continue
    }
    // Return to the normal work loop.
    return;
  } while (true);
}
```

继续执行 throwException，这里会将抛出的 promise 放入子组件的 updateQueue

```javascript
function throwException(
  root: FiberRoot,
  returnFiber: Fiber,
  sourceFiber: Fiber,
  value: mixed,
  renderExpirationTime: ExpirationTime,
) {
  ...
  if (
    value !== null &&
    typeof value === 'object' &&
    typeof value.then === 'function'
  ) {
    // This is a thenable.
    const thenable: Thenable = (value: any);

    ...
    do {
      if (
        workInProgress.tag === SuspenseComponent &&
        shouldCaptureSuspense(workInProgress, hasInvisibleParentBoundary)
      ) {
        // 一个 set 结构存储在 updateQueue
        const thenables: Set<Thenable> = (workInProgress.updateQueue: any);
        if (thenables === null) {
          const updateQueue = (new Set(): any);
          updateQueue.add(thenable);
          // 第一次新增
          workInProgress.updateQueue = updateQueue;
        } else {
          // 追加
          thenables.add(thenable);
        }
           ...
          // 同步设置
          sourceFiber.expirationTime = Sync;

          return;
        }

        ...
      workInProgress = workInProgress.return;
    } while (workInProgress !== null);
    
  }
  ...
}
```
#### commit阶段

commitWork 中会处理队列中的Promise

会对之前渲染的 fallback 组件标记删除，对新的渲染数据标记更新。

```javascript
function attachSuspenseRetryListeners(finishedWork) {
  // If this boundary just timed out, then it will have a set of wakeables.
  // For each wakeable, attach a listener so that when it resolves, React
  // attempts to re-render the boundary in the primary (pre-timeout) state.
  var wakeables = finishedWork.updateQueue;

  if (wakeables !== null) {
    finishedWork.updateQueue = null;
    var retryCache = finishedWork.stateNode;

    if (retryCache === null) {
      retryCache = finishedWork.stateNode = new PossiblyWeakSet();
    }

    wakeables.forEach(function (wakeable) {
      // Memoize using the boundary fiber to prevent redundant listeners.
      var retry = resolveRetryWakeable.bind(null, finishedWork, wakeable);

      if (!retryCache.has(wakeable)) {
        {
          if (wakeable.__reactDoNotTraceInteractions !== true) {
            retry = tracing.unstable_wrap(retry);
          }
        }

        retryCache.add(wakeable);
        // 通过then方法在resolve之后执行
        wakeable.then(retry, retry);
      }
    });
  }
}
```

#### 实现一个异步组件

```javascript
/**
 * 
 * @param {*} Component  需要异步数据的component 
 * @param {*} api        请求数据接口,返回Promise，可以再then中获取与后端交互的数据
 * @returns 
 */
function AysncComponent(Component,api){
    const AysncComponentPromise = () => new Promise(async (resolve)=>{
          const data = await api()
          resolve({
              default: (props) => <Component rdata={data} { ...props}  />
          })
    })
    return React.lazy(AysncComponentPromise)
}
```

+ 用 AysncComponent 作为一个 HOC 包装组件，接受两个参数，第一个参数为当前组件，第二个参数为请求数据的 api 。
+ 声明一个函数给 React.lazy 作为回调函数，React.lazy 要求这个函数必须是返回一个 Promise 。在 Promise 里面通过调用 api 请求数据，然后根据返回来的数据 rdata 渲染组件，别忘了接受并传递 props 。

```javascript
/* 数据模拟 */
const getData=()=>{
    return new Promise((resolve)=>{
        //模拟异步
        setTimeout(() => {
             resolve({
                 name:'alien',
                 say:'let us learn React!'
             })
        }, 1000)
    })
}
/* 测试异步组件 */
function Test({ rdata  , age}){
    const { name , say } = rdata
    console.log('组件渲染')
    return <div>
        <div> hello , my name is { name } </div>
        <div>age : { age } </div>
        <div> i want to say { say } </div>
    </div>
}
/* 父组件 */
export default class Index extends React.Component{
    LazyTest = AysncComponent(Test,getData) 
    /* 需要每一次在组件内部声明，保证每次父组件挂载，都会重新请求数据 ，防止内存泄漏。 */
    render(){
        const { LazyTest } = this
        return <div>
           <Suspense fallback={<div>loading...</div>} >
              <LazyTest age={18}  />
          </Suspense>
        </div>
    }
}
```