---
layout: posts
title: TS extends 使用技巧
mathjax: true
date: 2022-04-15 10:35:28
categories:
  - TypeScript
tags:
  - TypeScript
---

extends 关键字在 TS 中的两种用法，即接口继承和条件判断。

#### 接口继承

和 class 中的继承类似,但是类型中可以使用多继承

```ts
interface T3 extends T1, T2 {
  age: number;
}
```

#### 条件语句

`extends` 可以当作类型中的 if 语句使用,当时理念上与 if 略有不同

```ts
type T = string;
type A = T extends string ? true : false;
```

上面的语句可以简单理解为, T 的类型是否是 string 类型. 但是,更准确的说法是 **T 的类型能否分配给 string 类型**.

因为类型系统中不能像 `if` 一样,通过 `==` 或 `===` 来判断, 例如下面的接口或对象类型

```ts
interface A1 {
  name: string;
}

interface A2 {
  name: string;
  age: number;
}
type A = A2 extends A1 ? string : number; //string
```

这两个类型并不是完全相同,但是 A2 的类型可以分配给 A1 使用,因为 A2 中 完全包括了 A1 中的类型,也就是说可以把 A2 当做 A1 使用.

反过来 A1 不能当作 A2 使用,应为 A1 中没有 age 类型,可能导致类型错误.

#### 条件分配类型

看一个例子

```ts
type A2 = "x" | "y" extends "x" ? string : number; // number

type P<T> = T extends "x" ? string : number;
type A3 = P<"x" | "y">; // string | number
```

A3 并不会和 A2 相同,造成这个的原因就是 **分配条件类型（Distributive Conditional Types）**

> When conditional types act on a generic type, they become distributive when given a union type

当条件类型作用在泛型上时, 当传入一个联合类型这个类型是可分配的.

换句话说,当在使用泛型做条件判断的时候, 而且这个泛型传入的是一个联合类型,就会像数学中的分配率一样,把联合类型中的没没一项分别进行条件判断,最终返回一个联合类型

所以上面 A3 类型,等价于

```ts
type A3 =
  | ("x" extends "x" ? string : number)
  | ("y" extends "x" ? string : number);
```

分配条件类型最终会返回一个不同分支返回结果的联合类型,如果返回的结果是一个包装过的类型,那么就是不同分支包装类型的联合类型

```ts
type Test<T, T2 = T> = T extends T2 ? {t: T} : never;

type a = Test<string|number>  // {t:string} | {t:number}

type Test2<T, T2 = T> = T extends T2 ? [T] : never;

type a = Test<string|number>  // [string] | [number]
```

**注意 never**

never 在条件语句中的行为可能和想象的不一样,这也是条件类型在对其约束, never 相当于空的联合类型,所以没有判断直接返回

```ts
type A1 = never extends "x" ? string : number; // string

type P<T> = T extends "x" ? string : number;
type A2 = P<never>; // never
```

**防止条件类型分配**

如果不想让 never 解析成空的联合类型,而是当作一个 never 类型传入,实际上就是阻止类型系统对联合类型自动分配,可以使用一个 `[]`

```ts
type P<T> = [T] extends ["x"] ? string : number;
type A1 = P<"x" | "y">; // number
type A2 = P<never>; // string
```

