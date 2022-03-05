---
title: React原理 Ref深入
mathjax: true
categories:
  - React
tags:
  - React

date: 2021-09-16 10:27:02
---

#### Ref相关的问题

+ Ref是如何通过 `createRef` 或 `useRef` 创建对象的

+ React 对标签上的 ref 属性是如何处理的

+ React 内部处理Ref的逻辑是怎样的，如何做 Ref 转发的

#### 创建Ref对象

> React.create 源码 react/src/ReactCreateRef.js

```javascript
export function createRef(): RefObject {
  const refObject = {
    current: null,
  };
  return refObject;
}
```

> React.useRef /react/src/ReactHooks.js

```javascript
const ReactCurrentDispatcher = {
  /**
   * @internal
   * @type {ReactComponent}
   */
  current: (null: null | Dispatcher),
};
function resolveDispatcher() {
  const dispatcher = ReactCurrentDispatcher.current;
  return ((dispatcher: any): Dispatcher);
}
export function useRef<T>(initialValue: T): {|current: T|} {
  const dispatcher = resolveDispatcher();
  return dispatcher.useRef(initialValue);
}
```

`useRef`的初始化逻辑藏的比较深，当引入`useRef`的是否，`dispatcher.current===null` 并没有挂载方法。

而是通过 `exports.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = ReactSharedInternals;` 挂载在 `ReactSharedInternals`对象上并导出给 `react-reconciler` 中初始化（最后打包的时候`react-reconciler`会打包在`react-dom`中）。

> /react-reconciler/src/ReactFiberHooks.new.js

```javascript
function renderWithHooks(current, workInProgress, Component, props, secondArg, nextRenderLanes) {
    if (current !== null && current.memoizedState !== null) {
        ReactCurrentDispatcher.current = HooksDispatcherOnUpdateInDEV;
    } else if (hookTypesDev !== null) {
        // This dispatcher handles an edge case where a component is updating,
        // but no stateful hooks have been used.
        // We want to match the production code behavior (which will use HooksDispatcherOnMount),
        // but with the extra DEV validation to ensure hooks ordering hasn't changed.
        // This dispatcher does that.
        ReactCurrentDispatcher.current = HooksDispatcherOnMountWithHookTypesInDEV;
    } else {
        ReactCurrentDispatcher.current = HooksDispatcherOnMountInDEV;
    }
}
```

简单来说 Ref 就是一个对象，其中的current属性用于保存DOM元素，或组件实例。useRef 底层逻辑是和 createRef 差不多，就是 ref 保存位置不相同，类组件有一个实例 instance 能够维护像 ref 这种信息，但是由于函数组件每次更新都是一次新的开始，所有变量重新声明，所以 useRef 不能像 createRef 把 ref 对象直接暴露出去，如果这样每一次函数组件执行就会重新声明 Ref，此时 ref 就会随着函数组件执行被重置，这就解释了在函数组件中为什么不能用 createRef 的原因。

为了解决这个问题，hooks 和函数组件对应的 fiber 对象建立起关联，将 useRef 产生的 ref 对象挂到函数组件对应的 fiber 上，函数组件每次执行，只要组件不被销毁，函数组件对应的 fiber 对象一直存在，所以 ref 等信息就会被保存下来。对于 hooks 原理，后续章节会有对应的介绍。

#### Ref的几种用法

##### String 类型Ref

在老的React版本中使用，新版本中已经不推荐使用，可以用 `React.createRef` 或回调形式的 Ref 来代替。v17版本中使用`refs`获取对象时，只会返回一个空对象，String类型的Ref会导致很多问题：

+ React必须跟踪当前渲染的组件，因为它不知道this指向谁，这会导致React变慢

+ 下面例子中，string类型的refs写法会让ref被放置在DataTable组件中，而不是MyComponent中。

```javascript
class MyComponent extends Component {
  renderRow = (index) => {
    // This won't work. Ref will get attached to DataTable rather than MyComponent:
    return <input ref={'input-' + index} />;

    // This would work though! Callback refs are awesome.
    return <input ref={input => this['input-' + index] = input} />;
  }
 
  render() {
    return <DataTable data={this.props.data} renderRow={this.renderRow} />
  }
}
```

+ 如果一个库在传递的子组件（子元素）上放置了一个ref，那用户就无法在它上面再放一个ref了。但函数式可以实现这种组合。

##### 函数类型Ref

```javascript
export default class Index extends React.Component{
    render=()=> <div>
        <div ref={(node)=> this.currentDom = node } >hello word</div>
        <Children ref={(node) => this.currentComponentInstance = node  }  />
    </div>
}
```

当用一个函数来标记 Ref 的时候，将作为 callback 形式，等到真实 DOM 创建阶段，执行 callback ，获取的 DOM 元素或组件实例，将以回调函数第一个参数形式传入，所以可以像上述代码片段中，用组件实例下的属性 currentDom和 currentComponentInstance 来接收真实 DOM 和组件实例。

##### Ref对象

```javascript
export default class Index extends React.Component{
    currentDom = React.createRef(null)
    currentComponentInstance = React.createRef(null)
 
    render=()=> <div>
         <div ref={ this.currentDom } >hello word</div>
        <Children ref={ this.currentComponentInstance }  />
   </div>
}
```

#### Ref高级用法

##### Ref转发

初衷是用来实现将一个ref分发到一个组件的子组件中，这在写一些库的时候非常有用。

你可能会注意到，即使不通过refApi仅仅通过props的传递也可以获取，子组件的DOM。像下面的例子：

```javascript
class Level1 extends React.Component{
    render(){
        return <Level2 topRef={this.props.topRef}/>
    }
}

class Level2 extends React.Component{
    render(){
        return <input name='level2' ref={this.props.topRef}/>
    }
}

class TopLevel extends React.Component{
    topRef = React.createRef();
    componentDidMount(){
        console.log(this.topRef.current)
    }
    render(){
        return <Level1 topRef={this.topRef}/> 
    }
}
```

这与Ref转发的本意不符，对于高可复用“叶”组件来说是不方便的。这些组件倾向于在整个应用中以一种类似常规 DOM button 和 input 的方式被使用，并且访问其 DOM 节点对管理焦点，选中或动画来说是不可避免的。也可以理解成是对原声DOM的封装，而且还能方便的获取到原声DOM的引用


下面的例子，通过Ref转发获取到了 `<FancyButton/>`组件的子组件

```javascript
const FancyButton = React.forwardRef((props, ref) => (
  <button ref={ref} className="FancyButton">
    {props.children}
  </button>
));class Level1 extends React.Component{
    render(){
        return <Level2 topRef={this.props.topRef}/>
    }
}
const Level1Ref = React.forwardRef((props,ref)=> <Level1 {...props} topRef={ref}/>)
class Level2 extends React.Component{
    render(){
        return <input name='level2' ref={this.props.topRef}/>
    }
}

class TopLevel extends React.Component{
    topRef = React.createRef();
    componentDidMount(){
        console.log(this.topRef.current)
    }
    render(){
        return <Level1Ref ref={this.topRef}/> 
    }
}
export default TopLevel;

// 你可以直接获取 DOM button 的 ref：
const ref = React.createRef();
<FancyButton ref={ref}>Click me!</FancyButton>;
```

+ 我们通过调用 React.createRef 创建了一个 React ref 并将其赋值给 ref 变量。
+ 我们通过指定 ref 为 JSX 属性，将其向下传递给 <FancyButton ref={ref}>。
+ React 传递 ref 给 forwardRef 内函数 (props, ref) => ...，作为其第二个参数。
+ 我们向下转发该 ref 参数到 <button ref={ref}>，将其指定为 JSX 属性。
+ 当 ref 挂载完成，ref.current 将指向 <button> DOM 节点。


所以在最开的错误案例中，可以通过ref转发让叶组件获取ref,再通过`props`在将其在组件内部传递到需要的位置

```javascript
class Level1 extends React.Component{
    render(){
        return <Level2 topRef={this.props.topRef}/>
    }
}
const Level1Ref = React.forwardRef((props,ref)=> <Level1 {...props} topRef={ref}/>)
class Level2 extends React.Component{
    render(){
        return <input name='level2' ref={this.props.topRef}/>
    }
}

class TopLevel extends React.Component{
    topRef = React.createRef();
    componentDidMount(){
        console.log(this.topRef.current)
    }
    render(){
        return <Level1Ref ref={this.topRef}/> 
    }
}
```

##### 合并Ref转发

理解了上面通过 `forwardRef` 和 `props` 共同传递ref,供给子组件消费，就很容易理解合并Ref转发

`forwardRef` 让 `ref` 可以通过 `props` 传递，那么如果用 `ref` 对象标记的 `ref` ，那么 `ref` 对象就可以通过 props 的形式，提供给子孙组件消费，当然子孙组件也可以改变 `ref` 对象里面的属性，或者像如上代码中赋予新的属性，这种 `forwardref` + `ref` 模式一定程度上打破了 React 单向数据流动的原则。当然绑定在 `ref` 对象上的属性，不限于组件实例或者 DOM 元素，也可以是属性值或方法。

```javascript
// 表单组件
class Form extends React.Component{
    render(){
       return <div>{...}</div>
    }
}
// index 组件
class Index extends React.Component{ 
    componentDidMount(){
        const { forwardRef } = this.props
        forwardRef.current={
            form:this.form,      // 给form组件实例 ，绑定给 ref form属性 
            index:this,          // 给index组件实例 ，绑定给 ref index属性 
            button:this.button,  // 给button dom 元素，绑定给 ref button属性 
        }
    }
    form = null
    button = null
    render(){
        return <div   > 
          <button ref={(button)=> this.button = button }  >点击</button>
          <Form  ref={(form) => this.form = form }  />  
      </div>
    }
}
const ForwardRefIndex = React.forwardRef(( props,ref )=><Index  {...props} forwardRef={ref}  />)
// home 组件
export default function Home(){
    const ref = useRef(null)
     useEffect(()=>{
         console.log(ref.current)
     },[])
    return <ForwardRefIndex ref={ref} />
}
```

#####　在高阶组件中转发Ref

高阶组件中，属性是可以透传的，但是ref不可以，ref是特殊属性，这就导致使用高阶组件的时候，仅仅通过ref不能传递到基础组件

```javascript
function logProps(WrappedComponent) {
    class LogProps extends React.Component {
        render() {
            return <WrappedComponent {...this.props} />;
        }
    }
    return LogProps;
}

class FancyButton extends React.Component {
    focus() {
        console.log('focus')
    }
    render(){
        return <div>wefwef</div>
    }
}

const HOCFancyButton = logProps(FancyButton);

class MyComponent extends React.Component {
    ref = React.createRef();
    componentDidMount(){
        console.log(this.ref.current)
    }
    render(){
        // 使用高阶组件的时候 ref指向的是LogProps，而不是FancyButton
        return <HOCFancyButton ref={this.ref}/>
    }
}
```

可以使用`forwardRef`在高阶组件中做`Ref`转发

```javascript
function logProps(WrappedComponent) {
    class LogProps extends React.Component {
        render() {
            const { forwardedRef, ...rest } = this.props;
            return <WrappedComponent {...rest} ref={forwardedRef} />;
        }
    }
    return React.forwardRef((props, ref) => <LogProps {...props} forwardRef={ref} />);
}

class FancyButton extends React.Component {
    focus() {
        console.log('focus')
    }
    render() {
        return <div>wefwef</div>
    }
}

const HOCFancyButton = logProps(FancyButton);

class MyComponent extends React.Component {
    ref = React.createRef();
    componentDidMount() {
        console.log(this.ref.current)
    }
    render() {
        return <HOCFancyButton ref={this.ref} />
    }
}
```

##### 类组件通过Ref通信

有一种类似表单（Form）的场景，不希望表单元素的更新是通过父组件（Form）更新触发`render`并传递`props`到子组件来更新。而是希望不用触发父组件的`render`，直接子组件，子组件有自己的状态，这时就需要父组件能获取到子组件的实例。调用子组件实例方法，更新子组件内部状态。

```javascript
class Child extends React.Component{
    receiveMessageFromParent = (msg)=>{
        console.log(msg)
    }
    render(){
        return <>
            <button onClick={()=>this.receiveMessageFromParent('MessageFromChild')}>发消息给父组件</button>
            <div>child</div>
        </> 
    }
}

class Parent extends React.Component {
    childRef = React.createRef();
    sendMessageToChild = ()=>{
        this.childRef.current.receiveMessageFromParent('MessageFromParent')
    }
    receiveMessageFromChild = (msg)=>{
        console.log(msg);
    }
    render(){
        return <>
            <button type='button' onClick={this.sendMessageToChild}>发消息给子组件</button>
            <Child ref={this.childRef} receiveMessageFromChild={this.receiveMessageFromChild}/>
        </> 
    }
}
```

##### 函数组件通信

`useImperativeHandle`可以让你在使用 ref 时自定义暴露给父组件的实例值。在大多数情况下，应当避免使用 ref 这样的命令式代码。useImperativeHandle 应当与 forwardRef 一起使用：

```javascript
function FancyInput(props, ref) {
  const inputRef = useRef();
  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current.focus();
    }
  }));
  return <input ref={inputRef} />;
}
FancyInput = forwardRef(FancyInput);
```

![](0001.png)

上面的例子在函数式组件中可以改写为：

```javascript
function Child(props, ref) {
    const inputRef = React.useRef();
    const sayChild = useCallback(()=>{
        console.log('child')
    },[])
    React.useImperativeHandle(ref, () => ({
        focus: () => {
            inputRef.current.focus();
        },
        sayChild
    }));
    return <>
        <button onClick={()=> props.receiveMessageFromChild('MessageFromChild')}>发消息给父组件</button>
        <input ref={ref}/>
    </>
}
Child = React.forwardRef(Child)

const Parent = () => {
    const ref = React.useRef();
    React.useEffect(()=>{
        // 可以拿到子组件定义的方法,或者操作子组件的DOM元素
        console.log(ref.current)
    },[ref])
    const receiveMessageFromChild =useCallback((msg)=>{
        console.log(msg);
    },[])
    return <>
        <Child ref={ref} receiveMessageFromChild={receiveMessageFromChild}/>
    </>
}
```

#### Ref的原理

对于整个 Ref 的处理，都是在 commit 阶段发生的。因为在 commit 阶段才会对真正的 Dom 进行操作，这是用 ref 保存真正的 DOM 节点，或组件实例。

对Ref的更新会调用两个方法 `commitDetachRef` 和 `commitAttachRef` 一个发生在 commit 之前，一个发生在 commit 之后

> react-reconciler/src/ReactFiberCommitWork.js

```javascript
// 在 commit 的 mutation 阶段会清空Ref
function commitDetachRef(current: Fiber) {
  const currentRef = current.ref;
  if (currentRef !== null) {
    if (typeof currentRef === 'function') {
      currentRef(null); 
    } else {
      currentRef.current = null;
    }
  }
}
```

清空之后会进入DOM更新，根据不同的effect标签，操作真实的dom

最后 Layout 阶段会会更新Ref

```javascript
function commitAttachRef(finishedWork: Fiber) {
  const ref = finishedWork.ref;
  if (ref !== null) {
    const instance = finishedWork.stateNode;
    let instanceToUse;
    switch (finishedWork.tag) {
      case HostComponent: //元素节点 获取元素
        instanceToUse = getPublicInstance(instance);
        break;
      default:  // 类组件直接使用实例
        instanceToUse = instance;
    }
    if (typeof ref === 'function') {
      ref(instanceToUse);  //* function 和 字符串获取方式。 */
    } else {
      ref.current = instanceToUse; /* ref对象方式 */
    }
  }
}
```

字符串形式的ref,最后被包装成一个函数，以函数的形式执行

```javascript
function coerceRef(returnFiber, current, element) {
    // 会用_stringRef给函数做标记，如果相同则直接返回原来的函数引用
    if (current !== null && current.ref !== null && typeof current.ref === 'function' && current.ref._stringRef === stringRef) {
        return current.ref;
    }

    var ref = function (value) {
        var refs = inst.refs;

        if (refs === emptyRefsObject) {
            // This is a lazy pooled frozen object, so we need to initialize.
            refs = inst.refs = {};
        }

        if (value === null) {
            delete refs[stringRef];
        } else {
            refs[stringRef] = value;
        }
    };

    ref._stringRef = stringRef;
    return ref;
}
```

事实上并不是每次创建或更新这两个函数都会执行

> react-reconciler/src/ReactFiberWorkLoop.js

commitDetachRef 执行位置

**[每次都设为null,是防止内存泄漏](https://github.com/facebook/react/issues/9328) 如果 ref 每次绑定一个全新的 对象（Ref.current，callback）上，而不清理对旧的 dom节点 或者 类实例 的引用，则可能会产生内存泄漏。**

```javascript
function commitMutationEffects(){
     if (effectTag & Ref) {
      const current = nextEffect.alternate;
      if (current !== null) {
        commitDetachRef(current);
      }
    }
}
```

commitAttachRef 执行位置

```javascript
function commitLayoutEffects(){
     if (effectTag & Ref) {
      commitAttachRef(nextEffect);
    }
}
```

想要挂载Ref，是必须要打上effectTag的标签,所以只有在Ref改变的时候才会更新

> react-reconciler/src/ReactFiberBeginWork.js

```javascript
function markRef(current, workInProgress) {
  var ref = workInProgress.ref;

  if (
      // fiber初始化的时候，且定义了ref属性
      current === null && ref !== null
      // fiber更新的时候，ref对象的引用已经改变
      || current !== null && current.ref !== ref
    ) {
    // Schedule a Ref effect
    workInProgress.flags |= Ref;
  }
}

```

所以绑定匿名函数的写法，会导致函数每次都执行，因为函数的引用不一样

```javascript
// 可以把函数定义为类的方法
<div ref={(node)=>{
    this.node = node
    console.log('此时的参数是什么：', this.node )
}}  >ref元素节点</div>
```


被卸载的 fiber 会被打成 Deletion effect tag ，然后在 commit 阶段会进行 commitDeletion 流程。对于有 ref 标记的 ClassComponent （类组件） 和 HostComponent （元素），会统一走 safelyDetachRef 流程，这个方法就是用来卸载 ref。

> react-reconciler/src/ReactFiberCommitWork.js

```javascript
function safelyDetachRef(current) {
  const ref = current.ref;
  if (ref !== null) {
    if (typeof ref === 'function') {  // 函数式 ｜ 字符串
        ref(null)
    } else {
      ref.current = null;  // ref 对象
    }
  }
}
```

