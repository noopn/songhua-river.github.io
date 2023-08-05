---
title: ReactDOM.render
mathjax: true

date: 2021-02-13 21:47:04
categories:
  - React
  - 更新
tags:
  - React
---

#### ReactDOM.render

packages/react-dom/src/client/ReactDOMLegacy.js

+ 创建ReactRoot
+ 创将FiberRoot和RootFiber
+ 创将更新

```javascript
export function render(
  element: React$Element<any>,
  container: Container,
  callback: ?Function,
) { 
  // ...
  return legacyRenderSubtreeIntoContainer(
    null,
    element,
    container,
    false,
    callback,
  );
}
```

```javascript
function legacyRenderSubtreeIntoContainer(
  parentComponent: ?React$Component<any, any>, // 父组件
  children: ReactNodeList, // 渲染组件
  container: Container, // 容器
  forceHydrate: boolean, // 是否强制注入
  callback: ?Function, // 回调函数
) {
  //...
  // 查看是否有复用的节点
  let root: RootType = (container._reactRootContainer: any);
  let fiberRoot;
  if (!root) {
    // 初始化加载，在root上挂载创建的ReactRooter 
    root = container._reactRootContainer = legacyCreateRootFromDOMContainer(
      container,
      forceHydrate,
    );
    // _internalRoot 也就是内部使用的fiberRoot
    fiberRoot = root._internalRoot;
    //...
    unbatchedUpdates(() => {
      updateContainer(children, fiberRoot, parentComponent, callback);
    });
  } else {
    //... 
    updateContainer(children, fiberRoot, parentComponent, callback);
  }
  // 最终都是调用了 updateContainer，并把创将的fiberRoot传入
  return getPublicRootInstance(fiberRoot);
}
```

##### legacyCreateRootFromDOMContainer

```javascript
// 直接返回原生节点
function getReactRootElementInContainer(container: any) {
  if (!container) {
    return null;
  }

  if (container.nodeType === DOCUMENT_NODE) {
    return container.documentElement;
  } else {
    return container.firstChild;
  }
}

// 如果原生节点存在 shouldHydrate = true
function shouldHydrateDueToLegacyHeuristic(container) {
  const rootElement = getReactRootElementInContainer(container);
  return !!(
    rootElement &&
    rootElement.nodeType === ELEMENT_NODE &&
    rootElement.hasAttribute(ROOT_ATTRIBUTE_NAME)
  );
}

function legacyCreateRootFromDOMContainer(
  container: Container,
  forceHydrate: boolean,
): RootType {
  const shouldHydrate =
    forceHydrate || shouldHydrateDueToLegacyHeuristic(container);
  // First clear any existing content.
  if (!shouldHydrate) {
    let warned = false;
    let rootSibling;
    // 清空容器的子节点
    while ((rootSibling = container.lastChild)) {
      if (__DEV__) {
        if (
          !warned &&
          rootSibling.nodeType === ELEMENT_NODE &&
          // ROOT_ATTRIBUTE_NAME 用于服务端渲染的判断，是否需要合并节点
          (rootSibling: any).hasAttribute(ROOT_ATTRIBUTE_NAME)
        ) {
          warned = true;
          console.error(
            'render(): Target node has markup rendered by React, but there ' +
              'are unrelated nodes as well. This is most commonly caused by ' +
              'white-space inserted around server-rendered markup.',
          );
        }
      }
      container.removeChild(rootSibling);
    }
  }
  // ...
  return createLegacyRoot(
    container,
    shouldHydrate
      ? {
          hydrate: true,
        }
      : undefined,
  );
}
```

##### createLegacyRoot 创建ReactRoot

```javascript
export function createLegacyRoot(
  container: Container,
  options?: RootOptions,
): RootType {
  // 
  return new ReactDOMBlockingRoot(container, LegacyRoot, options);
}

function ReactDOMBlockingRoot(
  container: Container,
  tag: RootTag,
  options: void | RootOptions,
) {
  this._internalRoot = createRootImpl(container, tag, options);
}

function createRootImpl(
  container: Container,
  // 常量0,标识根节点
  tag: RootTag,
  options: void | RootOptions,
) {
  // createContainer 最终调用了createFiberRoot
  const root = createContainer(container, tag, hydrate, hydrationCallbacks);
  //...
  return root;
}
```

##### createFiberRoot

```javascript
export function createFiberRoot(
  containerInfo: any,
  tag: RootTag,
  hydrate: boolean,
  hydrationCallbacks: null | SuspenseHydrationCallbacks,
): FiberRoot {
  // 容器节点本身是FiberRoot对象
  const root: FiberRoot = (new FiberRootNode(containerInfo, tag, hydrate): any);
  // 创建的Fiber对象
  const uninitializedFiber = createHostRootFiber(tag);
  root.current = uninitializedFiber;
  uninitializedFiber.stateNode = root;
  // 为原始的fiber节点添加updateQueue信息
  // function initializeUpdateQueue(fiber) {
  //   var queue = {
  //     baseState: fiber.memoizedState,
  //     firstBaseUpdate: null,
  //     lastBaseUpdate: null,
  //     shared: {
  //       pending: null
  //     },
  //     effects: null
  //   };
  //   fiber.updateQueue = queue;
  // }
  initializeUpdateQueue(uninitializedFiber);
  return root;
}
```

##### updateContainer

```javascript
export function updateContainer(
  element: ReactNodeList,
  container: OpaqueRoot,
  parentComponent: ?React$Component<any, any>,
  callback: ?Function,
): Lane {
  // container = container._reactRootContainer = legacyCreateRootFromDOMContainer(container,forceHydrate)._internalRoot;
  const current = container.current;
  const eventTime = requestEventTime();

  //创将事件优先级
  const lane = requestUpdateLane(current);

  // 创将更新对象
  const update = createUpdate(eventTime, lane);
  update.payload = {element};

  // 加入到更新队列中
  enqueueUpdate(current, update);
  // 调度更新
  scheduleUpdateOnFiber(current, lane, eventTime);

  return lane;
}
```