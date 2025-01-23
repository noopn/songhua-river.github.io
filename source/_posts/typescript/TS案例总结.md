---
layout: post
title: TypeScript 相关概念
categories:
  - TypeScript
tags:
  - TypeScript
date: 2021-02-24 18:28:21
---

#### interface vs type

- interface 可以使用 扩展（extends）来继承其他接口，并且支持 声明合并（Declaration Merging）
  type 不能像接口那样直接进行声明合并，但它可以通过 交叉类型（&）来合并类型。**一般称作类型别名**

- interface 更多地用于定义对象的结构，也可以用来定义类的形状（即类实现的接口）。
  type 是更通用的类型别名，可以用于任何类型，包括基本类型、联合类型、交叉类型、元组等。

- 鼠标放在 interface 上会显示接口名称，但是放在 type 上显示的是对应的类型，因此 type 并不定义新的类型。

#### const vs readonly

不在同一个维度，一个是类型，一个是变量，如果描述一个类型不可变使用 readonly, 如果是变量不可变使用 const。

#### 数字类型索引

数字类型索引的类型必须是字符串索引的子类型。

```ts
class Animal {}
class Dog extends Animal {}
const a: {
  [k: number]: Dog;
  [k: string]: Animal;
} = {
  1: new Dog(),
};
```

#### class interface

**class 具有静态部分类型，和实例类型。 不要用构造器签名去给类实现接口使用。**

```ts
interface IA {
  todo(): void;
}
interface IACons {
  new (): IA;
}

class A implements IA {
  todo() {}
}

function create(cons: IACons): IA {
  return new cons();
}
```

#### 受保护的构造方法

可以考虑用抽象类代替

```ts
class A {
  protected constructor() {}
}
```

#### 类型断言

```ts
const a: object | any[] = [];

(a as any[]).push(1);
(<any[]>a).push(1);
```

#### 类型保护

- 使用类型谓词

  ```ts
  interface Fish {
    swim: () => void;
    name: () => void;
  }

  interface Bird {
    fly: () => void;
    name: () => void;
  }

  function isFish(obj: Fish | Bird): obj is Fish {
    // 返回一个boolean
    return (obj as Fish).swim !== undefined;
  }
  function fn(obj: Fish | Bird) {
    if (isFish(obj)) obj.swim();
    else obj.fly();
  }
  ```

- typeof

  ```ts
  function fn(obj: string | number) {
    if (typeof obj === "string") obj.substring;
    else obj.toFixed;
  }
  ```

- ! 操作符

  ```ts
  // 在嵌套函数中无法正确推断数据类型
  function fn(name: string | null | undefined) {
    return function () {
      name!.substring;
    };
  }
  ```

#### 类型约束

- **unknown 是 TypeScript 中的一个特殊类型，它表示任何类型**。与 any 不同，unknown 类型的值不能直接操作，必须先进行某种类型的检查。

```ts
type of = [1, 2, 3] extends unknown ? 1 : 2; // 1
```

#### 元组转为普通对象

会移除,number 索引签名,所有数组方法, length 属性,所有可能的数字字符串索引

保留元组特有的具体数字属性映射

```ts
type ObjFromTuple = Omit<Tuple, keyof any[]>;
```
