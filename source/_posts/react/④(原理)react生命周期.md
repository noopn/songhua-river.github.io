---
title: React原理 生命周期
mathjax: true
categories:
  - React
tags:
  - React

date: 2021-09-08 12:30:13
---


#### 预备

React 有两个重要阶段，render 阶段和 commit 阶段，React 在调和( render )阶段会深度遍历 React fiber 树，目的就是发现不同( diff )，不同的地方就是接下来需要更新的地方，对于变化的组件，就会执行 render 函数。在一次调和过程完毕之后，就到了commit 阶段，commit 阶段会创建修改真实的 DOM 节点。

> 类组件的处理逻辑在[beginWork](/posts/72e97988/#组件的本质)中被调用，react-reconciler/src/ReactFiberBeginWork.js

① instance 类组件对应实例。
② workInProgress 树，当前正在调和的 fiber 树 ，一次更新中，React 会自上而下深度遍历子代 fiber ，如果遍历到一个 fiber ，会把当前 fiber 指向 workInProgress。
③ current 树，在初始化更新中，current = null ，在第一次 fiber 调和之后，会将 workInProgress 树赋值给 current 树。React 来用workInProgress 和 current 来确保一次更新中，快速构建，并且状态不丢失。
④ Component 就是项目中的 class 组件。
⑤ nextProps 作为组件在一次更新中新的 props 。
⑥ renderLanes 作为下一次渲染的优先级。

在组件实例上可以通过 `_reactInternals` 属性来访问组件对应的 `fiber` 对象。在 `fiber` 对象上，可以通过 `stateNode` 来访问当前 `fiber` 对应的组件实例。

`class Instance` . `_reactInternals` => `class Fiber`

`class Fiber` . `stateNode` => `class Instance`


```javascript
function updateClassComponent(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: any,
  nextProps: any,
  renderLanes: Lanes,
) {
  // stateNode 是 fiber 指向 类组件实例的指针。
  const instance = workInProgress.stateNode;
  let shouldUpdate;
  // instance 为组件实例,如果组件实例不存在，证明该类组件没有被挂载过，那么会走初始化流程
  if (instance === null) {
    // 在这个方法中组件通过new被实例化
    constructClassInstance(workInProgress, Component, nextProps);
    // 初始化挂载组件流程
    mountClassInstance(workInProgress, Component, nextProps, renderLanes);
    // shouldUpdate 标识用来证明 组件是否需要更新。
    shouldUpdate = true;
  } else if (current === null) {
    // 已经存在了一个实例可以被复用
    shouldUpdate = resumeMountClassInstance(
      workInProgress,
      Component,
      nextProps,
      renderLanes,
    );
  } else {
    // 更新组件流程
    shouldUpdate = updateClassInstance(
      current,
      workInProgress,
      Component,
      nextProps,
      renderLanes,
    );
  }

  const nextUnitOfWork = finishClassComponent(
    current,
    workInProgress,
    Component,
    shouldUpdate,
    hasContext,
    renderLanes,
  );
  return nextUnitOfWork;
}

```

```javascript
function finishClassComponent(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: any,
  shouldUpdate: boolean,
  hasContext: boolean,
  renderLanes: Lanes,
) {
  // 即使 shouldComponentUpdate 返回了 false,Refs也应该被更新
  markRef(current, workInProgress);

  const instance = workInProgress.stateNode;

  // Rerender
  ReactCurrentOwner.current = workInProgress;
  // 获取子节点
  let nextChildren = instance.render();

  // 调和子节点
  reconcileChildren(current, workInProgress, nextChildren, renderLanes);

  // Memoize state using the values we just used to render.
  // TODO: Restructure so we never read values from the instance.
  workInProgress.memoizedState = instance.state;

  // The context might have changed so we need to recalculate it.
  if (hasContext) {
    invalidateContextProvider(workInProgress, Component, true);
  }

  return workInProgress.child;
}
```


#### 初始化阶段

`constructClassInstance`构建了组件的[实例](/posts/72e97988/#组件的本质)，在实例化组件之后，会调用 `mountClassInstance` 组件初始化。

> react-reconciler/src/ReactFiberClassComponent.js

```javascript
// 在从没有渲染过的实例上执行挂载生命周期
function mountClassInstance(
  workInProgress: Fiber,
  ctor: any,
  newProps: any,
  renderLanes: Lanes,
): void {
  // 组件实例
  const instance = workInProgress.stateNode;
  instance.props = newProps;
  instance.state = workInProgress.memoizedState;
  instance.refs = emptyRefsObject;

  initializeUpdateQueue(workInProgress);
  
  // 拿到类组件构造函数的静态方法
  const getDerivedStateFromProps = ctor.getDerivedStateFromProps;
    if (typeof getDerivedStateFromProps === 'function') {
        var prevState = workInProgress.memoizedState;
        // 返回更新之后的state
        var partialState = getDerivedStateFromProps(nextProps, prevState);
        // 如果返回的state不合法，使用原有状态，否则合并两个状态生成一个新的state对象
        var memoizedState = partialState === null || partialState === undefined ? prevState : _assign({}, prevState, partialState);
        workInProgress.memoizedState = memoizedState; 
        
        // Once the update queue is empty, persist the derived state onto the
        // base state.
        if (workInProgress.lanes === NoLanes) {
            // Queue is always non-null for classes
            var updateQueue = workInProgress.updateQueue;
            updateQueue.baseState = memoizedState;
        }
        instance.state = workInProgress.memoizedState;
    }

  if (typeof instance.componentDidMount === 'function') {
    workInProgress.flags |= fiberFlags;
  }
}

```

**`render` 函数执行**

到此为止 `mountClassInstance` 函数完成，但是上面 `updateClassComponent` 函数， 在执行完 `mountClassInstance` 后，执行了 `render` 渲染函数，形成了 children ， 接下来 React 调用 `reconcileChildren` 方法深度调和 `children` 。

**`componentDidMount`函数执行**

上述提及的几生命周期都是在 render 阶段执行的。一旦 React 调和完所有的 fiber 节点，就会到 commit 阶段，在组件初始化 commit 阶段，会调用 componentDidMount 生命周期。

```javascript
function commitRootImpl(root, renderPriorityLevel){
    const finishedWork = root.finishedWork;
    commitLayoutEffects(finishedWork, root, lanes);
}
```

`17.0.2`

```javascript
function commitLifeCycles(finishedRoot,current,finishedWork){
     switch (finishedWork.tag){                             /* fiber tag 在第一节讲了不同fiber类型 */
        case ClassComponent: {                              /* 如果是 类组件 类型 */
             const instance = finishedWork.stateNode        /* 类实例 */
             if(current === null){                          /* 类组件第一次调和渲染 */
                instance.componentDidMount() 
             }else{                                         /* 类组件更新 */
                instance.componentDidUpdate(prevProps,prevState，instance.__reactInternalSnapshotBeforeUpdate); 
             }
        }
     }
}
```

`17.0.3`

```javascript
function commitLayoutEffectOnFiber(
  finishedRoot: FiberRoot,
  current: Fiber | null,
  finishedWork: Fiber,
  committedLanes: Lanes,
): void {
    switch (finishedWork.tag) {
        case ClassComponent: {
            const instance = finishedWork.stateNode;
            if (!offscreenSubtreeWasHidden) {
                if (
                    enableProfilerTimer &&
                    enableProfilerCommitHooks &&
                    finishedWork.mode & ProfileMode
                ) {
                    try {
                    startLayoutEffectTimer();
                    instance.componentDidMount();
                    } finally {
                    recordLayoutEffectDuration(finishedWork);
                    }
                } else {
                    instance.componentDidMount();
                }
               
            commitUpdateQueue(finishedWork, updateQueue, instance);
            }
            break;
        }
    }
}

```

#### 更新阶段

回到了最开始 updateClassComponent 函数了，当发现 current 不为 null 的情况时，说明该类组件被挂载过，那么直接按照更新逻辑来处理。

> react-reconciler/src/ReactFiberClassComponent.js

```javascript
function updateClassInstance(current,workInProgress,ctor,newProps,renderExpirationTime){
    // 类组件实例
    const instance = workInProgress.stateNode;
    // 判断是否具有 getDerivedStateFromProps 生命周期
    const hasNewLifecycles =  typeof ctor.getDerivedStateFromProps === 'function'
    if(!hasNewLifecycles && typeof instance.componentWillReceiveProps === 'function' ){
        // 浅比较 props 不相等
         if (oldProps !== newProps || oldContext !== nextContext) {
            // 执行生命周期 componentWillReceiveProps
            instance.componentWillReceiveProps(newProps, nextContext);
         }
    }
    let newState = (instance.state = oldState);
    if (typeof getDerivedStateFromProps === 'function') {
        /* 执行生命周期getDerivedStateFromProps  ，逻辑和mounted类似 ，合并state  */
        ctor.getDerivedStateFromProps(nextProps,prevState)  
        newState = workInProgress.memoizedState;
    }
    let shouldUpdate = true
    /* 执行生命周期 shouldComponentUpdate 返回值决定是否执行render ，调和子节点 */
    if(typeof instance.shouldComponentUpdate === 'function' ){ 
        shouldUpdate = instance.shouldComponentUpdate(newProps,newState,nextContext,);
    }
    if(shouldUpdate){
        if (typeof instance.componentWillUpdate === 'function') {
            /* 执行生命周期 componentWillUpdate  */
            instance.componentWillUpdate(); 
    }
    return shouldUpdate
}
```

**getSnapshotBeforeUpdate** 的执行也是在 commit 阶段，commit 阶段细分为 before Mutation( DOM 修改前)，Mutation ( DOM 修改)，Layout( DOM 修改后) 三个阶段，getSnapshotBeforeUpdate 发生在before Mutation 阶段

####　销毁阶段

在一次调和更新中，如果发现元素被移除，就会打对应的 Deletion 标签 ，然后在 commit 阶段就会调用 `componentWillUnmount` 生命周期，接下来统一卸载组件以及 DOM 元素。

```javascript
var callComponentWillUnmountWithTimer = function (current, instance) {
  instance.props = current.memoizedProps;
  instance.state = current.memoizedState;

  {
    instance.componentWillUnmount();
  }
};
```

![](0001.jpg)

#### 各生命周期最佳实践

#####　constructor

```javascript
constructor(props){
    super(props)        // 执行 super ，别忘了传递props,才能在接下来的上下文中，获取到props。
    this.state={       //① 可以用来初始化state，比如可以用来获取路由中的
        name:'alien'
    }
    this.handleClick = this.handleClick.bind(this) /* ② 绑定 this */
    this.handleInputChange = debounce(this.handleInputChange , 500) /* ③ 绑定防抖函数，防抖 500 毫秒 */
    const _render = this.render
    this.render = function(){
        return _render.bind(this)  /* ④ 劫持修改类组件上的一些生命周期 */
    }
}
```

##### UNSAFE_componentWillMount

在新版本的react（v16.3）中`componentWillMount`已经变更为`UNSAFE_componentWillMount`,而且不在推荐使用，其中很大一部分原因是经常被滥用

+ 初始化状态

```javascript
class ExampleComponent extends React.Component {
  constructor(props){
    this.state = {
      color: "red"
    };
  }
  state = {
    color: "red"
  };
  componentWillMount() {
    // 应该将初始化状态放到构造函数或属性的初始化状态中
    // this.setState({
    //   color: "red"
    // });
  }
}
```

+ 获取异步的外部数据

```javascript
// Before
class ExampleComponent extends React.Component {
  state = {
    externalData: null,
  };

  componentWillMount() {
    this._asyncRequest = loadMyAsyncData().then(
      externalData => {
        this._asyncRequest = null;
        this.setState({externalData});
      }
    );
  }

  componentWillUnmount() {
    if (this._asyncRequest) {
      this._asyncRequest.cancel();
    }
  }

  render() {
    if (this.state.externalData === null) {
      // 渲染加载状态 ...
    } else {
      // 渲染真实 UI ...
    }
  }
}
```

上述代码对于服务器渲染（异步的请求数据不会被放到state中）和即将推出的异步渲染模式（可能执行多次）都存在问题。通常会把上面的操作放到 `componentDidMount` 

另一个问题是，`componentWillMount`的名字比较反直觉，听起来觉得在这个生命周期中获取数据，可以避免第一次`render`的时候进行一次空渲染，单实际上 `componentWillMount`执行后 `render`方法会立即执行，如果`componentWillMount` 没有获取到可用数据，`render`方法中同样获取不到数据。

如果想稍微提前一点请求，从而适应低性能的设备可以使用下面的方法

```javascript
// This is an advanced example! It is not intended for use in application code.
// Libraries like Relay may make use of this technique to save some time on low-end mobile devices.
// Most components should just initiate async requests in componentDidMount.

class ExampleComponent extends React.Component {
  _hasUnmounted = false;

  state = {
    externalData: null,
  };

  constructor(props) {
    super(props);

    // Prime an external cache as early as possible.
    // Async requests are unlikely to complete before render anyway,
    // So we aren't missing out by not providing a callback here.
    asyncLoadData(this.props.someId);
  }

  componentDidMount() {
    // Now that this component has mounted,
    // Wait for earlier pre-fetch to complete and update its state.
    // (This assumes some kind of external cache to avoid duplicate requests.)
    asyncLoadData(this.props.someId).then(externalData => {
      if (!this._hasUnmounted) {
        this.setState({ externalData });
      }
    });
  }

  componentWillUnmount() {
    this._hasUnmounted = true;
  }

  render() {
    if (this.state.externalData === null) {
      // Render loading state ...
    } else {
      // Render real UI ...
    }
  }
}
```

+ 事件监听

```javascript
// Before
class ExampleComponent extends React.Component {
  componentWillMount() {
    this.setState({
      subscribedValue: this.props.dataSource.value,
    });
    // 这是不安全的，它会导致内存泄漏！
    this.props.dataSource.subscribe(
      this.handleSubscriptionChange
    );
  }

  componentWillUnmount() {
    this.props.dataSource.unsubscribe(
      this.handleSubscriptionChange
    );
  }

  handleSubscriptionChange = dataSource => {
    this.setState({
      subscribedValue: dataSource.value,
    });
  };
}
```

上面的代码在服务端可能永远不会调用 `componentWillUnmount`, 或者在渲染完成之前可能被中断，导致不调用 `componentWillUnmount`,这两种场景都可能导致内存泄露，推荐的做法是移到`componentDidMount` 

订阅的触发，导致属性和状态的改变，`Redux` 或 `MobX` 会帮助我们实现，对于应用开发场景可以使用 [`create-subscription`](https://github.com/facebook/react/tree/main/packages/create-subscription), 在这里可以看到源码分析。



##### UNSAFE_componentWillReceiveProps getDerivedStateFromProps

首先明确一下这个两个方法在使用时，最常见的错误

1. 直接复制 props 到 state 上
2. 如果 props 和 state 不一致就更新 state
3. 经常被误解只有`props`改变时这两个方法才会调用，实际上只要父组件重新渲染这两个方法就会被调用

想说清楚造成这两个错误的原因，需要先了解一个概念叫做 **受控**

**受控**和**非受控**通常用来指代表单的 `inputs`,但是也可以用来描述数据频繁更新的组件。如果组件完全依赖于外部传入的`props`,可以认为是受控状态，因为组件完全被父组件的`props`控制。如果组件的状态只保存在组件（state）内部，可以认为是非受控的，因为组件有自己的状态，不受父组件的控制。

而组件中一旦将两种模式混为一谈（同时包含`props`和`state`）就会造成问题

**直接复制 props 到 state 上造成的问题**

```javascript
class EmailInput extends Component {
  state = { email: this.props.email };

  render() {
    return <input onChange={this.handleChange} value={this.state.email} />;
  }

  handleChange = event => {
    this.setState({ email: event.target.value });
  };

  componentWillReceiveProps(nextProps) {
    // 这会覆盖所有组件内的 state 更新！
    this.setState({ email: nextProps.email });
  }
}
```

初看还觉得可以，但是问题很严重，当通过`input`的输入改变了组件的状态，这时如果父组件更新就会触发`componentWillReceiveProps`方法，会将`state.email`状态重写，覆盖了刚才通过`input`输入更新的状态，导致状态丢失，这是两种模式混用最明显的错误。在实际的使用中会有多个`props`属性，任意一个属性的更新都会导致内部状态可能被覆盖。

既然这样，可以很容易想到，能不能只用`props`来更新组件，不让组件有自己的内部状态

```javascript
class EmailInput extends Component {
  state = {
    email: this.props.email
  };

  componentWillReceiveProps(nextProps) {
    // 只要 props.email 改变，就改变 state
    if (nextProps.email !== this.props.email) {
      this.setState({
        email: nextProps.email
      });
    }
  }
} 
```

但是仍然有个问题。想象一下，如果这是一个密码输入组件，拥有同样 email 的两个账户(假设一个邮箱可以注册多个账户)进行切换时，这个输入框不会重置（用来让用户重新登录）。因为父组件传来的 `prop` 值没有变化！这会让用户非常惊讶，因为这看起来像是帮助一个用户分享了另外一个用户的密码

**最佳实践:完全可控的组件**

从组件里面删除`state`,完全让外部的`props`的接管组件的状态

**最佳实践：有 key 的非可控组件**

让组件自己存储临时的 email state。在这种情况下，组件仍然可以从 prop 接收“初始值”，但是更改之后的值就和 prop 没关系了

```javascript
class EmailInput extends Component {
  state = { email: this.props.defaultEmail };

  handleChange = event => {
    this.setState({ email: event.target.value });
  };

  render() {
    return <input onChange={this.handleChange} value={this.state.email} />;
  }
}
```

我们可以使用 key 这个特殊的 React 属性。当 key 变化时， React 会创建一个新的而不是更新一个既有的组件。 Keys 一般用来渲染动态列表，但是这里也可以使用。在这个示例里，当用户输入时，我们使用 user ID 当作 key 重新创建一个新的 email input 组件

不用为每次输入都添加 key，在整个表单上添加 key 更有位合理。每次 key 变化，表单里的所有组件都会用新的初始值重新创建。

```javascript
<EmailInput
  defaultEmail={this.props.user.email}
  key={this.props.user.id}
/>
```

> 这听起来很慢，但是这点的性能是可以忽略的。如果在组件树的更新上有很重的逻辑，这样反而会更快，因为省略了子组件 diff。

**备选：用 prop 的 ID 重置非受控组件**

如果某些情况下 key 不起作用（可能是组件初始化的开销太大），一个麻烦但是可行的方案是在 getDerivedStateFromProps 观察 userID 的变化：、

```javascript
class EmailInput extends Component {
  state = {
    email: this.props.defaultEmail,
    prevPropsUserID: this.props.userID
  };

  static getDerivedStateFromProps(props, state) {
    // 只要当前 user 变化，
    // 重置所有跟 user 相关的状态。
    // 这个例子中，只有 email 和 user 相关。
    if (props.userID !== state.prevPropsUserID) {
      return {
        prevPropsUserID: props.userID,
        email: props.defaultEmail
      };
    }
    return null;
  }
}
```

`getDerivedStateFromProps` 的存在只有一个目的：让组件在 props 变化时更新 state。 代替了原来的`componentWillReceiveProps`

`nextProps` 父组件新传递的 `props` ;

你可能想知道为什么我们不将上一个 props 作为参数传递给 getDerivedStateFromProps。我们在设计 API 时考虑过这个方案，但最终决定不采用它，原因有两个：

+ prevProps 参数在第一次调用 getDerivedStateFromProps（实例化之后）时为 null，需要在每次访问 prevProps 时添加 if-not-null 检查。

+ 在 React 的未来版本中，不传递上一个 props 给这个方法是为了释放内存。（如果 React 无需传递上一个 props 给生命周期，那么它就无需保存上一个 props 对象在内存中。）

`prevState` 组件在此次更新前的 `state` 。

需要注意每次组件更新时`getDerivedStateFromProps`都会执行，无论是以哪那种方式更新

通常用于吧`props`混入`state`作为初始状态，合并后的`state`可以作为 `shouldComponentUpdate` 第二个参数 `newState` ，可以判断是否渲染组件。

```javascript
getDerivedStateFromProps(nextProps,prevState)
```

**总结**

最重要的是确定组件是受控组件还是非受控组件。不要直接复制（mirror） props 的值到 state 中，而是去实现一个受控的组件，然后在父组件里合并两个值。

对于不受控的组件，当你想在 prop 变化（通常是 ID ）时重置 state 的话，可以选择以下几种方式：

建议: 重置内部所有的初始 state，使用 key 属性
选项一：仅更改某些字段，观察特殊属性的变化（比如 props.userID）。


##### UNSAFE_componentWillUpdate getSnapshotBeforeUpdate

当组件收到新的 `props` 或 `state` 时，会在渲染之前调用 `UNSAFE_componentWillUpdate()`。 有时人们使用 `componentWillUpdate` 是出于一种反直觉，当 `componentDidUpdate` 触发时，更新其他组件的 `state` 已经”太晚”了。事实并非如此。在UI渲染之前，`componentWillUpdate`和`componentDidUpdate`中的`state`改变都将被记录。

```javascript
getSnapshotBeforeUpdate(prevProps, prevState)
```

`componentWillUpdate`常见的错误是在生命周期中使用异步获取数据的方法，因为任何`state`的更新和父组件的重新渲染会触发`componentWillUpdate`重新执行，所有获取数据的方法可能被执行多次。相反，应该使用 `componentDidUpdate` 生命周期，因为它保证每次更新只调用一次。

```javascript
class ExampleComponent extends React.Component {
  componentDidUpdate(prevProps, prevState) {
    if (
      this.state.someStatefulValue !==
      prevState.someStatefulValue
    ) {
      this.props.onChange(this.state.someStatefulValue);
    }
  }
}
```

**更新前读取 DOM 属性**

```javascript
class ListBox extends React.Component {
  ref = React.createRef();
  previousScrollOffset=0;
  // 在列表更新的时候，读取DOM属性
  componentWillUpdate(nextProps, nextState) {
    // 当列列表个数被改变的时候计算偏移量
    if (this.props.list.length < nextProps.list.length) {
      this.previousScrollOffset =
        this.ref.current.scrollHeight - this.ref.current.scrollTop;
    }
  }
  // 在列表被挂载的时候修改DOM属性
  componentDidUpdate(){
    // previousScrollOffset ！== 容器高度时(2px是边框高度)，表示滚动条没有滚动到底部，可能在查看历史记录的状态
    if(this.previousScrollOffset!== this.ref.current.offsetHeight-2) return;

    // newScrollHeight - oldScrollHeight + lastScrollTop
    // 相当于在上一次的scrollTop上加上ScrollHeight的增量
    this.ref.current.scrollTop =  (this.ref.current.scrollHeight -　this.previousScrollOffset　)
    this.previousScrollOffset = 0;
  }
  render() {
    return (<div style={{ width: 300, height: 200, overflow: 'auto', border: '1px solid' }} ref={this.ref}>
      {this.props.list.map(item => <div style={{ height: 20 }}>{item.val}</div>)}
    </div>)
  }
}
```

在上面的示例中，componentWillUpdate 用于读取 DOM 属性。但是，对于异步渲染，“渲染”阶段的生命周期（如 componentWillUpdate 和 render）和”提交”阶段的生命周期（如 componentDidUpdate）之间可能存在延迟。如果用户在这段时间内调整窗口大小，那么从 componentWillUpdate 读取的 scrollHeight 值将过时。

这个问题的解决方案是使用新的“提交”阶段生命周期 `getSnapshotBeforeUpdate`。这个方法在发生变化 前立即 被调用（例如在更新 DOM 之前）。它可以返回一个 React 的值作为参数传递给 componentDidUpdate 方法，该方法在发生变化 后立即 被调用。

```javascript
class ListBox extends React.Component {
  ref = React.createRef();
  getSnapshotBeforeUpdate(prevProps, nextState) {
    if (this.props.list.length > prevProps.list.length) {
      return this.ref.current.scrollHeight - this.ref.current.scrollTop;
    }
  }
  componentDidUpdate(prevProps, prevState, snapshot){
    if(snapshot>this.ref.current.offsetHeight) return;
    this.ref.current.scrollTop =  (this.ref.current.scrollHeight -　snapshot　)
    console.log(this.ref.current.scrollTop);
  }
  render() {
    return (<div style={{ width: 300, height: 200, overflow: 'auto', border: '1px solid' }} ref={this.ref}>
      {this.props.list.map(item => <div style={{ height: 20 }}>{item.val}</div>)}
    </div>)
  }
}
```


##### componentDidMount

componentDidMount() 会在组件挂载后（插入 DOM 树中）立即调用。依赖于 DOM 节点的初始化应该放在这里。如需通过网络请求获取数据，此处是实例化请求的好地方。

这个方法是比较适合添加订阅的地方。如果添加了订阅，请不要忘记在 componentWillUnmount() 里取消订阅

你可以在 componentDidMount() 里直接调用 setState()。它将触发额外渲染，但此渲染会发生在浏览器更新屏幕之前。如此保证了即使在 render() 两次调用的情况下，用户也不会看到中间状态。请谨慎使用该模式，因为它会导致性能问题。通常，你应该在 constructor() 中初始化 state。如果你的渲染依赖于 DOM 节点的大小或位置，比如实现 modals 和 tooltips 等情况下，你可以使用此方式处理


##### useEffect 和 useLayoutEffect

对于 `useEffect` 执行， `React` 处理逻辑是采用异步调用 ，对于每一个 `effect` 的 `callback，` React 会像 `setTimeout`回调函数一样，放入任务队列，等到主线程任务完成，DOM 更新，js 执行完成，视图绘制完毕，才执行。所以 `effect` 回调函数不会阻塞浏览器绘制视图。

`useLayoutEffect` 和 `useEffect` 不同的地方是采用了同步执行

首先 `useLayoutEffect` 是在 DOM 绘制之前，这样可以方便修改 DOM ，这样浏览器只会绘制一次，如果修改 DOM 布局放在 `useEffect` ，那 `useEffect` 执行是在浏览器绘制视图之后，接下来又改 DOM ，就可能会导致浏览器再次回流和重绘。而且由于两次绘制，视图上可能会造成闪现突兀的效果。`useLayoutEffect` callback 中代码执行会阻塞浏览器绘制。

useEffect 对 React 执行栈来看是异步执行的，而 componentDidMount / componentDidUpdate 是同步执行的，useEffect代码不会阻塞浏览器绘制。在时机上 ，componentDidMount / componentDidUpdate 和 useLayoutEffect 更类似。


