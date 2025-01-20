---
layout: posts
title: React+TS 实战文档
mathjax: true
date: 2022-04-11 23:04:03
categories:
  - TypeScript
tags:
  - TypeScript
  - React
---

#### Function Components

React.FunctionComponent 或 React.FC 与普通函数有什么不同?

React.FC 是隐式的返回值类型, 不同函数是显示的返回值类型

React.FC 提供了一些静态属性类型检查 `displayName`,`propTypes`, `defaultProps`

React.FC 隐式的定义了 children 子元素类型, 但某些场景自定义这个类型会更好

第二点中,当在 React.FC 中使用 `defaultProps` 的时候可能会造成错误

```ts
interface Props {
  text: string;
}

const BackButton: React.FC<Props> = (props) => {
  return <div />;
};
BackButton.defaultProps = {
  text: "Go Back",
};
let a = <BackButton />; // error: text is missing in type {}
```

这个问题有很多种方法可以解决, 可以使用普通函数来定义,而不是使用函数类型

```ts
interface Props {
  text: string;
}
function BackButton(props: Props) {
  return <div />;
}
BackButton.defaultProps = {
  text: "Go Back",
};
let a = <BackButton />; // it's OK
```

或者显示的声明 defaultProps

```ts
interface Props {
  text: string;
}

const BackButton: React.FC<Props> & {
  defaultProps: {
    text: string;
  };
} = (props) => {
  return <div />;
};
BackButton.defaultProps = {
  text: "Go Back",
};
let a = <BackButton />; // it's OK
```

另一个问题是 children 类型的问题, 有时组件返回的 children 类型并不是 React.FC 默认的 children 类型

```js
// Type 'string' is not assignable to type 'ReactElement<any, any>'.
const Title: React.FC = () => "123";
```

你可以选择者重新为返回值赋类型,这个处理方法同样适用于条件语句中的子元素,或者通过数组或对象生成的子元素

```ts
const Title: React.FC = () => "123" as unknown as React.ReactElement;
```

正因为有这种问题, @type/react@^18.0.0 将不再把 children 作为默认的属性,而是需要显示声明
