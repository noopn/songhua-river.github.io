---
title: React.Children
mathjax: true
abbrlink: f691bfb2
date: 2021-02-13 18:58:36
categories:
tags:
---


#### React.Children.map使用

map方法遍历每一个子元素，用回调函数处理后返回的还是一个数组，则继续递归调用，把数组拍平返回

```javascript
const Child =  function Child(props) {
  return React.Children.map(props.children,item=> [item,[item,[item]]])
}
function App() {
  return (
    <div>
      <Child>
        <span>1</span>
        <span>2</span>
      </Child>
    </div>
  );
}
```

最终的返回结果为拍平后的数组

```javascript
{
  0: {$$typeof: Symbol(react.element), type: "span", key: ".0/.0", ref: null, props: {…}, …}
  1: {$$typeof: Symbol(react.element), type: "span", key: ".0/.1:0", ref: null, props: {…}, …}
  2: {$$typeof: Symbol(react.element), type: "span", key: ".0/.1:1:0", ref: null, props: {…}, …}
  3: {$$typeof: Symbol(react.element), type: "span", key: ".1/.0", ref: null, props: {…}, …}
  4: {$$typeof: Symbol(react.element), type: "span", key: ".1/.1:0", ref: null, props: {…}, …}
  5: {$$typeof: Symbol(react.element), type: "span", key: ".1/.1:1:0", ref: null, props: {…}, …}
}

```

#### React.Children.map源码

对每个子元素遍历，调用 `mapIntoArray`

```javascript
function mapChildren(
  children: ?ReactNodeList,
  func: MapFunc,
  context: mixed,
): ?Array<React$Node> {
  if (children == null) {kkl;;;
  }
  const result = [];
  let count = 0;
  mapIntoArray(children, result, '', '', function(child) {
    return func.call(context, child, count++);
  });
  return result;
}
```

创建新的子元素时，key的生成规则
`React.Children.map(props.children,item=> [item,item,[item,item,[item]]])`
`---------------------------- 子元素索引 .0/[.0 | .1  [.2:0 | 1 | [ 2: 0]] `

处理自元素的过程

+ 如果不是数组而是其他合法的子结点类型 `invokeCallback`标记为`true`
  + 执行回调函数返回值如果为数组重复执行`mapIntoArray` 并重写回调函数，防止死循环
  + 如果不是数组，创建新的`key`并添加到结果数组中
+ 如果是数组则遍历每一项并执行 `mapIntoArray`
+ 如果是`iterator`把每一个next结果执行`mapIntoArray`
+ 如果是其他非 React element对象，抛出错误

```javascript
function mapIntoArray(
  children: ?ReactNodeList,
  // 保存结果
  array: Array<React$Node>,
  escapedPrefix: string,
  nameSoFar: string,
  callback: (?React$Node) => ?ReactNodeList,
): number {
  const type = typeof children;

  // 处理没有值的情况
  if (type === 'undefined' || type === 'boolean') {
    // All of the above are perceived as null.
    children = null;
  }

  let invokeCallback = false;

  if (children === null) {
    invokeCallback = true;
  } else {
    switch (type) {
      case 'string':
      case 'number':
        invokeCallback = true;
        break;
      case 'object':
        switch ((children: any).$$typeof) {
          case REACT_ELEMENT_TYPE:
          case REACT_PORTAL_TYPE:
            invokeCallback = true;
        }
    }
  }
  // 如果处理单个子元素的情况，子元素只有存在REACT_ELEMENT_TYPE时，invokeCallback才会被赋值为true
  if (invokeCallback) {
    const child = children;
    let mappedChild = callback(child);
    const childKey =
      nameSoFar === '' ? SEPARATOR + getElementKey(child, 0) : nameSoFar;
    // 如果在被回调函数处理之后变为了数组，同样依次遍历数组中的每一个
    if (Array.isArray(mappedChild)) {
      let escapedChildKey = '';
      if (childKey != null) {
        escapedChildKey = escapeUserProvidedKey(childKey) + '/';
      }
      // 每个子元素被回调函数处理了一次之后将会不在继续调用回调函数，避免死循环
      mapIntoArray(mappedChild, array, escapedChildKey, '', c => c);
    } else if (mappedChild != null) {
      if (isValidElement(mappedChild)) {
        mappedChild = cloneAndReplaceKey(
          mappedChild,
          escapedPrefix +
            // $FlowFixMe Flow incorrectly thinks React.Portal doesn't have a key
            (mappedChild.key && (!child || child.key !== mappedChild.key)
              ? // $FlowFixMe Flow incorrectly thinks existing element's key can be a number
                escapeUserProvidedKey('' + mappedChild.key) + '/'
              : '') +
            childKey,
        );
      }
      array.push(mappedChild);
    }
    return 1;
  }

  let child;
  let nextName;
  // 记录发现了多少个子元素，最终返回的就是子元素的个数，外层函数并没有使用，不重要
  let subtreeCount = 0;
  const nextNamePrefix =
    nameSoFar === '' ? SEPARATOR : nameSoFar + SUBSEPARATOR;
  
  // 子元素是数组的情况，
  if (Array.isArray(children)) {
    for (let i = 0; i < children.length; i++) {
      child = children[i];
      nextName = nextNamePrefix + getElementKey(child, i);
      subtreeCount += mapIntoArray(
        child,
        array,
        escapedPrefix,
        nextName,
        callback,
      );
    }
  } else {
    // 处理Iterable的情况
    const iteratorFn = getIteratorFn(children);
    if (typeof iteratorFn === 'function') {
      const iterableChildren: Iterable<React$Node> & {
        entries: any,
      } = (children: any);

      if (__DEV__) {
        // Warn about using Maps as children
        if (iteratorFn === iterableChildren.entries) {
          if (!didWarnAboutMaps) {
            console.warn(
              'Using Maps as children is not supported. ' +
                'Use an array of keyed ReactElements instead.',
            );
          }
          didWarnAboutMaps = true;
        }
      }

      const iterator = iteratorFn.call(iterableChildren);
      let step;
      let ii = 0;
      while (!(step = iterator.next()).done) {
        child = step.value;
        nextName = nextNamePrefix + getElementKey(child, ii++);
        subtreeCount += mapIntoArray(
          child,
          array,
          escapedPrefix,
          nextName,
          callback,
        );
      }
    } 
    // 如果子元素是React element 以外的对象则抛出错误
    else if (type === 'object') {
      const childrenString = '' + (children: any);
      invariant(
        false,
        'Objects are not valid as a React child (found: %s). ' +
          'If you meant to render a collection of children, use an array ' +
          'instead.',
        childrenString === '[object Object]'
          ? 'object with keys {' + Object.keys((children: any)).join(', ') + '}'
          : childrenString,
      );
    }
  }

  return subtreeCount;
}

```

cloneAndReplaceKey 创建新的React element

```javascript
export function cloneAndReplaceKey(oldElement, newKey) {
  const newElement = ReactElement(
    oldElement.type,
    newKey,
    oldElement.ref,
    oldElement._self,
    oldElement._source,
    oldElement._owner,
    oldElement.props,
  );

  return newElement;
}
```