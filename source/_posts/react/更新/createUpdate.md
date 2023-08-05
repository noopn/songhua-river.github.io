---
title: createUpdate
mathjax: true

date: 2021-02-14 14:33:17
categories:
  - React
  - 更新
tags:
  - React
---


#### Update

[用于记录组件状态的改变，保存到UpdateQueue中](/posts/a51eed6a/#updateContainer)，多个Update可以同时存在

/packages/react-reconciler/src/ReactUpdateQueue.new.js 

```javascript
export function createUpdate(eventTime: number, lane: Lane): Update<*> {
  const update: Update<*> = {
    eventTime,
    lane,
    // export const UpdateState = 0; 更新
    // export const ReplaceState = 1; 替换更新
    // export const ForceUpdate = 2; 强制更新
    // export const CaptureUpdate = 3; 捕获哦错误后更新
    tag: UpdateState,
    payload: null, // 更新内容，比如`setState`接收的第一个参数
    callback: null, // 对应的回调，`setState`，`render`都有
    next: null, // 指向下一个更新
  };
  return update;
}
```

#### enqueueUpdate

```javascript
export function enqueueUpdate<State>(fiber: Fiber, update: Update<State>) {
  // fiber 节点中的updateQueue,默认是null
  const updateQueue = fiber.updateQueue;
  if (updateQueue === null) {
    // 只在未挂载时执行
    return;
  }

  const sharedQueue: SharedQueue<State> = (updateQueue: any).shared;
  // pending update链表，最新的更新在链表的顶端
  // pending = 3->2->1->3....
  const pending = sharedQueue.pending;
  if (pending === null) {
    // 只有一个update时候，循环引用
    update.next = update;
  } else {
    update.next = pending.next;
    pending.next = update;
  }
  sharedQueue.pending = update;

```