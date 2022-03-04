---
title: ReactComponent
mathjax: true
categories:
  - React
  - 基础
tags:
  - React
abbrlink: ac67dd5c
date: 2021-02-13 13:15:59
---

#### ReactComponent

/packages/react/src/ReactBaseClasses.js

包含了 `PureComponent` `Component` 两个类，并在类上挂载了 `setState`,`forceUpdate` 两个方法，并没有对类的属性进行任何的处理

注释中也说明是用于帮助组件更新状态的基础类

```javascript
// Base class helpers for the updating state of a component.
function Component(props, context, updater) {
  this.props = props;
  this.context = context;
  // If a component has string refs, we will assign a different object later.
  // 如果一个组件有字符串形式的refs,在稍后会分配为一个对象
  this.refs = emptyObject;
  // We initialize the default updater but the real one gets injected by the renderer
  // 初始化一个默认的更新，但真正的更新会在渲染器注入
  this.updater = updater || ReactNoopUpdateQueue;
}

Component.prototype.isReactComponent = {};
```

#### setState

```javascript
/**
 * Sets a subset of the state. Always use this to mutate
 * state. You should treat `this.state` as immutable.
 * 设置state的子集，永远使用这个改变state.你应该把this.state看作不可改变的
 *
 * There is no guarantee that `this.state` will be immediately updated, so
 * accessing `this.state` after calling this method may return the old value.
 * 这不能保证this.state会立即更新，因此在调用setState后访问state,可能会返回旧的值
 *
 * There is no guarantee that calls to `setState` will run synchronously,
 * as they may eventually be batched together.  You can provide an optional
 * callback that will be executed when the call to setState is actually
 * completed.
 * 不能保证setState的调用会同步执行，他们最终可能被批量处理，你可以提供一个可选的回调方法
 * 他将在setState真正结束之后执行
 *
 * When a function is provided to setState, it will be called at some point in
 * the future (not synchronously). It will be called with the up to date
 * component arguments (state, props, context). These values can be different
 * from this.* because your function may be called after receiveProps but before
 * shouldComponentUpdate, and this new state, props, and context will not yet be
 * assigned to this.
 * 当一个回调函数提供给setState，将在未来的某个时间点被调用（不是同步），他会被叫做最新的组件参数（state, props, context）
 * 这些值可能与this中的不同，因为函数可能在receiveProps之后调用，但在shouldComponentUpdate之前
 * 并且新的state, props, context还没有被合并到this中
 * 
 * @param {object|function} partialState Next partial state or function to
 *        produce next partial state to be merged with current state.
 * @param {?function} callback Called after state is updated.
 * @final
 * @protected
 */
Component.prototype.setState = function(partialState, callback) {
  invariant(
    typeof partialState === 'object' ||
      typeof partialState === 'function' ||
      partialState == null,
    'setState(...): takes an object of state variables to update or a ' +
      'function which returns an object of state variables.',
  );
  this.updater.enqueueSetState(this, partialState, callback, 'setState');
};
```


#### forceUpdate

```javascript
/**
 * Forces an update. This should only be invoked when it is known with
 * certainty that we are **not** in a DOM transaction.
 * 强制更新，只有确认我们没有在DOM事务中时，才应该调用它。
 *
 * You may want to call this when you know that some deeper aspect of the
 * component's state has changed but `setState` was not called.
 * 当你知道一些深层次的组件状态改变但setState没有调用时，你可能需要调用它
 * 
 * This will not invoke `shouldComponentUpdate`, but it will invoke
 * `componentWillUpdate` and `componentDidUpdate`.
 * 这不会调用 shouldComponentUpdate，但是会调用componentWillUpdate和componentDidUpdate
 * 
 * @param {?function} callback Called after update is complete.
 * @final
 * @protected
 */
Component.prototype.forceUpdate = function(callback) {
  this.updater.enqueueForceUpdate(this, callback, 'forceUpdate');
};
```

#### PureComponent

与 `Component` 类似，重写了原型链，并添加了`isPureReactComponent`作为标识

```javascript
function PureComponent(props, context, updater) {
  this.props = props;
  this.context = context;
  // If a component has string refs, we will assign a different object later.
  this.refs = emptyObject;
  this.updater = updater || ReactNoopUpdateQueue;
}

const pureComponentPrototype = (PureComponent.prototype = new ComponentDummy());
pureComponentPrototype.constructor = PureComponent;
// Avoid an extra prototype jump for these methods.
Object.assign(pureComponentPrototype, Component.prototype);
pureComponentPrototype.isPureReactComponent = true;
```