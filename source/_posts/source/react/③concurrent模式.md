---
layout: posts
title: React源码分析 ③ concurrent 模式简介
mathjax: true
date: 2022-05-11 09:47:06
categories:
  - 源码分析
  - React
tags:
  - React
  - 源码分析
---

React 官方提供了三种模式可以选择:

- legacy 模式： ReactDOM.render(<App />, rootNode)。这是当前 React app 使用的方式。当前没有计划删除本模式，但是这个模式可能不支持这些新功能。
- blocking 模式： ReactDOM.createBlockingRoot(rootNode).render(<App />)。目前正在实验中。作为迁移到 concurrent 模式的第一个步骤。
- concurrent 模式： ReactDOM.createRoot(rootNode).render(<App />)。目前在实验中，未来稳定之后，打算作为 React 的默认开发模式。这个模式开启了所有的新功能。

但即使对于最新版本的 React 也没有主动提供 createRoot 这个 api,需要安装 Alpha 版本, 效果仍然相当于 legacy 模式.

#### 版本演化

React v15 的版本中用到了 Reconciler 和 Renderer 两个部分

![](0001.png)

这样存在的问题就是对节点的更新是递归同步更新的，如果节点非常多,即使只有一次 state 变更，React 也需要进行复杂的递归更新，更新一旦开始，中途就无法中断，直到遍历完整颗树，才能释放主线程。

而 React v16 添加了前两章提到的,Scheduler, Fiber 这些都为最终实现 concurrent 模式提供了支持

![](0002.png)

但是在 React v16 版本中只是对能实现 concurrent 模式的这些模块进行了尝试. 最重要的还是在 v16.8 版本中发布了全新了 Hooks Api.

在 v17.0 版本的时候又提出了全新的 lane 模型用于处理更新的优先级. 虽然在 v17.0 版本中没有重大的更新,但是 concurrent 模式已经可以与老的模式稳定共存.

#### 启动过程

![](0003.png)

传入不同的 [RootTag](/posts/0bde2678fb55/#RootTag) 用于标记不同的类型.这个变量会参与到初始化流程,优先级判断的逻辑中.

#### 更新入口

legacy 模式

```js
unbatchedUpdates(() => {
  updateContainer(children, fiberRoot, parentComponent, callback);
});
```

concurrent 模式

```js
ReactDOMRoot.prototype.render = ReactDOMBlockingRoot.prototype.render =
  function (children: ReactNodeList): void {
    const root = this._internalRoot;
    // 执行更新
    updateContainer(children, root, null, null);
  };
```

#### 异同点

不同的模式,传入不同的 rootTag 类型,最终都调用了 updateContainer 函数串联了 react-dom 与 react-reconciler.

legacy 下的更新会先调用 unbatchedUpdates, 更改执行上下文为 LegacyUnbatchedContext, 之后调用 updateContainer 进行更新.

concurrent 和 blocking 不会更改执行上下文, 直接调用 updateContainer 进行更新.

另外在 React 官方文档中可以找到:

legacy 模式在合成事件中有自动批处理的功能，但仅限于一个浏览器任务。非 React 事件想使用这个功能必须使用 unstable_batchedUpdates。在 blocking 模式和 concurrent 模式下，所有的 setState 在默认情况下都是批处理的,这也意味着 concurrent 模式下所有的更新都是异步的.
