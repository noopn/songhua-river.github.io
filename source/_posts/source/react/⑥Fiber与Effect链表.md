---
layout: posts
title: React源码分析 ⑥ Fiber与Effects链表
date: 2022-03-21 13:16:15
categories:
  - 源码分析
  - React
tags:
  - React
  - 源码分析
---

```javascript
const App: React.FC = () => {
  const [content, setContent] = useState("内容");
  return (
    <>
      <h1 onClick={() => setContent("内容改变")} role="presentation">
        标题
      </h1>
      <p>{content}</p> 2020.01.01
    </>
  );
};
```

回到 completeUnitOfWork 方法,看一下链表的创建过程

```javascript
function completeUnitOfWork(unitOfWork) {
  do {
    completeWork();

    if ((completedWork.flags & Incomplete) === NoFlags) {
      setCurrentFiber(completedWork);

      if (
        returnFiber !== null &&
        // Do not append effects to parents if a sibling failed to complete
        (returnFiber.flags & Incomplete) === NoFlags
      ) {
        // Append all the effects of the subtree and this fiber onto the effect
        // list of the parent. The completion order of the children affects the
        // side-effect order.
        if (returnFiber.firstEffect === null) {
          returnFiber.firstEffect = completedWork.firstEffect;
        }

        if (completedWork.lastEffect !== null) {
          if (returnFiber.lastEffect !== null) {
            returnFiber.lastEffect.nextEffect = completedWork.firstEffect;
          }

          returnFiber.lastEffect = completedWork.lastEffect;
        } // If this fiber had side-effects, we append it AFTER the children's
        // side-effects. We can perform certain side-effects earlier if needed,
        // by doing multiple passes over the effect list. We don't want to
        // schedule our own side-effect on our own list because if end up
        // reusing children we'll schedule this effect onto itself since we're
        // at the end.

        var flags = completedWork.flags;
        // Skip both NoWork and PerformedWork tags when creating the effect
        // list. PerformedWork effect is read by React DevTools but shouldn't be
        // committed.

        // 创建Effect链表时跳过 tag 为 NoWork 和PerformedWork
        // 他们只会被 DevTools 使用不应该提交

        if (flags > PerformedWork) {
          if (returnFiber.lastEffect !== null) {
            returnFiber.lastEffect.nextEffect = completedWork;
          } else {
            returnFiber.firstEffect = completedWork;
          }

          returnFiber.lastEffect = completedWork;
        }
      }
    }
    completedWork = returnFiber; // Update the next thing we're working on in case something throws.

    workInProgress = completedWork;
  } while (completedWork !== null); // We've reached the root.
}
```

首先,分析一下挂载时的链表创建过程, 第一个结束 completeWork 的是 h1 元素, 它的 returnFiber 是 App, 由于 h1 的 flags 是 0, 因为首次渲染是没有标记副作用,所以 App 和 h1 并不会通过 Effect 指针相连, 同理 p 和 文本元素,也是一样处理

下一个节点是 AppFiber, 它的 returnFiber 是 RootFiber, 由于 App 节点首次渲染的时候需要插入到挂载元素中, 所以它有 Placement 副作用,它的值大于 PerformedWork(标记节点处理过的副作用) ,首次挂载时的 Effect 链表如下

```js
returnFiber.firstEffect = completedWork;
returnFiber.lastEffect = completedWork;
```

![](0106.png)

更新时, h1 绑定的函数是匿名函数,所以会携带副作用, 因为第一次执行的时候 h1 和它 returnFiber 的 firstEffect 和 lastEffect,都为 null,所以最先建立这两个节点的联系

![](0001.png)

下一个节点是 p 节点, 它的副作用也需要添加到 Effect 链表上,所以通过 lastEffect 指针找到当前副作用链表的最后一个副作用,它的下一个副作用就是当前的 p 节点

最后调整 returnFiber 的 lastEffect 指针,指向新的副作用 p 节点. 总结来说,如果下一级的子元素携带副作用, 通过 lastEffect 指针找到最后的副作用,并通过 nextEffect 延长 Effect 链表, 如果是上级元素携带副作用,则修改 firstEffect 指针延长 Effect 链表

![](0002.png)

下面增加一点组件的复杂性

```ts
const Box: React.FC<{ content: string }> = (props) => {
  const [number, setNumber] = useState(1);
  return (
    <p onClick={() => setNumber((v) => v + 1)}>
      {props.content}
      <span>{number}</span>
    </p>
  );
};

const App: React.FC = () => {
  const [content, setContent] = useState("内容");
  return (
    <>
      <h1 onClick={() => setContent("内容改变")} role="presentation">
        标题 <p>{content}</p>
      </h1>
      <Box content={content} />
    </>
  );
};
```

这个组件最终形成的 Fiber 树如下

![](0003.png)

当点击 h1 标签后

第一个进入的是标题文本节点,但是文本节点不存在副作用,所以会跳过这个节点

下一个节点是 P 节点, 内容改变携带了副作用,所以会最先添加到链表中和 returnFiber 也就是 h1 Fiber 相连

![](0004.png)

下一个节点是 h1 会被拼接到 effectList 最后面, 这次 returnFiber 是 App, 它的 firstEffect 就是 h1 的 firstEffect, 换句话说也就是,上层节点会延长 effect 链表的头部, 会继承上一个节点 firstEffect

![](0005.png)

下一个节点是 Box 中的文本节点, 会和他的上级节点形成 effect 链表

![](0006.png)

下一个是 span 节点, 因为还没有点击 p 标签,所以 span 没有携带副作用,直接跳过

下一个是 span 上级的 p 节点, returnFiber 是 Box 会成为新的头部

![](0007.png)

下一个是个 Box 节点, returnFiber 是 App,相当于在末尾追加了 effect 链表, 所以修改了 App lastEffect 指针,并且延长了 h1 的 nextEffect

![](0008.png)

最后遍历到根节点 rootFiber 相当于头部延长 effect 链表

![](0009.png)

当点击 p 标签触发更新, 会重新构建整个 effect 链表, 最先进入 complete 的 span 节点, 所以会和他的父节点生成 effect 链表

构建步骤与第一次更新时类似

![](0010.png)

![](0011.png)

![](0012.png)

![](0013.png)
