---
title: react中的keep-alive
mathjax: true
categories:
  - React
  - 应用
tags:
  - React
abbrlink: 9e5405ec
date: 2021-04-02 17:11:42
---

#### 什么是 keep alive

keep-alive是vue内置的一个组件，而这个组件的作用就是能够缓存不活动的组件，一般情况下，组件进行切换的时候，默认会进行销毁，如果有需求，某个组件切换后不进行销毁，而是保存之前的状态，那么就可以利用keep-alive来实现。

这对于某些路由切换等场景非常好用，例如，如果我们需要实现一个列表页和详情页，但在用户从详情页返回列表的时候，我们不希望重新请求接口获取，也不希望重置列表的过滤、排序等条件，那这时就可以对列表页的组件用 keep-alive 包裹一下，这样，当路由切换时，会将这个组件“失活”并缓存起来，而不是直接卸载掉。

#### 最简单的方案

大部分开发者可能都会直接使用 `display: none` 来将 DOM 隐藏：

```javascript
<div style={shouldHide ? {display: 'none'} : {}}>
  <Foo/>
</div>
```

虽然在视觉上实现了keep-alive,但并没有真正的移除组件,**所以导致转场动画难（TransitionGroup）以实现**

#### 使用 Portals Api 实现 keep-alive

[Portals](https://zh-hans.reactjs.org/docs/portals.html) Portal 提供了一种将子节点渲染到存在于父组件以外的 DOM 节点的优秀的方案。

```javascript
import React, { useEffect, useState,useRef, useCallback } from 'react';
import ReactDOM from 'react-dom'

const KeepAlive = (props)=>{
  // 创建DOM元素用于缓存react子元素
  const [targetElement] = useState(()=>document.createElement('div'));
  // 用于挂载缓存的子元素
  const containerRef = useRef(null)
  // 通过外层属性判断是否需要渲染自元素
  useEffect(()=>{
    if (props.active) {
      containerRef.current.appendChild(targetElement)
    } else {
      try {
        containerRef.current.removeChild(targetElement)
      } catch (e) {}
    }
  },[
    props.active,
    targetElement
  ])
  
  return (
    <>
      <div ref={containerRef} />
      {ReactDOM.createPortal(props.children, targetElement)}
    </>
  )
}

const Count = ()=>{
  const [count,setCount]=  useState(1);
  const addCount = useCallback(()=>{
    setCount(state=>state+1);
  },[
    setCount
  ])
  return (<div>
    <div onClick={addCount}>+1</div>
    <div>
      {count}
    </div>
  </div>)
}

const App = ()=>{
  const [shouldHide,setShouldHide] = useState(false);
  
  const toggleVisable = useCallback(()=>{
    setShouldHide(state=>!state)
  },[
    setShouldHide
  ])

  return (
    <div>
      <div>xxx</div>
      <div onClick={toggleVisable}>显示隐藏</div>
      <KeepAlive active={!shouldHide}>
        <Count/>
      </KeepAlive>
    </div>
  )
}

export default App;
```

#### 用懒加载优化 Portals 方案

目前我们的 Conditional 组件还有一点小小的瑕疵：当组件初次渲染时，不论当前的 active 是 true 还是 false ， Conditional 组件都会将 props.children 渲染。这对大型应用可能会带来非常明显的性能问题

```javascript
const KeepAlive = (props)=>{
  const [targetElement] = useState(()=>document.createElement('div'));
  const containerRef = useRef(null);
  const activeMark = useRef(false);
  //一旦第一次加载后，会被标记为true,已加载并不会再改变
  activeMark.current = activeMark.current || props.active;
  useEffect(()=>{
    if (props.active) {
      containerRef.current.appendChild(targetElement)
    } else {
      try {
        containerRef.current.removeChild(targetElement)
      } catch (e) {}
    }
  },[
    props.active,
    targetElement
  ])
  return (
    <>
      <div ref={containerRef} />
      {
        activeMark.current && ReactDOM.createPortal(props.children, targetElement)
      }
    </>
  )
}
```

#### Portals 方案一些存在的问题

+ 需要手动控制 active ，不能直接基于子组件销毁/创建的生命周期事件

+ 缺少失活/激活的生命周期事件，子组件无法感知自己是不是被缓存起来了

+ 依赖了 ReactDOM ，对 SSR 不够友好


#### 另一种实现思路

我们希望使用的时候可以像一个普通组件一样使用, 使用了KeepAlive包裹的组件将会被缓存

```javascript
{show && (
  <KeepAlive>
    <Counter />
  </KeepAlive>
)}
```

#### 实现Wrapper组件

通过一个外层的高阶组件缓存需要被keep-alive组件的信息

提供一个keep方法并发放到下层组件中，用于收集kepp-alive组件信息

把组件挂载到一个节点上

```javascript
import React, { createContext, useCallback, useRef, useState,memo, useEffect, useContext, useLayoutEffect } from 'react'

const KeepAliveContext = createContext()

export const AliveScope = memo((props) => {
  const nodes = useRef({});
  const [cache,setCache] = useState({});
  const promiseThen = useRef([]);
  
  useLayoutEffect(()=>{
    while(promiseThen.current.length) {
      const [resolve,id] = promiseThen.current.pop();
      resolve(nodes.current[id]);
    }
  },[
    cache,
  ])

  const keep = useCallback((id,children)=>(
    new Promise(resolve=>{
      setCache(cache=> ({...cache,[id]:children}));
      promiseThen.current.push([resolve,id])
    })
  ),[setCache]);
  
  return (
    <KeepAliveContext.Provider value={keep}>
      {props.children}
      {Object.entries(cache).map(([id, children]) => (
        <div
          key={id}
          ref={node => {
            nodes.current[id] = node
          }}
        >
          {children}
        </div>
      ))}
    </KeepAliveContext.Provider>
  )
})
```

#### keep-alive组件的实现

通过id找到缓存的组件，并append到指定的节点上

```javascript
const KeepAlive = memo(({id,children})=>{
  const keep = useContext(KeepAliveContext);
  const mountRef= useRef(null);

  useEffect(()=>{
     (async ()=>{
      const element = await keep(id,children);
      console.log(element);
      mountRef.current && mountRef.current.appendChild(element)
    })()
  },[
    id,
    children,
    keep
  ])

  return (<div ref = {mountRef}></div>)
})
```

