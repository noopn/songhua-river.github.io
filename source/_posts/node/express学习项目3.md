---
layout: post
title: Express实践 ③ 项目部署
categories:
  - NodeJS
tags:
  - NodeJS
date: 2021-02-17 16:07:44
---

#### 统一的错误处理

http-errors 可以统一错误抛出，避免自定义错误对象。

```js
var E = require("http-errors");

throw new E.BadRequest(["报错了"]);
```

可以使用统一的错误处理函数

```js
module.exports = function errorHandle(res, err) {
  let status = 500;
  let message = [];

  if (err instanceof E.HttpError) {
    status = err.status;
    message = err.message;
  }

  res.status(status).json({
    status: false,
    errors: message,
  });
};
```

#### 腾讯 OSS 服务端上传

```js
// 引入模块
var COS = require("cos-nodejs-sdk-v5");
var crypto = require("crypto");
var multer = require("multer");
// 创建实例
var cos = new COS({
  SecretId: "xxx",
  SecretKey: "xxx",
});

// 存储桶名称，由bucketname-appid 组成，appid必须填入，可以在COS控制台查看存储桶名称。 https://console.cloud.tencent.com/cos5/bucket
var Bucket = "xxx-1255610650";
// 存储桶Region可以在COS控制台指定存储桶的概览页查看 https://console.cloud.tencent.com/cos5/bucket/
// 关于地域的详情见 https://cloud.tencent.com/document/product/436/6224
var Region = "ap-nanjing";

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 限制文件大小（10MB）
  fileFilter: (req, file, cb) => {
    // 可选：限制文件类型
    const allowedTypes = ["image/jpeg", "image/png"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("只允许上传 JPG/PNG 文件"));
    }
  },
});

const push = async (req, res) => {
  if (!req.file) {
    throw new E[400](["你没有选择文件"]);
  }

  const ext = req.file.originalname.split(".").pop();
  const fileName = `${crypto.randomBytes(64).toString("hex")}.${ext}`;

  return cos.putObject({
    Bucket,
    Region,
    Key: fileName, // 对象存储路径
    Body: req.file.buffer, // 文件内容（Buffer）
    ContentType: req.file.mimetype, // 文件类型
  });
};

module.exports = { middleware: upload.single("file"), push };
```

接口添加中间件

```js
const { middleware: uploadMiddleware } = require("./utils/upload");

app.use("/upload", uploadMiddleware, uploadRouter);
```

```js
router.post("/", async function (req, res, next) {
  try {
    if (!req.file) {
      throw new Error();
    }
    const result = await push(req);

    // 同时保存到数据库中
    // ...
    res.json(result);
  } catch (error) {
    res.errorHandle(error);
  }
});
```

#### 腾讯 OSS 客户端上传

需要先获取临时令牌,服务端提供接口, **allowPrefix allowActions 必填**

服务端可以把桶的名称，地区统一返回

```js
router.get("/sts", (req, res, next) => {
  var config = {
    secretId: "xxx", // 固定密钥
    secretKey: "xxx", // 固定密钥
    proxy: "",
    durationSeconds: 1800,
    // host: 'sts.tencentcloudapi.com', // 域名，非必须，默认为 sts.tencentcloudapi.com
    endpoint: "sts.tencentcloudapi.com", // 域名，非必须，与host二选一，默认为 sts.tencentcloudapi.com

    // 放行判断相关参数
    bucket: "node-learn-1255610650",
    region: "ap-nanjing",
    allowPrefix: "*",
    allowActions: [
      // 简单上传
      "name/cos:PutObject",
      // 分块上传
      "name/cos:InitiateMultipartUpload",
      "name/cos:ListMultipartUploads",
      "name/cos:ListParts",
      "name/cos:UploadPart",
      "name/cos:CompleteMultipartUpload",
    ],
  };

  var shortBucketName = config.bucket.substr(0, config.bucket.lastIndexOf("-"));
  var appId = config.bucket.substr(1 + config.bucket.lastIndexOf("-"));
  var policy = {
    version: "2.0",
    statement: [
      {
        action: config.allowActions,
        effect: "allow",
        principal: { qcs: ["*"] },
        resource: [
          "qcs::cos:" +
            config.region +
            ":uid/" +
            appId +
            ":prefix//" +
            appId +
            "/" +
            shortBucketName +
            "/" +
            config.allowPrefix,
        ],
        // condition生效条件，关于 condition 的详细设置规则和COS支持的condition类型可以参考https://cloud.tencent.com/document/product/436/71306
        // 'condition': {
        //   // 比如限定ip访问
        //   'ip_equal': {
        //     'qcs:ip': '10.121.2.10/24'
        //   }
        // }
      },
    ],
  };
  STS.getCredential(
    {
      secretId: config.secretId,
      secretKey: config.secretKey,
      proxy: config.proxy,
      durationSeconds: config.durationSeconds,
      endpoint: config.endpoint,
      policy: policy,
    },
    function (err, tempKeys) {
      res.json({
        ...tempKeys,
        bucket: "xxx-1255610650",
        region: "ap-nanjing",
      });
    }
  );
});
```

客户端调用

```js
fetch("/upload/sts")
  .then((res) => res.json())
  .then((res) => {
    const cos = new COS({
      SecretId: res.credentials.tmpSecretId, // sts服务下发的临时 secretId
      SecretKey: res.credentials.tmpSecretKey, // sts服务下发的临时 secretKey
      SecurityToken: res.credentials.sessionToken, // sts服务下发的临时 SessionToken
      StartTime: res.startTime, // 建议传入服务端时间，可避免客户端时间不准导致的签名错误
      ExpiredTime: res.expiredTime, // 临时密钥过期时间
    });
    cos.uploadFile(
      {
        Bucket: res.bucket,
        Region: res.region,
        Key: "xxx.txt",
        Body: document.getElementById("file").files[0], // 要上传的文件对象。
        onProgress: function (progressData) {
          console.log("上传进度：", progressData);
        },
      },
      function (err, data) {
        console.log("上传结束", err || data);
      }
    );
  });
```

#### redis

安装 redis 并提供一个简单的工具文件

```js
// redis-utils.js
const { createClient } = require("redis");

// 全局 Redis 客户端实例
let client = null;

/**
 * 初始化 Redis 客户端（单例模式）
 */
const initializeRedis = async () => {
  if (client?.isOpen) return;

  try {
    client = createClient({
      url: "redis://localhost:6379", // 默认连接地址
      // password: 'your_password',  // 如果需要密码验证
    });

    // 监听连接错误事件
    client.on("error", (err) => console.error("Redis connection error:", err));

    await client.connect();
    console.log("Redis client connected");
  } catch (err) {
    console.error("Failed to connect to Redis:", err);
    throw err;
  }
};

/**
 * 存储数据（支持对象/数组自动序列化）
 * @param {string} key - 存储键名
 * @param {object|array|string|number|boolean} value - 存储值
 * @param {number} [ttl] - 过期时间（秒），不传则永久保存
 */
const setKey = async (key, value, ttl) => {
  if (!client?.isOpen) await initializeRedis();

  try {
    const serializedValue =
      typeof value === "string" ? value : JSON.stringify(value);

    if (ttl) {
      await client.setEx(key, ttl, serializedValue);
    } else {
      await client.set(key, serializedValue);
    }
  } catch (err) {
    console.error(`Failed to set key "${key}":`, err);
    throw err;
  }
};

/**
 * 获取存储的数据（自动反序列化对象/数组）
 * @param {string} key - 要获取的键名
 * @returns {Promise<any>}
 */
const getKey = async (key) => {
  if (!client?.isOpen) await initializeRedis();

  try {
    const value = await client.get(key);
    if (!value) return null;

    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  } catch (err) {
    console.error(`Failed to get key "${key}":`, err);
    throw err;
  }
};

/**
 * 删除指定键
 * @param {string} key - 要删除的键名
 * @returns {Promise<boolean>}
 */
const deleteKey = async (key) => {
  if (!client?.isOpen) await initializeRedis();
  const result = await client.del(key);
  return result > 0;
};

const scanKeys = async (pattern, count = 100) => {
  if (!client?.isOpen) await initializeRedis();

  const foundKeys = [];
  let cursor = 0;

  do {
    const reply = await client.scan(cursor, { MATCH: pattern, COUNT: count });

    cursor = reply.cursor;
    foundKeys.push(...reply.keys);
  } while (cursor !== 0);

  return foundKeys;
};

/**
 * 关闭 Redis 连接
 */
const closeRedis = async () => {
  if (client?.isOpen) {
    await client.quit();
    console.log("Redis connection closed");
  }
};

module.exports = {
  initializeRedis,
  setKey,
  getKey,
  deleteKey,
  closeRedis,
};
```

安装 redis insight 客户端， 并通过 docker 启动 redis 服务

```js
version: '3.8' # 指定 Docker Compose 文件格式版本

services:
  redis:
    # 服务名称
    image: redis:7.4 # Redis 镜像版本（注意：Redis 官方镜像没有 7.4 版本，建议使用最新稳定版如 7.2）
    ports:
      - "6379:6379" # 端口映射（宿主机:容器）
    restart: unless-stopped # 容器自动重启策略

```

分页缓存策略,**使用 ： 拼接字段作为 key，冒号在 redis 中有特殊的意义，**

```js
const key = "article:math:1";
redis.setKey(key, value);

// 使用通配符查询所有key
const userKeys = await scanKeys("user:*");
```

#### 发送邮件

搜索 Google App Passwords 创建新密码

```js
const nodemailer = require("nodemailer");

const sendEmail = async () => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "fengaiqi000@gmail.com",
      pass: "创建的google账户免密",
    },
  });

  const mailOptions = {
    from: "fengaiqi000@gmail.com",
    to: "sunzhiqi@live.com",
    subject: "Test Email",
    text: "Hello, this is a test email sent using Nodemailer and OAuth2!",
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error);
    }
    console.log("Email sent: " + info.response);
  });
};

sendEmail().catch(console.error);
```

#### Rabbit MQ

常用于,发送电子邮件、发送短信、应用内通知、文件处理、数据分析与报告生成、订单处理、秒杀。

```js
// send.js
var amqplib = require("amqplib");
const url = `amqp://localhost`;
const QUEUE_NAME = "task1";
async function sendMessage(message) {
  let connection;
  try {
    connection = await amqplib.connect(url, {
      username: "node",
      password: "123456",
      port: "5672",
      vhost: "/",
    });
    console.log("✅ 成功连接到 RabbitMQ 服务器");

    // 2. 创建通道
    const channel = await connection.createChannel();
    console.log("🔄 通道已创建");

    // 3. 声明队列（如果不存在则创建）
    await channel.assertQueue(QUEUE_NAME, {
      durable: true, // 持久化队列（服务器重启后保留）
    });

    // 4. 发送消息
    const sent = channel.sendToQueue(
      QUEUE_NAME,
      Buffer.from(message),
      { persistent: true } // 消息持久化
    );

    if (sent) {
      console.log(`📤 消息已发送: ${message}`);
    } else {
      console.error("❌ 消息发送失败");
    }
  } catch (error) {
    console.error("🔥 发生错误:", error);
  } finally {
    // 5. 延迟500ms后关闭连接
    if (connection) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await connection.close();
      console.log("🚪 连接已关闭");
    }
    process.exit(0);
  }
}

// 执行发送
const message = process.argv[2] || "你好，RabbitMQ！";
sendMessage(message);
```

```js
// receiver.js
var amqplib = require("amqplib");

const QUEUE_NAME = "task1";

// 构造连接URL（处理密码特殊字符）
const url = `amqp://localhost`;

async function startConsumer() {
  let connection;
  try {
    // 1. 建立连接
    connection = await amqplib.connect(url, {
      username: "node",
      password: "123456",
      port: "5672",
      vhost: "/",
    });
    console.log("✅ 成功连接到 RabbitMQ 服务器");

    // 2. 创建通道
    const channel = await connection.createChannel();
    console.log("🔄 通道已创建");

    // 3. 声明队列（与发送端配置一致）
    await channel.assertQueue(QUEUE_NAME, {
      durable: true, // 必须与发送端队列声明一致
    });
    console.log(`📭 正在监听队列：${QUEUE_NAME}`);

    // 4. 设置消费参数
    channel.prefetch(1); // 每次只处理一个消息
    console.log("⏳ 等待消息中... (按 CTRL+C 退出)");

    // 5. 启动消费者
    channel.consume(
      QUEUE_NAME,
      async (msg) => {
        if (msg) {
          try {
            const content = msg.content.toString();
            console.log(`📥 收到消息: ${content}`);

            // 模拟业务处理（例如耗时操作）
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // 手动确认消息（确保 noAck: false）
            channel.ack(msg);
            console.log("✔️ 消息已确认");
          } catch (error) {
            console.error("⚠️ 消息处理失败:", error);
            channel.nack(msg); // 否定确认并重新入队
          }
        }
      },
      {
        noAck: false, // 关闭自动确认
      }
    );

    // 保持进程运行
    await new Promise(() => {});
  } catch (error) {
    console.error("🔥 发生错误:", error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.close();
      console.log("🚪 连接已关闭");
    }
  }
}

// 启动消费者
startConsumer();
```

#### 日志记录

创建一个日志表方便管理

```bash
npx sequelize model:generate --name Log --attributes level:string,message:string,meta:string,timestamp:date
```

修改对应的迁移文件

```js
"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Logs", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER.UNSIGNED,
      },
      level: {
        allowNull: false,
        type: Sequelize.STRING(16),
      },
      message: {
        allowNull: false,
        type: Sequelize.STRING(2048),
      },
      meta: {
        allowNull: false,
        type: Sequelize.STRING(2048),
      },
      timestamp: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("Logs");
  },
};
```

修改一下模型

```js
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Log extends Model {
    static associate(models) {}
  }

  Log.init(
    {
      level: DataTypes.STRING(16),
      message: DataTypes.STRING(2048),
      meta: {
        type: DataTypes.STRING,
        get() {
          // 转换报错信息
          try {
            return JSON.parse(this.getDataValue("meta"));
          } catch (error) {
            return this.getDataValue("meta");
          }
        },
      },
      timestamp: DataTypes.DATE,
    },
    {
      sequelize, // 使用传入的 Sequelize 实例
      modelName: "Log",
      timestamps: false, // 禁用自动生成 createdAt 和 updatedAt 字段
      tableName: "Logs", // 显式指定表名（可选）
    }
  );

  return Log;
};
```

创建日志工具文件

```js
// config/logger.js
const { createLogger, format, transports } = require("winston");
const MySQLTransport = require("winston-mysql").MySQLTransport;
const path = require("path");

// 根据环境变量加载数据库配置
const env = process.env.NODE_ENV || "development";
const dbConfig = require(path.join(__dirname, "../config/config.json"))[env];

// MySQL 传输配置
const mysqlTransportOptions = {
  host: dbConfig.host,
  user: dbConfig.username,
  password: dbConfig.password,
  database: dbConfig.database,
  table: "logs", // 存储日志的表名
  fields: {
    // 字段映射配置
    level: "level",
    meta: "meta",
    message: "message",
    timestamp: "timestamp",
    service: "service",
  },
};

// 创建日志记录器
const logger = createLogger({
  level: "info", // 默认日志级别
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.errors({ stack: true }), // 捕获错误堆栈
    format.json() // JSON 格式输出
  ),
  defaultMeta: { service: "clwy-api" }, // 全局元数据
  transports: [
    // MySQL 日志传输（生产环境使用）
    new MySQLTransport(mysqlTransportOptions),
  ],
});

// 开发环境添加控制台输出
if (env !== "production") {
  logger.add(
    new transports.Console({
      format: format.combine(
        format.colorize(), // 终端颜色输出
        format.printf((info) => {
          return `${info.timestamp} [${info.level}] ${info.message} ${
            info.stack || ""
          }`;
        })
      ),
    })
  );
}

module.exports = logger;
```
