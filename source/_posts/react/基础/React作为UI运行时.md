---
title: React作为UI运行时
mathjax: true
abbrlink: c4a2f4e9
date: 2021-05-17 09:27:38
categories:
  - React
  - 基础
tags:
  - React
---

####　宿主树

宿主树是对UI的描述，类似用json描述组织架构树一样。

但比常说的vdom的概念要更具体一点，并不是广义的结构描述模型，宿主树就是由具体的节点实例构成的。

宿主树通常有它自己的命令式 API 。而 React 就是它上面的那一层。

基于宿主树有两个最关键的部分：

1. 稳定性，因为宿主树是对UI的描述，所以不会大范围改变，相对稳定。
2. 通用型，每个UI的样式和交互行为，都可以拆分成可复用的最小单位。

最重要的一点是，React的宿主树是随时间变化的树，通过时间数据，完成对宿主实力的操作。


#### 宿主实例

宿主实例就是我们通常所说的 DOM 节点 — 就像当你调用 document.createElement('div') 时获得的对象。

React会帮助你调用宿主实例的API,完成对实例的操作

#### 渲染器

帮助React与宿主树通信以及如何管理宿主实例。React DOM、React Native都可以叫做渲染器。

通常渲染有两种模式：

1. 直接对宿主实例的修改，也就是突变模式
2. 克隆宿主树并对宿主树顶级子树，也就是变化的树中的根节点进行操作，由于宿主树的不可变性，使得多线程更加容易。

#### 元素

对于React来说，宿主实例就是React元素。即一个普通的javaScript对象。

但React元素并不是一直存在，它会在删除和创建之间循环

而且具有不可变性，不可以因为UI的改变而直接修改React元素，而是要重新创建它。

所以React元素可以描述UI在特定时间点的样子，因为它不会再改变。

#### 入口

每一个 React 渲染器都有一个“入口”。正是那个特定的 API 让我们告诉 React ，将特定的 React 元素树渲染到真正的宿主实例中去。

React DOM 的入口就是 ReactDOM.render

####　协调

React需要精确的处理渲染之间的细微差别，例如同时调用两次ReactDOM.render()

```javascript
ReactDOM.render(
  <button className="blue" />,
  document.getElementById('container')
);

// ... 之后 ...

// 应该替换掉 button 宿主实例吗？
// 还是在已有的 button 上更新属性？
ReactDOM.render(
  <button className="red" />,
  document.getElementById('container')
);
```

如果简单来做，需要删除掉原有的宿主实例，重新创建这个代价的巨大的。

所以，通过协模块来处理React元素映射到宿主树的过程。上面的例子中React会更新className属性，而不是重新创建宿主实例。

```javascript
let domNode = domContainer.firstChild;
// 更新已有的宿主实例
domNode.className = 'red';
```

换句话说，React 需要决定何时更新一个已有的宿主实例来匹配新的 React 元素，何时该重新创建新的宿主实例。

所以如果相同的元素类型在同一个地方先后出现两次，React 会重用已有的宿主实例。

下面例子很好的解释了跟新还是创建

```javascript
// let domNode = document.createElement('button');
// domNode.className = 'blue';
// domContainer.appendChild(domNode);
ReactDOM.render(
  <button className="blue" />,
  document.getElementById('container')
);

// 能重用宿主实例吗？能！(button → button)
// domNode.className = 'red';
ReactDOM.render(
  <button className="red" />,
  document.getElementById('container')
);

// 能重用宿主实例吗？不能！(button → p)
// domContainer.removeChild(domNode);
// domNode = document.createElement('p');
// domNode.textContent = 'Hello';
// domContainer.appendChild(domNode);
ReactDOM.render(
  <p>Hello</p>,
  document.getElementById('container')
);

// 能重用宿主实例吗？能！(p → p)
// domNode.textContent = 'Goodbye';
ReactDOM.render(
  <p>Goodbye</p>,
  document.getElementById('container')
);
```

对于子树来说会先判断父元素是否需要重新创建，在对每一个子元素重复执行这个过程。

#### 条件

对于父元素来说前后两次渲染的子元素可能不同

```javascript
function Form({ showMessage }) {
  let message = null;
  if (showMessage) {
    message = <p>I was just added here!</p>;
  }
  return (
    <dialog>
      {message}
      <input />
    </dialog>
  );
}
```

不管 showMessage 是 true 还是 false ，在渲染的过程中 <input> 总是在第二个孩子的位置且不会改变。

这样一来输入框中的状态就不会丢失了。

#### 列表

比较树中同一位置的元素类型对于是否该重用还是重建相应的宿主实例往往已经足够。

但这只适用于当子元素是静止的并且不会重排序的情况。在上面的例子中，即使 message 不存在，我们仍然知道输入框在消息之后，并且再没有其他的子元素。

而当遇到动态列表时，我们不能确定其中的顺序总是一成不变的。

React 只会对其中的每个元素进行更新而不是将其重新排序。这样做会造成性能上的问题和潜在的 bug 。例如，当商品列表的顺序改变时，原本在第一个输入框的内容仍然会存在于现在的第一个输入框中 — 尽管事实上在商品列表里它应该代表着其他的商品！

**这就是为什么每次当输出中包含元素数组时，React 都会让你指定一个叫做 key 的属性。**

```javascript
function ShoppingList({ list }) {
  return (
    <form>
      {list.map(item => (
        <p key={item.productId}>
          You bought {item.name}
          <br />
          Enter how many do you want: <input />
        </p>
      ))}
    </form>
  )
}
```

在渲染前后当key仍然相同时，React会重用先前的宿主实例，然后重新排序其兄弟元素。

**给key赋予什么值最好呢？最好的答案就是：一个元素不会改变即使它在父元素中的顺序被改变**

#### 纯净

在 React 中，幂等性比纯净性更加重要。

在 React 组件中不允许有用户可以直接看到的副作用。换句话说，仅调用函数式组件时不应该在屏幕上产生任何变化。

####　控制反转

控制反转 (Inversion of control) 并不是一项新的技术，是 Martin Fowler 教授提出的一种软件设计模式。那到底什么被反转了？获得依赖对象的过程被反转了。控制反转 (下文统一简称为 IoC) 把传统模式中需要自己通过 new 实例化构造函数，或者通过工厂模式实例化的任务交给容器。通俗的来理解，就是本来当需要某个类（构造函数）的某个方法时，自己需要主动实例化变为被动，不需要再考虑如何实例化其他依赖的类，只需要依赖注入 (Dependency Injection, 下文统一简称为 DI), DI 是 IoC 的一种实现方式。所谓依赖注入就是由 IoC 容器在运行期间，动态地将某种依赖关系注入到对象之中。所以 IoC 和 DI 是从不同的角度的描述的同一件事情，就是通过引入 IoC 容器，利用依赖注入的方式，实现对象之间的解耦。

+ 组件不仅仅只是函数，它与宿主树紧密相连加上组件自身的状态提供更多的信息，包括时事件交互等。React可以知道组件的存，如果手动调用需要自己构建这些特性。

+ 组件类型参与协调 组件的类型决定了组件是否需要渲染。

+ React 能够推迟协调。 如果让 React 控制调用你的组件，它能做很多有趣的事情。例如，它可以让浏览器在组件调用之间做一些工作，这样重渲染大体量的组件树时就不会阻塞主线程。想要手动编排这个过程而不依赖 React 的话将会十分困难。

+ 更好的可调试性。 如果组件是库中所重视的一等公民，我们就可以构建丰富的开发者工具，用于开发中的自省。

#### 惰性求值

```javascript
function Page({ currentUser, children }) {
  if (!currentUser.isLoggedIn) {
    return <h1>Please login</h1>;
  }
  return (
    <Layout>
      {children}
    </Layout>
  );
}
```

```javascript
<Page>
  {Comments()}
</Page>
```

如果是手动调用组件，即使Page并不会返回Comments的内容，但是Comments还是会被渲染。使我们的代码变得不那么脆弱。

#### 状态

宿主实例能够拥有所有相关的局部状态：focus、selection、input 等等。我们想要在渲染更新概念上相同的 UI 时保留这些状态。

我们也想可预测性地摧毁它们，当我们在概念上渲染的是完全不同的东西时。局部状态是如此有用，以至于 React 让你的组件也能拥有它。 组件仍然是函数但是 React 用对构建 UI 有好处的许多特性增强了它。在树中每个组件所绑定的局部状态就是这些特性之一。

####　一致性

即使我们想将协调过程本身分割成非阻塞的工作块，我们仍然需要在同步的循环中对真实的宿主实例进行操作。这样我们才能保证用户不会看见半更新状态的 UI ，浏览器也不会对用户不应看到的中间状态进行不必要的布局和样式的重新计算。

这也是为什么 React 将所有的工作分成了“渲染阶段”和“提交阶段”的原因。渲染阶段 是当 React 调用你的组件然后进行协调的时段。**在此阶段进行干涉是安全的且在未来这个阶段将会变成异步的。提交阶段 就是 React 操作宿主树的时候。而这个阶段永远是同步的。**

####　缓存

当父组件通过 setState 准备更新时，React 默认会协调整个子树。因为 React 并不知道在父组件中的更新是否会影响到其子代，所以 React 默认保持一致性。

当树的深度和广度达到一定程度时，你可以让 React 去缓存子树并且重用先前的渲染结果。 useMemo() Hooks

默认情况下，React 不会故意缓存组件。许多组件在更新的过程中总是会接收到不同的 props ，所以对它们进行缓存只会造成净亏损。

#### 原始模型

React 并没有使用**Proxy**的系统来支持细粒度的更新。换句话说，任何在顶层的更新只会触发协调而不是局部更新那些受影响的组件。

这样的设计是有意而为之的。对于 web 应用来说交互时间是一个关键指标，而通过遍历整个模型去设置细粒度的监听器只会浪费宝贵的时间。此外，在很多应用中交互往往会导致或小（按钮悬停）或大（页面转换）的更新，因此细粒度的订阅只会浪费内存资源。

React 的设计原则之一就是它可以处理原始数据。如果你拥有从网络请求中获得的一组 JavaScript 对象，你可以将其直接交给组件而无需进行预处理。没有关于可以访问哪些属性的问题，或者当结构有所变化时造成的意外的性能缺损。React 渲染是 O(视图大小) 而不是 O(模型大小) ，并且你可以通过 windowing 显著地减少视图大小。

有那么一些应用细粒度订阅对它们来说是有用的 — 例如股票代码。这是一个极少见的例子，因为“所有的东西都需要在同一时间内持续更新”。虽然命令式的方法能够优化此类代码，但 React 并不适用于这种情况。同样的，如果你想要解决该问题，你就得在 React 之上自己实现细粒度的订阅。

注意，即使细粒度订阅和“反应式”系统也无法解决一些常见的性能问题。 例如，渲染一棵很深的树（在每次页面转换的时候发生）而不阻塞浏览器。改变跟踪并不会让它变得更快 — 这样只会让其变得更慢因为我们执行了额外的订阅工作。另一个问题是我们需要等待返回的数据在渲染视图之前。在 React 中，我们用并发渲染来解决这些问题。


####　批量更新

```javascript
function Parent() {
  let [count, setCount] = useState(0);
  return (
    <div onClick={() => setCount(count + 1)}>
      Parent clicked {count} times
      <Child />
    </div>
  );
}

function Child() {
  let [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(count + 1)}>
      Child clicked {count} times
    </button>
  );
}
```
当事件被触发时，子组件的 onClick 首先被触发（同时触发了它的 setState ）。然后父组件在它自己的 onClick 中调用 setState 。

如果 React 立即重渲染组件以响应 setState 调用，最终我们会重渲染子组件两次：

```javascript
*** 进入 React 浏览器 click 事件处理过程 ***
Child (onClick)
  - setState
  - re-render Child // 😞 不必要的重渲染
Parent (onClick)
  - setState
  - re-render Parent
  - re-render Child
*** 结束 React 浏览器 click 事件处理过程 ***
```

第一次 Child 组件渲染是浪费的。并且我们也不会让 React 跳过 Child 的第二次渲染因为 Parent 可能会传递不同的数据由于其自身的状态更新。

**这就是为什么 React 会在组件内所有事件触发完成后再进行批量更新的原因：**

```javascript
*** 进入 React 浏览器 click 事件处理过程 ***
Child (onClick)
  - setState
Parent (onClick)
  - setState
*** Processing state updates                     ***
  - re-render Parent
  - re-render Child
*** 结束 React 浏览器 click 事件处理过程  ***
```

组件内调用 setState 并不会立即执行重渲染。相反，React 会先触发所有的事件处理器，然后再触发一次重渲染以进行所谓的批量更新。

####　调用树

React 与通常意义上的编程语言进行时不同因为它针对于渲染 UI 树，这些树需要保持“活性”，这样才能使我们与其进行交互。在第一次 ReactDOM.render() 出现之前，DOM 操作并不会执行。

这也许是对隐喻的延伸，但我喜欢把 React 组件当作 “调用树” 而不是 “调用栈” 。当我们调用完 Article 组件，它的 React “调用树” 帧并没有被摧毁。我们需要将局部状态保存以便映射到宿主实例的某个地方。

这些“调用树”帧会随它们的局部状态和宿主实例一起被摧毁，但是只会在协调规则认为这是必要的时候执行。如果你曾经读过 React 源码，你就会知道这些帧其实就是 Fibers 。

Fibers 是局部状态真正存在的地方。当状态被更新后，React 将其下面的 Fibers 标记为需要进行协调，之后便会调用这些组件。

