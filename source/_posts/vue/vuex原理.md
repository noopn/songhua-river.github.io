---
layout: post
title: vuex原理
categories:
  - Vue
tags:
  - Vue

date: 2021-03-08 09:29:31
---

#### 

![](0001.jpg)


1）state

state是存储的单一状态，是存储的基本数据。

2）Getters

getters是store的计算属性，对state的加工，是派生出来的数据。就像computed计算属性一样，getter返回的值会根据它的依赖被缓存起来，且只有当它的依赖值发生改变才会被重新计算。

3）Mutations

mutations提交更改数据，使用store.commit方法更改state存储的状态。（mutations同步函数）

4）Actions

actions像一个装饰器，提交mutation，而不是直接变更状态。（actions可以包含任何异步操作）

5）Module

Module是store分割的模块，每个模块拥有自己的state、getters、mutations、actions。

```javascript
const moduleA = {
  state: { ... },
  mutations: { ... },
  actions: { ... },
  getters: { ... }
}

const moduleB = {
  state: { ... },
  mutations: { ... },
  actions: { ... }
}

const store = new Vuex.Store({
  modules: {
    a: moduleA,
    b: moduleB
  }
})

store.state.a // -> moduleA 的状态
store.state.b // -> moduleB 的状态
```

6）辅助函数

Vuex提供了mapState、MapGetters、MapActions、mapMutations等辅助函数给开发在vm中处理store。


#### vuex实现原理

```javascript
/* eslint-disable no-underscore-dangle */

import Vue from 'vue';

class Store {
  constructor(options) {
    const {
      state,
      // 计算属性
      getters,
      // 通过提交commit改变数据
      // 只是一个单纯的函数
      // 不要使用异步操作，异步操作会导致变量不能追踪
      mutations,
      // 用于通过提交mutation改变数据
      // 会默认将自身封装为一个Promise
      // 可以包含任意的异步操作
      actions,
    } = options;
    this._mutations = mutations;
    this._actions = actions;
    if (getters) {
      this.handleGetters(getters);
    }

    // 把state添加到vue实例上
    // 用vue实现双向数据绑定
    this._vm = new Vue({
      data: {
        $$state: state,
      },
    });
    this.commit = this.commit.bind(this);
    this.dispatch = this.dispatch.bind(this);
  }

  get state() {
    return this._vm._data.$$state;
  }

  // _mutations相当于reducer
  commit(type, paload) {
    const entry = this._mutations[type];
    if (entry) {
      entry(this.state, paload);
    }
  }

  dispatch(type, payload) {
    const entry = this._actions[type];
    if (entry) {
      entry(this, payload);
    }
  }

  // 为每一个getter方法绑定了get
  handleGetters(getters) {
    this.getters = {};
    const self = this;
    Object.keys(getters).forEach((key) => {
      Object.defineProperty(self.getters, key, {
        get: () => getters[key](self.state),
      });
    });
  }
}

let _Vue;
function install(__Vue) {
  _Vue = __Vue;
  _Vue.mixin({
    beforeCreate() {
      // 在原型上添加store;
      if (this.$options.store) {
        Vue.prototype.$store = this.$options.store;
      }
    },
  });
}

export default {
  Store,
  install,
};

```

#### 问题1

vuex的store是如何挂载注入到组件中呢？

+ `Vue.use(vuex);`通过vue插件机制
+ 调用 vuex 暴露出的 install 方法
+ 利用vue的mixin混入机制，在beforeCreate钩子前混入，把store挂载在原型上面

![](0002.jpg)

#### 问题2

vuex的state和getters是如何映射到各个组件实例中响应式更新状态呢？

Vuex的state状态是响应式，是借助vue的data是响应式，将state存入vue实例组件的data中；Vuex的getters则是借助vue的计算属性computed实现数据实时监听。

```javascript
function resetStoreVM (store, state, hot) {
  const oldVm = store._vm

  // 设置 getters 属性
  store.getters = {}
  const wrappedGetters = store._wrappedGetters
  const computed = {}
  // 遍历 wrappedGetters 属性
  forEachValue(wrappedGetters, (fn, key) => {
    // 给 computed 对象添加属性
    computed[key] = partial(fn, store)
    // 重写 get 方法
    // store.getters.xx 其实是访问了store._vm[xx]，其中添加 computed 属性
    Object.defineProperty(store.getters, key, {
      get: () => store._vm[key],
      enumerable: true // for local getters
    })
  })

  const silent = Vue.config.silent
  Vue.config.silent = true
  // 创建Vue实例来保存state，同时让state变成响应式
  // store._vm._data.$$state = store.state
  store._vm = new Vue({
    data: {
      $$state: state
    },
    computed
  })
  Vue.config.silent = silent

  // 只能通过commit方式更改状态
  if (store.strict) {
    enableStrictMode(store)
  }
}
```