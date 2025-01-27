---
title: 解析 React Transition Group ①
mathjax: true

date: 2023-01-15 16:48:23
categories:
  - React
tags:
  - React
---

#### Transition 组件

优先设计以下用户接口，只考虑最核心的功能。

- 高阶组件的形式使用
- in 属性，控制元素是否显示

关键在于如何处理状态变化，因为要实现状态切换，需要避免在同一渲染帧中执行。 实现一个 hooks 专门用管理状态改变。

```js
const useTransitionState = (props) => {
  const stateRef = useRef();
  const propsRef = useRef();

  const [state, setState] = useState(() => {
    if (props.in) {
      if (props.appear) return "exited";
      return "entered";
    } else {
      return "exited";
    }
  });

  stateRef.current = state;
  propsRef.current = props;

  const next = useCallback(() => {
    const state = stateRef.current;
    const props = propsRef.current;

    let nextState = null;
    if (props.in) {
      if (
        (props.appear && state === "exited") ||
        (state !== "entering" && state !== "entered")
      ) {
        nextState = "entering";
      }

      if (!props.enter) {
        nextState = "entered";
      }

      if (state === "entering") {
        nextState = "entered";
      }
    } else {
      if (state === "entering" || state === "entered") {
        nextState = "exiting";
      }
      if (!props.exit) {
        nextState = "exited";
      }

      if (state === "exiting") {
        nextState = "exited";
      }
    }

    if (nextState !== null) setState(nextState);

    return nextState;
  }, []);

  return [state, next];
};
```

调用 next 方法即可完成状态切换，在组件渲染后调用 next 实现状态切换。

```js
useEffect(() => {
  let nextState = next();

  if (nextState === null) return;

  if (nextState === "entering") {
    return transitionEnd(
      props.timeout,
      safeCallback(() => {
        next();
      })
    );
  }

  if (nextState === "exiting") {
    return transitionEnd(
      props.timeout,
      safeCallback(() => {
        next();
      })
    );
  }
}, [next, props.in, props.timeout]);
```

在状态切换的过程中，如果状态改变，如何清除副作用？

当通过用户交互修改了 in 属性，会再次进入到 useEffect 函数中，在进入会执行清理函数， 清理函数需要可以清除执行到一半的中间状态。

如果使用计时器可以执行 clear 方法，也可以实现一个清除函数，它不会清除定时器的执行，但是会让回调函数失效。

```js
const safeCallback = (callback) => {
  let active = true;

  const nextCallback = () => {
    if (active) {
      callback();
    }
  };

  nextCallback.cancel = () => {
    active = false;
  };
  return nextCallback;
};
```

更加细节的处理：

- 考虑组件的类型，函数还是组件

  ```js
  if (typeof children === "function") {
    renderChildren = children(state);
  } else {
    renderChildren = React.Children.only(children);
  }
  ```

- 控制进入和退出状态切换是否产生动画 exit enter，需要跳过中间状态

  ```js
  if (
    (props.appear && state === "exited") ||
    (state !== "entering" && state !== "entered")
  ) {
    nextState = "entering";
  }

  if (!props.enter) {
    nextState = "entered";
  }

  if (state === "entering") {
    nextState = "entered";
  }
  ```

- 实现 appear 首次挂载的时候是否展示动画
  如果需要首次渲染时执行动画，那么即使 in 为 true，内部状态也要初始化为退出状态。然后通过 next 方法进行状态切换

  ```js
  const [state, setState] = useState(() => {
    if (props.in) {
      if (props.appear) return "exited";
      return "entered";
    } else {
      return "exited";
    }
  });
  ```

- timeout 可以为退出，进入单独配置
- 剩余属性透传
