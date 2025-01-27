---
title: 解析 React Transition Group ①
mathjax: true

date: 2023-01-23 17:29:00
categories:
  - React
tags:
  - React
---

#### Transition Group 组件

Transition Group 组件用于管理一个 Transition 组件列表，即使 Transition 不声明状态 Transition Group 也会自动为其维护一个内部状态。

- 自动为子组件列表添加状态并记录
- 子组件添加或删除时不会被直接渲染，而是被 Transition Group 拦截，当执行完动画逻辑后，在内部状态中删除，并重新渲染。

首次渲染时可以记录子组件并吸收为内部状态，需要注意以下细节：

- 子组件可能不合法，或没有 key
- Transition Group 的属性优先级需要高于子组件相同属性的优先级
- 需要实现清除逻辑给组件被删除时使用，从内部状态中清除被删除的组件。

```js
const TransitionGroup = (props) => {
  // 是否首次渲染
  const firstRender = useRef(true);
  useEffect(() => {
    firstRender.current = false;
  }, []);

  const [, rerender] = useState([]);

  const latestChildrenRef = useRef(props.children);
  latestChildrenRef.current = props.children;

  // handleOnExit 是一个组件内的方法
  // 需要注意的是它通过 latestChildrenRef 保证 children 永远是最新的
  // 因为组件可能被重新渲染，而 handleOnExit 方法可能已经被绑定在了组件上
  // 因此，在它真正执行的上下文中无法获取到最近的 children 属性

  const handleOnExit = (child, node) => {
    const currentMap = getChildrenMapping(latestChildrenRef.current);

    // onExit 执行的时候，这个元素可能已经没有了，在外部通过map重新渲染了新列表，所以已经计算的currentChildrenMap 不可靠
    if (currentMap.has(child.key)) return;

    if (child.props.onExited) {
      child.props.onExited(node);
    }

    preChildrenMap.current.delete(child.key);
    rerender([]);
  };

  const mappedChildren = firstRender.current
    ? getInitialChildMapping(props, handleOnExit)
    : getNextChildrenMap(props, preChildrenMap.current, handleOnExit); // 更新时的逻辑
};

const getInitialChildMapping = (props, handleExit) => {
  return getChildrenMapping(props.children, (child) => {
    return React.cloneElement(child, {
      // 在子组件退出的方法中处理删除内部状态的逻辑
      onExited: handleExit(child),

      // 初始化状态
      in: true,

      // Transition Group 的属性优先级需要高于子组件
      appear: getProp(child, "appear", props),
      enter: getProp(child, "enter", props),
      exit: getProp(child, "exit", props),
    });
  });
};

const getChildrenMapping = (children, fn) => {
  const childrenMap = new Map();
  const mapper = (child) => {
    return fn && React.isValidElement(child) ? fn(child) : child;
  };

  if (children) {
    // map 函数可以自动添加key
    React.Children.map(children, (child) => child).forEach((child) => {
      childrenMap.set(child.key, mapper(child));
    });
  }
  return childrenMap;
};
```

更新阶段, 新列表并不一定只会删除其中一个元素，而是可以添加或删除多个元素，而删除操作并不是立即执行的，而是当动画结束后，从内部状态中删除。

这需要一种策略合并两个列表。让旧组件尽量保持在原来的位置上，再将附近的新元素插入到就元素的前面。

<iframe width='100%' height='600px' src="https://drawio.iftrue.club:9348//?tags=%7B%7D&lightbox=1&highlight=0000ff&layers=1&nav=1&title=drawio.drawio#R%3Cmxfile%3E%3Cdiagram%20id%3D%22LWQS1ubHAZ7xhi4PirgD%22%20name%3D%22Page-1%22%3E7Vzbkto4EP0aPc4WvsiWHzF4kofdZKtmt5I8OiDAibGIMQPs168EEr60hnFqGUtUtipVI7VlWT6t0%2Bpud0DeZH14V6ab1R9sTnPkjuYH5E2R67qj0Od%2FhOR4ljiOj8%2BSZZnNpawWPGX%2FUCkcSekum9Nta2DFWF5lm7ZwxoqCzqqWLC1Ltm8PW7C8%2FdRNuqRA8DRLcyj9lM2r1VlK8KiWv6fZcqWe7IzklXWqBkvBdpXO2b4h8hLkTUrGqnNrfZjQXKCncDnf9%2FjC1cvCSlpUfW7YLxafpsWXv%2F6m44cs268%2B%2F3hfPjhSG89pvpNv7MnlVkeFwX6VVfRpk85Ef88Vjbx4Va1z3nN4Ey5Eru2ZlhU9NERyYe8oW9OqPPIh8qqnUJPbxFP47mvMPSlaNeBWslRqeXmZuQaCNyQWP4NLAHBxDeDiYttwCQEujglcrNsvxEpcXGIalwjiMjIAjO9bBoxHAAol2xVzKm4a8ZdmZbViS1ak%2Be%2BMbSQS32hVHeUhme4q1saJw1MeP4v7f3Ox6n%2BR850600Ord5S9FwHesl05o1deQx1uVVouaXXtfaX5pPPWeQsVVtI8rbLnNoluDr9ad2NfRibOvQjbtS0vr1Djgk3ggi2jqzr9G7j4JnCxzb574ZuasaGsmNfTiil32RYr5oFdacJ773qpxnelC72xwAIrZtxL9eCpB%2Fk7gDNmm%2FeunBPD3kDXSTWPC8wOOCbCGp%2FYBgwMawAs21W6Ec3ZrsyPcZnOvoujJX4Frfr0FL08%2FUrzP9k2qzJWcFlOF2IOgVw240dq5%2FI6m8%2FF4%2BM0z5ZCUJ6xuNwwlvLLwBsox4nayvEdqBxXoxzHfSvt%2BJDOQDviBH%2BS3dpHSWpp%2FJ%2F9mBexfdUfUXbgVX%2FElzNa4o%2F48Hwx4o94nR3pGjYXPoyqjGSHyOu4hIPiAs%2BXOyNq38DB9%2B0iKgwcTDg8gKihaaL6ABcumZhIgQCyarAZlqzwkwiA5Vf1eXDQz%2Be5KPHm2sF37%2FOEfU0pscuUWvJFrGNKsXFTCnMwHxCOHYSnFlhTHTzBkPBgeNLcF19x3xgFe1bxFcMYBSI%2FPF8DTdQ8KF8xdAkFX107%2BKqDZ1i%2BQnN2Z3zFffka2sVXOyqUAF9NpyAx9DsEXz1L%2BKqBZ1i%2BajK0SYCiEI1DlEQoIih6RAlGhAhh8ojiCW9%2FVC0YDnMkRFixrUr2nU5YzkouL1gheL3I8rwjauC7YEUlGc3DSdmXEzvXIhUV0sy4Ymh5G00FbUW5IQaKutQwtkKXt9JUAA%2Fkk6YCFI%2BuaOrDr6YpzzeuKZjGRG6QC6w3LQ0EP3aiqjXOs4I%2BqKWN%2BRBhFfAJHTWEt5by72mi7SYttHMJVTxsT7oRMznu5qCfKCFonJz2DkbxFEX4Ku8xiiZoTE5jYhT7ja3HL40QSVDiozhGZIqSEBHeDtRav5b1QzEaT8Xk9YQhisZivHgW%2F%2BcJCZ9%2FPFIbd9JYGBzjizF8BjGGt5P2UtUKu3c1HioXz195isYXRXHFnyFuw87Fm67sZjrVTT7PnrXTC%2B4%2BSDaJ2b%2FttlW2OL42%2F2k6sPxry7DHZsgEl%2B6QvoEV6XxT9j2NFfE1VuTNMlWhzorckycdkJ6edBBZ5UkHdlTFAE86MuxJB9BVFJ50YIknrYFnUE86dO%2Bcr2Hfj3ShXR%2FpQpiRMVGt1eVr6BnmawhTp4KvoR181cEzLF%2FvPVMVRj35qpC3ha%2FwHDFRIw74aroaVz2%2FgctHzlffEr5q4BmUr%2BTe%2FWHi9uWrXV%2BC1LoN%2F1%2BXLl%2BJ6Wo1Av0OwVdsB1918AzLV92X25slr855m1MeKY5ErqnO5DQTSufkFUFjR2SErud2%2Fs%2FjDJrHucGe7%2BRsQl2OXldepHI7t9%2Fz916oSYK%2BZ5RdXz8JLLqzoVCTmK4uIvqvn5ElZ5Tp6iJy7zEg6RsDquyYLXzV%2FN6BDeWAkenyIqWnbjmgJfWAOnwGZWx071Fg1DcKjOyKAtW6Tf9CCWCspqR8WMbqw0AOjh2M1eBzI8bybv2zXKdrjV8385J%2FAQ%3D%3D%3C%2Fdiagram%3E%3C%2Fmxfile%3E"></iframe>

```js
const mergeMappingChildren = (preChildrenMap, currentChildrenMap) => {
  const pre = preChildrenMap || new Map();
  const next = currentChildrenMap || new Map();

  let pendingQueue = [];
  let prePendingMap = new Map();

  // 如果新列表中有当前这个旧元素
  // 记录这个旧元素之前的元素，放进列表
  pre.forEach((preChild) => {
    if (next.has(preChild.key)) {
      if (pendingQueue.length) {
        prePendingMap.set(preChild.key, pendingQueue);
        pendingQueue = [];
      }
    } else {
      pendingQueue.push(preChild.key);
    }
  });

  const mergedChildrenMap = new Map();
  next.forEach((nextChild) => {
    // 新元素排在旧元素的前面
    // 旧元素尽可能保持在原有的位置。
    if (prePendingMap.has(nextChild.key)) {
      const pendingQueue = prePendingMap.get(nextChild.key);
      pendingQueue.forEach((key) => {
        mergedChildrenMap.set(key, pre.get(key));
      });
    }
    mergedChildrenMap.set(nextChild.key, next.get(nextChild.key));
  });

  if (pendingQueue.length) {
    pendingQueue.forEach((preChild) => {
      mergedChildrenMap.set(preChild.key, next.get(preChild.key));
    });
  }

  return mergedChildrenMap;
};

const getNextChildrenMap = (props, preChildrenMap, handleExit) => {
  const nextChildrenMap = getChildrenMapping(props.children);
  const mergedChildrenMap = mergeMappingChildren(
    preChildrenMap,
    nextChildrenMap
  );

  const childrenMap = new Map();
  mergedChildrenMap.forEach((child) => {
    const preHas = preChildrenMap.has(child.key);
    const nextHas = nextChildrenMap.has(child.key);
    const isExiting = preHas && !preChildrenMap.get(child.key).props.in;

    // 本次更新中被删除的元素
    if (preHas && !nextHas && !isExiting) {
      childrenMap.set(
        child.key,
        React.cloneElement(child, {
          in: false,
        })
      );
      // 新增的元素,包括正在退出中的元素
    } else if ((!preHas || isExiting) && nextHas) {
      childrenMap.set(
        child.key,
        React.cloneElement(child, {
          onExited: () => handleExit(child),
          in: true,
          enter: getProp(child, "enter", props),
          exit: getProp(child, "exit", props),
        })
      );
      // 没有改变的元素
    } else if (preHas && nextHas && isValidElement(prevChild)) {
      childrenMap.set(
        child.key,
        React.cloneElement(child, {
          onExited: () => handleExit(child),
          in: preChildrenMap.get(child.key).props.in,
          enter: getProp(child, "enter", props),
          exit: getProp(child, "exit", props),
        })
      );
    }
  });
  return childrenMap;
};
```
