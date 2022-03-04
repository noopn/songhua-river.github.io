---
title: ReactElement
mathjax: true
abbrlink: ea56cd18
date: 2021-02-13 09:39:28
categories:
  - React
  - 基础
tags:
  - React
---


#### ReactElement 

/packages/react/src/ReactElement.js

jsx语法在编译之后会变成`React.createElement`函数调用，函数的返回值就是ReactElement对象

ReactElement通过createElement创建，调用该方法需要传入三个参数：

**type**

表示ReactElement的类型

+ 字符串比如div，p代表原生DOM，称为HostComponent
+ Class类型是我们继承自Component或者PureComponent的组件，称为ClassComponent
+ 方法就是functional Component
+ 原生提供的Fragment、AsyncMode等是Symbol，会被特殊处理



key和ref不会跟其他config中的变量一起被处理，而是单独作为变量出现在ReactElement上。

**config**

描述节点上的属性

**children**

表示子元素，并不会以数组的形式传入，默认第二个参数以后都表示子元素

**$$type**

是一个常量：REACT_ELEMENT_TYPE，但有一个特例：ReactDOM.createPortal的时候是REACT_PORTAL_TYPE，不过他不是通过createElement创建的，所以他应该也不属于ReactElement

```javascript
export function createElement(type, config, children) {
  let propName;

  // Reserved names are extracted
  const props = {};

  let key = null;
  let ref = null;
  let self = null;
  let source = null;

  if (config != null) {
    if (hasValidRef(config)) {
      ref = config.ref;

      if (__DEV__) {
        warnIfStringRefCannotBeAutoConverted(config);
      }
    }
    if (hasValidKey(config)) {
      key = '' + config.key;
    }

    self = config.__self === undefined ? null : config.__self;
    source = config.__source === undefined ? null : config.__source;

    // Remaining properties are added to a new props object
    // 处理ref等特殊属性，在外层声明 RESERVED_PROPS
    // const RESERVED_PROPS = {
    //   key: true,
    //   ref: true,
    //   __self: true,
    //   __source: true,
    // };
    for (propName in config) {
      if (
        hasOwnProperty.call(config, propName) &&
        !RESERVED_PROPS.hasOwnProperty(propName)
      ) {
        props[propName] = config[propName];
      }
    }
  }

  // Children can be more than one argument, and those are transferred onto
  // the newly allocated props object.
  // 只有一个子元素的时候直接使用子元素
  const childrenLength = arguments.length - 2;
  if (childrenLength === 1) {
    props.children = children;
  } else if (childrenLength > 1) {
    // 多个子元素放入数组中
    const childArray = Array(childrenLength);
    for (let i = 0; i < childrenLength; i++) {
      childArray[i] = arguments[i + 2];
    }
    if (__DEV__) {
      if (Object.freeze) {
        Object.freeze(childArray);
      }
    }
    props.children = childArray;
  }

  // Resolve default props
  // 处理默认props,type表示一个对象时，如果存在默认属性，则合并到props中
  // Comp.defaultProps = {}
  if (type && type.defaultProps) {
    const defaultProps = type.defaultProps;
    for (propName in defaultProps) {
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName];
      }
    }
  }
  if (__DEV__) {
    if (key || ref) {
      const displayName =
        typeof type === 'function'
          ? type.displayName || type.name || 'Unknown'
          : type;
      if (key) {
        defineKeyPropWarningGetter(props, displayName);
      }
      if (ref) {
        defineRefPropWarningGetter(props, displayName);
      }
    }
  }
  return ReactElement(
    type,
    key,
    ref,
    self,
    source,
    ReactCurrentOwner.current,
    props,
  );
}
```

工厂方法是当需要手动调用api来创建React element时使用的方法，正常开发写jsx不存在使用的场景

```javascript
/**
 * Factory method to create a new React element. This no longer adheres to
 * the class pattern, so do not use new to call it. Also, instanceof check
 * will not work. Instead test $$typeof field against Symbol.for('react.element') to check
 * if something is a React Element.
 * 工厂方法创建了一个新的React element,这不再遵循类的模式，因此不要使用new去调用。而且检查实例将不会用作用
 * 而是检测$$typeof 与 Symbol.for('react.element')是否匹配来判断是不是 React element
 *
 * @param {*} type
 * @param {*} props
 * @param {*} key
 * @param {string|object} ref
 * @param {*} owner
 * @param {*} self A *temporary* helper to detect places where `this` is
 * different from the `owner` when React.createElement is called, so that we
 * can warn. We want to get rid of owner and replace string `ref`s with arrow
 * functions, and as long as `this` and owner are the same, there will be no
 * change in behavior.
 * 当React.createElement被调用时，用于检测的this和owner不同的帮助对象，可以发出警告，
 * 我们想要丢弃owner并使用箭头函数替换字符串的refs,只要this和owner相同在行为上就不会有改变
 * owner 只向一个fiber类型对象 react-reconciler/src/ReactInternalTypes
 * @param {*} source An annotation object (added by a transpiler or otherwise)
 * indicating filename, line number, and/or other information.
 * 注释对象（由transpiler或其他方式添加）指示文件名、行号和/或其他信息。
 * @internal
 */
const ReactElement = function(type, key, ref, self, source, owner, props) {
  const element = {
    // This tag allows us to uniquely identify this as a React Element
    // 这个标签允许我们唯一的标识一个React element
    $$typeof: REACT_ELEMENT_TYPE,

    // Built-in properties that belong on the element
    // 属于元素的内置属性
    type: type,
    key: key,
    ref: ref,
    props: props,

    // Record the component responsible for creating this element.
    // 记录创建此元素的组件。
    _owner: owner,
  };

  if (__DEV__) {
    // The validation flag is currently mutative. We put it on
    // an external backing store so that we can freeze the whole object.
    // This can be replaced with a WeakMap once they are implemented in
    // commonly used development environments.
    element._store = {};

    // To make comparing ReactElements easier for testing purposes, we make
    // the validation flag non-enumerable (where possible, which should
    // include every environment we run tests in), so the test framework
    // ignores it.
    Object.defineProperty(element._store, 'validated', {
      configurable: false,
      enumerable: false,
      writable: true,
      value: false,
    });
    // self and source are DEV only properties.
    Object.defineProperty(element, '_self', {
      configurable: false,
      enumerable: false,
      writable: false,
      value: self,
    });
    // Two elements created in two different places should be considered
    // equal for testing purposes and therefore we hide it from enumeration.
    Object.defineProperty(element, '_source', {
      configurable: false,
      enumerable: false,
      writable: false,
      value: source,
    });
    if (Object.freeze) {
      Object.freeze(element.props);
      Object.freeze(element);
    }
  }

  return element;
};
```


ReactElement只是一个用来承载信息的容器，他会告诉后续的操作这个节点的以下信息：

+ type类型，用于判断如何创建节点
+ key和ref这些特殊信息
+ props新的属性内容
+ $$typeof用于确定是否属于ReactElement
