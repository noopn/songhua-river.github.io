---
title: Ref/forwardRef
mathjax: true
categories:
  - React
  - 基础
tags:
  - React
abbrlink: 690d411c
date: 2021-02-13 14:01:53
---

#### Ref

通过`React.createRef`创建一个对象，`react`会将真实的DOM挂载在对象的`current`属性上

```javascript
export function createRef(): RefObject {
  const refObject = {
    current: null,
  };
  if (__DEV__) {
    Object.seal(refObject);
  }
  return refObject;
}
```

#### forwardRef

可以让父组件拿到子组件Ref引用的API.

```javascript
const Child = forwardRef((props,ref)=>{
  return <input ref={ref}/> 
})
function App() {
  const childRef = useRef(null);
  useEffect(()=>{
      console.log(childRef.current)
  },[])
  return (
    <div className="App">
      <Child ref={childRef}/>
    </div>
  );
}
```

在高阶组件中使用的时候，高阶组件的返回值也需要使用forwardRef

```javascript
const Child = forwardRef((props,ref)=>{
  return <input ref={ref}/> 
})
const HOC = function(Comp){
  return forwardRef((props,ref)=>{
    return <Comp ref={ref}/>
  }) 
}
const ChildHOC = HOC(Child)
function App() {
  const childRef = useRef(null);
  useEffect(()=>{
      console.log(childRef.current)
  },[])
  return (
    <div className="App">
     <ChildHOC ref={childRef}/>
    </div>
  );
}
```

如果没有用forwardRef，包裹返回值，会报错 ` Function components cannot be given refs. Attempts to access this ref will fail. Did you mean to use React.forwardRef()?`


#### 源码

```javascript
export function forwardRef(
  render
) {
  // .... __DEV__下的兼容处理

  const elementType = {
    $$typeof: REACT_FORWARD_REF_TYPE,
    render,
  };
  return elementType;
}
```

forwardRef 返回了一个新的对象，需要注意的是，这并不意味着用`forwardRef`包装过的组件`$$typeof`属性为`REACT_FORWARD_REF_TYPE`

因为在使用包装过的组件的时候`<Child ref={childRef}/>`,Child 会作为type属性传入到`ReactElement`方法中，通过`ReactElement`创将的对象`$$typeof`仍然为`REACT_ELEMENT_TYPE`,`forwardRef`返回的对象最终会放到`type`属性上