---
title: supOS常见问题
mathjax: true

date: 2021-05-19 19:30:09
categories: 
- 其他
tags:
- supOS
---

[^_^]:①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳❶❷❸❹❺❻❼❽❾❿⓫⓬⓭⓮⓯⓰⓱⓲⓳⓴


### [官方文档](https://devc.supos.com/document?groupId=doc_group_id_005&devcContentId=DOC_CONTENT_1625187847647&version=supos_version_002&id=534)

#### 目录

①  [导入App提示重复不能导入 (3.0.3)](#导入App提示重复不能导入)
②  [如何修改标签页组件的标签样式](#如何修改标签页组件的标签样式)
③  [如何设置页面的背景为透明色](#如何设置页面的背景为透明色)
④  [服务中调用openApi或第三方接口](#服务中调用openApi或第三方接口)
④  [脚本中如何调用平台内置服务](#脚本中如何调用平台内置服务)
⑤  [服务中如何调用平台内置服务](#服务中如何调用平台内置服务)
⑥  [表格中设置单元格点击事件无效](#表格中设置单元格点击事件无效)

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


#### 服务中调用openApi或第三方接口

```javascript
var httpClient = services.HttpClientService;
 
// get请求参数
httpClient.getString(String url);
httpClient.getString(String url, int timeout);
httpClient.getString(String url, Map header);
httpClient.getString(String url, Map header, int timeout);
 
// post请求参数
httpClient.post(String url, String body);
httpClient.post(String url, String body, int timeout);
httpClient.post(String url, String body, Map header);
httpClient.post(String url, String body, Map header, int timeout);
 
// put请求参数
httpClient.put(String url, String body);
httpClient.put(String url, String body, int timeout);
httpClient.put(String url, String body, Map header);
httpClient.put(String url, String body, Map header, int timeout);
 
// delete请求参数
httpClient.delete(String url);
httpClient.delete(String url, int timeout);
httpClient.delete(String url, Map header);
httpClient.delete(String url, Map header, int timeout);
```


**get**

```javascript
var timeout = 2000;
var url = "https://developer.supos.com/services/resources/video/resources/newestList";
var result = services.HttpClientService.getString(url, timeout);
result;
```

**post**

```javascript
var timeout = 2000;
var url = "/open-api/supos/oodm/v2/model-label-types";
var body = {
  "appAccessMode": "PUBLIC",
  "appName": "system",
  "comment": "这是一个测试标签",
  "displayName": "设备",
  "enName": "device",
  "namespace": "system"
};
var result = services.HttpClientService.post(url, JSON.stringify(body), timeout);
result;
```

**其他示例**

```javascript
// 创建属性
// /v2/template/{templateNamespace}/{templateName}/entity/{instanceName}/attribute
var param = {
"comment": "这是一个测试属性",
"dataType": "DOUBLE",
"displayName": "p3",
"enName": "p3",
"readWriteMode": "READ_WRITE",
"appAccessMode": "PUBLIC",
"appName": "system",
"appShowName": "system",
"namespace": "system",
"maxValue": 2342342342.232,
"minValue": -2342342342.232
}
var url = "/open-api/supos/oodm/v2/template/system/test/entity/o1/attribute";
var result = services.HttpClientService.post(url, JSON.stringify(param));
result
 
 
// 修改属性
// 客户端为IE11浏览器时不支持ES6脚本
// /v2/template/{templateNamespace}/{templateName}/entity/{instanceName}/attribute/{attributeNamespace}/{attributeName}
var param = {
"comment": "这是一个测试属性",
"readWriteMode": "READ_WRITE",
"appAccessMode": "PUBLIC",
"appName": "system",
"appShowName": "system",
"namespace": "system",
"maxValue": 234234342342.232,
"minValue": -234234342342.232
}
var url = "/open-api/supos/oodm/v2/template/system/test/entity/o1/attribute/system/p3";
var result = services.HttpClientService.put(url, JSON.stringify(param));
result
 
 
// 查询属性
// 客户端为IE11浏览器时不支持ES6脚本
// /v2/template/{templateNamespace}/{templateName}/instance/{instanceName}/attribute/self
var url = "/open-api/supos/oodm/v2/template/system/test/instance/o1/attribute/self?pageIndex=1&pageSize=3";
var result = services.HttpClientService.getString(url);
result
```


#### 脚本中如何调用平台内置服务

2.7 版本使用方式

```js
scriptUtil.excuteScriptService({
  objName: '对象实例别名',
  serviceName: '服务别名',
  params:{
    // "参数的值,可能是字符串,也可能是对象,按照服务参数说明填写"
  },
  cb:(res)=>{
    // 执行结束后的回调函数,和下面方法二选一,写法不同,效果一样
  }
}, (res) => {
  // 执行结束后的回调函数 
})
```

3.0 及以上版本使用方式

```js
scriptUtil.excuteScriptService({
  objName: '模板命名空间.模板别名',
  serviceName: '服务命名空间.服务别名',
  version: 'V2',
  params:{
    // "参数的值,可能是字符串,也可能是对象,按照服务参数说明填写"
  },
  cb:(res)=>{
    // 执行结束后的回调函数,和下面方法二选一,写法不同,效果一样
  }
}, (res) => {
  // 执行结束后的回调函数 
})
```

查看服务参数

点击对象模板 -> 添加按钮,创建表单 -> 点击进入详情

![](0008.png)

点击服务 -> **其他服务就是平台内置服务** -> 点击操作中的查看

![](0009.png)

在 信息输入 描述中查看参数格式, 别名就是参数的 `key` 描述就是值的格式

![](0010.png)


+ 案例1: 添加表单数据的内置服务

|别名 | 类型 | 描述 | 必填 |
|---|---|---|---|
|params | STRING	| 参数格式：{"id":"1","name":"zhangsan"}| 是|

2.7 写法 

```js
scriptUtil.excuteScriptService(k{
  objName: '对象实例名称',
  serviceName: 'addDataTableEntry',
  // params 固定属性不要修改
  params:{
    // 属性描述中的参数,值需要传一个字符串所以需要转换
    params: JSON.stringify({"id":"1","name":"zhangsan"})
  },
  cb:(res)=>{
    if(res.code==200){
      //
    }
  }
})
```

3.0 写法

```js
scriptUtil.excuteScriptService(k{
  objName: 'templateNamespace.templateName',
  serviceName: 'serviceNamespace.addDataTableEntry',
  // params 固定属性不要修改
  params:{
    // 属性描述中的参数,值需要传一个字符串所以需要转换
    params: JSON.stringify({"id":"1","name":"zhangsan"})
  },
  cb:(res)=>{
    if(res.code==200){
      //
    }
  }
})
```


#### 服务中如何调用平台内置服务

2.7 版本

```js
var inputs = {
  params: JSON.stringify({"id":"1","name":"zhangsan"})
};
ObjectPool.get('对象实例别名').executeService('内置服务(addDataTableEntry)', inputs);
```

3.0 版本 

```js

var inputs = {
  params: JSON.stringify({"id":"1","name":"zhangsan"})
};
var instance = templates['对象模板命名空间.模板别名'].instances('对象实例别名');
var result = instance.executeService('服务命名空间.内置服务(addDataTableEntry)',inputs);
```

#### 服务中使用sql查询表单模板

语法与<a href='#服务中如何调用平台内置服务'>服务中如何调用平台内置服务</a>相同,只需要把sql当作服务参数传入即可


下面是一个稍微复杂一点的例子, `timeLine` 和 `status` 是外部传入的两个参数

可以直接对传入参数进行操作, 循环或是判断是否有值

**表名**:    模板命名空间_模板别名
**字段名称**: 表别名(可选).模板命名空间_字段名称
 
```js

var i=0;   
// 解析成一个数组用于循环
var timeLine = JSON.parse(timeLine);

var sql1 = "select p.admin_promanagesystem_companyname as ocompanyname,p.admin_promanagesystem_companyname as ocid, sum(p.admin_promanagesystem_money) as contractmoney "

for(var k in timeLine){
    var month = timeLine[k];
    sql1+= " ,JSON_OBJECT('count', op" +i +".count, 'overdue', op" +i +".overdue,'money',op" +i +".money,'engineeringnode',op" +i +".engineeringnode ) as '" + month + "' "
    i = i+1
}
    sql1+= " from admin_promanagesystem_proContractNode as p "
var i=0;   
for(var k in timeLine){
    var month = timeLine[k];

    sql1+= "left join ( "
    sql1+= " select p.admin_promanagesystem_companyname as companyname, p.admin_promanagesystem_companyname as cid, '"+ month +"' as date "
    sql1+= " from admin_promanagesystem_proContractNode as p "
    sql1+= " where DATE_FORMAT(p.admin_promanagesystem_estimatedCompDate, '%Y-%m') = '"+month+"' "

    // 判断这个外部参数是否为真,用于添加查询条件
    if(status) {
    sql1+= " and p.admin_promanagesystem_engineerStatus = '" + status + "' "    
    }
    sql1+= " group by p.admin_promanagesystem_companyname "
    sql1+= " order by STR_TO_DATE(p.admin_promanagesystem_estimatedCompDate,'%Y-%m-%d') desc "
    sql1+= ") as op" +i +" on 1 = 1 and p.admin_promanagesystem_companyname = op" +i +".companyname "
    i = i+1
}
    
    sql1+= "group by p.admin_promanagesystem_companyname "
    
   

var inputs = {
	input: JSON.stringify({"sql": sql1})
};     
var template = templates['admin_promanagesystem.proManageSystem'];

var list = template['system.querySQLExec'](inputs).data;

var list = template['system.querySQLExec'](inputs).data.dataSource;
list

```

#### 表格中设置单元格点击事件无效

如果按照 [官方文档](https://devc.supos.com/document?groupId=doc_group_id_005&devcContentId=DOC_CONTENT_1646703154679&version=supos_version_002&id=909#_234 ) 配置单元格点击事件无效,需要把事件名称改为 `onClick`

```js

var table = scriptUtil.getRegisterReactDom('组件id');
var cellConfig={
 name: {
    onClick: function(row, tableData){
      console.log('单击该单元格', row, tableData);
    },
  }
};

table.setCellConfig(cellConfig);
```