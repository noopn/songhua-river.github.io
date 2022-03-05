---
layout: post
title: React原理 context深入

date: 2021-09-24 10:50:42
categories:
  - React
tags:
  - React
---

#### context三中用法

定义context

```javascript
const ThemeContext = React.createContext(null) //
const ThemeProvider = ThemeContext.Provider  //提供者
const ThemeConsumer = ThemeContext.Consumer // 订阅消费者
```

使用方法

```javascript
class ConsumerDemo extends React.Component{
    render(){
        const { color,background } = this.context
        return <div style={{ color,background } } >消费者</div> 
    }
 }
 ConsumerDemo.contextType = ThemeContext

function ProviderDemo(){
    const [ contextValue , setContextValue ] = React.useState({  color:'#ccc', background:'pink' })
    return <div>
        <ThemeProvider value={ contextValue } > 
            <ConsumerDemo />
        </ThemeProvider>
    </div>
}
```

```javascript
class ConsumerDemo extends React.Component {
    render() {
        return <ThemeConsumer>
            {({ color, background }) => <div style={{ color, background }} >消费者</div>}
        </ThemeConsumer>
    }
}
function ProviderDemo() {
    const [contextValue, setContextValue] = React.useState({ color: '#ccc', background: 'pink' })
    return <div>
        <ThemeProvider value={contextValue} >
            <ConsumerDemo />
        </ThemeProvider>
    </div>
}
```

```javascript
function ConsumerDemo() {
    const { color, background } = React.useContext(ThemeContext);
    return <div style={{ color, background }} >消费者</div>
}

function ProviderDemo() {
    const [contextValue, setContextValue] = React.useState({ color: '#ccc', background: 'pink' })
    return <div>
        <ThemeProvider value={contextValue} >
            <ConsumerDemo />
        </ThemeProvider>
    </div>
}
```

#### displayName

context 对象接受一个名为 displayName 的 property，类型为字符串。React DevTools 使用该字符串来确定 context 要显示的内容。

```javascript
const MyContext = React.createContext(/* 初始化内容 */);
MyContext.displayName = 'MyDisplayName';

<MyContext.Provider> // "MyDisplayName.Provider" 在 DevTools 中
<MyContext.Consumer> // "MyDisplayName.Consumer" 在 DevTools 中
```

#### 源码

createContext 创建了一个包含， Provider 和 Consumer 组件的对象,通过`_context`属性形成相互引用的循环链表结构

```javascript
function createContext(defaultValue, calculateChangedBits) {
  var context = {
    $$typeof: REACT_CONTEXT_TYPE,
    _currentValue: defaultValue,
    _currentValue2: defaultValue,
    Provider: null,
    Consumer: null
  };
  context.Provider = {
    $$typeof: REACT_PROVIDER_TYPE,
    _context: context
  };

  {
    var Consumer = {
      $$typeof: REACT_CONTEXT_TYPE,
      _context: context,
    }; 
    Object.defineProperties(Consumer, {
      // 添加getter 和 setter
    });

    context.Consumer = Consumer;
  }

  return context;
}
```


如果当前类型的 fiber 不需要更新，那么会 FinishedWork 中止当前节点和子节点的更新。

如果当前类型 fiber 需要更新，那么会调用不同类型 fiber 的处理方法。当然 ContextProvider 也有特有的 fiber 更新方法 —— updateContextProvider

```javascript
function updateContextProvider(current, workInProgress, renderLanes) {
  // 通过type属性获取Provider组件
  var providerType = workInProgress.type;
  // 拿到createContext定义的上下文
  var context = providerType._context;
  
  // 获取传递到Provider组件的属性
  var newProps = workInProgress.pendingProps;
  var oldProps = workInProgress.memoizedProps;
  var newValue = newProps.value;

  // 方法内部通过context._currentValue = nextValue 给context赋值
  pushProvider(workInProgress, newValue);
  
  // 上一次props有值得时候需要判断是否进行子元素的调度
  if (oldProps !== null) {
    var oldValue = oldProps.value;

    // 1.判断引用是否相同
    // 2.尝试使用自定义函数判断是否相同 changedBits & MAX_SIGNED_31_BIT_INT) !== changedBits 如果不是有效数字则报错
    // 3 通过 |0 操作将非法结果强制转换成0；
    var changedBits = calculateChangedBits(context, newValue, oldValue);

    if (changedBits === 0) {
      // context没有变化，且子节点没有变化，legacy context没改变，则退出更新
      // No change. Bailout early if children are the same.
      if (oldProps.children === newProps.children && !hasContextChanged()) {
        // 子元素引用没有变化则停止调度
        return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
      }
    } else {
      // The context value changed. Search for matching consumers and schedule
      // them to update.
      propagateContextChange(workInProgress, context, changedBits, renderLanes);
    }
  }

  // 获取到子节点并继续在子节点上调度
  var newChildren = newProps.children;
  reconcileChildren(current, workInProgress, newChildren, renderLanes);
  return workInProgress.child;
}
```



```javascript
function updateContextConsumer(current, workInProgress, renderLanes) {
  var context = workInProgress.type;

  var newProps = workInProgress.pendingProps;
  var render = newProps.children;

  // 如果子元素不是一个函数则抛出错误
  {
    if (typeof render !== 'function') {
      error('A context consumer was rendered with multiple children, or a child ' + "that isn't a function. A context consumer expects a single child " + 'that is a function. If you did pass a function, make sure there ' + 'is no trailing or leading whitespace around it.');
    }
  }
  
  prepareToReadContext(workInProgress, renderLanes);
  // 获取最新的值
  var newValue = readContext(context, newProps.unstable_observedBits);
  var newChildren;

  // 执行函数获取下一个节点
  {
    ReactCurrentOwner$1.current = workInProgress;
    setIsRendering(true);
    newChildren = render(newValue);
    setIsRendering(false);
  } // React DevTools reads this flag.

  //继续在下一个节点上调度
  workInProgress.flags |= PerformedWork;
  reconcileChildren(current, workInProgress, newChildren, renderLanes);
  return workInProgress.child;
}
```


