---
title: FSM 有限状态机
mathjax: true
tags:
  - 算法
  - 有限状态机
categories:
  - 算法
  - 常见算法与数学

date: 2021-07-01 09:11:40
---


#### 有限状态机

有限状态机（英语：finite-state machine，缩写：FSM）又称有限状态自动机（英语：finite-state automation，缩写：FSA），简称状态机，是表示有限个状态以及在这些状态之间的转移和动作等行为的数学计算模型。

#### 特点 

+ 状态总数（state）是有限的。

+ 任一时刻，只处在一种状态之中。

+ 某种条件下，会从一种状态转变（transition）到另一种状态。

+ 每个状态都是一个机器，所有机器接受的输入是一致的

+ 状态机的本身是没有状态的，如果用函数来表示的话，应该是纯函数。

+ 每一个状态机都知道自己的下一个状态

  每个机器都有确定的下一个状态 （Moore）

  每个机器根据输入决定下一个状态 （Mealy）


#### 案例

网页上有一个菜单元素。鼠标悬停的时候，菜单显示；鼠标移开的时候，菜单隐藏。如果使用有限状态机描述，就是这个菜单只有两种状态（显示和隐藏），鼠标会引发状态转变。

本案例中的状态机其实就是摩尔状态机，每个状态都有确定的下一个状态，而存在的问题就是状态和行为是耦合的。

```javascript
<body>
<div id = 'box1'>1</div>
<div id = 'box2' style="display:none">2</div>
<script>
  
  var menu = {
    // 当前状态
    currentState: 'hide',
    // 绑定事件
    initialize: function (dom) {
      dom.addEventListener('mouseover',this.transition.bind(this))
      dom.addEventListener('mouseout',this.transition.bind(this))
    },
    // 状态转换
    transition: function (event) {
      switch (this.currentState) {
        case "hide":
          this.currentState = 'show';
          document.getElementById('box2').style.display ='block'
          break;
        case "show":
          this.currentState = 'hide';
          document.getElementById('box2').style.display ='none'
          break;
        default:
          console.log('Invalid State!');
          break;
      }
    }
  };
  menu.initialize(document.getElementById('box1'));
  </script>
</body>
```

####　查找字符串

尝试在一个字符串中找到 `abcd`

**需要注意的是在每次状态迁移之后，一定要把上一个的状态置为false,因为状态转移之后与上一个状态再没有任何关系**

```javascript
const machine = (str) => {
  let foundA = false;
  let foundB = false;
  let foundC = false;
  for (let s of str) {
    if (s === 'a') {
      foundA = true;
    } else if (s === 'b' && foundA) {
      foundA = false;
      foundB = true;
    } else if (s === 'c' && foundB) {
      foundB = false;
      foundC = true;
    } else if (s === 'd' && foundC) {
      foundC = false;
      return true;
    } else {
      foundA = false;
      foundB = false;
      foundC = false;
    }
  }
  return false;
}
console.log(machine('abbccd'))
```

####　查找字符串 函数式状态机

显而易见的好处是，状态机本身没有状态，所以无需在维护状态

需要注意的一点是，每一个函数返回的是`start(s)`,因为遇到`ababcd`这种情况时，第二个`a`可以当做字符串的开头，如果直接返回`start`会跳过这一步的判断

```javascript
const start = (s) => {
  if (s === 'a') return foundB;
  return start;
}
const foundB = (s) => {
  if (s === 'b') return foundC;
  return start(s);
}
const foundC = (s) => {
  if (s === 'c') return foundD;
  return start(s);
}
const foundD = (s) => {
  if (s === 'd') return end;
  return start(s)
}
const end = () => end;
let state = start;
for (let s of 'ababcd') {
  state = state(s);
}
console.log(state === end)
```


#### 有效数字问题

