---
title: MySQL DQL查询语言
mathjax: true

date: 2021-12-09 09:55:38
categories:
  - 数据库
tags: 
  - 数据库
  - MySQL
---


DQL (Data Query Language)数据查询语言;

#### 基本查询

1、查询的结果集 是一个虚拟表
2、select 查询列表  类似于`System.out.println(打印内容)`;

select后面跟的查询列表，可以有多个部分组成，中间用逗号隔开
例如：select 字段1,字段2,表达式 from 表;

`System.out.println()`的打印内容，只能有一个。

3、执行顺序

① from子句
② select子句

4、查询列表可以是：字段、表达式、常量、函数等

```sql

USE myemployees;

#一、查询常量
SELECT 100 ;

#二、查询表达式
SELECT 100%3;

#三、查询单个字段
SELECT `last_name` FROM `employees`;

#四、查询多个字段
SELECT `last_name`,`email`,`employee_id` FROM employees;

#五、查询所有字段
SELECT * FROM `employees`;


#F12:对齐格式
SELECT 
    `last_name`,
    `first_name`,
    `last_name`,
    `commission_pct`,
    `hiredate`,
    `salary` 
FROM
    employees ;
    
#六、查询函数（调用函数，获取返回值）
SELECT DATABASE();
SELECT VERSION();
SELECT USER();

#七、起别名
#方式一：使用as关键字

SELECT USER() AS 用户名;
SELECT USER() AS "用户名";
SELECT USER() AS '用户名';

SELECT last_name AS "姓 名" FROM employees;


#方式二：使用空格


SELECT USER()   用户名;
SELECT USER()   "用户名";
SELECT USER()   '用户名';

SELECT last_name   "姓 名" FROM employees;


#八、+的作用
-- 需求：查询 first_name 和last_name 拼接成的全名，最终起别名为：姓 名

#方案1：使用+    pass×
SELECT first_name+last_name AS "姓 名"
FROM employees;



#方案2：使用concat拼接函数

SELECT CONCAT(first_name,last_name) AS "姓 名"
FROM employees;



/*

Java中+的作用：
1、加法运算
	100+1.5      'a'+2    1.3+'2'
	
2、拼接符
	至少有一个操作数为字符串
	"hello"+'a'
	
	
mysql中+的作用：
1、加法运算

①两个操作数都是数值型
100+1.5

②其中一个操作数为字符型
将字符型数据强制转换成数值型,如果无法转换，则直接当做0处理

'张无忌'+100===>100


③其中一个操作数为null

null+null====》null

null+100====》 null



*/

    
    
#九、distinct的使用 去重

#需求：查询员工涉及到的部门编号有哪些


SELECT DISTINCT department_id FROM employees;


#十、查看表的结构

DESC employees;
SHOW COLUMNS FROM employees;

```

**练习**

显示出表 `employees` 的全部列，各个列之间用逗号连接，列头显示成 `OUT_PUT`

```sql
SELECT CONCAT(employee_id,',',first_name,',',last_name,',',salary,',',IFNULL(commission_pct,''))  AS "OUT_PUT"
FROM employees;

#ifnull(表达式1，表达式2)
/*
表达式1：可能为null的字段或表达式
表达式2：如果表达式1为null，则最终结果显示的值

功能：如果表达式1为null，则显示表达式2，否则显示表达式1

*/

SELECT commission_pct,IFNULL(commission_pct,'空') FROM employees;
```

#### 条件查询

select 查询列表
from  表名
where 筛选条件;


执行顺序：
①from子句
②where子句
③select子句

1、按关系表达式筛选

关系运算符：>   <    >=   <=     =     <>
              补充：也可以使用!=,但不建议

2、按逻辑表达式筛选

逻辑运算符：and    or   not
	      补充：也可以使用&&  ||   !  ，但不建议

3、模糊查询

like
in
between and
is null


```sql
#一、按关系表达式筛选
#案例1：查询部门编号不是100的员工信息
SELECT *
FROM employees
WHERE department_id <> 100;


#案例2：查询工资<15000的姓名、工资
SELECT last_name,salary
FROM employees
WHERE salary<15000;


#二、按逻辑表达式筛选

#案例1：查询部门编号不是 50-100之间员工姓名、部门编号、邮箱
#方式1：
SELECT last_name,department_id,email
FROM employees
WHERE department_id <50 OR department_id>100;

#方式2：


SELECT last_name,department_id,email
FROM employees
WHERE NOT(department_id>=50 AND department_id<=100);



#案例2：查询奖金率>0.03 或者 员工编号在60-110之间的员工信息
SELECT *
FROM employees
WHERE commission_pct>0.03 OR (employee_id >=60 AND employee_id<=110);


#三、模糊查询

#1、like

/*
功能：一般和通配符搭配使用，对字符型数据进行部分匹配查询
常见的通配符：
_ 任意单个字符
% 任意多个字符,支持0-多个
like/not like 
*/

#案例1：查询姓名中包含字符a的员工信息
SELECT *
FROM employees
WHERE last_name LIKE '%a%';

#案例2：查询姓名中包含最后一个字符为e的员工信息
SELECT *
FROM employees
WHERE last_name LIKE '%e';

#案例3：查询姓名中包含第一个字符为e的员工信息
SELECT *
FROM employees
WHERE last_name LIKE 'e%';

#案例4：查询姓名中包含第三个字符为x的员工信息
SELECT *
FROM employees
WHERE last_name LIKE '__x%';

#案例5：查询姓名中包含第二个字符为_的员工信息
SELECT *
FROM employees
WHERE last_name LIKE '_\_%';

SELECT *
FROM employees
WHERE last_name LIKE '_$_%' ESCAPE '$';


#2、in
/*
功能：查询某字段的值是否属于指定的列表之内

a  in(常量值1,常量值2,常量值3,...)
a not in(常量值1,常量值2,常量值3,...)

in/not in
*/

#案例1：查询部门编号是30/50/90的员工名、部门编号


#方式1：
SELECT last_name,department_id
FROM employees
WHERE department_id IN(30,50,90);

#方式2：

SELECT last_name,department_id
FROM employees
WHERE department_id = 30
OR department_id = 50
OR department_id = 90;


#案例2：查询工种编号不是SH_CLERK或IT_PROG的员工信息
#方式1：
SELECT *
FROM employees
WHERE job_id NOT IN('SH_CLERK','IT_PROG');

#方式2：
SELECT *
FROM employees
WHERE NOT(job_id ='SH_CLERK'
OR job_id = 'IT_PROG');


#3、between and

/*
功能：判断某个字段的值是否介于xx之间

between and/not between and

*/


#案例1：查询部门编号是30-90之间的部门编号、员工姓名

#方式1：
SELECT department_id,last_name
FROM employees
WHERE department_id BETWEEN 30 AND 90;

#方式2：

SELECT department_id,last_name
FROM employees
WHERE department_id>=30 AND department_id<=90;


#案例2：查询年薪不是100000-200000之间的员工姓名、工资、年薪

SELECT last_name,salary,salary*12*(1+IFNULL(commission_pct,0)) 年薪
FROM employees
WHERE salary*12*(1+IFNULL(commission_pct,0))<100000 OR salary*12*(1+IFNULL(commission_pct,0))>200000;



SELECT last_name,salary,salary*12*(1+IFNULL(commission_pct,0)) 年薪
FROM employees
WHERE salary*12*(1+IFNULL(commission_pct,0)) NOT BETWEEN 100000 AND 200000;



#4、is null/is not null

#案例1：查询没有奖金的员工信息
SELECT *
FROM employees
WHERE commission_pct IS NULL;



#案例2：查询有奖金的员工信息
SELECT *
FROM employees
WHERE commission_pct IS NOT NULL;


SELECT *
FROM employees
WHERE salary IS 10000;

#----------------对比------------------------------------

=		只能判断普通的内容

IS              只能判断NULL值

<=>             安全等于，既能判断普通内容，又能判断NULL值




SELECT *
FROM employees
WHERE salary <=> 10000;

SELECT *
FROM employees
WHERE commission_pct <=> NULL;
```

#### 排序查询


select 查询列表
from 表名
【where 筛选条件】
order by 排序列表


执行顺序：

①from子句
②where子句
③select子句
④order by 子句


特点：

1、排序列表可以是单个字段、多个字段、表达式、函数、列数、以及以上的组合
2、升序 ，通过 asc   ，默认行为
   降序 ，通过 desc

```sql
#一、按单个字段排序

#案例1：将员工编号>120的员工信息进行工资的升序
SELECT * 
FROM employees 

ORDER BY salary ;

#案例1：将员工编号>120的员工信息进行工资的降序
SELECT * 
FROM employees 
WHERE employee_id>120 
ORDER BY salary DESC;

#二、按表达式排序
#案例1：对有奖金的员工，按年薪降序

SELECT *,salary*12*(1+IFNULL(commission_pct,0))  年薪
FROM employees
WHERE commission_pct IS NOT NULL
ORDER BY salary*12*(1+IFNULL(commission_pct,0)) DESC;


#三、按别名排序
#案例1：对有奖金的员工，按年薪降序

SELECT *,salary*12*(1+IFNULL(commission_pct,0))  年薪
FROM employees

ORDER BY 年薪 DESC;

#四、按函数的结果排序

#案例1：按姓名的字数长度进行升序


SELECT last_name
FROM employees
ORDER BY LENGTH(last_name);


#五、按多个字段排序

#案例1：查询员工的姓名、工资、部门编号，先按工资升序，再按部门编号降序

SELECT last_name,salary,department_id
FROM employees
ORDER BY salary ASC,department_id DESC;


#六、补充选学：按列数排序


SELECT * FROM employees 
ORDER BY 2 DESC;


SELECT * FROM employees 
ORDER BY first_name;
```

#### 函数

函数：类似于java中学过的“方法”，
为了解决某个问题，将编写的一系列的命令集合封装在一起，对外仅仅暴露方法名，供外部调用

1、自定义方法(函数)
2、调用方法(函数)★
	叫什么  ：函数名
	干什么  ：函数功能

##### 单行函数
+ 字符函数
	`concat`
	`substr`
	`length（str）`
	`char_length`
	`upper`
	`lower`
	`trim`
	`left`
	`right`
	`lpad`
	`rpad`
	`instr`
	`strcmp`
+ 数学函数
	`abs`
	`ceil`
	`floor`
	`round`
	`truncate`
	`mod`
	
+ 日期函数
	`now` 
	`curtime`
	`curdate`
	`datediff`
	`date_format`
	`str_to_date`
	
+ 流程控制函数
	`if`
	`case`


```sql
1、CONCAT 拼接字符

SELECT CONCAT('hello,',first_name,last_name)  备注 FROM employees;

2、LENGTH 获取字节长度

SELECT LENGTH('hello,郭襄');

3、CHAR_LENGTH 获取字符个数
SELECT CHAR_LENGTH('hello,郭襄');

4、SUBSTRING 截取子串
/*
注意：起始索引从1开始！！！
substr(str,起始索引，截取的字符长度)
substr(str,起始索引)
*/
SELECT SUBSTR('张三丰爱上了郭襄',1,3);
SELECT SUBSTR('张三丰爱上了郭襄',7);

5、INSTR获取字符第一次出现的索引

SELECT INSTR('三打白骨精aaa白骨精bb白骨精','白骨精');

6、TRIM去前后指定的字符，默认是去空格


SELECT TRIM(' 虚  竹    ')  AS a;
SELECT TRIM('x' FROM 'xxxxxx虚xxx竹xxxxxxxxxxxxxxxxxx')  AS a;

7、LPAD/RPAD  左填充/右填充
SELECT LPAD('木婉清',10,'a');
SELECT RPAD('木婉清',10,'a');

8、UPPER/LOWER  变大写/变小写

#案例：查询员工表的姓名，要求格式：姓首字符大写，其他字符小写，名所有字符大写，且姓和名之间用_分割，最后起别名“OUTPUT”


SELECT UPPER(SUBSTR(first_name,1,1)),first_name FROM employees;
SELECT LOWER(SUBSTR(first_name,2)),first_name FROM employees;
SELECT UPPER(last_name) FROM employees;

SELECT CONCAT(UPPER(SUBSTR(first_name,1,1)),LOWER(SUBSTR(first_name,2)),'_',UPPER(last_name)) "OUTPUT"
FROM employees;

9、STRCMP 比较两个字符大小

SELECT STRCMP('aec','aec');


10、LEFT/RIGHT  截取子串
SELECT LEFT('鸠摩智',1);
SELECT RIGHT('鸠摩智',1);


#二、数学函数

1、ABS 绝对值
SELECT ABS(-2.4);
2、CEIL 向上取整  返回>=该参数的最小整数
SELECT CEIL(-1.09);
SELECT CEIL(0.09);
SELECT CEIL(1.00);

3、FLOOR 向下取整，返回<=该参数的最大整数
SELECT FLOOR(-1.09);
SELECT FLOOR(0.09);
SELECT FLOOR(1.00);

4、ROUND 四舍五入
SELECT ROUND(1.8712345);
SELECT ROUND(1.8712345,2);

5、TRUNCATE 截断

SELECT TRUNCATE(1.8712345,1);

6、MOD 取余

SELECT MOD(-10,3);
a%b = a-(INT)a/b*b
-10%3 = -10 - (-10)/3*3   = -1

SELECT -10%3;
SELECT 10%3;
SELECT -10%-3;
SELECT 10%-3;


#三、日期函数


1、NOW
SELECT NOW();

2、CURDATE

SELECT CURDATE();

3、CURTIME
SELECT CURTIME();


4、DATEDIFF
SELECT DATEDIFF('1998-7-16','2019-7-13');

5、DATE_FORMAT

SELECT DATE_FORMAT('1998-7-16','%Y年%M月%d日 %H小时%i分钟%s秒') 出生日期;



SELECT DATE_FORMAT(hiredate,'%Y年%M月%d日 %H小时%i分钟%s秒')入职日期 
FROM employees;



6、STR_TO_DATE 按指定格式解析字符串为日期类型
SELECT * FROM employees
WHERE hiredate<STR_TO_DATE('3/15 1998','%m/%d %Y');


#四、流程控制函数


1、IF函数

SELECT IF(100>9,'好','坏');


#需求：如果有奖金，则显示最终奖金，如果没有，则显示0
SELECT IF(commission_pct IS NULL,0,salary*12*commission_pct)  奖金,commission_pct
FROM employees;



2、CASE函数

①情况1 ：类似于switch语句，可以实现等值判断
CASE 表达式
WHEN 值1 THEN 结果1
WHEN 值2 THEN 结果2
...
ELSE 结果n
END


案例：
部门编号是30，工资显示为2倍
部门编号是50，工资显示为3倍
部门编号是60，工资显示为4倍
否则不变

显示 部门编号，新工资，旧工资

SELECT department_id,salary,
CASE department_id
WHEN 30 THEN salary*2
WHEN 50 THEN salary*3
WHEN 60 THEN salary*4
ELSE salary
END  newSalary
FROM employees;


②情况2：类似于多重IF语句，实现区间判断
CASE 
WHEN 条件1 THEN 结果1
WHEN 条件2 THEN 结果2
...

ELSE 结果n

END



案例：如果工资>20000,显示级别A
      工资>15000,显示级别B
      工资>10000,显示级别C
      否则，显示D
      
 SELECT salary,
 CASE 
 WHEN salary>20000 THEN 'A'
 WHEN salary>15000 THEN 'B'
 WHEN salary>10000 THEN 'C'
 ELSE 'D'
 END
 AS  a
 FROM employees;   
```

##### 分组函数

说明：分组函数往往用于实现将一组数据进行统计计算，最终得到一个值，又称为聚合函数或统计函数

分组函数清单：

sum(字段名)：求和
avg(字段名)：求平均数
max(字段名)：求最大值
min(字段名)：求最小值
count(字段名)：计算非空字段值的个数

**特点：**

sum,avg 一般处理数值类型，max,min,count 可以处理任意类型，以上分组函数都忽略null值。

可以和 distinct 搭配实现去重的运算

count函数一般使用count(*)用作统计行数

和分组函数一同查询的字段有限制，只能是 group by 后面的函数


```sql
#案例1 ：查询员工信息表中，所有员工的工资和、工资平均值、最低工资、最高工资、有工资的个数

SELECT SUM(salary),AVG(salary),MIN(salary),MAX(salary),COUNT(salary) FROM employees;

#案例2：添加筛选条件
	#①查询emp表中记录数：
	SELECT COUNT(employee_id) FROM employees;

	#②查询emp表中有佣金的人数：
	
	SELECT COUNT(salary) FROM employees;
	
	
	#③查询emp表中月薪大于2500的人数：
	SELECT COUNT(salary) FROM employees WHERE salary>2500;

	
	#④查询有领导的人数：
	SELECT COUNT(manager_id) FROM employees;
	
	
#count的补充介绍★


#1、统计结果集的行数，推荐使用count(*)
	
SELECT COUNT(*) FROM employees;
SELECT COUNT(*) FROM employees WHERE department_id = 30;


SELECT COUNT(1) FROM employees;
SELECT COUNT(1) FROM employees WHERE department_id = 30;


#2、搭配distinct实现去重的统计

#需求：查询有员工的部门个数

SELECT COUNT(DISTINCT department_id) FROM employees;


#思考：每个部门的总工资、平均工资？

SELECT SUM(salary)  FROM employees WHERE department_id = 30;
SELECT SUM(salary)  FROM employees WHERE department_id = 50;


SELECT SUM(salary) ,department_id
FROM employees
GROUP BY department_id;
```

#### 分组查询

select 查询列表
from 表名
where 筛选条件
group by 分组列表
having 分组后筛选
order by 排序列表;

执行顺序：
①from子句
②where子句
③group by 子句
④having子句
⑤select子句
⑥order by子句


特点：
①查询列表往往是  分组函数和被分组的字段 ★
②分组查询中的筛选分为两类
			筛选的基表	使用的关键词		位置
分组前筛选		原始表		where			group by 的前面

分组后筛选		分组后的结果集  having			group by的后面

where——group by ——having

问题：分组函数做条件只可能放在having后面！！！


```sql
#1）简单的分组
#案例1：查询每个工种的员工平均工资

SELECT AVG(salary),job_id
FROM employees
GROUP BY job_id;

#案例2：查询每个领导的手下人数

SELECT COUNT(*),manager_id
FROM employees
WHERE manager_id IS NOT NULL
GROUP BY manager_id;





#2）可以实现分组前的筛选
#案例1：查询邮箱中包含a字符的 每个部门的最高工资
SELECT MAX(salary) 最高工资,department_id
FROM employees
WHERE email LIKE '%a%'
GROUP BY department_id;


#案例2：查询每个领导手下有奖金的员工的平均工资
SELECT AVG(salary) 平均工资,manager_id
FROM employees
WHERE commission_pct IS NOT NULL
GROUP BY manager_id;


#3）可以实现分组后的筛选
#案例1：查询哪个部门的员工个数>5
#分析1：查询每个部门的员工个数
SELECT COUNT(*) 员工个数,department_id
FROM employees
GROUP BY department_id

#分析2：在刚才的结果基础上，筛选哪个部门的员工个数>5

SELECT COUNT(*) 员工个数,department_id
FROM employees

GROUP BY department_id
HAVING  COUNT(*)>5;


#案例2：每个工种有奖金的员工的最高工资>12000的工种编号和最高工资

SELECT job_id,MAX(salary)
FROM employees
WHERE commission_pct  IS NOT NULL
GROUP BY job_id
HAVING MAX(salary)>12000;


#案例3：领导编号>102的    每个领导手下的最低工资大于5000的最低工资
#分析1：查询每个领导手下员工的最低工资
SELECT MIN(salary) 最低工资,manager_id
FROM employees
GROUP BY manager_id;

#分析2：筛选刚才1的结果
SELECT MIN(salary) 最低工资,manager_id
FROM employees
WHERE manager_id>102
GROUP BY manager_id
HAVING MIN(salary)>5000 ;




#4）可以实现排序
#案例：查询没有奖金的员工的最高工资>6000的工种编号和最高工资,按最高工资升序
#分析1：按工种分组，查询每个工种有奖金的员工的最高工资
SELECT MAX(salary) 最高工资,job_id
FROM employees
WHERE commission_pct IS  NULL
GROUP BY job_id


#分析2：筛选刚才的结果，看哪个最高工资>6000
SELECT MAX(salary) 最高工资,job_id
FROM employees
WHERE commission_pct IS  NULL
GROUP BY job_id
HAVING MAX(salary)>6000


#分析3：按最高工资升序
SELECT MAX(salary) 最高工资,job_id
FROM employees
WHERE commission_pct IS  NULL
GROUP BY job_id
HAVING MAX(salary)>6000
ORDER BY MAX(salary) ASC;


#5）按多个字段分组
#案例：查询每个工种每个部门的最低工资,并按最低工资降序
#提示：工种和部门都一样，才是一组

工种	部门  工资
1	10	10000
1       20      2000
2	20
3       20
1       10
2       30
2       20


SELECT MIN(salary) 最低工资,job_id,department_id
FROM employees
GROUP BY job_id,department_id;
```


#### 链接查询

说明：又称多表查询，当查询语句涉及到的字段来自于多个表时，就会用到连接查询

笛卡尔乘积现象：表1 有m行，表2有n行，结果=m*n行

发生原因：没有有效的连接条件
如何避免：添加有效的连接条件

+ 分类：

	+ 按年代分类：
    	+ sql92标准:仅仅支持内连接
    		+ 内连接：
    			+ 等值连接
    			+ 非等值连接
    			+ 自连接
    	+ sql99标准【推荐】：支持内连接+外连接（左外和右外）+交叉连接
	+ 按功能分类：
		+ 内连接：
			+ 等值连接
			+ 非等值连接
			+ 自连接
		+ 外连接：
			+ 左外连接
			+ 右外连接
			+ 全外连接
		+ 交叉连接

##### 内链接 

语法:
select 查询列表
from 表1 别名,表2 别名
where 连接条件
and 筛选条件
group by 分组列表
having 分组后筛选
order by 排序列表

执行顺序：

1、from子句
2、where子句
3、and子句
4、group by子句
5、having子句
6、select子句
7、order by子句

SQL92和SQL99的区别：
	SQL99，使用JOIN关键字代替了之前的逗号，并且将连接条件和筛选条件进行了分离，提高阅读性！！！


```sql
语法：
SELECT 查询列表
FROM 表名1 别名
【INNER】 JOIN  表名2 别名
ON 连接条件
WHERE 筛选条件
GROUP BY 分组列表
HAVING 分组后筛选
ORDER BY 排序列表;

#一）等值连接
#①简单连接
#案例：查询员工名和部门名

SELECT last_name,department_name
FROM departments d 
 JOIN  employees e 
ON e.department_id =d.department_id;



#②添加筛选条件
#案例1：查询部门编号>100的部门名和所在的城市名
SELECT department_name,city
FROM departments d
JOIN locations l
ON d.`location_id` = l.`location_id`
WHERE d.`department_id`>100;


#③添加分组+筛选
#案例1：查询每个城市的部门个数

SELECT COUNT(*) 部门个数,l.`city`
FROM departments d
JOIN locations l
ON d.`location_id`=l.`location_id`
GROUP BY l.`city`;




#④添加分组+筛选+排序
#案例1：查询部门中员工个数>10的部门名，并按员工个数降序

SELECT COUNT(*) 员工个数,d.department_name
FROM employees e
JOIN departments d
ON e.`department_id`=d.`department_id`
GROUP BY d.`department_id`
HAVING 员工个数>10
ORDER BY 员工个数 DESC;


#二）非等值连接

#案例：查询部门编号在10-90之间的员工的工资级别，并按级别进行分组
SELECT * FROM sal_grade;


SELECT COUNT(*) 个数,grade
FROM employees e
JOIN sal_grade g
ON e.`salary` BETWEEN g.`min_salary` AND g.`max_salary`
WHERE e.`department_id` BETWEEN 10 AND 90
GROUP BY g.grade;




#三）自连接

#案例：查询员工名和对应的领导名

SELECT e.`last_name`,m.`last_name`
FROM employees e
JOIN employees m
ON e.`manager_id`=m.`employee_id`;
```


##### 外连接

说明：查询结果为主表中所有的记录，如果从表有匹配项，则显示匹配项；如果从表没有匹配项，则显示 null

应用场景：一般用于查询主表中有但从表没有的记录

特点：

1、外连接分主从表，两表的顺序不能任意调换
2、左连接的话，left join 左边为主表
右连接的话，right join 右边为主表

语法：

select 查询列表
from 表 1 别名
left|right|full 【outer】 join 表 2 别名
on 连接条件
where 筛选条件;

```bash
#案例1：查询所有女神记录，以及对应的男神名，如果没有对应的男神，则显示为null

#左连接
SELECT b.*,bo.*
FROM beauty b
LEFT JOIN boys bo ON b.`boyfriend_id` = bo.`id`;

#右连接
SELECT b.*,bo.*
FROM boys bo
RIGHT JOIN  beauty b ON b.`boyfriend_id` = bo.`id`;



#案例2：查哪个女生没有男朋友

#左连接
SELECT b.`name`
FROM beauty b
LEFT JOIN boys bo ON b.`boyfriend_id` = bo.`id`
WHERE bo.`id`  IS NULL;

#右连接
SELECT b.*,bo.*
FROM boys bo
RIGHT JOIN  beauty b ON b.`boyfriend_id` = bo.`id`
WHERE bo.`id`  IS NULL;


#案例3：查询哪个部门没有员工，并显示其部门编号和部门名

SELECT COUNT(*) 部门个数
FROM departments d
LEFT JOIN employees e ON d.`department_id` = e.`department_id`
WHERE e.`employee_id` IS NULL;
```

#### 子查询

说明：当一个查询语句中又嵌套了另一个完整的 select 语句，则被嵌套的 select 语句称为子查询或内查询
外面的 select 语句称为主查询或外查询。

分类：

按子查询出现的位置进行分类：

1、select 后面
要求：子查询的结果为单行单列（标量子查询）
2、from 后面
要求：子查询的结果可以为多行多列
3、where 或 having 后面 ★
要求：子查询的结果必须为单列
单行子查询
多行子查询
4、exists 后面
要求：子查询结果必须为单列（相关子查询）
特点：
1、子查询放在条件中，要求必须放在条件的右侧
2、子查询一般放在小括号中
3、子查询的执行优先于主查询
4、单行子查询对应了 单行操作符：> < >= <= = <>
多行子查询对应了 多行操作符：any/some all in

##### 单行子查询

```bash
#一）单行子查询

#案例1：谁的工资比 Abel 高?


#①查询Abel的工资
SELECT salary
FROM employees
WHERE last_name  = 'Abel'
#②查询salary>①的员工信息
SELECT last_name,salary
FROM employees
WHERE salary>(
	SELECT salary
	FROM employees
	WHERE last_name  <> 'Abel'

);

#案例2：返回job_id与141号员工相同，salary比143号员工多的员工姓名，job_id 和工资
#①查询141号员工的job_id
SELECT job_id
FROM employees
WHERE employee_id = 141

#②查询143号员工的salary

SELECT salary
FROM employees
WHERE employee_id = 143

#③查询job_id=① and salary>②的信息
SELECT last_name,job_id,salary
FROM employees
WHERE job_id = (
	SELECT job_id
	FROM employees
	WHERE employee_id = 141
) AND salary>(

	SELECT salary
	FROM employees
	WHERE employee_id = 143

);
```

##### 多行子查询

```bash
/*
in:判断某字段是否在指定列表内
x in(10,30,50)


any/some:判断某字段的值是否满足其中任意一个

x>any(10,30,50)
x>min()

x=any(10,30,50)
x in(10,30,50)

all:判断某字段的值是否满足里面所有的

x >all(10,30,50)
x >max()

*/


#案例1：返回location_id是1400或1700的部门中的所有员工姓名

#①查询location_id是1400或1700的部门
SELECT department_id
FROM departments
WHERE location_id IN(1400,1700)


#②查询department_id = ①的姓名
SELECT last_name
FROM employees
WHERE department_id IN(
	SELECT DISTINCT department_id
	FROM departments
	WHERE location_id IN(1400,1700)

);



#题目：返回其它部门中比job_id为‘IT_PROG’部门任一工资低的员工的员工号、姓名、job_id 以及salary

#①查询job_id为‘IT_PROG’部门的工资
SELECT DISTINCT salary
FROM employees
WHERE job_id = 'IT_PROG'


#②查询其他部门的工资<任意一个①的结果

SELECT employee_id,last_name,job_id,salary
FROM employees
WHERE salary<ANY(

	SELECT DISTINCT salary
	FROM employees
	WHERE job_id = 'IT_PROG'


);



等价于

SELECT employee_id,last_name,job_id,salary
FROM employees
WHERE salary<(

	SELECT MAX(salary)
	FROM employees
	WHERE job_id = 'IT_PROG'


);




#案例3：返回其它部门中比job_id为‘IT_PROG’部门所有工资都低的员工 的员工号、姓名、job_id 以及salary

#①查询job_id为‘IT_PROG’部门的工资
SELECT DISTINCT salary
FROM employees
WHERE job_id = 'IT_PROG'


#②查询其他部门的工资<所有①的结果

SELECT employee_id,last_name,job_id,salary
FROM employees
WHERE salary<ALL(

	SELECT DISTINCT salary
	FROM employees
	WHERE job_id = 'IT_PROG'


);



等价于

SELECT employee_id,last_name,job_id,salary
FROM employees
WHERE salary<(

	SELECT MIN(salary)
	FROM employees
	WHERE job_id = 'IT_PROG'


);


#二、放在select后面

#案例；查询部门编号是50的员工个数

SELECT
(
	SELECT COUNT(*)
	FROM employees
	WHERE department_id = 50
)  个数;


#三、放在from后面

#案例：查询每个部门的平均工资的工资级别
#①查询每个部门的平均工资

SELECT AVG(salary),department_id
FROM employees
GROUP BY department_id



#②将①和sal_grade两表连接查询

SELECT dep_ag.department_id,dep_ag.ag,g.grade
FROM sal_grade g
JOIN (

	SELECT AVG(salary) ag,department_id
	FROM employees
	GROUP BY department_id

) dep_ag ON dep_ag.ag BETWEEN g.min_salary AND g.max_salary;


#四、放在exists后面

#案例1 ：查询有无名字叫“张三丰”的员工信息
SELECT EXISTS(
	SELECT *
	FROM employees
	WHERE last_name = 'Abel'

) 有无Abel;


#案例2：查询没有女朋友的男神信息

USE girls;

SELECT bo.*
FROM boys bo
WHERE bo.`id` NOT IN(
	SELECT boyfriend_id
	FROM beauty b
)



SELECT bo.*
FROM boys bo
WHERE NOT EXISTS(
	SELECT boyfriend_id
	FROM beauty b
	WHERE bo.id = b.boyfriend_id
);
```