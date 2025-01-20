---
layout: post
title: Express实践 ① 用 sequelize 实现 CRUD
categories:
  - NodeJS
tags:
  - NodeJS
date: 2021-02-03 16:40:10
---

#### 安装

初始化项目 [express-generator](https://github.com/expressjs/generator)

```bash
# --no-view 表示不生成视图文件
npx express-generator --no-view [项目名称]
```

安装 ORM 相关依赖,并初始化

```bash
npm install -D sequelize mysql2

# 初始化ORM
npx sequelize-cli init
```

修改 sequelize 配置文件

**所有的参数都需要使用字符串格式**

```json
// config/config.js

{
  "development": {
    "username": "用户名",
    "password": "密码",
    "port": "端口号",
    "database": "数据库名称",
    "host": "127.0.0.1",
    "dialect": "mysql",
    "timezone": "+8:00"
  }
}
```

#### 创建数据库

**字符集 utf8mb4**
utf8mb4 支持 Unicode 字符集中的所有字符，包括表情符号（emoji）。一些其他语言字符，utf8 字符集无法处理的字符。

**字符集排序规则 utf8mb4_general_ci **

是一种常见的 不区分大小写（case-insensitive, CI） 排序规则，ci 代表 Case Insensitive，即不区分字母的大小写。
它会将大写字母和小写字母视为相同的字符进行排序。例如，字母 a 和 A 会被视为相同，而在某些排序规则下它们可能会被视为不同。

utf8mb4_unicode_ci — 精确排序

适用场景：多语言支持、需要精确排序的应用。
优点：符合 Unicode 排序规则，处理复杂字符（如带有重音符号的字母）时表现更好，能够准确地处理所有 Unicode 字符，适用于全球多种语言的应用。
缺点：与 utf8mb4_general_ci 相比，性能略差一些，因为它会考虑更多的字符特性进行排序。

#### 创建模型

[Creating the first Model (and Migration)](https://sequelize.org/docs/v6/other-topics/migrations/#creating-the-first-model-and-migration), **模型的名字用单数命名，生成的表名是复数**

```bash
npx sequelize-cli model:generate --name User --attributes firstName:string,lastName:string,email:string
```

可以为模型添加校验条件 [Validations & Constraints](https://sequelize.org/docs/v6/core-concepts/validations-and-constraints/)

```js
// models\user.js

"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // define association here
    }
  }
  User.init(
    {
      email: DataTypes.STRING,
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "用户名不能为空",
          },
          notEmpty: {
            msg: "用户名不能为空",
          },
          async isUnique(value) {
            const user = await User.findOne({ where: { username: value } });
            if (user) {
              throw new Error("用户名已存在");
            }
          },
          len: {
            args: [2, 20],
            msg: "用户名长度在 2 到 20 之间",
          },
        },
      },
      password: DataTypes.STRING,
      nickname: DataTypes.STRING,
      sex: DataTypes.TINYINT,
      company: DataTypes.STRING,
      introduce: DataTypes.TEXT,
      role: DataTypes.TINYINT,
      avatar: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "User",
    }
  );
  return User;
};
```

还可以通过 mysql-workbench 创建 ER 图，**其中实线表示关联表没有自己的主键。**

**如果数据库不是在 Docker 环境，而是使用集成环境运行,迁移后表名可能是小写的，这会导致部署到服务器上之后 Mysql 严格区分大小写导致报错,可以在服务器上重新运行迁移**

对于已经存在的表，如果可以在模型中对表名做映射的配置

```js
class User extends Model {
  static associate(models) {
    models.User.belongsToMany(models.Course, {
      through: models.Like,
      // 指明特殊的外键字段
      foreignKey: "user_name",
      as: "likeCourses",
    });
  }
}
User.init(
  {
    user_name: DataTypes.STRING,
  },
  {
    sequelize,
    modelName: "User",
    //指定模型和表名的对应关系
    tableName: "user_table",
    // 不需要时间字段
    timestamps: false,
  }
);
```

#### 执行迁移文件

[Running Migrations](https://sequelize.org/docs/v6/other-topics/migrations/#running-migrations), **创建模型会自动生成迁移文件**,迁移文件需要按情况手动修改,修改字段类型，添加索引，等操作都是在迁移文件中完成的。

```js
// migrations\20250117092337-create-user.js

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    await queryInterface.createTable("Users", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER.UNSIGNED,
      },
      email: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      username: {
        allowNull: false,

        type: Sequelize.STRING,
      },
      password: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      nickname: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      sex: {
        type: Sequelize.TINYINT,
      },
      company: {
        type: Sequelize.STRING,
      },
      introduce: {
        type: Sequelize.TEXT,
      },
      role: {
        type: Sequelize.TINYINT,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    //添加索引
    await queryInterface.addIndex("Users", ["email"], {
      unique: true,
    });

    await queryInterface.addIndex("Users", ["username"], {
      unique: true,
    });
  },
  async down(queryInterface, Sequelize) {
    // 回滚
    await queryInterface.dropTable("Users");
  },
};
```

修改完成后，执行迁移文件，这会在数据库中创建真正的数据表。

```bash
npx sequelize-cli db:migrate
```

如果数据表已经存在数据可以使用一下命令回归，这会执行迁移文件中的 down 方法，删除数据表

```bash
npx sequelize-cli db:migrate:undo  --name [迁移文件名称]
```

**如果数据表数据有效不能删除，还需要对字段修改，就需要额外创建一个迁移文件, 并单独执行这个迁移文件, 并同步修改 model 文件新增或修改字段属性**

```bash
npx sequelize-cli migration:generate --name add-avatar-to-user

npx sequelize-cli db:migrate --name xxxx-add-avatar-to-user
```

#### 创建种子文件

[Creating the first Seed](https://sequelize.org/docs/v6/other-topics/migrations/#creating-the-first-seed) 用于快速生成初始化的测试数据。

**seed:all 会执行所有的种子文件，因此已经用 seed 初始化的表，还会再插入一遍数据**

**种子文件字段校验受到模型（索引字段），迁移文件（校验字段，类型）影响,需要注意字段是否匹配，否则命令执行可能报错**

```bash
npx sequelize-cli seed:generate --name demo-user
```

需要手动修改种子文件，添加新增数据和删除数据的方法

```js
// seeders\20250117101059-user.js

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("Users", [
      {
        email: "admin@live.com",
        username: "admin",
        password: "12345",
        nickname: "admin",
        sex: 1,
        role: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Users", null);
  },
};
```

#### 开发路由

- 在 router 文件夹下添加一个新的路由文件，并注册到 express 中

  ```js
  // app.js
  var app = express();
  var courseRouter = require("./routes/course");
  app.use("/course", courseRouter);
  ```

- 使用 [模糊查询](https://sequelize.org/docs/v6/core-concepts/model-querying-basics/#applying-where-clauses)

- 常用 [查询方法](https://sequelize.org/docs/v6/core-concepts/model-querying-basics/)

- 201 响应码表示请求成功，且修改或创建了资源

- 必须对用户提交的数据过滤，字段验证可以用模型实现，而且可以自定义异步方法，从数据库中查询校验

- 避免孤儿数据
  外键约束影响性能，一般不允许使用。
  删除关联数据有风险，有些关联数据是用户数据不能删除
  可以检测只有没有关联信息的数据才能被删除

- 查询 [关联字段](https://sequelize.org/docs/v6/advanced-association-concepts/creating-with-associations/)，文档只有语法，但是没有自动生成文件中如何添加的示例。

  在 model 文件中添加关联信息

  ```js
  // models\course.js

  const { Model } = require("sequelize");
  module.exports = (sequelize, DataTypes) => {
    class Course extends Model {
      static associate(models) {
        // as 关联字段的别名, 在路由中使用的代码也需要改
        models.Course.belongsTo(models.User, { as: "user" });
        models.Course.belongsTo(models.Category, { as: "category" });
      }
    }
    // ...
    return Course;
  };
  ```

  查询条件中需要添加关联字段

  ```js
  const condition = {
    // 排序字段
    order: [["id", "DESC"]],
    // 全局过滤 两个关联的外键
    attributes: {
      exclude: ["categoryId", "userId"],
    },
    include: [
      // as 关联字段别名，需要和model中的对应
      // attributes 用于过滤关联模型中的字段
      { model: User, as: "user", attributes: ["id", "username"] },
      { model: Category, as: "category", attributes: ["id", "name"] },
    ],
  };
  ```

- 路由代码如下， 可以优化统一的错误处理以及参数的解析

  ```js
  // routes\course.js

  var express = require("express");
  var router = express.Router();
  const { Course, User, Category } = require("../../models");
  const { Op } = require("sequelize");

  router.get("/", async function (req, res, next) {
    try {
      const condition = {
        order: [["id", "DESC"]],
        // 全局过滤 两个关联的外键
        attributes: {
          exclude: ["categoryId", "userId"],
        },
        include: [
          // as 关联字段别名，需要和model中的对应
          // attributes 用于过滤关联模型中的字段
          { model: User, as: "user", attributes: ["id", "username"] },
          { model: Category, as: "category", attributes: ["id", "name"] },
        ],
      };

      const page = req.query.page || 1;
      const pageSize = req.query.pageSize || 10;

      condition.limit = pageSize;
      condition.offset = (page - 1) * pageSize;

      if (req.query.title) {
        condition.where = {
          title: {
            [Op.like]: `%${req.query.title}%`,
          },
        };
      }

      const { count, rows } = await Course.findAndCountAll(condition);

      res.json({
        status: true,
        message: null,
        data: {
          course: rows,
          pagination: {
            total: count,
            page,
            pageSize,
          },
        },
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({
        status: false,
        message: err,
      });
    }
  });

  router.get("/:id", async function (req, res, next) {
    try {
      const { id } = req.params;
      const data = await Article.findByPk(id);

      if (data) {
        res.json({
          status: true,
          message: null,
          data,
        });
      } else {
        res.status(404).json({
          status: false,
        });
      }
    } catch {
      res.status(500).json({
        status: false,
      });
    }
  });

  router.post("/", async function (req, res, next) {
    try {
      const data = await Article.create(req.body);
      res.status(201).json({
        status: true,
      });
    } catch (err) {
      res.status(500).json({
        err: err,
      });
    }
  });

  router.delete("/:id", async function (req, res, next) {
    try {
      const data = await Article.destroy({
        where: {
          id: req.params.id,
        },
      });
      console.log(data);
      res.status(201).json({
        status: true,
      });
    } catch {
      res.status(500).json({
        status: false,
      });
    }
  });

  router.put("/:id", async function (req, res, next) {
    try {
      const count = await Article.count({
        where: { id: req.params.id },
      });
      if (count == 0) {
        res.status(404).json({
          status: false,
          message: "文章不存在",
        });
      } else {
        await Article.update(req.body, {
          where: { id: req.params.id },
        });
        res.status(201).json({
          status: true,
          message: "更新成功",
        });
      }
    } catch {
      res.status(500).json({
        status: false,
      });
    }
  });
  module.exports = router;
  ```
