---
layout: posts
title: Git 命令/配置
mathjax: true
date: 2024-08-26 08:51:21
categories:
  - DevOps
tags:
  - DevOps
---

#### 查看 git 详细命令描述

```bash
# 会在浏览器打开本地离线文档
git help [option]
```

#### 查看仓库配置文件

查看本地仓库配置

```bash
cd [项目路径]
cat ./git/config
```

查看全局仓库配置

```bash
git config --global -l
```

#### 设置用户名/邮箱

用户信息会体现在 commit 提交信息中

设置本地用户

```bash
git config user.name "xxx"
git config user.email "xxx@.com"
```

设置全局用户

```bash
git config --global user.name "xxx"
git config --global user.email "xxx@.com"
```

如果本地用户没有设置会优先使用全局的用户设置, 如果存在多个用户可以设置本地用户信息

#### git add 做了什么

执行 `git add .` 会将工作区的文件加入到暂存区，体现在 git objects 中会增加一个 `.git/objects/[文件sh1前2位]/[文件sh1第3位到40位]]` 的文件。`[sha1]` 的计算逻辑是：

```txt
h = sha1()
h.update("blob [文件长度]\0")
h.update('[文件内容]')
```

可以使用 cat-file 命令查看文件的 类型和内容

```bash
git cat-file -t [sha1]  #查看类型
git cat-file -p [sha1]  #查看内容
git cat-file -s [sha1]  #查看文件长度

#查看当前目录有所文件的信息
git ls-file -s

# 100644 e69de29bb2d1d6434b8b29ae775ad8c2e48c5391 0       a/aa.js
# 文件权限         对象名称                                文件名称

```

#### git commit 做了什么

查看执行 commit 之后新增文件的类型为 commit

```bash
git cat-file -t [sha1] #commit
```

查看 commit 后生成文件的内容

```bash
git cat-file -p [sha1]

#tree de9ca8d60d61e2dbff58571e243256f0d084e030            tree对象文件名字（sha1）
#parent ef911d46ddddb69cfb0149bbc7217f582c668f21          上一次提交的文件名字(sha1)
#author sunzhiqi <sunzhiqi@live.com> 1724649175 +0800     作者 邮箱  时间戳 时区
#committer sunzhiqi <sunzhiqi@live.com> 1724649175 +0800

#2                                                        提交的文件内容
```

继续查看 tree 文件的内容,

```bash
git cat-file -p [sha1]

#100644 blob b44836b41abbfc0640d4dd88fe587a9a145e5203    LICENSE
#100644 blob b9c2b056b82135218b26420e8479c56554b54afb    README.md
#100644 blob 4b9a8a29f6956ea1742e42354c5ba36fe717a2ed    a.txt
#100644 blob 9f478040b9109d4b1d25ad7f11528ed9a682f063    b.txt

# 如果提交内容中有文件夹，那么会有一个单独的 tree 描述文件夹的信息
#100644 tree xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx   folder
```

另外 commit 操作会影响 HEAD 指针的指向

```bash
# 查看HEAD指向的分支
cat .git/HEAD         #ref: refs/heads/master

# 查看分支对应的文件

cat .git/refs/heads/master         #ref: f45e2d0b45ca63806d263ae31276a3fbe4a7229d
```

#### 我提交了什么

```bash
git show
git log -n1 -p
```

#### 想修改最近的提交信息

提交信息后(commit),发现信息写错了，想修改最近一条提交信息(如果想修改当前提交以前的信息)。

```bash
git commit --amend --only [filename] -m 'update'

# 会弹出交互式命令行手动提交
git commit --amend --only [filename]
```

`--only` 参数非常重要,只对当前正在修改的文件进行提交，而不包括暂存区中的其他文件。

#### 怎么看是否落后与主分支

```bash
git fetch origin
git status
```

```bash
# oneline  提交显示为一行
# graph    左侧显示一个 ASCII 图形，用于展示分支和合并的关系
# decorate 提交信息中附加上相关的分支、标签等引用名称

# 查看远程分支所有提交历史
git log --oneline --graph --decorate origin/master

# 查看所有分支的提价历史
git log --graph --all

# 指定分支

git log --graph origin/master master
```

从分支上可以看出，主分支并没有 fff 的提交，最终合并在本地的 master 分支

![](001.png)

#### 取消上次提交中的某个文件

一次提交中包括， `a.txt`, `b.txt` 现在想取消 `a.txt` 的提交，也就是恢复为上一次的状态

```bash
# 查看上一次提交文件的内容
git show [commitID]:a.txt

# 将工作区中的文件恢复为上一次提交的内容
git checkout HEAD^ a.txt

# 也可以使用 commitId
git checkout [commitId] a.txt

# 将恢复的文件加入暂存区   -A 参数可以将删除文件也从暂存区删除
git add .

# 提交修改到暂存区，沿用上一次的ID，并且不修改提交描述
git commit --amend --no-edit
```

如果当前的的历史已经提交到远程，由于并没有改变提交历史，所以可以安全的 `git push -f`

#### 删除 上一次/多个 Commit

极不建议使用，虽然可以用 reset 重置为上一级的状态，但是会丢失当前的修改，而且会破坏提交历史。

```bash
# HEAD^ 上一个提交状态
# hard 改变暂存区和工作目录到指定的提交
git reset HEAD^ --hard
```

使用 soft 参数可以避免工作区被回滚，但提交历史已经被改变，如果你的分支还会被其他人使用，多人写作中会有安全问题。避免在公共分支中使用 `git reset`,

```bash
git reset HEAD^ --soft
```

对于公共分支唯一安全的做法是使用 `revert`

```bash
git revert [commitId]

# 如果有冲突，解决冲突后执行
git add .
git revert --continue
```

#### 修改 commit 之后不能 push

- 可能你已经将历史 push 到远程，但是又修改了本地的最近的 commit, 导致 git 理解为你的 commit 和 远程的不同需要先合并分支。
  **尽可能避免修改一个已经推送到远程的历史**，如果必须要这样做，只能使用 `git push -f`

#### reset 之后想找回

```bash
# 使用reflog查看头指针的移动历史
git reflog
git reset --hard [commitId]
```

#### 提交文件的一部分/分别提交到两个 commit

```bash
# 使用交互式命令行操作
git add -p [filename]

#y - 将该 hunk 添加到暂存区
#n - 不将该 hunk 添加到暂存区
#s - 拆分当前 hunk 成更小的块
#e - 手动编辑当前 hunk
#q - 退出暂存模式
#a - 将当前文件的所有剩余 hunk 添加到暂存区
#d - 不将当前文件的任何剩余 hunk 添加到暂存区
```

使用 `e` 手动编辑的模式时：

- 如果想要取消删除行的修改，需要将行前的 `-` 替换为 ` ` 空字符
- 如果想要取消新增行的修改， 需要将 `+` 行整体删除

添加到暂存区中后执行 `commit` 操作，接着再次执行一次 `git add .` 提交剩余的修改。

#### 有临时工作又不想提交当前的修改

```bash
# 使用 stash 命令暂存当前修改
git stash
git stash push -m "描述" #为stash添加描述

# 切换到需要工作的分支进行开发
git checkout [branch]
# 在当前分支中想要合并最新的主分支，也可以使用暂存功能
git pull

# 工作结束后切换回原来的分支，并从暂存中取出内容
git checkout [main branch]
git stash pop
```

#### 仅 stash 未暂存的更改，而保留暂存区的内容

```bash
# 已经git add 的内容不想放到stash中
# 只把刚在工作区修改的内容放到stash中
git stash --keep-index

# 如果有文件还没有git add添加过，想要stash这些文件
git stash -u

```
