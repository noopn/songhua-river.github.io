---
layout: post
title: redux实现原理

categories:
  - React
tags:
  - Redux
date: 2021-02-20 08:06:18
---

现有状态管理工具

redux mobx mobx-state-tree redoil vuex

redux flux 是一个工具，每一层分的清楚但是麻烦

store -> container
currentState -> _value
action-> f
currentReducer ->map 
middleware- io functor 异步问题

store 是一个容器含有state 和reducer,reducer 是一个纯函数，他可以查看之前的状态，执行一个action并且返回一个新的状态


mobx 强调的是轻量，去掉了Reducer.  只有action+state @observer(函数组件)

mobx-state-lite => provider  

#### 原理图

![](0001.gif)

#### Action 

Action 是store数据的唯一来源， store.dispatch() 将 action 传到 store。

**我们应该尽量减少在 action 中传递的数据。尽量传递数据标识或修改条件，如索引，过滤条件**，而不是修改数据之后传入整个数据对象。

通常Action是一个对象 

```javascript
{
  type: SET_VISIBILITY_FILTER,
  filter: SHOW_COMPLETED
}
```

可以用函数简单的包装

```javascript
const addTodo  = (text) => ({
    type: ADD_TODO,
    text
})
```

因为action最终回传递到dispatch中，可以通过一个函数来自动实现这一步，也就是**actionCreater**

```javascript
const boundTode = (text) => dispatch(addTodo(text))
```

#### Reducer

Reducers 指定了应用状态的变化如何响应 actions 并发送到 store 的，记住 actions 只是描述了有事情发生了这一事实，并没有描述应用如何更新 state。

reducer 就是一个纯函数，接收旧的 state 和 action，返回新的 state。

```javascript
(previousState, action) => newState
```


之所以将这样的函数称之为reducer，是因为这种函数与被传入 Array.prototype.reduce(reducer, ?initialValue) 里的回调函数属于相同的类型。保持 reducer 纯净非常重要。永远不要在 reducer 里做这些操作：

1.修改传入参数；
2.执行有副作用的操作，如 API 请求和路由跳转；
3.调用非纯函数，如 Date.now() 或 Math.random()。

**只要传入参数相同，返回计算得到的下一个 state 就一定相同。没有特殊情况、没有副作用，没有 API 请求、没有变量修改，单纯执行计算。**

```javascript
function todoApp(state = initialState, action) {
  switch (action.type) {
    case SET_VISIBILITY_FILTER:
      return Object.assign({}, state, {
        visibilityFilter: action.filter
      })
    default:
      return state
  }
}
```

注意：
+ 不能直接修改state
+ 在 default 情况下返回旧的 state。遇到未知的 action 时，一定要返回旧的 state。

**拆分Reducer**

```javascript
function todos(state = [], action) {
  switch (action.type) {
    case ADD_TODO:
      return [
        ...state,
        {
          text: action.text,
          completed: false
        }
      ]
    default:
      return state
  }
}

function visibilityFilter(state = SHOW_ALL, action) {
  switch (action.type) {
    case SET_VISIBILITY_FILTER:
      return action.filter
    default:
      return state
  }
}

function todoApp(state = {}, action) {
  return {
    visibilityFilter: visibilityFilter(state.visibilityFilter, action),
    todos: todos(state.todos, action)
  }
}
```

redux 提供了合并reducer的方法与上面的完全等价，会按照不同的key值，把reducer分组

```javascript
import { combineReducers } from 'redux'

const todoApp = combineReducers({
  visibilityFilter,
  todos
})
```



#### Store

Store 就是把它们联系到一起的对象。

维持应用的 state；
提供 getState() 方法获取 state；
提供 dispatch(action) 方法更新 state；
通过 subscribe(listener) 注册监听器;
通过 subscribe(listener) 返回的函数注销监听器。

通过redux提供的createStore方法创建store

./redux.js

```javascript

// 接受reducer 和 初始化状态返回store对象
function createStore(reducer,initState){
  let currentreducer = reducer;
  let store = initState;
  let currentListen = [];


  // 直接返回store的引用
  function getState(){
    return store;
  }

  // 把事添加到监听队列中
  function subscribe(listen){
    currentListen.push(listen);
  }
  
  //派发一个action,通过reducer处理，返回并保存新的state
  function dispatch(action){
    store = currentreducer(action,store);
    // 发布通知
    for(let i=0;i<currentListen.length;i++){
      currentListen[i]();
    }
  }

  // 返回的store对象
  return {
    getState,
    dispatch,
    subscribe
  }
}
export {
  createStore,
}
```


#### combineReducers

combineReducers用于合并reducer,需要注意的是reducer和combineReducers都是函数
所以combineReducers的实现是把，多个reducer循环执行并且按reducer拆分store

```javascript
function combineReducers(reducers){
  // 缓存keys,避免重复执行
  const keys = Object.keys(reducers);
  return function(action,store){
    // 初始化的store可能为undefined
    store = store || {};
    for(let k of keys){
      store[k] = reducers[k](action,store[k])
    }
    return store;
  }
}
```

因为第一次执行的时候,每个reducer如果有默认的state应该先合并一次

需要在createrStore中自动执行一次`dispatch({type:Symbol('')})`

#### Middleware

有时希望能在状态改变前和改变后处理

```javascript
function dispatchAndLog(store, action) {
  console.log('dispatching', action)
  store.dispatch(action)
  console.log('next state', store.getState())
}
```

重写了dispatch函数，并保持了对老的dispatch的引用
新的dispatch是对老的dispatch的封装，可以在中间添加逻辑处理

```javascript
function patchStoreToAddLogging(store) {
  let next = store.dispatch
  store.dispatch = function dispatchAndLog(action) {
    console.log('dispatching', action)
    let result = next(action)
    console.log('next state', store.getState())
    return result
  }
}
```

由于不满足函数式编程的思想，这里通过直接返回一个函数来处理
并把老的dispatch方法通过next参数传入
传入的next需要在redux中实现

```javascript
const logger = store => next => action => {
  console.log('dispatching', action)
  let result = next(action)
  console.log('next state', store.getState())
  return result
}
```

**applyMiddleware**

返回一个新的store对象，并提供通过middleware包装过的dispatch方法

```javascript
function applyMiddleware(...middlewares){
  return function(createStore){
    // 新的createStore方法传入 reducers 和 initstate
    return function(...args){
    const store = createStore(...args);
    // 保留dispatch的引用
    const next = store.dispatch;
      // 提供给middleware的第一个参数，如果直接调用dispatch回抛出错误
      const middlewareApi = {
        getState:store.getState,
        dispatch:()=> new Error()
      }
      //为每个middle提供getState方法
      middlewares = middlewares.map(middleware=>middleware(middlewareApi));

      //重写dispatch方法，每一个middleware执行，都会触发传入的dispatch的引用
      //a(next) 返回middleware中最有一个函数，需要传入一个action
      //(action) =>{
      //   console.log('error state',store.getState());
      //   next(action);
      //   console.log('action');
      // }
      // b函数传入的就是这个返回函数
      // 在最终调用的时候action回一级一级的被传下去
      const dispatch = middlewares.reduce((a,b)=>b(a(next)));
      return {
        ...store,
        dispatch
      }
    }
  }
}
```

同时`redux.js`中需要修改 

```javascript
function createStore(reducer,initState,middleware){
  if(middleware) {
    // 重写create函数,相当于在外层添加一个拦截器
   return  middleware(createStore)(reducer,initState)
  }
}
```

**compose**

把 reducer middlewares 的逻辑单独提取出来

```javascript
export default function compose(...funcs) {
  if (funcs.length === 0) {
    return arg => arg
  }

  if (funcs.length === 1) {
    return funcs[0]
  }
  //注意最后返回的时候包裹了一个函数，传入外部参数，也就是上面的store.dispatch
  return funcs.reduce((a, b) => (...args) => a(b(...args)))
}
```

最终完整的代码

```javascript
const applyMiddleware = function(...middlewares){
  return (createStore)=>(...args) =>{
    const store = createStore(...args);
    console.log(middlewares);

    let dispatch = () => {
      throw new Error(
        'Dispatching while constructing your middleware is not allowed. ' +
          'Other middleware would not be applied to this dispatch.'
      )
    }

    const middlewareAPI = {
      getState: store.getState,
      dispatch: (...args) => dispatch(...args)
    }

    const chain = middlewares.map(middleware => middleware(middlewareAPI))
    dispatch = compose(...chain)(store.dispatch)
    return {
      ...store,
      dispatch
    }
  }
}
```

#### bindActionCreators

我们希望可以创建一个action对象，直接调用上面的方法，而忽略dispatch的步骤

```javascript
const actions1 =(payload)=>({
  type: "A",
  payload
});
const actions2 =(payload)=>({
  type: "B",
  payload
})
const actions3 =(payload)=>({
  type: "C",
  payload
})

const actions = bindActionCreators({
  actions1,
  actions2,
  actions3,
},store.dispatch)

actions.actions1()
actions.actions2({name: 'wefwegwekfl'})
actions.actions3({age: '30'})
```

需要实现一个bindActionCreators方法

惟一会使用到 bindActionCreators 的场景是当你需要把 action creator 往下传到一个组件上

却不想让这个组件觉察到 Redux 的存在，而且不希望把 dispatch 或 Redux store 传给它。


```javascript
const bindActionCreator = function(actionCreator,dispatch){
  return function(){
    return dispatch(actionCreator.apply(this,arguments))
  }
}

// 接受的是一个action对象集合
const bindActionCreators = function(actionCreators,dispatch){
  const boundActionCreators = {}
  for(let key in actionCreators){
    if(typeof actionCreators[key]==='function'){
      // 最终返回一个以每个action名字为key的对象
      // 每个key对应的值为一个可以触发dispatch方法的函数
      // 相当于为每个actio自动绑定了dispatch 方法
      boundActionCreators[key] = bindActionCreator(actionCreators[key],dispatch)
    }
  }
  return boundActionCreators;
}


export default bindActionCreators
```