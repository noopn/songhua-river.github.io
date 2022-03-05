---
title: Recoil状态管理库
mathjax: true
categories:
  - React
tags:
  - Recoil

date: 2021-07-28 10:01:29
---

#### Recoil 产生背景

前端的应用越来越复杂，诸如常见的 Web 监控面板，包含各类的性能数据、节点信息、分类聚合用来进行应用分析。可以想象得到面板中包含各类的交互行为，编辑、删除、添加、将一个数据源绑定多个面板等等。除此之外，还需要对数据持久化，这样就能把 url 分享给其他人，并要确保被分享的人看到的是一致的。

因此开发过程中要尽量做到页面最小化更新达到高性能的目的，需要对数据流的操作更加精细。

面对这样的挑战，一般会想到用一些状态管理的函数或者库，如 React 内置的 state 管理，或者 Redux。

Recoil 想通过一个不一样的方式来解决这些问题，主要分为 3 个方面：

Flexible shared state: 在 react tree 任意的地方都能灵活共享 state，并保持高性能
Derived data and queries: 高效可靠地根据变化的 state 进行计算
App-wide state observation: time travel debugging, 支持 undo, 日志持久化

#### Recoil 主要设计

有一个应用基于这样一个场景，将 List 中更新一个节点，然后对应 Canvas 中的节点也更新

![](0001.jpg)

#####　第 1 种方式

把 state 传到公共的父节点转发给 canvas 子节点，这样显然会全量 re-render

##### 第 2 种方式

给父节点加 Provider 在子节点加 Consumer，不过每多加一个 item 就要多一层 Provider

![](0002.jpg)

##### 第 3 种方式

在 react tree 上创建另一个正交的 tree，把每片 item 的 state 抽出来。每个 component 都有对应单独的一片 state，当数据更新的时候对应的组件也会更新。Recoil 把 这每一片的数据称为 Atom，Atom 是可订阅可变的 state 单元。

![](0003.jpg)

配合 useRecoilState 可以使用这些 Atom，实践上对多个 item 的 Atom 可以用 memorize 进行优化，具体可以在官方文档查看

#### Derived Data

有这么一个场景需要根据多个 Item Box 计算 Bounding Box

![](0004.jpg)

如果你是 Vue 的爱好者，你可能想到了计算属性。Derived Data 确实有 computed props 的味道，具体思路是选取多个 Atom 进行计算，然后返回一个新的 state。因此在 Recoil 中设计了 select 这样的 API 来选取多个 Atom 进行计算。

![](0005.jpg)

select 的设计和 Proxy 挺像的，属性上有 get 进行读取，有 set 进行设置，函数内部又有 get， set 操作 state


```javascript
import {atom, selector, useRecoilState} from 'recoil';

const tempFahrenheit = atom({
  key: 'tempFahrenheit',
  default: 32,
});

const tempCelcius = selector({
  key: 'tempCelcius',
  get: ({get}) => ((get(tempFahrenheit) - 32) * 5) / 9,
  set: ({set}, newValue) => set(tempFahrenheit, (newValue * 9) / 5 + 32),
});

```

#### App-wide observation

这个场景下需要把 url 分享给其他人，别人打开相同的链接也能看到一样的页面。

那么就需要 observe Atom 的变更，Recoil 使用 useTransactionObservation 进行订阅

```javascript
useTransactionObservation(({atomValues,modifiedAtoms,...} => {}))
```

另一方面，打开链接的时候也需要对输入的数据进行校验

```javascript
const counter = atom({
  key: 'myCounter',
  default: 0,
  validator: (untrustedInput),
  metadata: ...
})
```