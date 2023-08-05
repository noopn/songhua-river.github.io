---
layout: posts
title: react-draggable 源码分析
mathjax: true
date: 2022-05-19 14:07:27
categories:
  - 源码分析
  - React Grid Layout
tags:
  - React
---

[react-draggable](https://github.com/react-grid-layout/react-draggable) 一个可以让组件实现拖拽的库

#### 整体结构

只有两个核心文件,Draggable 和 DraggableCore

Draggable 的作用是初始化组件,并且预处理一些参数,最终的核心逻辑由 DraggableCore 完成

```js
class Draggable extends React.Component<DraggableProps, DraggableState> {
  //可选属性
  static propTypes = {
    allowAnyClick: PropTypes.bool, //任意鼠标键可以拖动
    disabled: PropTypes.bool, // 禁止拖动
    enableUserSelectHack: PropTypes.bool, //如果禁止页面元素可以被选择无效,可以使用这个属性
    offsetParent: PropTypes.HTMLElement, // 计算初始偏移量的时候会相对于这个元素
    grid: PropTypes.arrayOf(PropTypes.number), //以网格的形式移动元素
    handle: PropTypes.string, // 指定元素可拖动的区域
    cancel: PropTypes.string, //指定元素不能拖动的区域
    nodeRef: PropTypes.object, //用于直接指定那个元素可以被拖动
    onStart: PropTypes.func, //自定义拖动开始时的回调函数
    onDrag: PropTypes.func, //自定义拖动中的回调函数
    onStop: PropTypes.func, //自定义拖动结束时候的回调函数
    onMouseDown: PropTypes.func,
    scale: PropTypes.number, // 拖动时候的偏移比例
    axis: PropTypes.oneOf(["both", "x", "y", "none"]), //指明可拖动的方向轴
    // 拖动边界
    bounds: PropTypes.oneOfType([
      PropTypes.shape({
        left: PropTypes.number,
        right: PropTypes.number,
        top: PropTypes.number,
        bottom: PropTypes.number,
      }),
      PropTypes.string,
      PropTypes.oneOf([false]),
    ]),
    //自定义拖动时候的样式
    defaultClassName: PropTypes.string,
    defaultClassNameDragging: PropTypes.string,
    defaultClassNameDragged: PropTypes.string,
    // 默认位置
    defaultPosition: PropTypes.shape({
      x: PropTypes.number,
      y: PropTypes.number,
    }),
    // 默认偏移量
    positionOffset: PropTypes.shape({
      x: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      y: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    }),
  };
  // 初始化状态
  constructor(props: DraggableProps) {
    super(props);
    this.state = {
      dragging: false,
      dragged: false,
      x: props.position ? props.position.x : props.defaultPosition.x,
      y: props.position ? props.position.y : props.defaultPosition.y,
      prevPropsPosition: { ...props.position },
      // 用于计算在边界外的拖动
      slackX: 0,
      slackY: 0,
      isElementSVG: false,
    };
  }

  // 如果组件是受控的,检查新传入的值时候与上一次更新时候的值不同,避免组件频繁更新
  static getDerivedStateFromProps(
    { position }: DraggableProps,
    { prevPropsPosition }: DraggableState
  ): ?$Shape<DraggableState> {
    if (
      position &&
      (!prevPropsPosition ||
        position.x !== prevPropsPosition.x ||
        position.y !== prevPropsPosition.y)
    ) {
      return {
        x: position.x,
        y: position.y,
        prevPropsPosition: { ...position },
      };
    }
    return null;
  }
  findDOMNode() {}
  // 预处理用户提供的事件绑定方法
  // 其他的事件属性与这个类似
  onDragStart(e, coreData) {
    // 创建一个事件对象,返回给使用者
    const shouldStart = this.props.onStart(
      e,
      createDraggableData(this, coreData)
    );
    // 如果绑定方法返回 false,那么同样放回false,在实际调用时停止程序执行
    if (shouldStart === false) return false;
    //标记状态, 表示拖动开始
    this.setState({ dragging: true, dragged: true });
  }
  onDrag() {
    // Draggable 中的状态与 DraggableCore 中的状态是区分开的
    if (!this.state.dragging) return false;

    // 在这里处理边界问题和偏移量比例的问题
    // 相当于把用户的自定义配置影响分离出来,DraggableCore 只处理核心拖拽的问题
    function createDraggableData(draggable, coreData) {
      const scale = draggable.props.scale;
      return {
        node: coreData.node,
        x: draggable.state.x + coreData.deltaX / scale,
        y: draggable.state.y + coreData.deltaY / scale,
        deltaX: coreData.deltaX / scale,
        deltaY: coreData.deltaY / scale,
        lastX: draggable.state.x,
        lastY: draggable.state.y,
      };
    }
    const uiData = createDraggableData(this, coreData);

    const newState: $Shape<DraggableState> = {
      x: uiData.x,
      y: uiData.y,
    };

    // Keep within bounds.
    if (this.props.bounds) {
      // Save original x and y.
      const { x, y } = newState;

      // Add slack to the values used to calculate bound position. This will ensure that if
      // we start removing slack, the element won't react to it right away until it's been
      // completely removed.
      newState.x += this.state.slackX;
      newState.y += this.state.slackY;

      const [newStateX, newStateY] = getBoundPosition(
        this,
        newState.x,
        newState.y
      );
      newState.x = newStateX;
      newState.y = newStateY;

      // Recalculate slack by noting how much was shaved by the boundPosition handler.
      newState.slackX = this.state.slackX + (x - newState.x);
      newState.slackY = this.state.slackY + (y - newState.y);

      // Update the event we fire to reflect what really happened after bounds took effect.
      uiData.x = newState.x;
      uiData.y = newState.y;
      uiData.deltaX = newState.x - this.state.x;
      uiData.deltaY = newState.y - this.state.y;
    }

    // Short-circuit if user's callback killed it.
    const shouldUpdate = this.props.onDrag(e, uiData);
    if (shouldUpdate === false) return false;

    this.setState(newState);
  }
  onDragStop() {}
  render() {
    return (
      <DraggableCore
        {...draggableCoreProps}
        onStart={this.onDragStart}
        onDrag={this.onDrag}
        onStop={this.onDragStop}
      >
        {React.cloneElement(React.Children.only(children), {
          className: className,
          style: { ...children.props.style, ...style },
          transform: svgTransform,
        })}
      </DraggableCore>
    );
  }
}

class DraggableCore extends React.Component<
  DraggableCoreProps,
  DraggableCoreState
> {
  componentDidMount() {
    this.mounted = true;
    // 组件挂载时去查找需要挂载的元素,并绑定事件
    const thisNode = this.findDOMNode();
    // 因为移动短的touch 事件可能会让屏幕发生滚动,所以必须通过原生事件绑定传入 passive 参数
    if (thisNode) {
      addEvent(thisNode, eventsFor.touch.start, this.onTouchStart, {
        passive: false,
      });
    }
  }
  findDOMNode(): ?HTMLElement {
    return this.props?.nodeRef
      ? this.props?.nodeRef?.current
      : ReactDOM.findDOMNode(this);
  }

  handleDragStart() {}
  handleDrag() {}
  handleDragStop() {}
  // 在组件上绑定下面四个方法,当方法被触发时,可以区分是否是触摸设备
  onMouseDown() {
    const eventsFor = {
      touch: {
        start: "touchstart",
        move: "touchmove",
        stop: "touchend",
      },
      mouse: {
        start: "mousedown",
        move: "mousemove",
        stop: "mouseup",
      },
    };
    dragEventFor = eventsFor.mouse; // on touchscreen laptops we could switch back to mouse
    return this.handleDragStart(e);
  }
  onMouseUp() {}
  onTouchStart() {}
  onTouchEnd() {}
}
```

#### getBoundPosition

```js
function getBoundPosition(
  draggable: Draggable,
  x: number,
  y: number
): [number, number] {
  // If no bounds, short-circuit and move on
  if (!draggable.props.bounds) return [x, y];

  // Clone new bounds
  let { bounds } = draggable.props;
  bounds = typeof bounds === "string" ? bounds : cloneBounds(bounds);
  const node = findDOMNode(draggable);

  if (typeof bounds === "string") {
    const { ownerDocument } = node;
    const ownerWindow = ownerDocument.defaultView;
    let boundNode;
    if (bounds === "parent") {
      boundNode = node.parentNode;
    } else {
      boundNode = ownerDocument.querySelector(bounds);
    }
    if (!(boundNode instanceof ownerWindow.HTMLElement)) {
      throw new Error(
        'Bounds selector "' + bounds + '" could not find an element.'
      );
    }
    const boundNodeEl: HTMLElement = boundNode; // for Flow, can't seem to refine correctly
    const nodeStyle = ownerWindow.getComputedStyle(node);
    const boundNodeStyle = ownerWindow.getComputedStyle(boundNodeEl);
    // Compute bounds. This is a pain with padding and offsets but this gets it exactly right.
    bounds = {
      left:
        -node.offsetLeft +
        int(boundNodeStyle.paddingLeft) +
        int(nodeStyle.marginLeft),
      top:
        -node.offsetTop +
        int(boundNodeStyle.paddingTop) +
        int(nodeStyle.marginTop),
      right:
        innerWidth(boundNodeEl) -
        outerWidth(node) -
        node.offsetLeft +
        int(boundNodeStyle.paddingRight) -
        int(nodeStyle.marginRight),
      bottom:
        innerHeight(boundNodeEl) -
        outerHeight(node) -
        node.offsetTop +
        int(boundNodeStyle.paddingBottom) -
        int(nodeStyle.marginBottom),
    };
  }

  // Keep x and y below right and bottom limits...
  if (isNum(bounds.right)) x = Math.min(x, bounds.right);
  if (isNum(bounds.bottom)) y = Math.min(y, bounds.bottom);

  // But above left and top limits.
  if (isNum(bounds.left)) x = Math.max(x, bounds.left);
  if (isNum(bounds.top)) y = Math.max(y, bounds.top);

  return [x, y];
}
```

#### handleDragStart

```js
const handleDragStart: EventHandler<MouseTouchEvent> = (e) => {
  // 用于自定义的 onMouseDown 事件
  this.props.onMouseDown(e);

  // 任意鼠标按键都一颗拖动,否则只有鼠标左键可以拖动
  if (
    !this.props.allowAnyClick &&
    typeof e.button === "number" &&
    e.button !== 0
  )
    return false;

  // 查找到需要拖动的元素
  const thisNode = this.findDOMNode();
  if (!thisNode || !thisNode.ownerDocument || !thisNode.ownerDocument.body) {
    throw new Error("<DraggableCore> not mounted on DragStart!");
  }
  const { ownerDocument } = thisNode;

  // 控制可拖动区域和不可拖动区域
  // handle cancel 属性传入的是控制区域的元素标签名称
  // 用原生的 matches 方法检查这个标签是否在拖动元素的内部,如果有就停止执行  element.matches('p')
  // 这是真正的 onStart 方法还没有执行,不需要重置状态
  if (
    this.props.disabled ||
    !(e.target instanceof ownerDocument.defaultView.Node) ||
    (this.props.handle &&
      !matchesSelectorAndParentsTo(e.target, this.props.handle, thisNode)) ||
    (this.props.cancel &&
      matchesSelectorAndParentsTo(e.target, this.props.cancel, thisNode))
  ) {
    return;
  }

  // Prevent scrolling on mobile devices, like ipad/iphone.
  // Important that this is after handle/cancel.
  if (e.type === "touchstart") e.preventDefault();

  // Set touch identifier in component state if this is a touch event. This allows us to
  // distinguish between individual touches on multitouch screens by identifying which
  // touchpoint was set to this element.
  // 记录触摸点的 id
  const touchIdentifier = getTouchIdentifier(e);
  this.setState({ touchIdentifier });

  // Get the current drag point from the event. This is used as the offset.
  // 首先如果存在触摸点,则回去touch 事件,否则获取原生的 event
  // 通过 findDOMNode 查找需要拖动的元素, 获取用于计算相对位置的元素 offsetParent 如果没有这个属性就用上级 parentNode || document
  // const x = (evt.clientX + offsetParent.scrollLeft - offsetParentRect.left) / scale;
  // const y = (evt.clientY + offsetParent.scrollTop - offsetParentRect.top) / scale;
  // 获取相对于父元素的鼠标位置
  const position = getControlPosition(e, touchIdentifier, this);
  if (position == null) return; // not possible but satisfies flow
  const { x, y } = position;

  // Create an event object with all the data parents need to make a decision here.
  const coreEvent = createCoreData(this, x, y);

  // 真正执行 onStart 方法
  const shouldUpdate = this.props.onStart(e, coreEvent);
  // 如果返回值为false 停止执行
  if (shouldUpdate === false || this.mounted === false) return;

  // Add a style to the body to disable user-select. This prevents text from
  // being selected all over the page.
  if (this.props.enableUserSelectHack) addUserSelectStyles(ownerDocument);

  // Initiate dragging. Set the current x and y as offsets
  // so we know how much we've moved during the drag. This allows us
  // to drag elements around even if they have been moved, without issue.
  this.setState({
    dragging: true,

    lastX: x,
    lastY: y,
  });

  // Add events to the document directly so we catch when the user's mouse/touch moves outside of
  // this element. We use different events depending on whether or not we have detected that this
  // is a touch-capable device.
  addEvent(ownerDocument, dragEventFor.move, this.handleDrag);
  addEvent(ownerDocument, dragEventFor.stop, this.handleDragStop);
};
```

#### handleDrag

```js
const handleDrag: EventHandler<MouseTouchEvent> = (e) => {
  // Get the current drag point from the event. This is used as the offset.
  const position = getControlPosition(e, this.state.touchIdentifier, this);
  if (position == null) return;
  let { x, y } = position;

  // 实现按网格拖动
  if (Array.isArray(this.props.grid)) {
    let deltaX = x - this.state.lastX,
      deltaY = y - this.state.lastY;
    const deltaX = Math.round(deltaX / this.props.grid[0]) * this.props.grid[0];
    const deltaY = Math.round(deltaY / this.props.grid[0]) * this.props.grid[0];
    if (!deltaX && !deltaY) return; // skip useless drag
    (x = this.state.lastX + deltaX), (y = this.state.lastY + deltaY);
  }

  const coreEvent = createCoreData(this, x, y);

  // Call event handler. If it returns explicit false, trigger end.
  // 指定自定义方法,如果返回 false 手动停止执行
  const shouldUpdate = this.props.onDrag(e, coreEvent);
  if (shouldUpdate === false || this.mounted === false) {
    try {
      // $FlowIgnore
      this.handleDragStop(new MouseEvent("mouseup"));
    } catch (err) {}
    return;
  }

  this.setState({
    lastX: x,
    lastY: y,
  });
};
```

#### handleDragStop

```js
const handleDragStop: EventHandler<MouseTouchEvent> = (e) => {
  if (!this.state.dragging) return;

  const position = getControlPosition(e, this.state.touchIdentifier, this);
  if (position == null) return;
  let { x, y } = position;

  // Snap to grid if prop has been provided
  if (Array.isArray(this.props.grid)) {
    let deltaX = x - this.state.lastX || 0;
    let deltaY = y - this.state.lastY || 0;
    [deltaX, deltaY] = snapToGrid(this.props.grid, deltaX, deltaY);
    (x = this.state.lastX + deltaX), (y = this.state.lastY + deltaY);
  }

  const coreEvent = createCoreData(this, x, y);

  // Call event handler
  const shouldContinue = this.props.onStop(e, coreEvent);
  if (shouldContinue === false || this.mounted === false) return false;

  const thisNode = this.findDOMNode();
  if (thisNode) {
    // Remove user-select hack
    if (this.props.enableUserSelectHack)
      removeUserSelectStyles(thisNode.ownerDocument);
  }

  // 重置状态并移除事件
  // Reset the el.
  this.setState({
    dragging: false,
    lastX: NaN,
    lastY: NaN,
  });

  if (thisNode) {
    // Remove event handlers
    removeEvent(thisNode.ownerDocument, dragEventFor.move, this.handleDrag);
    removeEvent(thisNode.ownerDocument, dragEventFor.stop, this.handleDragStop);
  }
};
```
