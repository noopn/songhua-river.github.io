---
title: React原理 state深入
mathjax: true

date: 2021-09-02 15:26:41
categories:
  - React
tags:
  - React
---


#### 同步还是异步

`batchUpdate`批量更新可能并不准确，React 是有多种模式的，基本平时用的都是 `legacy` 模式下的 `React`，除了`legacy` 模式，还有 `blocking` 模式和 `concurrent` 模式， `blocking` 可以视为 `concurrent` 的优雅降级版本和过渡版本，React 未来将以 `concurrent` 模式作为默认版本，这个模式下会开启一些新功能。

对于 concurrent 模式下，会采用不同 State 更新逻辑。前不久透露出未来的React v18 版本，concurrent 将作为一个稳定的功能出现。

#### setState时候发生了什么

+ 首先，`setState` 会产生当前更新的优先级（老版本用 expirationTime ，新版本用 lane ）。

+ 接下来 React 会从 `fiber Root` 根部 `root fiber` 向下调和子节点，调和阶段将对比发生更新的地方，更新对比 expirationTime ，找到发生更新的组件，合并 `state`，然后触发 `render` 函数，得到新的 UI 视图层，完成 `render` 阶段。

+ 接下来到 `commit` 阶段，`commit` 阶段，替换真实 DOM ，完成此次更新流程。

+ 接下来会执行 `setState` 中 `callback` 函数,如上的()=>{ console.log(this.state.number) }，到此为止完成了一次 `setState` 全过程。

#### 对更新的限制

① pureComponent 可以对 state 和 props 进行浅比较，如果没有发生变化，那么组件不更新。

② shouldComponentUpdate 生命周期可以通过判断前后 state 变化来决定组件需不需要更新，需要更新返回true，否则返回false。

#### 实现原理

`setState`实际上调用了`Component`上的[updater对象的类方法](/posts/72e97988/#class类组件)

> /react-reconciler/src/ReactFiberClassComponent.new.js

```javascript
function adoptClassInstance(workInProgress: Fiber, instance: any): void {
  instance.updater = classComponentUpdater;
  workInProgress.stateNode = instance;
}
```

```javascript
const classComponentUpdater = {
  enqueueSetState(inst, payload, callback) {
    // 获取当前fiber节点
    const fiber = getInstance(inst);
    // 获取当前更新时间
    const eventTime = requestEventTime();
    // 获取更新优先级
    const lane = requestUpdateLane(fiber);

    // 每一次调用`setState`，react 都会创建一个 update 
    const update = createUpdate(eventTime, lane);
    update.payload = payload;

    // 保存更新之后的会掉函数
    if (callback !== undefined && callback !== null) {
      update.callback = callback;
    }
    /* enqueueUpdate 把当前的update 传入当前fiber，待更新队列中 */
    enqueueUpdate(fiber, update, lane);

    // 开始调度更新
    const root = scheduleUpdateOnFiber(fiber, lane, eventTime);
  }
}
```

**批量更新在何时处理？** 

大部分的更新都是由UI交互产生，或异步的方法和函数，例如`setTimeout`或`xhr`,批量更新和事件系统息息相关

事件系统的函数调用过程为：

> /react-dom/src/client/ReactDOMRoot.js

```javascript
export function hydrateRoot(
  container: Container,
  initialChildren: ReactNodeList,
  options?: HydrateRootOptions,
): RootType {
  // 在root元素上监听所有的时间
  listenToAllSupportedEvents(container);
}
```

```javascript
export function listenToAllSupportedEvents(rootContainerElement: EventTarget) {
    // 循环所有的事件名称，绑定事件
    allNativeEvents.forEach(domEventName => {
        listenToNativeEvent(domEventName, true, rootContainerElement);
    });
}
```

```javascript
function listenToNativeEvent(domEventName, isCapturePhaseListener, rootContainerElement, targetElement) {
    addTrappedEventListener(target, domEventName, eventSystemFlags, isCapturePhaseListener);
}
```

```javascript
function addTrappedEventListener(targetContainer, domEventName, eventSystemFlags, isCapturePhaseListener, isDeferredListenerForLegacyFBSupport) {
  var listener = createEventListenerWrapperWithPriority(targetContainer, domEventName, eventSystemFlags); // If passive option is not supported, then the
}
```

```javascript
function createEventListenerWrapperWithPriority(targetContainer, domEventName, eventSystemFlags) {
  var eventPriority = getEventPriorityForPluginSystem(domEventName);
  var listenerWrapper;
  switch (eventPriority) {
    case DiscreteEvent:
      listenerWrapper = dispatchDiscreteEvent;
      break;

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

```javascript
function dispatchEvent(domEventName, eventSystemFlags, targetContainer, nativeEvent) {
  dispatchEventForPluginEventSystem(domEventName, eventSystemFlags, nativeEvent, null, targetContainer);
} // Attempt dispatching an event. Returns a SuspenseInstance or Container if it's blocked.

```

```javascript
// 在`legacy`模式下，所有的事件都将经过此函数同一处理 
function dispatchEventForPluginEventSystem(domEventName, eventSystemFlags, nativeEvent, targetInst, targetContainer) {
  batchedEventUpdates(function () {
    return dispatchEventsForPlugins(domEventName, eventSystemFlags, nativeEvent, ancestorInst);
  });
}
```

```javascript
function batchedEventUpdates(fn, a, b) {
  // 标记为批量更新
  // scheduleUpdateOnFiber中会根据这个变量判断是否批量更新
  isBatchingEventUpdates = true;
  try {
    return batchedEventUpdatesImpl(fn, a, b);
  } finally {
    // try 不会影响finally执行，执行结束后标记为false
    isBatchingEventUpdates = false;
    finishEventHandler();
  }
}
```


#### 更新调用栈

```javascript
export default class index extends React.Component{
    state = { number:0 }
    handleClick= () => {
          this.setState({ number:this.state.number + 1 },()=>{   console.log( 'callback1', this.state.number)  })
          console.log(this.state.number)
          this.setState({ number:this.state.number + 1 },()=>{   console.log( 'callback2', this.state.number)  })
          console.log(this.state.number)
          this.setState({ number:this.state.number + 1 },()=>{   console.log( 'callback3', this.state.number)  })
          console.log(this.state.number)
    }
    render(){
        return <div>
            { this.state.number }
            <button onClick={ this.handleClick }  >number++</button>
        </div>
    }
} 
```

最终打印的结果是 `0,0,0,callback1 ,1,callback2 ,1,callback3 ,1,` 

![](0001.awebp)

如果是异步执行，调用栈会被改变

```javascript
setTimeout(()=>{
  this.setState({ number:this.state.number + 1 },()=>{   console.log( 'callback1', this.state.number)  })
  console.log(this.state.number)
  this.setState({ number:this.state.number + 1 },()=>{    console.log( 'callback2', this.state.number)  })
  console.log(this.state.number)
  this.setState({ number:this.state.number + 1 },()=>{   console.log( 'callback3', this.state.number)  })
  console.log(this.state.number)
})
```

![](0002.awebp)

在异步环境批量更新

```javascript
import ReactDOM from 'react-dom'
const { unstable_batchedUpdates } = ReactDOM
setTimeout(()=>{
    unstable_batchedUpdates(()=>{
        this.setState({ number:this.state.number + 1 })
        console.log(this.state.number)
        this.setState({ number:this.state.number + 1})
        console.log(this.state.number)
        this.setState({ number:this.state.number + 1 })
        console.log(this.state.number)
    })
})
```

**那么如何提升更新优先级呢？**

React-dom 提供了 flushSync ，flushSync 可以将回调函数中的更新任务，放在一个较高的优先级中。React 设定了很多不同优先级的更新任务。如果一次更新任务在 flushSync 回调函数内部，那么将获得一个较高优先级的更新。

```javascript
handerClick=()=>{
  setTimeout(()=>{
      this.setState({ number: 1  })
  })
  this.setState({ number: 2  })
  ReactDOM.flushSync(()=>{
      this.setState({ number: 3  })
  })
  this.setState({ number: 4  })
}
render(){
   console.log(this.state.number)
   return ...
}
```

最终结果打印 `3,4,1`

**flushSync补充说明**：flushSync 在同步条件下，会合并之前的 setState | useState，可以理解成，如果发现了 flushSync ，就会先执行更新，如果之前有未更新的 setState ｜ useState ，就会一起合并了，所以就解释了如上，2 和 3 被批量更新到 3 ，所以 3 先被打印。

综上所述， React 同一级别更新优先级关系是:

flushSync 中的 setState > 正常执行上下文中 setState > setTimeout ，Promise 中的 setState。


#### hooks中的state

行为与类中的相似, 需要注意的是，在一个方法中的执行上下文中，是获取不到最新的`state`

```javascript
export default function Index(props){
  const [ number , setNumber ] = React.useState(0)
  /* 监听 number 变化 */
  React.useEffect(()=>{
      console.log('监听number变化，此时的number是:  ' + number )
  },[ number ])

  const handerClick = ()=>{
      // 遇到下面高优先级更新被合并更新
      setNumber(5) 

      // 和handerClick方法中下面的几个打印函数一样
      // 打印值都为0,每次触发更新之后，Index函数都会被重新执行
      // number值已经与当前环境绑定
      console.log(number);

      /** 高优先级更新 **/
      ReactDOM.flushSync(()=>{
          setNumber(3) 
      })

      // 批量更新，只会触发一次更新
      setNumber(1) 
      setNumber(2) 
      console.log(number);

      // 滞后更新 ，批量更新规则被打破
      setTimeout(()=>{
          setNumber(4) 
          console.log(number);
      })
     
  };

  // 每次函数被重新执行的时候，打印最新的state值
  console.log(number)
  return <div>
      <span> { number }</span>
      <button onClick={ handerClick }  >number++</button>
  </div>
}
```


#### 相同与不同

**相同**： 

首先从原理角度出发，setState和 useState 更新视图，底层都调用了 scheduleUpdateOnFiber 方法，而且事件驱动情况下都有批量更新规则。

**不同**: 

在不是 pureComponent 组件模式下， setState 不会浅比较两次 state 的值，只要调用 setState，在没有其他优化手段的前提下，就会执行更新。但是 useState 中的 dispatchAction 会默认比较两次 state 是否相同，然后决定是否更新组件。

setState 有专门监听 state 变化的回调函数 callback，可以获取最新state；但是在函数组件中，只能通过 useEffect 来执行 state 变化引起的副作用。

setState 在底层处理逻辑上主要是和老 state 进行合并处理，而 useState 更倾向于重新赋值。


