---
layout: post
title: php面向对象
tags:
  - PHP
categories:
  - PHP
abbrlink: '87096832'
date: 2020-09-23 11:26:11
---

### 面向对象介绍

+ 软件危机: 落后的软件的生产方式不能满足计算机软件需求,导致在开发过程中产生严重问题.

+ 软件工程学用于解决软件危机,研究如何通过工程化的方法构建和维护有效,实用,高质量的软件学科. 涉及程序设计序言,数据库,软件开发工具,系统平台,标准,设计模式等方面.分为结构化方法(按软件周期分为三个阶段,分析.设计.编程) 和面向对象.

+ OOP(Object-Oriented Programming) 
    OOP 的三个目标:  重用性, 灵活性, 扩展性
    OOP 特点: 封装 继承 多态

**面向对象的主要特征**

+ 对象的行为
+ 对象的状态
+ 对象的标识

### 如何抽象一个类

+ 类的声明
+ 类的属性
+ 类的方法

```php
[修饰符]  class 类名 { //通过一个class关键字 + 空格 + 类名
    [成员属性] //也叫成员变量
    [成员方法] //也叫成员函数
}
```
**完整实现**
```php
[修饰符] class 类名 [extentds 父类] [implements 接口1,[,接口2]] {
    [成员属性] //也叫成员变量
    [成员方法] //也叫成员函数
}
```
格式: 修饰符 $变量名 [=默认值]
注意: 成员属性不可以是带运算符的表达式, 变量, 方法或函数调用.

#### 成员属性

```php
public $var3 = 1+2 //错误
public $var4 = self::myStaticMethod();//错误
public $var5 = $myVar;//错误
```

```php
public $var6 = 100//正确 普通数值 整数 浮点数 布尔 字符串
public $var7 = myConstant;//正确 常量
public $var8 = self::classConstant;//正确 静态属性
public $var9 = array(true,false); //数组
```
#### 成员方法

```php
[修饰符] function 方法名(参数...){
    [方法体]
    [return 返回值]
}
```

```php
public function say(){
    echo "说话"
}
```

### 通过类实例化一个对象

```php
$对象实例 = new 类名(参数)
```

```php
$引用名 = new 类名(构造参数);
$引用名 -> 成员属性 // 对象属性赋值
echo $引用名 ->成员属性 //输出对象的属性
$引用名 -> 成员方法(参数) //调用成员方法
```
#### $this 特殊对象引用

```php
class Person {
    public $age; //必须要有$
    public function say($word){
        echo "she say {$word}";
    }
    public function info(){
        $this -> say('Hi');
        return $this->age;
    }
}
$obj = new Person();
$obj->age = 22;
$age = $obj->info();
// 必须要有分号
echo $age;
```