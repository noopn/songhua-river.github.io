---
title: eventTime
mathjax: true
abbrlink: ca16ccb4
date: 2021-02-14 16:08:57
categories:
  - React
  - 更新
tags:
  - React
---

#### eventTime

[用于的调度更新的时间戳](/posts/a51eed6a/#updateContainer) 通过 `requestEventTime` 创建

```javascript
// 用二进制来表示所处的上下文状态
export const NoContext = /*             */ 0b0000000;
const BatchedContext = /*               */ 0b0000001;
const EventContext = /*                 */ 0b0000010;
const DiscreteEventContext = /*         */ 0b0000100;
const LegacyUnbatchedContext = /*       */ 0b0001000;
const RenderContext = /*                */ 0b0010000;
const CommitContext = /*                */ 0b0100000;
export const RetryAfterError = /*       */ 0b1000000;

var currentEventTime = NoTimestamp = -1;;
// executionContext = NoContext
export function requestEventTime() {
  if ((executionContext & (RenderContext | CommitContext)) !== NoContext) {
    // We're inside React, so it's fine to read the actual time.
    return now();
  }
  // 不在react中，可能在浏览器的事件中
  if (currentEventTime !== NoTimestamp) {
    // 对所有更新使用相同的开始时间，直到再次进入react中
    return currentEventTime;
  }
  // 这是React运行后后的第一次更新。计算新的开始时间。
  currentEventTime = now();
  return currentEventTime;
}
```

获取时间戳的时候，如果Date对象初始化的时间过长，在使用的时候还需要把初始化的时间减去

```javascript
let getCurrentTime;
const hasPerformanceNow =
  typeof performance === 'object' && typeof performance.now === 'function';

if (hasPerformanceNow) {
  const localPerformance = performance;
  getCurrentTime = () => localPerformance.now();
} else {
  const localDate = Date;
  const initialTime = localDate.now();
  getCurrentTime = () => localDate.now() - initialTime;
}

var Scheduler_now = Scheduler.unstable_now = getCurrentTime;
var initialTimeMs$1 = Scheduler_now$1(); 
// 如果初始化的事件戳非常小，直接使用 initialTimeMs，对于现代浏览器直接使用performance.now
// 在老的浏览器中回退使用Date.now, 返回Unix事件戳，这时需要减去模块初始化的时间来模拟 performance.now
// 并把时间控制在32位以内

var now = initialTimeMs$1 < 10000 ? Scheduler_now$1 : function () {
  return Scheduler_now$1() - initialTimeMs$1;
};
```