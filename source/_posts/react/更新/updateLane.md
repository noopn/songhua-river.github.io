---
title: updateLane
mathjax: true

date: 2021-02-14 17:51:27
categories:
  - React
  - 更新
tags:
  - React
---


#### updateLane

[用于调度更新的优先级](/posts/a51eed6a/#updateContainer) 通过 `requestUpdateLane` 创建

```javascript
export function requestUpdateLane(fiber: Fiber): Lane {
  const mode = fiber.mode;
  if ((mode & BlockingMode) === NoMode) {
    // 初次加载时为SyncLane
    return (SyncLane: Lane);
  } else if ((mode & ConcurrentMode) === NoMode) {
    return getCurrentPriorityLevel() === ImmediateSchedulerPriority
      ? (SyncLane: Lane)
      : (SyncBatchedLane: Lane);
  } else if (
    !deferRenderPhaseUpdateToNextBatch &&
    (executionContext & RenderContext) !== NoContext &&
    workInProgressRootRenderLanes !== NoLanes
  ) {
    // This is a render phase update. These are not officially supported. The
    // 这是一个渲染阶段的更新，这些都没有得到官方的支持
    // old behavior is to give this the same "thread" (expiration time) as
    // 原来的方案是赋予它与当前渲染相同的过期时间
    // whatever is currently rendering. So if you call `setState` on a component
    // 如果你在一个组件上调用setState，他们会在相同的渲染中稍后生效， 
    // that happens later in the same render, it will flush. Ideally, we want to
    // 会发生闪屏
    // remove the special case and treat them as if they came from an
    // 理想情况下，我们希望删除特例，并将它们视为来插入的事件
    // interleaved event. Regardless, this pattern is not officially supported.
    // 无论如何，这种模式并没有得到官方的支持。
    // This behavior is only a fallback. The flag only exists until we can roll
    // 这种行为值是一个回退机制，标识只存存在于我们可以离开setState警告之前
    // out the setState warning, since existing code might accidentally rely on
    // 因为现有代码可能意外地依赖于当前行为。
    // the current behavior.
    return pickArbitraryLane(workInProgressRootRenderLanes);
  }

  // The algorithm for assigning an update to a lane should be stable for all
  // updates at the same priority within the same event. To do this, the inputs
  // 对于同一事件中具有相同优先级的所有更新，为车道分配更新的算法应该是稳定的（幂等的）。
  // to the algorithm must be the same. For example, we use the `renderLanes`
  // 为此，算法的输入必须相同。 
  // to avoid choosing a lane that is already in the middle of rendering.
  // 我们使用“renderLanes”来避免选择已经在渲染过程中的车道。
  // However, the "included" lanes could be mutated in between updates in the
  // 然而 included 车道可能在两次相同事件中的更新被改变
  // same event, like if you perform an update inside `flushSync`. Or any other
  // 就像在“flushSync”中执行更新一样
  // code path that might call `prepareFreshStack`.
  // 或者任何其他可能调用“prepareFreshStack”的代码。
  // The trick we use is to cache the first of each of these inputs within an
  // 我们使用的技巧是在事件中缓存这些输入中的第一个
  // event. Then reset the cached values once we can be sure the event is over.
  // 然后在确定事件结束后重置缓存的值。
  // Our heuristic for that is whenever we enter a concurrent work loop.
  // 启发式方法是，每当我们进入一个并发工作循环时
  // We'll do the same for `currentEventPendingLanes` below.
  if (currentEventWipLanes === NoLanes) {
    currentEventWipLanes = workInProgressRootIncludedLanes;
  }

  const isTransition = requestCurrentTransition() !== NoTransition;
  if (isTransition) {
    if (currentEventPendingLanes !== NoLanes) {
      currentEventPendingLanes =
        mostRecentlyUpdatedRoot !== null
          ? mostRecentlyUpdatedRoot.pendingLanes
          : NoLanes;
    }
    return findTransitionLane(currentEventWipLanes, currentEventPendingLanes);
  }

  // TODO: Remove this dependency on the Scheduler priority.
  // To do that, we're replacing it with an update lane priority.
  const schedulerPriority = getCurrentPriorityLevel();

  // The old behavior was using the priority level of the Scheduler.
  // This couples React to the Scheduler internals, so we're replacing it
  // with the currentUpdateLanePriority above. As an example of how this
  // could be problematic, if we're not inside `Scheduler.runWithPriority`,
  // then we'll get the priority of the current running Scheduler task,
  // which is probably not what we want.
  let lane;
  if (
    // TODO: Temporary. We're removing the concept of discrete updates.
    (executionContext & DiscreteEventContext) !== NoContext &&
    schedulerPriority === UserBlockingSchedulerPriority
  ) {
    lane = findUpdateLane(InputDiscreteLanePriority, currentEventWipLanes);
  } else {
    const schedulerLanePriority = schedulerPriorityToLanePriority(
      schedulerPriority,
    );

    if (decoupleUpdatePriorityFromScheduler) {
      // In the new strategy, we will track the current update lane priority
      // inside React and use that priority to select a lane for this update.
      // For now, we're just logging when they're different so we can assess.
      const currentUpdateLanePriority = getCurrentUpdateLanePriority();

      if (
        schedulerLanePriority !== currentUpdateLanePriority &&
        currentUpdateLanePriority !== NoLanePriority
      ) {
        if (__DEV__) {
          console.error(
            'Expected current scheduler lane priority %s to match current update lane priority %s',
            schedulerLanePriority,
            currentUpdateLanePriority,
          );
        }
      }
    }

    lane = findUpdateLane(schedulerLanePriority, currentEventWipLanes);
  }

  return lane;
}
```