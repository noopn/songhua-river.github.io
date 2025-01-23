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



```ts
type T1 = { name: string };
type T2 = { age: number };

// 返回值逆变 因此返回的是联合类型
type UnionToIntersection<T> = T extends {
  a: (x: T1) => infer U;
  b: (x: T2) => infer U;
}
  ? U
  : never;
type T3 = UnionToIntersection<{ a: (x: T1) => string; b: (x: T2) => void }>; // string|void
```

#### 类型模块查找过程

- 检查 package.json 的 exports 字段

  ```json
  {
    "exports": {
      "./es": {
        "types": "./es/index.d.ts",
        "import": "./es/index.js"
      }
    }
  }
  ```

  **但是不支持动态路径映射，必须是指定路径下的文件, 也就是说类型文件必须存在于 /es 目录下**

  ```json
  {
    "exports": {
      "./es": {
        // 使用方会提示找不到对应的类型文件
        "types": "./index.d.ts",
        "import": "./es/index.js"
      }
    }
  }
  ```

- 检查 package.json 的 types

  ```json
  {
    "name": "lodash",
    "types": "index.d.ts"
  }
  ```

  如果导入了 lodash/es 类似的二级路径，但 types 只指向 index.d.ts，TypeScript 不会自动识别子路径，**类型文件必须存在于 /es 目录下，或者使用 tsconfig 文件明确指明路径**

  ```json
  {
    "compilerOptions": {
      "baseUrl": ".",
      "paths": {
        "lodash/es": ["node_modules/@types/lodash/index.d.ts"]
      }
    }
  }
  ```

- 直接检查文件路径
  尝试直接从导入路径中解析类型文件

- 在 node_modules/@types 中查找类型
  同样不支持动态路径映射，必须指定路径

#### 映射类型

- 边界情况,映射类型在遇到非对象类型（例如 undefined 或 null）时,直接保留原始类型。

  ```ts
  type NonNullableFlat<O> = {
    [K in keyof O]: NonNullable<O[K]>;
  } & {};

  type c = NonNullableFlat<undefined>; // undefined
  type d = NonNullableFlat<null>; // null
  ```

#### 条件类型

- 条件类型会引入局部作用域。

  ```ts
  type z = [1, 2, 3, 4, 5];
  // B 的定义仅在 true 分支中存在。
  type V = z extends [any, ...infer B] ? 1 : B;
  ```
