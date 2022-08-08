---
title: React原理 props深入
mathjax: true

date: 2021-09-07 10:00:18
categories:
  - React
tags:
  - React
---

#### props的几种用法

① props 作为一个子组件渲染数据源。
② props 作为一个通知父组件的回调函数。
③ props 作为一个单纯的组件传递。
④ props 作为渲染函数。
⑤ render props ， 和④的区别是放在了 children 属性上。
⑥ render component 插槽组件。

```javascript
/* children 组件 */
function ChidrenComponent(){
    return <div> In this chapter, let's learn about react props ! </div>
}
/* props 接受处理 */
class PropsComponent extends React.Component{
    componentDidMount(){
        console.log(this,'_this')
    }
    render(){
        const {  children , mes , renderName , say ,Component } = this.props
        const renderFunction = children[0]
        const renderComponent = children[1]
        /* 对于子组件，不同的props是怎么被处理 */
        return <div>
            { renderFunction() }
            { mes }
            { renderName() }
            { renderComponent }
            <Component />
            <button onClick={ () => say() } > change content </button>
        </div>
    }
}
/* props 定义绑定 */
class Index extends React.Component{
    state={  
        mes: "hello,React"
    }
    node = null
    say= () =>  this.setState({ mes:'let us learn React!' })
    render(){
        return <div>
            <PropsComponent  
               mes={this.state.mes}  // ① props 作为一个渲染数据源
               say={ this.say  }     // ② props 作为一个回调函数 callback
               Component={ ChidrenComponent } // ③ props 作为一个组件
               renderName={ ()=><div> my name is alien </div> } // ④ props 作为渲染函数
            >
                { ()=> <div>hello,world</div>  } { /* ⑤render props */ }
                <ChidrenComponent />             { /* ⑥render component */ }
            </PropsComponent>
        </div>
    }
}
```

####　监听props改变

**类组件**

getDerivedStateFromProps 会在调用 render 方法之前调用，并且在初始挂载及后续更新时都会被调用。它应返回一个对象来更新 state，如果返回 null 则不更新任何内容。

**函数组件**

函数组件中同理可以用 useEffect 来作为 props 改变后的监听函数。

#### props+children 最佳实践

**增强子组件**

通过 props.children 属性访问到 Chidren 组件，为 React element 对象。

1. 可以根据需要控制 Chidren 是否渲染。

2. Container 可以用 React.cloneElement 强化 props (混入新的 props )，或者修改 Chidren 的子元素。

```javascript
<Container>
    <Children>
</Container>
```


**函数式子组件**

1. 根据需要控制 Chidren 渲染与否。
2. 可以将需要传给 Children 的 props 直接通过函数参数的方式传递给执行函数 children 。

```javascript
<Container>
   { (ContainerProps)=> <Children {...ContainerProps}  /> }
</Container>
```

像下面这种情况下 children 是不能直接渲染的，直接渲染会报错。

```javascript
function  Container(props) {
    const  ContainerProps = {
        name: 'alien',
        mes:'let us learn react'
    }
    return  props.children(ContainerProps)
}
```

**混合使用**

```javascript
<Container>
    <Children />
    { (ContainerProps)=> <Children {...ContainerProps} name={'haha'}  />  }
</Container>
```

```javascript
const Children = (props)=> (<div>
    <div>hello, my name is {  props.name } </div>
    <div> { props.mes } </div>
</div>)

function  Container(props) {
    const ContainerProps = {
        name: 'alien',
        mes:'let us learn react'
    }
     return props.children.map(item=>{
        if(React.isValidElement(item)){ // 判断是 react elment  混入 props
            return React.cloneElement(item,{ ...ContainerProps },item.props.children)
        }else if(typeof item === 'function'){
            return item(ContainerProps)
        }else return null
     })
}

const Index = ()=>{
    return <Container>
        <Children />
        { (ContainerProps)=> <Children {...ContainerProps} name={'haha'}  />  }
    </Container>
}
```

#### props的意义

**层级间数据传递**

父组件 props 可以把数据层传递给子组件去渲染消费。另一方面子组件可以通过 props 中的 callback ，来向父组件传递信息。还有一种可以将视图容器作为 props 进行渲染。

React 可以把组件的闭合标签里的插槽，转化成 children 属性，一会将详细介绍这个模式。

**用于更新判断**

在 React 中，props 在组件更新中充当了重要的角色，在 fiber 调和阶段中，diff 可以说是 React 更新的驱动器，熟悉 vue 的同学都知道 vue 中基于响应式，数据的变化，就会颗粒化到组件层级，通知其更新，但是在 React 中，无法直接检测出数据更新波及到的范围，props 可以作为组件是否更新的重要准则，变化即更新，于是有了 PureComponent ，memo 等性能优化方案。

#### 使用技巧

**使用剩余参数过滤props**

```javascript
function Father(props){
    const { age,...fatherProps  } = props
    return <Son  { ...fatherProps }  />
}
```

**混合props**

```javascript
function Father(prop){
    return React.cloneElement(prop.children,{  mes:'let us learn React !' })
}
```

