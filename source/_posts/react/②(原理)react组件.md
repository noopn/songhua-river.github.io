---
title: React原理 组件
mathjax: true
categories:
  - React
tags:
  - React

date: 2021-08-22 23:10:56
---

#### class类组件

> 类组件继承了React.Component /react/src/ReactBaseClasses.js

类组件的updater对象在实例化的时候在被绑定

```javascript
function Component(props, context, updater) {
  this.props = props;      //绑定props
  this.context = context;  //绑定context
  this.refs = emptyObject; //绑定ref
  this.updater = updater || ReactNoopUpdateQueue; //上面所属的updater 对象
}
/* 绑定setState 方法 */
Component.prototype.setState = function(partialState, callback) {
  this.updater.enqueueSetState(this, partialState, callback, 'setState');
}
/* 绑定forceUpdate 方法 */
Component.prototype.forceUpdate = function(callback) {
  this.updater.enqueueForceUpdate(this, callback, 'forceUpdate');
}
```

根据上面的源码，可以知道为什么类组件一定要在`super`函数中传入`props`

```javascript
constructor(props){
    super(props)
    console.log(this.props) // 如果不传，打印 undefined 为什么?
}
```

执行`super`相当于执行`Component`函数如果没有传入`props`,`Component`函数不能绑定`props`类属性，在后面的子类中则取不到`props`

#### 函数组件

> 注意：不要尝试给函数组件 prototype 绑定属性或方法，即使绑定了也没有任何作用，因为通过上面源码中 React 对函数组件的调用，是采用直接执行函数的方式，而不是通过new的方式

**对于类组件来说，底层只需要实例化一次，实例中保存了组件的 state 等状态。对于每一次更新只需要调用 render 方法以及对应的生命周期就可以了。但是在函数组件中，每一次更新都是一次新的函数执行，一次函数组件的更新，里面的变量会重新声明。**

为了能让函数组件可以保存一些状态，执行一些副作用钩子，React Hooks 应运而生，它可以帮助记录 React 中组件的状态，处理一些额外的副作用。

#### 组件常用的通信方式

1. props 和 callback 方式

子组件可以调用父组件传递下来的方法，改变父组件的状态

2. ref 方式。
3. React-redux 或 React-mobx 状态管理方式。
4. context 上下文方式。
5. event bus 事件总线。

event bus的本质是观察者模式.

#### 组件的强化方式

+ 类组件继承

```javascript
class BaseComponent extends React.Component{
  constructor(props){
      super(props)
      this.state = {
        name:"BaseComponent"
      }
  }
  // 内部属性
  interFunc (){
    console.log('interFunc')
  }
  render(){
    return <div>
      基础组件 {this.state.name}
    </div>
  }
}

class ExtendsComponent extends BaseComponent {
  // 重写父组件方法 
  interFunc(){
    console.log('over write interFunc')
  }
  render(){
    return <div>
      {super.render()}
      <p>ExtendsComponent</p>
    </div>
  }
}
```

#### 组件的本质

组件的本质就是类和函数，只不过在函数和类上添加了渲染视图（render）或更新视图（setState/useState）的逻辑

react会像正常实例化类或执行函数一样处理组件

> 对于类组件的执行，是在react-reconciler/src/ReactFiberClassComponent.js中：

```javascript
function constructClassInstance(
    workInProgress, // 当前正在工作的 fiber 对象
    ctor,           // 我们的类组件
    props           // props 
){
     /* 实例化组件，得到组件实例 instance */
     const instance = new ctor(props, context)
}
```

> 对于函数组件的执行，是在react-reconciler/src/ReactFiberHooks.js中

```javascript
function renderWithHooks(
  current,          // 当前函数组件对应的 `fiber`， 初始化
  workInProgress,   // 当前正在工作的 fiber 对象
  Component,        // 我们函数组件
  props,            // 函数组件第一个参数 props
  secondArg,        // 函数组件其他参数
  nextRenderExpirationTime, //下次渲染过期时间
){
     /* 执行我们的函数组件，得到 return 返回的 React.element对象 */
     let children = Component(props, secondArg);
}
```

> 初始化的时候会执行组件的函数  /react-reconciler/src/ReactFiberBeginWork.new.js

会按照不同的组件类型，调用不同组件声明的函数来初始化组件

```javascript
function beginWork(current, workInProgress, renderLanes) {
  switch (workInProgress.tag) {
    case IndeterminateComponent:
      {
        return mountIndeterminateComponent(current, workInProgress, workInProgress.type, renderLanes);
      }
  }
}
```

