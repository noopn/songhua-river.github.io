---
layout: post
title: Express实践 ② 完善核心功能
categories:
  - NodeJS
tags:
  - NodeJS
date: 2021-02-10 10:03:12
---

#### 密码加密/校验

- 密码不可以明文存储，需要生成 hash,在模型文件中，可以使用 [Getters, Setters & Virtuals](https://sequelize.org/docs/v6/core-concepts/getters-setters-virtuals/) 方法并配合 [bcrypt 模块](https://github.com/kelektiv/node.bcrypt.js) 实现

  ```js
  // models\user.js

  const { Model, Op } = require("sequelize");
  const bcrypt = require("bcrypt");
  module.exports = (sequelize, DataTypes) => {
    class User extends Model {}
    User.init(
      {
        password: {
          type: DataTypes.STRING,
          set(value) {
            // 在设置值或更新值得时候会执行这个方法
            this.setDataValue("password", bcrypt.hashSync(value, 10));
          },
        },
      },
      {
        sequelize,
        modelName: "User",
      }
    );
    return User;
  };
  ```

- 密码校验，**模型校验方法只有设置或更新数据时触发，所以可以考虑将验证方法写在模型的类上，或是在路由中实现**

  ```js
  // routes\user.js
  // 路由中校验数据

  router.post("/login", async function (req, res, next) {
    try {
      const data = await User.findOne({
        where: {
          username: req.body.username,
          email: req.body.email,
        },
      });

      if (!bcrypt.compareSync(req.body.password, data.password)) {
        throw new Error("密码错误");

        res.status(401);
        return;
      }

      res.end();
    } catch (err) {}
  });
  ```

- 生成 jwt，用户保存用户的登录状态, 需要依赖 [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken)

  ```js
  // routes\user.js

  const bcrypt = require("bcrypt");
  const jwt = require("jsonwebtoken");

  router.post("/login", async function (req, res, next) {
    try {
      const data = await User.findOne({
        // ...
      });
      const token = jwt.sign(
        {
          data: "foobar",
        },
        process.env.SECRET,
        { expiresIn: "30d" }
      );
      res.end(token);
    } catch (err) {}
  });
  ```

- SECRET 通常作为环境变量，**且禁止提交到仓库**, 可以使用 crypto 生成随机密钥

  ```js
  crypto.randomBytes(64).toString("hex");
  ```

#### 中间件/校验 jwt

对接口的校验权限的校验不止一个，所以不会再每个路由文件中实现一边逻辑，这就是用到了 [**中间件**](https://expressjs.com/en/guide/using-middleware.html)

下面是一个路由级别的中间件，用于处理用户的 token 是否有效

```js
// middleware\auth.js

const jwt = require("jsonwebtoken");
const { User } = require("../models");

module.exports = async function (req, res, next) {
  try {
    const { token } = req.headers;
    if (!token) {
      throw new Error("用户未登录");
    }

    const { userId } = jwt.verify(token, process.env.SECRET);

    const user = await User.findByPk(userId);

    if (!user) throw new Error("用户不存在");

    if (user.role === "[some role]") throw new Error("用户权限错误");

    // 可以直接再路由的req上获取用户信息
    req.user = user;
    next();
  } catch (err) {
    // 客户端需要处理token失效的情况

    res.status(500).json({
      err: err.message,
    });
  }
};
```

#### 嵌套关联查询

上一章讲解了一对多的关联查询，但是关联字段中可能还需要关联另一张表，也就是嵌套关联查询

```js
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
        {
          model: Category,
          as: "category",
          attributes: ["id", "name"],

          // 通过嵌套 include 关联查询
          include: {
            model: Article,
            as: "article",
            attributes: ["id", "title"],
          },
        },
      ],
    };
    const page = req.query.page || 1;
    const pageSize = req.query.pageSize || 10;

    condition.limit = pageSize;
    condition.offset = (page - 1) * pageSize;

    const { count, rows } = await Course.findAndCountAll(condition);
    res.json(rows);
  } catch (err) {}
});
```

这会查出来如下嵌套的返回格式， 他们的关系是

- 一个课程数据多个用户，也属于多个分类。或者说一个用户有多个课程，一个分类包含多个课程。
- 一个分类属于多篇文章。或者说一个文章有多个分类。

```json
{
  "status": true,
  "message": null,
  "data": {
    "course": [
      {
        "id": 12,
        "name": "后端课程2",
        "image": "xxx",
        "recommended": true,
        "introductory": false,
        "content": "后端课程1,描述",
        "likesCount": 10,
        "chaptersCount": 10,
        "createdAt": "2025-01-17T12:48:54.000Z",
        "updatedAt": "2025-01-17T12:48:54.000Z",
        "user": {
          "id": 7,
          "username": "user1"
        },
        "category": {
          "id": 2,
          "name": "后端课程",
          "article": {
            "id": 16,
            "title": "标题100"
          }
        }
      }
      // ...剩余7条数据
    ],
    "pagination": {
      "total": 8,
      "page": 1,
      "pageSize": 10
    }
  }
}
```

但是其我们是以课程的视角去查询，用户，分类，以及文章都属于当前课程的附属属性，并不需要用层级关系去体现。会希望他们以同级的字段展示。这也是 sequelize 中 [Eager Loading vs Lazy Loading](https://sequelize.org/docs/v6/core-concepts/assocs/#fetching-associations---eager-loading-vs-lazy-loading) 的概念。

include 关联字段表示 Eager Loading, 会直接把数据返回。而 Lazy Loading 允许用方法调用的方式，选择哪些数据需要，而这种方式正好处理数据的层级问题。

**上面的 findAndCountAll 是无法使用 Lazy 关联查询的，因为它查询的是整个列表，必须明确用数据结构说面关联关系，并不是针对某个课程的关联查询**

下面是查询单独一个课程的关联信息， **需要查询出关联的字段**

```js
router.get("/:id", async function (req, res, next) {
  try {
    const condition = {
      order: [["id", "DESC"]],
      //  注意不要排除了关联 ID, 否则查询不到
      //   attributes: {
      //     exclude: ["categoryId", "userId"],
      //   },
    };

    const course = await Course.findByPk(req.params.id, condition);

    // 通过课程查询分类，注意要带上关联的 articleId
    const category = await course.getCategory({
      attributes: ["id", "name", "articleId"],
    });

    // 通过分类查询文章
    const article = await category.getArticle({
      attributes: ["id", "title"],
    });

    res.json({
      status: true,
      message: null,
      data: {
        course,
        category,
        article,
      },
    });
  } catch (err) {}
});
```

#### 多对多的查询

实现一个点赞的功能：

- 一个用户可以可以给多个课程点赞
- 一个课程也可以被多个用户点赞

虽然可以直接在用户表中储存点赞课程，但不是一个好的做法, 存在以下问题：

无法保证数据一致性：难以通过外键验证课程是否存在。
查询复杂：查找特定课程的所有学生需要额外的解析逻辑。
扩展性差：不适合大规模、多条件查询的场景。

最佳实践是使用中间表：

数据一致性：中间表中的外键可以确保关联数据的完整性。
灵活性：中间表允许添加额外的信息（如时间戳、状态等）。
查询效率：数据库的索引可以优化多对多查询性能。
扩展性：关系较复杂时，可以轻松扩展中间表的结构。

修改模型，通过点赞中间表建立课程表和用户之间的关系

```js
// models\user.js

class User extends Model {
  static associate(models) {
    models.User.belongsToMany(models.Course, {
      through: models.Like,
      as: "likeCourse",
    });
  }
}

// models\course.js
class User extends Model {
  static associate(models) {
    models.Course.belongsToMany(models.User, {
      through: models.Like,
      as: "courseWithUsers",
    });
  }
}
```

查询某个用户喜欢的课程， **如果使用 include 做查询在多对多的关系中无法实现分页,在 include 中无法对关联查询的数据分页，且模型中的 foreignKey 是必填的，否则会报错**

```js
router.get("/:id", async function (req, res, next) {
  try {
    // 获取user实例
    const user = await User.findByPk(req.params.id, {
      include: [
        {
          model: Course,
          as: "likeCourses",
          // 无法使用分页
          // limit: pageSize,
          // offset: (page - 1) * pageSize,
        },
      ],
    });

    res.json({
      //...
    });
  } catch (err) {}
});
```

所以可以使用 Lazy Loading 手动请求数据, 模型中提供了内置的方法，可以用于获取分页数据

另外需要控制 [不显示中间表的数据](https://sequelize.org/docs/v6/core-concepts/assocs/#foobelongstomanybar--through-baz-)

```js
router.get("/:id", async function (req, res, next) {
  try {
    const page = req.query.page || 1;
    const pageSize = req.query.pageSize || 10;

    const limit = pageSize;
    const offset = (page - 1) * pageSize;
    const user = await User.findByPk(req.params.id);

    // getLikeCourses 是模型内部映射的方法，通过 get + as别名 命名
    const course = await user.getLikeCourses({
      // 不显示中间表的数据
      joinTableAttributes: [],
      attributes: ["id", "name"],
      limit,
      offset,
    });

    // 另一个映射方法用于获取总条数
    const total = await user.countLikeCourses();

    res.json({
      //...
    });
  } catch (err) {}
});
```

#### 处理跨域

- nginx
- cors