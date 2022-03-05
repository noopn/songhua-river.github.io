---
title: React源码分析 ① 从入口开始认识React
categories:
  - React
  - 源码分析

tags:
  - React

date: 2021-10-22 19:04:28
---

#### render 方法

当我们打开 React 的[官方文档](https://reactjs.org/docs/hello-world.html)看到的第一个例子便是 Hello World：

```javascript
ReactDOM.render(<h1>Hello, world!</h1>, document.getElementById("root"));
```

`render`函数将`h1`标签和`Hello World`文本渲染在了页面的`root`元素中，但很显然这段代码没有看到的那么简单，`js`并不会认识`html`元素，这个标签最终会被转换成 js 对象，然后通过`render`方法后面的一系列函数调用，最终被插入到页面中。

#### JSX

刚才看到的 `h1` 标签，严格说来并不是`html`,因为他写在 js 语法中，可以把它叫做标签语法，也就是 JSX。

为什么 JSX 的出现好像又让页面开发回到了刀耕火种的`jquery`时代，`js`与`html`混合在一起，UI(视图)与逻辑耦合。

但实际上 React 认为，渲染逻辑与 UI 的逻辑是耦合的，比如需要在 UI 中绑定事件，数据改变时通知 UI 发生改变，而 React 并没有将这两点分离到不同的文件中，而是通过组件的概念，实现关注点分离，也就是设计原则的分离，每一部分都有自己的关注点。

我们可以在[Babel](https://www.babeljs.cn/)中，看一下 JSX 最终变成了什么。

```javascript
const CompA = (
  <div>
    <p>p</p>div
  </div>
);

const CompB = () => <a>a</a>;
const App = () => {
  return (
    <>
      <CompA />
      <CompB />
    </>
  );
};
```

转化为

```javascript
"use strict";

const CompA = /*#__PURE__*/ React.createElement(
  "div",
  null,
  /*#__PURE__*/ React.createElement("p", null, "p"),
  "div"
);

const CompB = () => /*#__PURE__*/ React.createElement("a", null, "a");

const App = () => {
  return /*#__PURE__*/ React.createElement(
    React.Fragment,
    null,
    /*#__PURE__*/ React.createElement(CompA, null),
    /*#__PURE__*/ React.createElement(CompB, null)
  );
};
```

可以注意到组件被转化为`React.createElement`方法的第一个参数，这也是为什么组件的第一个字母需要大写的原因，Babel 会通过大小写来区分原生组件和 React 组件

而正因为 JSX 语法被转换成了`React.createElement`的函数调用，因此在写 JSX 的时候必须要`import React from react`

而 React 17-RC 以及之后的版本将采用[新的 JSX 转换](https://reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html)，从而无需在引入 React

#### Virtual DOM

通过 React.createElement 处理的节点，会被转换成 Virtual DOM 也可以称为虚拟 DOM

Virtual DOM 是一种编程概念,它与真是的 DOM 一一对应，而且他是保存在内存中的，当 DOM 的属性发生改变的时候，React 会在内存中把改变映射成 Virtual DOM,在把最终状态渲染在页面中，从而保证最小的 DOM 操作

实际上 React 中的 Fiber,也是属于 Virtual DOM 概念的一部分，在 React.createElement 创建的对象上添加了，更多的属性，例如优先级，副作用，更新队列等。

> React.createElement /react/packages/react/src/React.js 在源码中非常简单 

```javascript
export function createElement(type, config, children) {
  let propName;

  // 用于提取保留字段
  const props = {};

  let key = null;
  let ref = null;
  let self = null;
  let source = null;

  if (config != null) {
    if (hasValidRef(config)) {
      ref = config.ref;
    }
    if (hasValidKey(config)) {
      // 转换为字符串
      key = "" + config.key;
    }

    self = config.__self === undefined ? null : config.__self;
    source = config.__source === undefined ? null : config.__source;
    
    // 拷贝外部传入的props属性(这里的形参是config)到props对象上
    for (propName in config) {
      if (
        hasOwnProperty.call(config, propName) &&
        !RESERVED_PROPS.hasOwnProperty(propName)
      ) {
        props[propName] = config[propName];
      }
    }
  }

  // 子元素的个数
  const childrenLength = arguments.length - 2;

  // 如果只有一个子元素直接赋值
  if (childrenLength === 1) {
    props.children = children;
  } else if (childrenLength > 1) {
    const childArray = Array(childrenLength);
    for (let i = 0; i < childrenLength; i++) {
      childArray[i] = arguments[i + 2];
    }
    // 如果大于一个则插入到一个数组中
    props.children = childArray;
  }

  // 如果定义了默认属性，则用默认属性覆盖掉，
  if (type && type.defaultProps) {
    const defaultProps = type.defaultProps;
    for (propName in defaultProps) {
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName];
      }
    }
  }
  return ReactElement(
    type,                     // 组件类型 可能是元素标签，也可能是类组件或函数组件的引用
    key,                      // 字符串key
    ref,                      // ref对象 
    self,                     // 内部属性初始化null
    source,                   // 内部属性初始化null
    ReactCurrentOwner.current,// 用于跟踪拥有当前正在被构建组件的组件
    props                     // 属性集合
  );
}
                         
const ReactElement = function(type, key, ref, self, source, owner, props) {
  const element = {
    $$typeof: REACT_ELEMENT_TYPE,
    type: type,
    key: key,
    ref: ref,
    props: props,
    _owner: owner,
  };

  return element;
};
```

当type是一个react组件的时候，他会被赋值到type属性上，最终被实例化。现在看一下，这个组件被定义时的样子

```javascript
class App extends React.Component {}
```

> React.Component  /react/packages/react/src/ReactBaseClasses.js

```javascript

// 基本类，用于帮助更新组件的状态
function Component(props, context, updater) {
  this.props = props;
  this.context = context;
  // 如果refs是一个已经过时的string类型，晚一点的时候会重新分配一个不同的对象
  this.refs = emptyObject;
  // 初始化一个默认updater对象，但真实的对象会在渲染的时候被插入
  this.updater = updater || ReactNoopUpdateQueue;
}

Component.prototype.isReactComponent = {};

/**
 * 设置一个状态的子集，必须使用这个方法，你应该确保'this.state'是不可变的，也就是不能修改，每次修改必须返回一个新的传入一个新的state
 * 
 * setState没有确保立即更新，所以在调用这个方法后使用数据可能是旧的。也没有确保setState会立即执行，实际上最终可能会一起执行
 * 你可以提供一个回调函数，他将在setState真正完成后执行。
 * 
 * 当setState传入一个函数，他将在未来的某一时间执行，并不是同步，它将使用最新的组件参数（state, props, context）被调用
 * 这些参数与this对象上的可以是不同的，因为他可能在receiveProps之后但在shouldComponentUpdate之前，这些新的state, props, and context还没来得及合并到this对象
 */
Component.prototype.setState = function(partialState, callback) {
  if (
    typeof partialState !== 'object' &&
    typeof partialState !== 'function' &&
    partialState != null
  ) {
    throw new Error(
      'setState(...): takes an object of state variables to update or a ' +
        'function which returns an object of state variables.',
    );
  }

  // 更新会被添加到队列，在未来的某一时间更新
  this.updater.enqueueSetState(this, partialState, callback, 'setState');
};

/**
 * 强制更新，它应该只当明确知道我们不在一个DOM事务中才被使用，你可能会想，当你知道一些深层组件的状态已经改变但是setState没有调用的时候去调用它。
 * 它将不会触发shouldComponentUpdate，但会触发 `componentWillUpdate` 和 `componentDidUpdate`
 */
Component.prototype.forceUpdate = function(callback) {
  this.updater.enqueueForceUpdate(this, callback, 'forceUpdate');
};
```

#### 执行流程

现在已经知道了render执行时的大部分必要信息，那render背后的逻辑又是怎样的，这显然是一个复杂的调用过程，但是我们可以通过浏览器的性能分析去查看render函数的调用那个过程

现在你只需要大概了解调用了那些方法，这些方法会组成后面的调用流程图，后面会详细的描述

![](0001.png)

##### 初始化事件相关对象

![](0002.png)

- registerSimpleEvents 创建对象相关对象

| 变量名称                     | 变量对象 | 说明                                                                                                                                                |
| ---------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| allNativeEvents              | Set 集合 | <div style='width:600px'>保存所有原生事件的名称 例如 `0:"cancel"`</div>                                                                             |
| eventPriorities              | Map 集   | <div style='width:600px'>保存事件名称和事件优先级对应关系 例如 `click=>0` </div>                                                                    |
| topLevelEventsToReactNames   | Map 集   | <div style='width:600px'>保存原始事件名称和 React 事件的对应关系 例如 `"cancel" => "onCancel"` </div>                                               |
| registrationNameDependencies | Object   | <div style='width:600px'>保存 React 事件和原生事件的对应关系 例如 `onClick:(1) ['click']` 每个 React 事件对应一个数组用于保存合成事件对应关系</div> |
| possibleRegistrationNames    | Object   | <div style='width:600px'>保存小写的 React 事件名称和正确的驼峰命名事件的对应关系，用于校验用户输入 例如 `onclick:onClick`</div>                     |

##### 入口

![](0003.png)

**render** : ReactDom.render()
**createRootImpl** : 创建 FiberRootNode 根节点
**listenToAllSupportedEvents** : 绑定所有原生事件在 root 节点上

##### render 阶段

![](0004.png)

**unbatchedUpdates** : 非批量更新，让用户尽早看见页面内容，如果是 batchedUpdates 会以异步执行
**scheduleUpdateOnFiber** : 调度 Fiber 节点更新优先级
**performUnitOfWork** : 以 Fiber 节点为单位，深度优先递归遍历每一个节点
**reconcileChildren** ： 创建对比 Fiber 节点，标记有副作用的节点 （添加，删除，移动，更新）
**completeUnitOfWork** ： 从下至上遍历节点，创建相应的 DOM 节点，并创建 Effects 链表，交给 commit 阶段使用

##### commit 阶段

![](0005.png)

**commitBeforeMutationEffects**: 操作真实节点前执行，会执行`getSnapshotBeforeUpdate`
**commitMutationEffects**: 执行节点操作
**commitLayoutEffects：** 执行副作用函数，包括 `componentDidUpdate` 或 `effect`回调函数

#### 预告

如此复杂的调用栈，是为了解决那些问题。下一章，让我们感受一下react的设计理念

<!-- ##### Fiber 双缓存

Fiber 对象上面保存了包括这个节点的属性、类型、dom 等，Fiber 通过 child、sibling、return（指向父节点）来形成 Fiber 树，还保存了更新状态时用于计算 state 的 updateQueue，updateQueue 是一种链表结构，上面可能存在多个未计算的 update，update 也是一种数据结构，上面包含了更新的数据、优先级等，除了这些之外，上面还有和副作用有关的信息。

双缓存是指存在两颗 Fiber 树，current Fiber 树描述了当前呈现的 dom 树，workInProgress Fiber 是正在更新的 Fiber 树，这两颗 Fiber 树都是在内存中运行的，在 workInProgress Fiber 构建完成之后会将它作为 current Fiber 应用到 dom 上

在 mount 时（首次渲染），会根据 jsx 对象（Class Component 或的 render 函数者 Function Component 的返回值），构建 Fiber 对象，形成 Fiber 树，然后这颗 Fiber 树会作为 current Fiber 应用到真实 dom 上，在 update（状态更新时如 setState）的时候，会根据状态变更后的 jsx 对象和 current Fiber 做对比形成新的 workInProgress Fiber，然后 workInProgress Fiber 切换成 current Fiber 应用到真实 dom 就达到了更新的目的，而这一切都是在内存中发生的，从而减少了对 dom 好性能的操作。

![](0006.jpg)

#### Lane 模型

react 之前的版本用 expirationTime 属性代表优先级，该优先级和 IO 不能很好的搭配工作（io 的优先级高于 cpu 的优先级），现在有了更加细粒度的优先级表示方法 Lane，Lane 用二进制位表示优先级，二进制中的 1 表示位置，同一个二进制数可以有多个相同优先级的位，这就可以表示‘批’的概念，而且二进制方便计算。

这好比赛车比赛，在比赛开始的时候会分配一个赛道，比赛开始之后大家都会抢内圈的赛道（react 中就是抢优先级高的 Lane），比赛的尾声，最后一名赛车如果落后了很多，它也会跑到内圈的赛道，最后到达目的地（对应 react 中就是饥饿问题，低优先级的任务如果被高优先级的任务一直打断，到了它的过期时间，它也会变成高优先级）

Lane 的二进制位如下，1 的 bits 越多，优先级越低

```javascript
export const NoLanes: Lanes = /*                        */ 0b0000000000000000000000000000000;
export const NoLane: Lane = /*                          */ 0b0000000000000000000000000000000;

export const SyncLane: Lane = /*                        */ 0b0000000000000000000000000000001;
export const SyncBatchedLane: Lane = /*                 */ 0b0000000000000000000000000000010;
```

#### Scheduler

Scheduler 的作用是调度任务，react15 没有 Scheduler 这部分，所以所有任务没有优先级，也不能中断，只能同步执行。

我们知道了要实现异步可中断的更新，需要浏览器指定一个时间，如果没有时间剩余了就需要暂停任务，requestIdleCallback 貌似是个不错的选择，但是它存在兼容和触发不稳定的原因，react17 中采用 MessageChannel 来实现。

在 Scheduler 中的每的每个任务的优先级使用过期时间表示的，如果一个任务的过期时间离现在很近，说明它马上就要过期了，优先级很高，如果过期时间很长，那它的优先级就低，没有过期的任务存放在 timerQueue 中，过期的任务存放在 taskQueue 中，timerQueue 和 timerQueue 都是小顶堆，所以 peek 取出来的都是离现在时间最近也就是优先级最高的那个任务，然后优先执行它。

#### reconciler

Reconciler 发生在 render 阶段，render 阶段会分别为节点执行 beginWork 和 completeWork，或者计算 state，对比节点的差异，为节点赋值相应的 effectFlags（对应 dom 节点的增删改）。

协调器是在 render 阶段工作的，简单一句话概括就是 Reconciler 会创建或者更新 Fiber 节点。在 mount 的时候会根据 jsx 生成 Fiber 对象，在 update 的时候会根据最新的 state 形成的 jsx 对象和 current Fiber 树对比构建 workInProgress Fiber 树，这个对比的过程就是 diff 算法。

diff 算法发生在 render 阶段的 reconcileChildFibers 函数中，diff 算法分为单节点的 diff 和多节点的 diff（例如一个节点中包含多个子节点就属于多节点的 diff），单节点会根据节点的 key 和 type，props 等来判断节点是复用还是直接新创建节点，多节点 diff 会涉及节点的增删和节点位置的变化。

reconcile 时会在这些 Fiber 上打上 Flags 标签，在 commit 阶段把这些标签应用到真实 dom 上，这些标签代表节点的增删改，如

```javascript
export const Placement = /*             */ 0b0000000000010;
export const Update = /*                */ 0b0000000000100;
```

render 阶段遍历 Fiber 树类似 dfs 的过程，处理发生在 beginWork 函数中，该函数做的主要工作是创建 Fiber 节点，计算 state 和 diff 算法，‘冒泡’阶段发生在 completeWork 中，该函数主要是做一些收尾工作，例如处理节点的 props、和形成一条 effectList 的链表，该链表是被标记了更新的节点形成的链表。

```javascript
function App() {
  const [count, setCount] = useState(0);
  return (
    <>
      <h1
        onClick={() => {
          setCount(() => count + 1);
        }}
      >
        <p title={count}>{count}</p> hello
      </h1>
    </>
  );
}
```

如果 p 和 h1 节点更新了则 effectList 如下，从 rootFiber->h1->p,，顺便说下 fiberRoot 是整个项目的根节点，只存在一个，rootFiber 是应用的根节点，可能存在多个。 -->
