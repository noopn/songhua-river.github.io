---
layout: post
title: React 运行时的函数调用
abbrlink: ce2c3a7b
date: 2021-04-26 09:22:20
categories:
  - React
  - 原理
tags:
  - React
---

[^_^]:①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳❶❷❸❹❺❻❼❽❾❿⓫⓬⓭⓮⓯⓰⓱⓲⓳⓴

##### render

整个程序的入口，把组建渲染在根节点上

```javascript
function render(element, container, callback) {
  // 验证根节点是否合法
  // ...
  {
    // 在容器的原生dom上是否有一标识
    var isModernRoot = isContainerMarkedAsRoot(container) && container._reactRootContainer === undefined;
    // ...
  }
  // 把React元素渲染进Container
  return legacyRenderSubtreeIntoContainer(null, element, container, false, callback);
}
```

##### legacyRenderSubtreeIntoContainer

① 首次渲染_reactRootContainer为undefined

② [legacyCreateRootFromDOMContainer](/posts/ce2c3a7b/#legacyCreateRootFromDOMContainer)方法清除了container所有子元素,并返回ReactDOMBlockingRoot的实例FiberRoot

③ 首次渲染不会分批处理更新

```javascript
//                                                                                 false
function legacyRenderSubtreeIntoContainer(parentComponent, children, container, forceHydrate, callback) {
  // ...
  var root = container._reactRootContainer;
  var fiberRoot;
  // ①
  if (!root) {
    // ②                                                                                 false
    root = container._reactRootContainer = legacyCreateRootFromDOMContainer(container, forceHydrate);
    fiberRoot = root._internalRoot;
    // ③
    unbatchedUpdates(function () {
      //              React element　　｜　fiberRoot　　　｜　　　null,        ｜　undefined
      updateContainer(children,     　　　fiberRoot, 　　　　parentComponent，　　 callback);
    });
  } else {
    fiberRoot = root._internalRoot;

    if (typeof callback === 'function') {
      var _originalCallback = callback;

      callback = function () {
        var instance = getPublicRootInstance(fiberRoot);

        _originalCallback.call(instance);
      };
    } // Update


    updateContainer(children, fiberRoot, parentComponent, callback);
  }
  return getPublicRootInstance(fiberRoot);
}
```

##### legacyCreateRootFromDOMContainer

① 清空了container所有的内容

② FiberRoot.current 指向 createHostRootFiber 创建的rootFiber对象，形成相互引用的链表结构，最终返回了FiberRoot对象

③ 在rootFiber节点上添加了更新队列相关的信息

④ 在container真实的DOM节点上添加 `__reactContainer$' + randomKey` 属性指向fiberRoot,fiberRoot节点和真实DOM节点相互引用

⑤ 在container上代理了所有的事件 [listenToAllSupportedEvents](/posts/ce2c3a7b/#listenToAllSupportedEvents)

⑥⑦⑧⑨⑩⑪⑫⑬

```javascript
//                                          root节点      false
function legacyCreateRootFromDOMContainer(container, forceHydrate) {
  var shouldHydrate = forceHydrate || shouldHydrateDueToLegacyHeuristic(container); // First clear any existing content.

  if (!shouldHydrate) {
    var warned = false;
    var rootSibling;
    // ①
    while (rootSibling = container.lastChild) {
      {
        if (!warned && rootSibling.nodeType === ELEMENT_NODE && rootSibling.hasAttribute(ROOT_ATTRIBUTE_NAME)) {
          warned = true;

          error('render(): Target node has markup rendered by React, but there ' + 'are unrelated nodes as well. This is most commonly caused by ' + 'white-space inserted around server-rendered markup.');
        }
      }

      container.removeChild(rootSibling);
    }
  }

  return createLegacyRoot(container, shouldHydrate ? {
    hydrate: true
  } : undefined);
}

function createLegacyRoot(container, options) {
  //                                         LegacyRoot=0
  return new ReactDOMBlockingRoot(container, LegacyRoot, options);
}

function ReactDOMBlockingRoot(container, tag, options) {
  this._internalRoot = createRootImpl(container, tag, options);
}

function createRootImpl(container, tag, options) {
  // Tag is either LegacyRoot or Concurrent Root
  var hydrate = options != null && options.hydrate === true;
  var hydrationCallbacks = options != null && options.hydrationOptions || null;
  var mutableSources = options != null && options.hydrationOptions != null && options.hydrationOptions.mutableSources || null;
  // ② 
  var root = createContainer(container, tag, hydrate);
  // ④
  markContainerAsRoot(root.current, container);
  // function markContainerAsRoot(hostRoot, node) {
  //   node[internalContainerInstanceKey] = hostRoot;
  // }
  var containerNodeType = container.nodeType;
  // ⑤
  {
    var rootContainerElement = container.nodeType === COMMENT_NODE ? container.parentNode : container;
    listenToAllSupportedEvents(rootContainerElement);
  }

  if (mutableSources) {
    for (var i = 0; i < mutableSources.length; i++) {
      var mutableSource = mutableSources[i];
      registerMutableSourceForHydration(root, mutableSource);
    }
  }

  return root;
}

function createContainer(containerInfo, tag, hydrate, hydrationCallbacks) {
  return createFiberRoot(containerInfo, tag, hydrate);
}

function createFiberRoot(containerInfo, tag, hydrate, hydrationCallbacks) {
  var root = new FiberRootNode(containerInfo, tag, hydrate);
  // stateNode is any.

  var uninitializedFiber = createHostRootFiber(tag);
  root.current = uninitializedFiber;
  uninitializedFiber.stateNode = root;

  // ③
  initializeUpdateQueue(uninitializedFiber);
  return root;
}

function initializeUpdateQueue(fiber) {
  var queue = {
    baseState: fiber.memoizedState,
    firstBaseUpdate: null,
    lastBaseUpdate: null,
    shared: {
      pending: null
    },
    effects: null
  };
  fiber.updateQueue = queue;
}
```

##### listenToAllSupportedEvents

① 标记已经添加监听DOM元素，如果已经绑定过事件监听不会重复执行
   
   allNativeEvents 为Set集合,没有事件委托的事件（媒体事件等,`listenToNativeEvent` 第二个参数 `isCapturePhaseListener` 为 `false`


```javascript
var listeningMarker = '_reactListening' + Math.random().toString(36).slice(2);
function listenToAllSupportedEvents(rootContainerElement) {
  {               
    if (rootContainerElement[listeningMarker]) {
      // Performance optimization: don't iterate through events
      // for the same portal container or root node more than once.
      // TODO: once we remove the flag, we may be able to also
      // remove some of the bookkeeping maps used for laziness.
      return;
    }
    // ① 
    rootContainerElement[listeningMarker] = true;
    allNativeEvents.forEach(function (domEventName) {
      if (!nonDelegatedEvents.has(domEventName)) {
        listenToNativeEvent(domEventName, false, rootContainerElement, null);
      }

      listenToNativeEvent(domEventName, true, rootContainerElement, null);
    });
  }
}

```

② 事件按照优先级分类

③ 把事件和优先级的对应关系存入 eventPriorities Map集合

④ allNativeEvents 保存原生事件



```javascript

// ②
var discreteEventPairsForSimpleEventPlugin = ['cancel', 'cancel', 'click', 'click', 'close', 'close', 'contextmenu', 'contextMenu', 'copy', 'copy', 'cut', 'cut', 'auxclick', 'auxClick', 'dblclick', 'doubleClick', // Careful!
'dragend', 'dragEnd', 'dragstart', 'dragStart', 'drop', 'drop', 'focusin', 'focus', // Careful!
'focusout', 'blur', // Careful!
'input', 'input', 'invalid', 'invalid', 'keydown', 'keyDown', 'keypress', 'keyPress', 'keyup', 'keyUp', 'mousedown', 'mouseDown', 'mouseup', 'mouseUp', 'paste', 'paste', 'pause', 'pause', 'play', 'play', 'pointercancel', 'pointerCancel', 'pointerdown', 'pointerDown', 'pointerup', 'pointerUp', 'ratechange', 'rateChange', 'reset', 'reset', 'seeked', 'seeked', 'submit', 'submit', 'touchcancel', 'touchCancel', 'touchend', 'touchEnd', 'touchstart', 'touchStart', 'volumechange', 'volumeChange'];
var otherDiscreteEvents = ['change', 'selectionchange', 'textInput', 'compositionstart', 'compositionend', 'compositionupdate'];


var userBlockingPairsForSimpleEventPlugin = ['drag', 'drag', 'dragenter', 'dragEnter', 'dragexit', 'dragExit', 'dragleave', 'dragLeave', 'dragover', 'dragOver', 'mousemove', 'mouseMove', 'mouseout', 'mouseOut', 'mouseover', 'mouseOver', 'pointermove', 'pointerMove', 'pointerout', 'pointerOut', 'pointerover', 'pointerOver', 'scroll', 'scroll', 'toggle', 'toggle', 'touchmove', 'touchMove', 'wheel', 'wheel']; // prettier-ignore

var continuousPairsForSimpleEventPlugin = ['abort', 'abort', ANIMATION_END, 'animationEnd', ANIMATION_ITERATION, 'animationIteration', ANIMATION_START, 'animationStart', 'canplay', 'canPlay', 'canplaythrough', 'canPlayThrough', 'durationchange', 'durationChange', 'emptied', 'emptied', 'encrypted', 'encrypted', 'ended', 'ended', 'error', 'error', 'gotpointercapture', 'gotPointerCapture', 'load', 'load', 'loadeddata', 'loadedData', 'loadedmetadata', 'loadedMetadata', 'loadstart', 'loadStart', 'lostpointercapture', 'lostPointerCapture', 'playing', 'playing', 'progress', 'progress', 'seeking', 'seeking', 'stalled', 'stalled', 'suspend', 'suspend', 'timeupdate', 'timeUpdate', TRANSITION_END, 'transitionEnd', 'waiting', 'waiting'];

var DiscreteEvent = 0;
var UserBlockingEvent = 1;
var ContinuousEvent = 2;

function registerSimpleEvents() {
  registerSimplePluginEventsAndSetTheirPriorities(discreteEventPairsForSimpleEventPlugin, DiscreteEvent);
  registerSimplePluginEventsAndSetTheirPriorities(userBlockingPairsForSimpleEventPlugin, UserBlockingEvent);
  registerSimplePluginEventsAndSetTheirPriorities(continuousPairsForSimpleEventPlugin, ContinuousEvent);
  setEventPriorities(otherDiscreteEvents, DiscreteEvent);
}

function registerSimplePluginEventsAndSetTheirPriorities(eventTypes, priority) {
  // As the event types are in pairs of two, we need to iterate
  // through in twos. The events are in pairs of two to save code
  // and improve init perf of processing this array, as it will
  // result in far fewer object allocations and property accesses
  // if we only use three arrays to process all the categories of
  // instead of tuples.
  for (var i = 0; i < eventTypes.length; i += 2) {
    var topEvent = eventTypes[i];
    var event = eventTypes[i + 1];
    var capitalizedEvent = event[0].toUpperCase() + event.slice(1);
    var reactName = 'on' + capitalizedEvent;
    // ③
    eventPriorities.set(topEvent, priority);
    topLevelEventsToReactNames.set(topEvent, reactName);
    registerTwoPhaseEvent(reactName, [topEvent]);
  }
}
// ④
function registerDirectEvent(registrationName, dependencies) {
  for (var i = 0; i < dependencies.length; i++) {
    allNativeEvents.add(dependencies[i]);
  }
}

```

⑤ eventSystemFlags 通过位运算合并了事件捕获的标识

⑥ 获取之前存在 `eventPriorities` Map结构中的事件优先级

⑦ 独立事件优先级处理函数 dispatchDiscreteEvent

⑧ 用户阻塞事件优先级处理函数 [dispatchUserBlockingUpdate](/posts/ce2c3a7b/#dispatchUserBlockingUpdate)

⑨ 根据优先级创建事件监听函数

⑩



```javascript
var IS_EVENT_HANDLE_NON_MANAGED_NODE = 1;
var IS_NON_DELEGATED = 1 << 1;
var IS_CAPTURE_PHASE = 1 << 2;
var IS_REPLAYED = 1 << 4;

//                               事件名称           事件委托             container              null 
function listenToNativeEvent(domEventName, isCapturePhaseListener, rootContainerElement, targetElement) {
  if (!listenerSet.has(listenerSetKey)) {
      if (isCapturePhaseListener) {
        // ⑤
        eventSystemFlags |= IS_CAPTURE_PHASE;
      } 
    // ...                 container    时间名称          4                 true
    addTrappedEventListener(target, domEventName, eventSystemFlags, isCapturePhaseListener);
  }
}

function addTrappedEventListener(targetContainer, domEventName, eventSystemFlags, isCapturePhaseListener, isDeferredListenerForLegacyFBSupport) {
  // ⑨
  var listener = createEventListenerWrapperWithPriority(targetContainer, domEventName, eventSystemFlags); 

  var isPassiveListener = undefined;

  targetContainer =  targetContainer;
  var unsubscribeListener; // When legacyFBSupport is enabled, it's for when we


  if (isCapturePhaseListener) {
    if (isPassiveListener !== undefined) {
      unsubscribeListener = addEventCaptureListenerWithPassiveFlag(targetContainer, domEventName, listener, isPassiveListener);
    } else {
      unsubscribeListener = addEventCaptureListener(targetContainer, domEventName, listener);
    }
  } else {
    if (isPassiveListener !== undefined) {
      unsubscribeListener = addEventBubbleListenerWithPassiveFlag(targetContainer, domEventName, listener, isPassiveListener);
    } else {
      unsubscribeListener = addEventBubbleListener(targetContainer, domEventName, listener);
    }
  }
}

function createEventListenerWrapperWithPriority(targetContainer, domEventName, eventSystemFlags) {
  // ⑥
  var eventPriority = getEventPriorityForPluginSystem(domEventName);
  var listenerWrapper;
  
  switch (eventPriority) {
    // ⑦
    case DiscreteEvent:
      listenerWrapper = dispatchDiscreteEvent;
      break;
    // ⑧
    case UserBlockingEvent:
      listenerWrapper = dispatchUserBlockingUpdate;
      break;

    case ContinuousEvent:
    default:
      listenerWrapper = dispatchEvent;
      break;
  }

  return listenerWrapper.bind(null, domEventName, eventSystemFlags, targetContainer);
}
```

##### dispatchUserBlockingUpdate

① `UserBlockingPriority$1 = Scheduler.unstable_UserBlockingPriority` Scheduler模块中设置的用户阻塞优先级为2

② 

③④⑤⑥⑦⑧⑨⑩⑪⑫


```javascript
function dispatchUserBlockingUpdate(domEventName, eventSystemFlags, container, nativeEvent) {
  {
    // ①                     2          
    runWithPriority(UserBlockingPriority$1, dispatchEvent.bind(null, domEventName, eventSystemFlags, container, nativeEvent));
  }
}



```

##### updateContainer

```javascript
function updateContainer(element, container, parentComponent, callback) {
  // ...
  // 根节点的fiberNode
  var current$1 = container.current;
  // 如果performance支持，返回performance.now
  // 如果不支持返回  当前时间戳 - 初始化代码的时间
  var eventTime = requestEventTime();
  // ...
  // 把fiberNode的mode与BlockingMode=2做&运算
  // 第一次渲染时根元素的fiberNode=8 返回syncLane=1
  var lane = requestUpdateLane(current$1);
  var context = getContextForSubtree(parentComponent);
  // ...
  // 返回一个对象update对象
  // {
  //   eventTime: eventTime,
  //   lane: lane,
  //   tag: UpdateState,
  //   payload: null,
  //   callback: null,
  //   next: null
  // }
  var update = createUpdate(eventTime, lane);
  // Caution: React DevTools currently depends on this property being called "element".
  // element为子元素的fiberNode
  update.payload = {
    element: element
  };
  callback = callback === undefined ? null : callback;
  update.callback = callback;
  // 添加到更新队列 fiber===current$1
  // var updateQueue = fiber.updateQueue;
  // 当updateQueue === null 表示fiber节点已经被卸载， 直接return
  // var sharedQueue = updateQueue.shared;
  // var pending = sharedQueue.pending;
  // pending为第一个更新任务
  // if (pending === null) {
  //   update.next = update;
  // } else {
  //   update.next = pending.next;
  //   pending.next = update;
  // }
  // 更新队列循环链表
  // sharedQueue.pending = update;
  enqueueUpdate(current$1, update);
  scheduleUpdateOnFiber(current$1, lane, eventTime);
  return lane;
}
```

##### scheduleUpdateOnFiber

```javascript
//                       根节点的fiberNode  |   更新等级syncLane=1  | 代码执行到这里的时间戳
function scheduleUpdateOnFiber(fiber,                 lane,              eventTime) {
  // 是否触发了死循环， 调用更新层级过深
  checkForNestedUpdates();
  warnAboutRenderPhaseUpdatesInDEV(fiber);
  // 把fiberNode上的lanes和lane做与运算合并优先级,并把fiberNode.lanes重新赋值
  // 最后返回fiberRoot(fiberNode.stateNode)
  var root = markUpdateLaneFromFiberToRoot(fiber, lane);
  // root.pendingLanes |= updateLane; 
  // var higherPriorityLanes = updateLane - 1; // Turns 0b1000 into 0b0111
  // root.suspendedLanes &= higherPriorityLanes;
  // root.pingedLanes &= higherPriorityLanes;
  // var eventTimes = root.eventTimes;
  // var index = laneToIndex(updateLane);
  // eventTimes[index] = eventTime;
  markRootUpdated(root, lane, eventTime);
  // ...
  if (lane === SyncLane) {
      // ...
      // 会进入协调器在主线程中执行
      performSyncWorkOnRoot(root);
  }
  // ...
  mostRecentlyUpdatedRoot = root;
} // This is split into a separate function so we can mark a fiber with pending
// work without treating it as a typical update that originates from an event;
// e.g. retrying a Suspense boundary isn't an update, but it does schedule work
// on a fiber.
```

##### performSyncWorkOnRoot



##### beginWork$1

全局的beginWork1方法，调用内部beginWork方法，reactDom的入口

```javascript
beginWork$1 = function (current, unitOfWork, lanes) {
  // 如果组件抛出错误，则在一个同步事件派发中在执行一次，那样调试器(debugger)将会把它看做一个未捕获的错误
  // 更多信息查看ReactErrorUtils，在进入begin阶段之前，拷贝work-in-progress放在一个虚构的fiber上
  // 如果beginWork抛出（错误）,我们将使用这个（fiber）重置状态（state）.
  var originalWorkInProgressCopy = assignFiberPropertiesInDEV(dummyFiber, unitOfWork);

  try {
    return beginWork(current, unitOfWork, lanes);
  } catch (originalError) {
    if (originalError !== null && typeof originalError === 'object' && typeof originalError.then === 'function') {
      // Don't replay promises. Treat everything else like an error.
      throw originalError;
    } // Keep this code in sync with handleError; any changes here must have
    // corresponding changes there.
  }
}
```