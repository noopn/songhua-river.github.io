---
title: React原理 执行流程与架构
mathjax: true
categories:
  - React
tags:
  - React
abbrlink: c48c9a6f
date: 2021-10-22 19:04:28
---


#### 整体执行流程

![](0001.png)

#### 初始化事件相关对象

![](0002.png)

+ registerSimpleEvents 创建对象相关对象

|变量名称|变量对象|说明|
|---|---|---|
|allNativeEvents|Set集合|<div style='width:600px'>保存所有原生事件的名称 例如 `0:"cancel"`</div>|
|eventPriorities|Map集|<div style='width:600px'>保存事件名称和事件优先级对应关系 例如 `click=>0` </div>|
|topLevelEventsToReactNames|Map集|<div style='width:600px'>保存原始事件名称和 React事件的对应关系 例如 `"cancel" => "onCancel"` </div>|
|registrationNameDependencies|Object|<div style='width:600px'>保存React事件和原生事件的对应关系 例如 `onClick:(1) ['click']` 每个React事件对应一个数组用于保存合成事件对应关系</div>|
|possibleRegistrationNames|Object|<div style='width:600px'>保存小写的React事件名称和正确的驼峰命名事件的对应关系，用于校验用户输入 例如 `onclick:onClick`</div>|

#### 入口

![](0003.png)

**render** : ReactDom.render()
**createRootImpl** : 创建 FiberRootNode 根节点
**listenToAllSupportedEvents** : 绑定所有原生事件在root节点上

#### render阶段 

![](0004.png)

**unbatchedUpdates** : 非批量更新，让用户尽早看见页面内容，如果是 batchedUpdates 会以异步执行
**scheduleUpdateOnFiber** : 调度Fiber节点更新优先级
**performUnitOfWork** : 以Fiber节点为单位，深度优先递归遍历每一个节点
**reconcileChildren** ： 创建对比Fiber节点，标记有副作用的节点 （添加，删除，移动，更新）
**completeUnitOfWork** ： 从下至上遍历节点，创建相应的DOM节点，并创建Effects链表，交给commit阶段使用

#### commit阶段

![](0005.png)

**commitBeforeMutationEffects**: 操作真实节点前执行，会执行`getSnapshotBeforeUpdate`
**commitMutationEffects**: 执行节点操作
**commitLayoutEffects：** 执行副作用函数，包括 `componentDidUpdate` 或 `effect`回调函数

#### JSX
jsx是js语言的扩展，react通过babel词法解析，将jsx转换成React.createElement，React.createElement方法返回virtual-dom对象（内存中用来描述dom阶段的对象），所有jsx本质上就是React.createElement的语法糖，它能声明式的编写我们想要组件呈现出什么样的ui效果.

#### Fiber双缓存
Fiber对象上面保存了包括这个节点的属性、类型、dom等，Fiber通过child、sibling、return（指向父节点）来形成Fiber树，还保存了更新状态时用于计算state的updateQueue，updateQueue是一种链表结构，上面可能存在多个未计算的update，update也是一种数据结构，上面包含了更新的数据、优先级等，除了这些之外，上面还有和副作用有关的信息。

双缓存是指存在两颗Fiber树，current Fiber树描述了当前呈现的dom树，workInProgress Fiber是正在更新的Fiber树，这两颗Fiber树都是在内存中运行的，在workInProgress Fiber构建完成之后会将它作为current Fiber应用到dom上

在mount时（首次渲染），会根据jsx对象（Class Component或的render函数者Function Component的返回值），构建Fiber对象，形成Fiber树，然后这颗Fiber树会作为current Fiber应用到真实dom上，在update（状态更新时如setState）的时候，会根据状态变更后的jsx对象和current Fiber做对比形成新的workInProgress Fiber，然后workInProgress Fiber切换成current Fiber应用到真实dom就达到了更新的目的，而这一切都是在内存中发生的，从而减少了对dom好性能的操作。

![](0006.jpg)

#### Lane模型

react之前的版本用expirationTime属性代表优先级，该优先级和IO不能很好的搭配工作（io的优先级高于cpu的优先级），现在有了更加细粒度的优先级表示方法Lane，Lane用二进制位表示优先级，二进制中的1表示位置，同一个二进制数可以有多个相同优先级的位，这就可以表示‘批’的概念，而且二进制方便计算。

这好比赛车比赛，在比赛开始的时候会分配一个赛道，比赛开始之后大家都会抢内圈的赛道（react中就是抢优先级高的Lane），比赛的尾声，最后一名赛车如果落后了很多，它也会跑到内圈的赛道，最后到达目的地（对应react中就是饥饿问题，低优先级的任务如果被高优先级的任务一直打断，到了它的过期时间，它也会变成高优先级）

Lane的二进制位如下，1的bits越多，优先级越低

```javascript
export const NoLanes: Lanes = /*                        */ 0b0000000000000000000000000000000;
export const NoLane: Lane = /*                          */ 0b0000000000000000000000000000000;

export const SyncLane: Lane = /*                        */ 0b0000000000000000000000000000001;
export const SyncBatchedLane: Lane = /*                 */ 0b0000000000000000000000000000010;
```

#### Scheduler

Scheduler的作用是调度任务，react15没有Scheduler这部分，所以所有任务没有优先级，也不能中断，只能同步执行。

我们知道了要实现异步可中断的更新，需要浏览器指定一个时间，如果没有时间剩余了就需要暂停任务，requestIdleCallback貌似是个不错的选择，但是它存在兼容和触发不稳定的原因，react17中采用MessageChannel来实现。

在Scheduler中的每的每个任务的优先级使用过期时间表示的，如果一个任务的过期时间离现在很近，说明它马上就要过期了，优先级很高，如果过期时间很长，那它的优先级就低，没有过期的任务存放在timerQueue中，过期的任务存放在taskQueue中，timerQueue和timerQueue都是小顶堆，所以peek取出来的都是离现在时间最近也就是优先级最高的那个任务，然后优先执行它。

#### reconciler

Reconciler发生在render阶段，render阶段会分别为节点执行beginWork和completeWork，或者计算state，对比节点的差异，为节点赋值相应的effectFlags（对应dom节点的增删改）。

协调器是在render阶段工作的，简单一句话概括就是Reconciler会创建或者更新Fiber节点。在mount的时候会根据jsx生成Fiber对象，在update的时候会根据最新的state形成的jsx对象和current Fiber树对比构建workInProgress Fiber树，这个对比的过程就是diff算法。

diff算法发生在render阶段的reconcileChildFibers函数中，diff算法分为单节点的diff和多节点的diff（例如一个节点中包含多个子节点就属于多节点的diff），单节点会根据节点的key和type，props等来判断节点是复用还是直接新创建节点，多节点diff会涉及节点的增删和节点位置的变化。

reconcile时会在这些Fiber上打上Flags标签，在commit阶段把这些标签应用到真实dom上，这些标签代表节点的增删改，如

```javascript
export const Placement = /*             */ 0b0000000000010;
export const Update = /*                */ 0b0000000000100;
```

render阶段遍历Fiber树类似dfs的过程，处理发生在beginWork函数中，该函数做的主要工作是创建Fiber节点，计算state和diff算法，‘冒泡’阶段发生在completeWork中，该函数主要是做一些收尾工作，例如处理节点的props、和形成一条effectList的链表，该链表是被标记了更新的节点形成的链表。

```javascript
function App() {
  const [count, setCount] = useState(0);
  return (
   	 <>
      <h1
        onClick={() => {
          setCount(() => count + 1);
        }}
      >
        <p title={count}>{count}</p> hello
      </h1>
    </>
  )
}
```

如果p和h1节点更新了则effectList如下，从rootFiber->h1->p,，顺便说下fiberRoot是整个项目的根节点，只存在一个，rootFiber是应用的根节点，可能存在多个。

