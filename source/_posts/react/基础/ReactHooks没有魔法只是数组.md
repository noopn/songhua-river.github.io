---
title: ReactHooks没有魔法只是数组
mathjax: true
layout: post
categories:
  - React
  - 基础
tags:
  - React
abbrlink: b6c51877
date: 2021-05-22 16:17:17
---

#### Hooks规则

Hooks在使用的时候有两条铁律：

+ 不要在循环，条件语句，深层函数调用Hooks

+ 只在React函数组件中调用Hooks


#### useState实现

下面代码只是一个demo，是为了让我们理解hooks大概是怎么运作的。这不是 React 中的真正内部实现。

##### state初始化

创建两个空数组，分别用来存放 setters 和 state，将 指针 指到 0 的位置：

![](0001.jpg)

##### 组件首次render

当首次render这个函数组件的时候。

每一个 useState 调用，当 首次 执行的时候，在 setter 数组里加入一个 setter 函数(和对应的数组index关联)；然后，将 state 加入对应的 state 数组里：

![](0002.jpg)

##### 组件后续(非首次)render

后续组件的每次render，指针都会重置为 0 ，每调用一次 useState，都会返回指针对应的两个数组里的 state 和 setter，然后将指针位置 +1。

![](0003.jpg)

##### setter调用处理

每一个 setter 函数，都关联了对应的指针位置。当调用某个 setter 函数式，就可以通过这个函数所关联的指针，找到对应的 state，修改state数组里对应位置的值：

![](0004.jpg)

#### 为什么hooks的调用顺序不能变呢？

useState 是在一个 条件分支里。看看这样引入的bug。

```javascript
let firstRender = true;

function RenderFunctionComponent() {
  let initName;

  if(firstRender){
    [initName] = useState("Rudi");
    firstRender = false;
  }
  const [firstName, setFirstName] = useState(initName);
  const [lastName, setLastName] = useState("Yardley");

  return (
    <Button onClick={() => setFirstName("Fred")}>Fred</Button>
  );
}
```

##### 第一次render

![](0005.jpg)

第一个render之后，我们的两个state，firstName 和 lastName 都对应了正确的值。接下来看看组件第二次render的时候，会发生什么情况。


##### 第二次render

![](0006.jpg)

第二次render之后，我们的两个state， firstName和 lastName 都成了 Rudi。这显然是错误的，必须要避免这样使用hooks！但是这也给我们演示了，hooks的调用顺序，为什么不能改变。

react团队明确强调了hooks的2个使用原则，如果不按照这些原则来使用hooks，将会导致我们数据的不一致性！

将hooks的操作想象成数组的操作，你可能不太会违背这些原则

OK，现在你应该清楚，为什么我们不能在条件块或者循环语句里调用hooks了。因为调用hooks的过程中，我们是在操作数组上的指针，如果你在多次render中，改变了hooks的调用顺序，将导致数组上的指针和组件里的 useState 不匹配，从而返回错误的 state 以及 setter 。
