---
title: createContext
mathjax: true
categories:
  - React
  - 基础
tags:
  - React
abbrlink: ee52e5d7
date: 2021-02-13 15:38:20
---

#### createContext

提供了跨层级共享数据的方案

```javascript
import React,{createContext} from 'react';
const ThemeContext = createContext('light');

const Child = function(){
  return <div>
    <ThemeContext.Consumer>
      {value=> <div>{value}</div>}
    </ThemeContext.Consumer>
  </div>
}
function App() {
  return (
    <ThemeContext.Provider value="dark">
      <div className="App">
         <Child/>
    </div>
  </ThemeContext.Provider>

  );
}
```

#### 源码

`context.Consumer = context;` 在使用context时候Consumer就是定义的`context`本身，所以可以直接在Consumer中拿到状态

```javascript
export function createContext<T>(
  defaultValue: T,
  calculateChangedBits: ?(a: T, b: T) => number,
): ReactContext<T> {
  // ...
  const context: ReactContext<T> = {
    $$typeof: REACT_CONTEXT_TYPE,
    _calculateChangedBits: calculateChangedBits,
    // As a workaround to support multiple concurrent renderers, we categorize
    // some renderers as primary and others as secondary. We only expect
    // there to be two concurrent renderers at most: React Native (primary) and
    // Fabric (secondary); React DOM (primary) and React ART (secondary).
    // Secondary renderers store their context values on separate fields. 
    // 作为支持种渲染环境的解决方案，将一些渲染器作为主渲染器，其他作为辅助渲染器，我们期待最多只有两种渲染器共存
    // React Native（primary）和 Fabric（次要）；React DOM（主要）和React ART（次要）。
    // 二级渲染器将其上下文值存储在单独的字段中。
    _currentValue: defaultValue, // 用于记录最新的context
    _currentValue2: defaultValue,
    // Used to track how many concurrent renderers this context currently
    // 用于跟踪此上下文当前有多少个并发渲染器
    // supports within in a single renderer. Such as parallel server rendering.
    // 在单个渲染器中支持。例如并行服务器渲染。
    _threadCount: 0,
    // These are circular
    Provider: (null: any),
    Consumer: (null: any),
  };

  context.Provider = {
    $$typeof: REACT_PROVIDER_TYPE,
    _context: context,
  };

  let hasWarnedAboutUsingNestedContextConsumers = false;
  let hasWarnedAboutUsingConsumerProvider = false;
  let hasWarnedAboutDisplayNameOnConsumer = false;

  if (__DEV__) {
    //...
  } else {
    context.Consumer = context;
  }
  return context;
}

```