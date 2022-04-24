---
layout: posts
title: d3-dispatch 源码分析
mathjax: true
date: 2022-04-24 17:51:35
categories:
  - 源码分析
  - d3
tags:
  - d3
---

[d3-dispatch](https://github.com/d3/d3-dispatch) 是一个基于 观察者模式 的事件处理工具.

#### 使用方法

```ts
// 注册事件
const d = dispatch("start", "end");

//帮顶事件方法
d.on('start.a',()=>{})
d.on('start.*b.c',()=>{}) // *b.c作为方法名
d.on('start.d start.e',()=>{}) // 帮顶d,e两个方法
d.on('start.d',null) // 删除d绑定事件
d.on('start.e') // 获取e绑定事件

// 执行方法
d.fire('start') // 按照帮顶顺序执行每一个方法

```

#### dispatch

用于添加一个或多个事件名称,事件对应着一个队列,可以包含多个子方法

```ts
const d = dispatch("start", "end");
```

- 尝试把方法名转换为字符串
- 不能转换为字符串 或 已经注册过 或 包含`空格`或`.` 则不合法

```ts
const dispatch = (...args: string[]) => {
  const types: Types = {};
  for (let i = 0, l = args.length, t; i < l; i += 1) {
    t = `${args[i]}`;
    if (!t || t in types || /[\s.]/.test(t)) throw new Error();
    types[t] = [];
  }
  return new Dispatch(types);
};

export default dispatch;
```

#### Dispatch

```ts
interface TypeItem {
  name: string;
  value: (...args: unknown[]) => unknown;
}

interface Types {
  [k: string]: TypeItem[];
}

// 工具方法空函数
const noop = { value: () => {} } as TypeItem;

class Dispatch {
  private types: Types;

  constructor(types: Types) {
    this.types = types;
  }

  on() {}

  copy() {}

  fire() {}
}
```

一个取值的工具方法
事件对象中取出回调方法的数组

```ts
const get = (type: TypeItem[], name: string): TypeItem["value"] | undefined => {
  for (let i = 0, n = type.length, c; i < n; i += 1) {
    c = type[i];
    if (c.name === name) {
      return c.value;
    }
  }
  return undefined;
};
```

设置值的工具方法
如果存在同名方法,从事件队列中删除,并置空同名方法
如果传递了回调函数则在队列最后重新添加方法

```ts
const set = (
  _type: TypeItem[],
  name: string,
  callback: TypeItem["value"] | null
): TypeItem[] => {
  let type = _type;
  for (let i = 0, n = type.length; i < n; i += 1) {
    if (type[i].name === name) {
      type[i] = noop;
      type = type.slice(0, i).concat(type.slice(i + 1));
      break;
    }
  }
  if (callback != null) type.push({ name, value: callback });
  return type;
};
```

解析事件方法名
方法名尝试转为字符串,并删除头尾空格预处理
`a.b a.c` 会添加两个回调方法, `a.b.c` 会添加 `b.c` 作为方法名称
用空格来切割,因为可能存在多个绑定事件
查找 `.` 的第一个匹配位置,后面的无论是什么都看作是一个方法

```ts
const parseTypenames = (
  typenames: string,
  types: Types
): { type: string; name: string }[] => {
  return typenames
    .trim()
    .split(/^|\s+/)
    .map(function map(_t) {
      let t = _t;
      let name = "";
      const i = t.indexOf(".");
      if (i >= 0) {
        name = t.slice(i + 1);
        t = t.slice(0, i);
      }
      const has = Object.prototype.hasOwnProperty.call(types, t);
      if (t && !has) throw new Error(`unknown type:  ${t}`);
      return { type: t, name };
    });
};
```

#### on

```ts
public on(
    _typename: string | { name: string; type: string },
    callback: TypeItem['value'] | null
  ): this | TypeItem['value'] | undefined {
    const { types } = this;
    let typename = _typename;
    const T = parseTypenames(`${typename}`, types);
    let t: string | TypeItem['value'] | undefined;
    let i = 0;
    const n = T.length;

    // 如果不存在回调函数,把他作为取值操作,返回最先匹配到的方法
    if (callback === undefined) {
      while (i < n) {
        typename = T[i];
        t = typename.type;
        if (!t) return undefined;
        t = get(types[t], typename.name);
        if (t) return t;
      }
      i += 1;
      return undefined;
    }
    // 如果回调函数不是方法,直接报错

    if (callback != null && typeof callback !== 'function')
      throw new Error(`invalid callback: ${callback}`);

    // 添加到 type 事件对象中
    while (i < n) {
      // 插入
      typename = T[i];
      t = typename.type;
      const ct = typename;

      if (t) types[t] = set(types[t], typename.name, callback);
      // 删除
      // 所有监听队列中的同名方法都将被删除

      else if (callback == null)
        Object.entries(types).forEach(([k, v]) => {
          types[k] = set(v, ct.name, null);
        });

      i += 1;
    }

    return this;
  }
```

#### copy

```ts
public copy() {
  const copy: Types = {};
  const { types } = this;
  Object.entries(types).forEach(([k, v]) => {
    copy[k] = v.slice();
  });
  return new Dispatch(copy);
}
```

#### fire 

```ts
public fire(type: string, that?: unknown, ...args: unknown[]) {
  const has = Object.prototype.hasOwnProperty.call(this.types, type);
  if (!has) throw new Error(`unknown type: ${type}`);
  const t = this.types[type];
  let i = 0;
  const n = t.length;
  for (; i < n; i += 1) t[i].value.apply(that, args);
}
```
