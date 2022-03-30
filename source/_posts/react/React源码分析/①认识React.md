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

现在你只需要大概了解调用了哪些方法，这些方法会组成后面的调用流程图，后面会详细的描述

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


如此复杂的调用栈，是为了解决哪些问题。下一章，让我们感受一下react的设计理念

