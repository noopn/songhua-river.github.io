---
title: React原理 HOC高阶组件
mathjax: true
categories:
  - React
tags:
  - React

date: 2021-09-25 21:20:59
---


#### 属性代理

属性代理，就是用组件包裹一层代理组件，在代理组件上，可以做一些，对源组件的强化操作。这里注意属性代理返回的是一个新组件，被包裹的原始组件，将在新的组件里被挂载。

```javascript
function HOC(WrapComponent){
    return class Advance extends React.Component{
       state={
           name:'alien'
       }
       render(){
           return <WrapComponent  { ...this.props } { ...this.state }  />
       }
    }
}
```

**优点：**

① 属性代理可以和业务组件低耦合，零耦合，对于条件渲染和 props 属性增强，只负责控制子组件渲染和传递额外的 props 就可以了，所以无须知道，业务组件做了些什么。所以正向属性代理，更适合做一些开源项目的 HOC ，目前开源的 HOC 基本都是通过这个模式实现的。
② 同样适用于类组件和函数组件。
③ 可以完全隔离业务组件的渲染，因为属性代理说白了是一个新的组件，相比反向继承，可以完全控制业务组件是否渲染。
④ 可以嵌套使用，多个 HOC 是可以嵌套使用的，而且一般不会限制包装 HOC 的先后顺序。

**缺点：**

① 一般无法直接获取原始组件的状态，如果想要获取，需要 ref 获取组件实例。
② 无法直接继承静态属性。如果需要继承需要手动处理，或者引入第三方库。
③ 因为本质上是产生了一个新组件，所以需要配合 forwardRef 来转发 ref。

#### 反向继承

反向继承和属性代理有一定的区别，在于包装后的组件继承了原始组件本身，所以此时无须再去挂载业务组件。

```javascript
class Index extends React.Component{
  render(){
    return <div> hello,world  </div>
  }
}
function HOC(Component){
    return class wrapComponent extends Component{ /* 直接继承需要包装的组件 */
        
    }
}
export default HOC(Index) 
```

**优点：**

① 方便获取组件内部状态，比如 state ，props ，生命周期，绑定的事件函数等。
② es6继承可以良好继承静态属性。所以无须对静态属性和方法进行额外的处理。

**缺点：**

① 函数组件无法使用。
② 和被包装的组件耦合度高，需要知道被包装的原始组件的内部状态，具体做了些什么？
③ 如果多个反向继承 HOC 嵌套在一起，当前状态会覆盖上一个状态。这样带来的隐患是非常大的，比如说有多个 componentDidMount ，当前 componentDidMount 会覆盖上一个 componentDidMount 。这样副作用串联起来，影响很大。


#### HOC的几种场景

##### 强化props

强化 props 就是在原始组件的 props 基础上，加入一些其他的 props ，强化原始组件功能。举个例子，为了让组件也可以获取到路由对象，进行路由跳转等操作，所以 React Router 提供了类似 withRouter 的 HOC 。

```javascript
function withRouter(Component) {
  const displayName = `withRouter(${Component.displayName || Component.name})`;
  const C = props => {
      /*  获取 */
    const { wrappedComponentRef, ...remainingProps } = props;
    return (
      <RouterContext.Consumer>
        {context => {
          return (
            <Component
              {...remainingProps} // 组件原始的props 
              {...context}        // 存在路由对象的上下文，history  location 等 
              ref={wrappedComponentRef}
            />
          );
        }}
      </RouterContext.Consumer>
    );
  };

  C.displayName = displayName;
  C.WrappedComponent = Component;
  /* 继承静态属性 */
  return hoistStatics(C, Component);
}
export default withRouter
```

分离出 props 中 wrappedComponentRef 和 remainingProps ， remainingProps 是原始组件真正的 props， wrappedComponentRef 用于转发 ref。
用 Context.Consumer 上下文模式获取保存的路由信息。（ React Router 中路由状态是通过 context 上下文保存传递的）
将路由对象和原始 props 传递给原始组件，所以可以在原始组件中获取 history ，location 等信息。

##### 控制渲染

HOC 反向继承模式，可以通过 super.render() 得到 render 之后的内容，利用这一点，可以做渲染劫持 ，更有甚者可以修改 render 之后的 React element 对象。

```javascript
const HOC = (WrapComponent) =>
  class Index  extends WrapComponent {
    render() {
      if (this.props.visible) {
        return super.render()
      } else {
        return <div>暂无数据</div>
      }
    }
  }
```


```javascript
class Index extends React.Component{
  render(){
    return <div>
       <ul>
         <li>react</li>
         <li>vue</li>
         <li>Angular</li>
       </ul>
    </div>
  }
}
function HOC (Component){
  return class Advance extends Component {
    render() {
      const element = super.render()
      const otherProps = {
        name:'alien'
      }
      /* 替换 Angular 元素节点 */
      const appendElement = React.createElement('li' ,{} , `hello ,world , my name  is ${ otherProps.name }` )
      const newchild =  React.Children.map(element.props.children.props.children,(child,index)=>{
           if(index === 2) return appendElement
           return  child
      }) 
      return  React.cloneElement(element, element.props, newchild)
    }
  }
}
export  default HOC(Index)
```


##### 动态加载

dva 中 dynamic 就是配合 import ，实现组件的动态加载的，而且每次切换路由，都会有 Loading 效果，接下来看看大致的实现思路。

```javascript
export default function dynamicHoc(loadRouter) {
  return class Content extends React.Component {
    state = {Component: null}
    componentDidMount() {
      if (this.state.Component) return
      loadRouter()
        .then(module => module.default) // 动态加载 component 组件
        .then(Component => this.setState({Component},
         ))
    }
    render() {
      const {Component} = this.state
      return Component ? <Component {
      ...this.props
      }
      /> : <Loading />
    }
  }
}
```


#####  组件赋能

**ref获取实例** 

对于属性代理虽然不能直接获取组件内的状态，但是可以通过 ref 获取组件实例，获取到组件实例，就可以获取组件的一些状态，或是手动触发一些事件，进一步强化组件，但是注意的是：类组件才存在实例，函数组件不存在实例。

```javascript
function Hoc(Component){
  return class WrapComponent extends React.Component{
      constructor(){
        super()
        this.node = null /* 获取实例，可以做一些其他的操作。 */
      }
      render(){
        return <Component {...this.props}  ref={(node) => this.node = node }  />
      }
  }
}
```

**事件监控**

HOC 不一定非要对组件本身做些什么？也可以单纯增加一些事件监听，错误监控。接下来，接下来做一个 HOC ，只对组件内的点击事件做一个监听效果。

```javascript
function ClickHoc (Component){
  return  function Wrap(props){
    const dom = useRef(null)
    useEffect(()=>{
       const handerClick = () => console.log('发生点击事件') 
       dom.current.addEventListener('click',handerClick)
     return () => dom.current.removeEventListener('click',handerClick)
    },[])
    return  <div ref={dom}  ><Component  {...props} /></div>
  }
}

@ClickHoc
class Index extends React.Component{
   render(){
     return <div className='index'  >
       <p>hello，world</p>
       <button>组件内部点击</button>
    </div>
   }
}
export default ()=>{
  return <div className='box'  >
     <Index />
     <button>组件外部点击</button>
  </div>
}
```


#### 总结

下面对 HOC 具体能实现那些功能，和如何编写做一下总结：

+ 强化 props ，可以通过 HOC ，向原始组件混入一些状态。

+ 渲染劫持，可以利用 HOC ，动态挂载原始组件，还可以先获取原始组件的渲染树，进行可控性修改。

+ 可以配合 import 等 api ，实现动态加载组件，实现代码分割，加入 loading 效果。

+ 可以通过 ref 来获取原始组件实例，操作实例下的属性和方法。

+ 可以对原始组件做一些事件监听，错误监控等。


#### 注意事项

**谨慎修改原型链**

如上 HOC 作用仅仅是修改了原来组件原型链上的 componentDidMount 生命周期。但是这样有一个弊端就是如果再用另外一个 HOC 修改原型链上的 componentDidMount ，那么这个HOC的功能即将失效。


```javascript
function HOC (Component){
  const proDidMount = Component.prototype.componentDidMount 
  Component.prototype.componentDidMount = function(){
     console.log('劫持生命周期：componentDidMount')
     proDidMount.call(this)
  }
  return  Component
}
```

**不要在函数组件内部或类组件render函数中使用HOC**

由于属性的引用不同，每次都会重新渲染

**ref的处理**

高阶组件的约定是将所有 props 传递给被包装组件，但这对于 ref 并不适用。那是因为 ref 实际上并不是一个 prop ， 就像 key 一样，对于 ref 属性它是由 React 专门处理的。那么如何通过 ref 正常获取到原始组件的实例呢？在 ref 章节已经讲到，可以用 forwardRef做 ref 的转发处理。

**修饰器的嵌套顺序**


**静态属性需要处理**