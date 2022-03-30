---
layout: posts
title: React源码分析 ⑤ Fiber与Effects链表
date: 2022-03-21 13:16:15
categories:
  - React
  - 源码分析
tags:
  - React
---

```javascript
const App: React.FC = () => {
  const [content, setContent] = useState('内容');
  return (
    <>
      <h1 onClick={() => setContent('内容改变')} role="presentation">
        标题
      </h1>
      <p>{content}</p> 2020.01.01
    </>
  );
};
```

#### complete

当 `h1` 元素首次进入, 会进入对应的 HostComponent 处理,这时的 alternate 节点还没有渲染,所以 `current=null`, 会进入 else 分支

```javascript
case HostComponent:
  {
    var type = workInProgress.type;

    if (current !== null && workInProgress.stateNode != null) {
      updateHostComponent$1(current, workInProgress, type, newProps, rootContainerInstance);
    }else{
      // 会直接调用原生的DOM方法创建元素
      // domElement = ownerDocument.createElement(type);
      var instance = createInstance(type, newProps, rootContainerInstance, currentHostContext, workInProgress);
      
      // 如果元素还有其他子元素例如 <h1><span/><span/></h1>
      // 会循环遍历子元素,将子元素的原生DOM,插入到 h1 的原生DOM中
      appendAllChildren(instance, workInProgress, false, false);
      // 重新赋值 stateNode 指针,指向原生DOM
      workInProgress.stateNode = instance; // Certain renderers require commit-time effects for initial mount.
      // (eg DOM renderer supports auto-focus for certain elements).
      // Make sure such renderers get scheduled for later work.

      // 通过原生DOM方法将props中的属性添加在原生DOM上
      // node.addAttribute(_attributeName);
      // 如果是点击时间,则会加入到事件系统的队列中
      if (finalizeInitialChildren(instance, type, newProps, rootContainerInstance)) {

        // 添加更新的副作用 workInProgress.flags |= Update;
        markUpdate(workInProgress);
      }
    }
  }
  return null;
}
```

如果是更新阶段, 会进入 if 分支执行 updateHostComponent$1, 在 这个函数内部会调用 <strong id='diffProperties'>diffProperties</strong> 也就是属性的 Diff 算法

以下一个进来的 `p` 节点为例, 新的文本是 `内容改变`, 旧的文本是 `内容`

```javascript
function diffProperties(domElement, tag, lastRawProps, nextRawProps, rootContainerElement) {

  // lastRawProps {children:'内容'}
  // nextRawProps {children:'内容改变'}

  var updatePayload = null;
  var lastProps;
  var nextProps;

  // 这些元素类型,会被添加上特有的元素默认属性
  switch (tag) {
    case 'input':
      lastProps = getHostProps(domElement, lastRawProps);
      nextProps = getHostProps(domElement, nextRawProps);
      updatePayload = [];
      break;

    case 'option':
      lastProps = getHostProps$1(domElement, lastRawProps);
      nextProps = getHostProps$1(domElement, nextRawProps);
      updatePayload = [];
      break;

    case 'select':
      lastProps = getHostProps$2(domElement, lastRawProps);
      nextProps = getHostProps$2(domElement, nextRawProps);
      updatePayload = [];
      break;

    case 'textarea':
      lastProps = getHostProps$3(domElement, lastRawProps);
      nextProps = getHostProps$3(domElement, nextRawProps);
      updatePayload = [];
      break;

    default:
      lastProps = lastRawProps;
      nextProps = nextRawProps;

      if (typeof lastProps.onClick !== 'function' && typeof nextProps.onClick === 'function') {
        // TODO: This cast may not be sound for SVG, MathML or custom elements.
        trapClickOnNonInteractiveElement(domElement);
      }

      break;
  }

  // 验证一些特殊属性,是否合法 例如 dangerouslySetInnerHTML
  assertValidProps(tag, nextProps);
  var propKey;
  var styleName;
  var styleUpdates = null;

  for (propKey in lastProps) {
    // 如果旧的属性没有,而新的属性有,那个就跳出直接分析新的属性
    if (nextProps.hasOwnProperty(propKey) || !lastProps.hasOwnProperty(propKey) || lastProps[propKey] == null) {
      continue;
    }

    if (propKey === STYLE) {
      var lastStyle = lastProps[propKey];
      // 如果是style属性,提取出属性的key
      for (styleName in lastStyle) {
        if (lastStyle.hasOwnProperty(styleName)) {
          if (!styleUpdates) {
            styleUpdates = {};
          }

          styleUpdates[styleName] = '';
        }
      }
    } else if (propKey === DANGEROUSLY_SET_INNER_HTML || propKey === CHILDREN) ; else if (propKey === SUPPRESS_CONTENT_EDITABLE_WARNING || propKey === SUPPRESS_HYDRATION_WARNING) ; else if (propKey === AUTOFOCUS) ; else if (registrationNameDependencies.hasOwnProperty(propKey)) {
      // This is a special case. If any listener updates we need to ensure
      // that the "current" fiber pointer gets updated so we need a commit
      // to update this element.
      if (!updatePayload) {
        updatePayload = [];
      }
    } else {
      // For all other deleted properties we add it to the queue. We use
      // the allowed property list in the commit phase instead.
      (updatePayload = updatePayload || []).push(propKey, null);
    }
  }

  for (propKey in nextProps) {
    var nextProp = nextProps[propKey];
    var lastProp = lastProps != null ? lastProps[propKey] : undefined;

    // 如果新的属性值为假,或者没有变化,就跳出循环
    if (!nextProps.hasOwnProperty(propKey) || nextProp === lastProp || nextProp == null && lastProp == null) {
      continue;
    }

    if (propKey === STYLE) {
      {
        if (nextProp) {
          // Freeze the next style object so that we can assume it won't be
          // mutated. We have already warned for this in the past.
          Object.freeze(nextProp);
        }
      }

      if (lastProp) {
        // Unset styles on `lastProp` but not on `nextProp`.
        for (styleName in lastProp) {
          if (lastProp.hasOwnProperty(styleName) && (!nextProp || !nextProp.hasOwnProperty(styleName))) {
            if (!styleUpdates) {
              styleUpdates = {};
            }

            styleUpdates[styleName] = '';
          }
        } // Update styles that changed since `lastProp`.


        for (styleName in nextProp) {
          if (nextProp.hasOwnProperty(styleName) && lastProp[styleName] !== nextProp[styleName]) {
            if (!styleUpdates) {
              styleUpdates = {};
            }

            styleUpdates[styleName] = nextProp[styleName];
          }
        }
      } else {
        // Relies on `updateStylesByID` not mutating `styleUpdates`.
        if (!styleUpdates) {
          if (!updatePayload) {
            updatePayload = [];
          }

          updatePayload.push(propKey, styleUpdates);
        }

        styleUpdates = nextProp;
      }
    } else if (propKey === DANGEROUSLY_SET_INNER_HTML) {
      var nextHtml = nextProp ? nextProp[HTML$1] : undefined;
      var lastHtml = lastProp ? lastProp[HTML$1] : undefined;

      if (nextHtml != null) {
        if (lastHtml !== nextHtml) {
          (updatePayload = updatePayload || []).push(propKey, nextHtml);
        }
      }
    } 
    //  会以数组的形式,同时插入 key 和 value ['children','内容改变']
    else if (propKey === CHILDREN) {
      if (typeof nextProp === 'string' || typeof nextProp === 'number') {
        (updatePayload = updatePayload || []).push(propKey, '' + nextProp);
      }
    } else if (propKey === SUPPRESS_CONTENT_EDITABLE_WARNING || propKey === SUPPRESS_HYDRATION_WARNING) ; else if (registrationNameDependencies.hasOwnProperty(propKey)) {
      if (nextProp != null) {
        // We eagerly listen to this even though we haven't committed yet.
        if ( typeof nextProp !== 'function') {
          warnForInvalidEventListener(propKey, nextProp);
        }

        if (propKey === 'onScroll') {
          listenToNonDelegatedEvent('scroll', domElement);
        }
      }

      if (!updatePayload && lastProp !== nextProp) {
        // This is a special case. If any listener updates we need to ensure
        // that the "current" props pointer gets updated so we need a commit
        // to update this element.
        updatePayload = [];
      }
    } else if (typeof nextProp === 'object' && nextProp !== null && nextProp.$$typeof === REACT_OPAQUE_ID_TYPE) {
      // If we encounter useOpaqueReference's opaque object, this means we are hydrating.
      // In this case, call the opaque object's toString function which generates a new client
      // ID so client and server IDs match and throws to rerender.
      nextProp.toString();
    } else {
      // For any other property we always add it to the queue and then we
      // filter it out using the allowed property list during the commit.
      (updatePayload = updatePayload || []).push(propKey, nextProp);
    }
  }

  if (styleUpdates) {
    {
      validateShorthandPropertyCollisionInDev(styleUpdates, nextProps[STYLE]);
    }

    (updatePayload = updatePayload || []).push(STYLE, styleUpdates);
  }

  return updatePayload;
}
```

最后会把 Diff 之后的属性数组,添加到更新队列上

```javascript
updateHostComponent$1 = function (current, workInProgress, type, newProps, rootContainerInstance) {
  // If we have an alternate, that means this is an update and we need to
  // schedule a side-effect to do the updates.
  var oldProps = current.memoizedProps;

  if (oldProps === newProps) {
    // In mutation mode, this is sufficient for a bailout because
    // we won't touch this node even if children changed.
    return;
  } // If we get updated because one of our children updated, we don't
  // have newProps so we'll have to reuse them.
  // TODO: Split the update API as separate for the props vs. children.
  // Even better would be if children weren't special cased at all tho.


  var instance = workInProgress.stateNode;
  var currentHostContext = getHostContext(); // TODO: Experiencing an error where oldProps is null. Suggests a host
  // component is hitting the resume path. Figure out why. Possibly
  // related to `hidden`.

  var updatePayload = prepareUpdate(instance, type, oldProps, newProps, rootContainerInstance, currentHostContext); 
  // TODO: Type this specific to this type of component.

  workInProgress.updateQueue = updatePayload;
  // If the update payload indicates that there is a change or if there
  // is a new ref we mark this as an update. All the work is done in commitWork.
  if (updatePayload) {
    markUpdate(workInProgress);
  }
};
```

#### Effect链表的创建

以上面的代码为例,当点击了 h1 元素,触发更新, 最终会形成如下的一条 Effect 链表


回到  completeUnitOfWork 方法,看一下链表的创建过程

```javascript
function completeUnitOfWork(unitOfWork) {
  // Attempt to complete the current unit of work, then move to the next
  // sibling. If there are no more siblings, return to the parent fiber.
  var completedWork = unitOfWork;

  do {
    // The current, flushed, state of this fiber is the alternate. Ideally
    // nothing should rely on this, but relying on it here means that we don't
    // need an additional field on the work in progress.
    var current = completedWork.alternate;
    var returnFiber = completedWork.return; // Check if the work completed or if something threw.

    if ((completedWork.flags & Incomplete) === NoFlags) {
      setCurrentFiber(completedWork);

      if (returnFiber !== null && 
      // Do not append effects to parents if a sibling failed to complete
      (returnFiber.flags & Incomplete) === NoFlags) {
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
    } else {
     
    }

    completedWork = returnFiber; // Update the next thing we're working on in case something throws.

    workInProgress = completedWork;
  } while (completedWork !== null); // We've reached the root.


  if (workInProgressRootExitStatus === RootIncomplete) {
    workInProgressRootExitStatus = RootCompleted;
  }
}
```

因为第一次执行的时候 h1 和它 returnFiber 的 firstEffect 和 lastEffect,都为null

所以最先建立这两个节点的联系

![](0001.png)

下一个节点是 p 节点, 它的副作用也需要添加到 Effect 链表上,所以通过 lastEffect 指针找到当前副作用链表的最后一个副作用,它的下一个副作用就是当前的 p 节点

最后调整 returnFiber 的 lastEffect 指针,指向新的副作用 p 节点

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
  const [content, setContent] = useState('内容');
  return (
    <>
      <h1 onClick={() => setContent('内容改变')} role="presentation">
        标题 <p>{content}</p>
      </h1>
      <Box content={content}/>
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

下一个节点是 h1 会被拼接到 effectList 最后面, 这次 returnFiber 是App, 它的 firstEffect 就是 h1 的 firstEffect, 换句话说也就是,上层节点会延长 effect 链表的头部, 会继承上一个节点 firstEffect

![](0005.png)

下一个节点是 Box 中的文本节点, 会和他的上级节点形成 effect 链表

![](0006.png)

下一个是 span 节点, 因为还没有点击 p 标签,所以 span 没有携带副作用,直接跳过

下一个是 span 上级的 p 节点, returnFiber 是 Box 会成为新的头部

![](0007.png)

下一个是个 Box 节点, returnFiber 是 App,相当于在末尾追加了 effect 链表, 所以修改了 App lastEffect 指针,并且延长了 h1 的nextEffect

![](0008.png)

最后遍历到根节点 rootFiber 相当于头部延长 effect 链表

![](0009.png)

当点击 p 标签触发更新, 会重新构建整个 effect 链表, 最先进入 complete 的 span节点, 所以会和他的父节点生成 effect 链表

构建步骤与第一次更新时类似

![](0010.png)

![](0011.png)

![](0012.png)

![](0013.png)
