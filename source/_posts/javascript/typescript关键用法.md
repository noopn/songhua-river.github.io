---
layout: post
title: Typescript 关键用法
categories:
  - TypeScript
tags:
  - TypeScript

date: 2021-01-14 23:26:07
---

#### 逆变 协变

- 协变通常表示同向，例如 A 是 B 的子类型，那么 Container<A> 也是 Container<B> 的子类型，类型会随着内部类型的变化而同向变化。

- 逆变通常表示逆向，例如 A 是 B 的子类型，那么 Container<B> 是 Container<A> 的子类型，类型会随着内部类型的变化而逆向变化。

- 换一种简单说法就是要永远保证类型的安全

```ts
class Animal {}

class Cat extends Animal {
  Cat() {}
}
class Dog extends Animal {
  Dog() {}
}
class SmallDog extends Dog {
  public name = 1;
}

// 错误  参数类型不安全，定义的类型应该是参数类型的夫类型，参数可以多出不使用，但是不能少
const fn: (v: Dog) => Dog = (v: SmallDog) => new SmallDog();
// 错误
const fn1: (v: Dog) => Dog = (v: SmallDog) => new Animal();
const fn2: (v: Dog) => Dog = (v: Animal) => new SmallDog();
// 错误  返回值类型不安全，定义的类型应该是返回值类型的子类型，返回值可以返回当前有的类型，但是不能多返回
const fn3: (v: Dog) => Dog = (v: Animal) => new Animal();
```

```ts
type T1 = { name: string };
type T2 = { age: number };

// 参数协变，因此返回的是交叉类型
type UnionToIntersection<T> = T extends {
  a: (x: infer U) => void;
  b: (x: infer U) => void;
}
  ? U
  : never;
type T3 = UnionToIntersection<{ a: (x: T1) => void; b: (x: T2) => void }>; // T1 & T2
```

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
