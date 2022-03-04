---
title: supOS常见问题
mathjax: true
abbrlink: 3221341b
date: 2021-05-19 19:30:09
categories: 
- 其他
tags:
- supOS
---

[^_^]:①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳❶❷❸❹❺❻❼❽❾❿⓫⓬⓭⓮⓯⓰⓱⓲⓳⓴

#### 目录

①  [导入App提示重复不能导入 (3.0.3)](#导入App提示重复不能导入)
②  [如何修改标签页组件的标签样式](#如何修改标签页组件的标签样式)
③  [如何设置页面的背景为透明色](#如何设置页面的背景为透明色)

#### 导入App提示重复\/已存在不能导入

版本： `V-3.0.3`

① 查找mariadb所在的容器 

```bash
kubectl get po|grep maria
```

② 进入容器

mariadb的容器为 **lake-mariadb-default-\*\***

```bash
kubectl exec -it lake-mariadb-default-698b957d96-dn2xq bash
```

③ 链接数据库

[^_^] mariadbSupos

密码联系管理员获取

```bash
mysql -h localhost -u root -p
```

④ 执行sql删除脏数据

```sql
DELETE FROM supos_system001.supngin_oodm_network_node
WHERE instance_name NOT IN (
  SELECT en_name
  FROM supos_dt.supngin_oodm_entity
)
```

#### 如何修改标签页组件的标签样式

① 在界面设计->表单库中找到标标签页组件，拖到画布中并配置数据

![](0001.png)

② 交互事件中添加**内容加载事件**

![](0002.png)

③ 点击设置在脚本中添加如下代码并点击完成保存代码

![](0003.png)

查看组件ID并复制，替换调下面代码中的组件ID，**注意：组件Id前面的#不能省略，和组件ID之间不能有空格**

```javascript
// 修改tab标签的字体颜色
document.querySelector('#组件Id .ant-tabs').style.color='red'

// 修改正在激活的标签的字体颜色
document.querySelector('#组件Id .ant-tabs .ant-tabs-nav .ant-tabs-tab-active').style.color='blue'

// 修改正在激活标签的背景颜色
document.querySelector('#组件Id .ant-tabs .ant-tabs-nav .ant-tabs-tab-active').style.background='blue'

// 修改标签栏（整行）的背景颜色
document.querySelector('#组件Id .ant-tabs-nav-wrap').style.background='blue'
```

#### 如何设置页面的背景为透明色

经常在其他页面引用当前设计好的页面会存在背景色不透明的情况，首先需要在三个地方设置透明度，如果不能解决尝试添加最后的脚本

① 修改设计界面的透明度

![](0004.png)

② 修改布局配置中的透明度

![](0006.png)

③ 双击界面或点击右上角笔的图标进入设计器，点击一下空白的灰色画布位置，修改画布的透明度

![](0005.png)

④ 如果上述设置后不能解决，尝试在需要透明的页面中设置脚本来解决

  打开需要让背景变透明的页面，添加以下脚本

![](0007.png)

```javascript
document.querySelector('body .ant-layout').style.background='transparent'
document.querySelector('body').style.background='transparent'
```