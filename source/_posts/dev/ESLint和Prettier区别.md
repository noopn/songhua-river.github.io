---
title: ESLint 和 Prettier 区别
mathjax: true

date: 2021-09-11 00:15:41
categories:
  - DevOps
tags:
  - DevOps
---


#### ESLint 是什么呢？

是一个开源的 JavaScript 的 linting 工具，使用 espree 将 JavaScript 代码解析成抽象语法树 (AST)，然后通过AST 来分析我们代码，从而给予我们两种提示：

+ 代码质量问题：使用方式有可能有问题(problematic patterns)
+ 代码风格问题：风格不符合一定规则 (doesn’t adhere to certain style guidelines)
(这里的两种问题的分类很重要，下面会主要讲）

你可能开始为了缩进问题配置了一个规则

```json
// .eslintrc    
{        
    "indent": ["error", 2]    
}
```

+ 还安装了 ESLint 的 VSCode 插件，没有通过 ESLint 校验的代码 VSCode 会给予下滑波浪线提示。

+ 为了万无一失，你还添加一个 `pre-commit` 钩子 `eslint --ext .js src`，确保没有通过 lint 的代码不会被提交。

+ 更让人开心的是，之前不统一的代码也能通过 eslint --fix 来修改成新的格式。


####　Airbnb Style Guide

配置完了缩进之后你可能又会发现有人写大括号的时候不会换行。最终你找到了一个和你有一样困惑的公司Airbnb,并且他们自行讨论出一套完整的校验规则。你 `install` 了 `eslint-config-airbnb` ，并且将 `.eslintrc` 文件改成了下面这样，终于大功告成。

```json
// .eslintrc
{
  "extends": ["airbnb"]
}
```

#### Prettier

上面我们说到，ESLint 主要解决了两类问题，但其实 ESLint 主要解决的是代码质量问题。另外一类代码风格问题其实 Airbnb JavaScript Style Guide 并没有完完全全做完，因为这些问题"没那么重要"，代码质量出问题意味着程序有潜在 Bug，而风格问题充其量也只是看着不爽。

+ 代码质量规则 (code-quality rules)
+   no-unused-vars
+   no-extra-bind
+   no-implicit-globals
+   prefer-promise-reject-errors
...


+ 代码风格规则 (code-formatting rules)
+ max-len
+ no-mixed-spaces-and-tabs
+ keyword-spacing
+ comma-style
...

这时候就出现了 Prettier，Prettier 声称自己是一个有主见 (偏见) 的代码格式化工具 (opinionated code formatter)，Prettier 认为格式很重要，但是格式好麻烦，我来帮你们定好吧。简单来说，不需要我们再思考究竟是用 single quote，还是 double quote 这些乱起八糟的格式问题，Prettier 帮你处理。最后的结果，可能不是你完全满意，但是，绝对不会丑，况且，Prettier 还给予了一部分配置项，可以通过 `.prettierrc` 文件修改。

所以相当于 Prettier 接管了两个问题其中的代码格式的问题，而使用 Prettier + ESLint 就完完全全解决了两个问题。但实际上使用起来配置有些小麻烦，但也不是什么大问题。因为 Prettier 和 ESLint 一起使用的时候会有冲突，所以

首先我们需要使用 eslint-config-prettier 来关掉 (disable) 所有和 Prettier 冲突的 ESLint 的配置（这部分配置就是上面说的，格式问题的配置，所以关掉不会有问题），方法就是在 `.eslintrc` 里面将 prettier 设为最后一个 extends

```json
// .eslintrc
{
    "extends": ["prettier"] // prettier 一定要是最后一个，才能确保覆盖
}

```

 然后再启用 `eslint-plugin-prettier` ，将 prettier 的 rules 以插件的形式加入到 ESLint 里面。这里插一句，为什么"可选" ？当你使用 Prettier + ESLint 的时候，其实格式问题两个都有参与，disable ESLint 之后，其实格式的问题已经全部由 prettier 接手了。那我们为什么还要这个 plugin？其实是因为我们期望报错的来源依旧是 ESLint ，使用这个，相当于把 Prettier 推荐的格式问题的配置以 ESLint rules 的方式写入，这样相当于可以统一代码问题的来源。
 
```json
// .eslintrc    
{
    "plugins": ["prettier"],
    "rules": {        
        "prettier/prettier": "error"
    }
}

```

将上面两个步骤和在一起就是下面的配置，也是官方的推荐配置

```json
// .eslintrc
{
  "extends": ["plugin:prettier/recommended"]
}
```