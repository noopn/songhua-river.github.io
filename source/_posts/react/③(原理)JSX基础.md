---
title: React原理 JSX基础
mathjax: true
categories:
  - React
tags:
  - JSX
  - React

date: 2021-08-20 13:10:06
---

#### JSX是什么

JSX是一种JavaScript的语法扩展，运用于React架构中，其格式比较像是模版语言，但事实上完全是在JavaScript内部实现的。元素是构成React应用的最小单位，JSX就是用来声明React当中的元素，React使用JSX来描述用户界面。

```javascript
const A = ()=>{
  return <div id='root'></div>
}
```

#### 最后JSX变成什么

显然JSX并不是标准的JS语法，需要转换成标准的JS语法浏览器才能识别 

```javascript
function() {
  React.createElement("div", {
      style: {
          height: 200
      }
  }, React.createElement("div", {
      onClick: function(e) {
          return console.log(e)
      }
  }), ["a", "b", "c"].map((function(t) {
      return React.createElement("span", {
          key: t
      }, t)
  }
  )))
}
```

所有的JSX代码最终都会变成 `React.createElement`的函数调用

```javascript
React.createElement({
  // 组件类型 div等字符串
  type,
  // 一个对象，对应dom中的标签属性
  [props],
  // 子元素按原有顺序排列
  [...children]
})
```

**在老版本中由于编译后的代码会变成React.createElement的函数调用，所以必须在文件中引入React,17版以后**

**createElement** 做了如下几件事

+ 处理config，把除了保留属性外的其他config赋值给props
+ 把children处理后赋值给props.children
+ 处理defaultProps
+ 调用ReactElement返回一个jsx对象(virtual-dom)

**jsx对象上没有优先级、状态、effectTag等标记，这些标记在Fiber对象上，在mount时Fiber根据jsx对象来构建，在update时根据最新状态的jsx和current Fiber对比，形成新的workInProgress Fiber，最后workInProgress Fiber切换成current Fiber。**


下面描述了JSX被转换之后，以及生成的type类型

```javascript
<div style={{height:200}}>
  <React.Fragment></React.Fragment> {/*Fragment组件*/}
  string children                   {/*string类型子元素*/}
  <FunctionComponent/>              {/*函数式组件*/}
  <ClassComponent/>                 {/*类组件组件*/}
  {/*绑定属性*/}
  <div onClick = {(e)=> console.log(e)}></div>
  {/*数组类型子元素*/}
  {['a','b','c'].map(item=> <span key={item}>{item}</span>)}
</div>
```

![](0001.png)

|jsx元素类型|通过createElement转换|type属性|
|----|----|----|
|原生标签|`react element`类型|`tagname` 例如`span` `div`|
|`fragment`类型|`react element`类型|`symbol react.fragment`类型|
|文本类型|直接返回字符串|无|
|数组类型|返回数组，数组中的元素按上述规则转换|无|
|类组件|`react element`类型|类组件引用|
|函数组件|`react element`类型|函数组件引用|
|三元表达式|执行运算后的结果按上述规则匹配|无|
|函数调用|执行运算后的结果按上述规则匹配|无|

React针对不同React element元素会产生不通的tag（种类），也就是不同的fiber对象， 在`ReactWorkTags.js`定义了`tag`种类

```javascript
export const FunctionComponent = 0;              // 函数组件
export const ClassComponent = 1;                 // 类组建
export const IndeterminateComponent = 2;         // 在不知道是函数组件还是类组件的时候
export const HostRoot = 3;                       // Root Fiber 必须呗包含在另一个节点中
export const HostPortal = 4;                     // 通过createPortal创建的fiber子树，可能是另一个渲染的入口
export const HostComponent = 5;
export const HostText = 6;
export const Fragment = 7;
export const Mode = 8;                           // <React.StrictMode>
export const ContextConsumer = 9;
export const ContextProvider = 10;
export const ForwardRef = 11;
export const Profiler = 12;                      // <Profiler />
export const SuspenseComponent = 13;
export const MemoComponent = 14;
export const SimpleMemoComponent = 15;
export const LazyComponent = 16;
export const IncompleteClassComponent = 17;
export const DehydratedFragment = 18;
export const SuspenseListComponent = 19;
export const ScopeComponent = 21;
export const OffscreenComponent = 22;
export const LegacyHiddenComponent = 23;
export const CacheComponent = 24;
```

最终JSX会变成由Fiber节点组成的链表

**数组结构中的子节点会作为Fragment的子节点**

```javascript
function FiberNode(
  tag: WorkTag,
  pendingProps: mixed,
  key: null | string,
  mode: TypeOfMode,
) {
  // Instance
  this.tag = tag;
  this.key = key;
  this.elementType = null;
  this.type = null;
  this.stateNode = null;

  // Fiber
  this.return = null;  // 指向父级fiber节点
  this.child = null;   // 指向子级fiber节点
  this.sibling = null; // 指向兄弟fiber节点
  this.index = 0;

  this.ref = null;

  this.pendingProps = pendingProps;
  this.memoizedProps = null;
  this.updateQueue = null;
  this.memoizedState = null;
  this.dependencies = null;

  this.mode = mode;

  // Effects
  this.flags = NoFlags;
  this.subtreeFlags = NoFlags;
  this.deletions = null;

  this.lanes = NoLanes;
  this.childLanes = NoLanes;

  this.alternate = null;
}
```


#### 对元素进行操作

+ React.Children.toArray 拍平子元素

```javascript
const Element = (
  <div style={{height:200}}>
    <React.Fragment></React.Fragment>
    string children
    <FunctionComponent/>
    <ClassComponent/>
    <div onClick = {(e)=> console.log(e)}></div>
    {['a','b','c'].map(item=> <span key={item}>{item}</span>)}
  </div>
)

React.Children.toArray(Element.props.children)
```

![](0002)

+ 遍历子节点 React.Children.forEach React.Children.map

在 children 里的每个直接子节点上调用一个函数，并将 this 设置为 thisArg。如果 children 是一个数组，它将被遍历并为数组中的每个子节点调用该函数。如果子节点为 null 或是 undefined，则此方法将返回 null 或是 undefined，而不会返回数组。

**如果 children 是一个 Fragment 对象，它将被视为单一子节点的情况处理，而不会被遍历。**

```javascript
React.Children.map(children, function[(thisArg)])
```

+ React.Children.only

验证 children 是否只有一个子节点（一个 React 元素），如果有则返回它，否则此方法会抛出错误。

```javascript
React.Children.only(children)
```

+ React.cloneElement 克隆元素

以 element 元素为样板克隆并返回新的 React 元素。config 中应包含新的 props，key 或 ref。返回元素的 props 是将新的 props 与原始元素的 props 浅层合并后的结果。新的子元素将取代现有的子元素，如果在 config 中未出现 key 或 ref，那么原始元素的 key 和 ref 将被保留。

```javascript
React.cloneElement(
  element,
  [config],
  [...children]
)
```

React.cloneElement() 几乎等同于：

```javascript
<element.type {...element.props} {...props}>{children}</element.type>
```

但是，这也保留了组件的 ref。这意味着当通过 ref 获取子节点时，你将不会意外地从你祖先节点上窃取它。相同的 ref 将添加到克隆后的新元素中。如果存在新的 ref 或 key 将覆盖之前的。
