---
layout: post
title: Nodejs 基础 API
categories:
  - NodeJS
tags:
  - NodeJS
date: 2021-01-25 15:49:33
---

#### Buffer

```js
// 20个字节
const b1 = Buffer.alloc(20);

// 直接去一块连续内存，可能有没有回收的垃圾数据
const b2 = Buffer.allocUnsafe(20);

// 为什么是 31 而不是01， 因为uft8 编码下并不是1
const b3 = Buffer.from("1");

// 无法保存文字的信息, 数组中的每一个必须是16进制 8 或2
const b4 = Buffer.from([1, "维护"]);

// 两块内存不会相同，内存上是分开的
const b5 = Buffer.alloc(3);
const b6 = Buffer.from(b5);

// 填充

const b7 = Buffer.alloc(5);
//会把整个buffer填满，如果长度不够，会截断
//                       开始字节位置，结束字节位置
console.log(b7.fill("中", 1, 2));
console.log(b7.toString());

// 写入
const b8 = Buffer.alloc(5);
console.log(b8.write("中", 1, 4));

// toString 可以选择从哪一个字节下标开始解析

console.log(b7.toString("utf-8", 3, 6));

// slice 截取操作
const b9 = Buffer.from("为各位");
console.log(b9.slice());

// 查找可以指定从哪一位后面开始查找
console.log(b9.indexOf("为", 2));

// copy
const b10 = Buffer.from("为各位");

const b11 = Buffer.alloc(39);
// 开始结束位置
b10.copy(b11, 3, 6);

// concat

const b12 = Buffer.from("1");
const b13 = Buffer.from("2");
const b14 = Buffer.concat([b12, b13]);

// slice 方法已经被标记为过时，使用 subarray 从 Buffer 中截取一段数据
//                      start end
const b15 = b14.subarray(0，2);

// 判断
Buffer.isBuffer;

// 实现对 Buffer 的split
Buffer.prototype.split = function (sep) {
  const length = Buffer.from(sep).length;
  let ret = [];
  let start = 0;
  let offset = 0;
  while ((offset = this.indexOf(sep, start)) !== -1) {
    ret.push(this.subarray(start, offset).toString());
    start = offset + length;
  }
  ret.push(this.subarray(start).toString());
  return ret;
};

// 向buffer中写入数据
// value 必须是指定进制的整数
// offset从哪个字节开始写入
// LE 表示按小端字节序写入  1 => [01,00,00,00]
// LB 表示按大端字节序写入  1 => [00,00,00,01]
buf.writeInt32LE(value,offset);

// 从buffer中读取数据
// offset 表示从哪个位置开始读取
// 注意： 不能设置读取长度，他读取的长度是固定的，4个字节32位
buf.readInt32LE(offset)
```

#### Event Loop

Node.js 的事件循环基于 **libuv**，用于管理异步操作。事件循环分为多个阶段，每个阶段负责处理特定类型的回调。

**1. Timers 阶段**

- **作用**：处理由 `setTimeout()` 和 `setInterval()` 创建的回调。
- **行为**：
  - 检查到期的定时器，并执行其回调。
  - 如果没有到期的定时器，则直接跳到下一个阶段。

**2. I/O Callbacks 阶段**

- **作用**：处理几乎所有延迟的 I/O 回调（除了 `close` 事件、`setImmediate` 和定时器回调）。
- **行为**：
  - 处理如网络请求错误等 I/O 回调。
  - 较少用在用户代码中，因为大多数 I/O 会在 `Poll` 阶段完成。

**3. Idle, Prepare 阶段**

- **作用**：供内部使用，用于准备事件循环和一些内部操作。
- **行为**：
  - 通常不处理用户定义的回调。
  - 主要为 Node.js 引擎的内部运行服务。

**4. Poll 阶段**

- **作用**：处理新到达的 I/O 事件并执行相关回调。
- **行为**：
  - 如果没有到期的定时器，这个阶段会阻塞，等待新的 I/O 事件。
  - 如果有定时器到期，会直接跳到 `Timers` 阶段。

**5. Check 阶段**

- **作用**：执行 `setImmediate()` 的回调。
- **行为**：
  - 优先于下一次 `Poll` 阶段任务执行。
  - 在 `Poll` 阶段结束后立即执行。

**6. Close Callbacks 阶段**

- **作用**：处理关闭事件的回调。
- **行为**：
  - 例如处理 `socket.on('close')` 或 `fs.close()` 的回调。
  - 用于释放资源时执行相关任务。

**特殊任务：微任务队列（Microtask Queue）**

- 并不属于事件循环的某个阶段，而是会在每个阶段完成后执行。
- 包括以下两种任务：

  - `process.nextTick()` 回调。
  - `Promise` 的 `.then()`、`.catch()` 和 `.finally()`。

- 微任务优先于下一个事件循环阶段执行。
- 例如，在 `Timers` 阶段执行完所有回调后，会立即执行微任务队列中的任务。

```javascript
// setTimeout  setImmediate 执行时机并不确定
setTimeout(() => console.log("Timers"), 0);
setImmediate(() => console.log("Check"));
Promise.resolve().then(() => console.log("Microtask"));
process.nextTick(() => console.log("Next Tick"));

// 1. Next Tick
// 2. Microtask
// 3. Timers
// 4. Check
```

```js
fs.readFileSync(() => {
  setTimeout(() => console.log("Timers"), 0);
  // setImmediate 永远先执行，因为 fs队列是在poll中
  // 下一步会执行 check 队列中的 setImmediate
  setImmediate(() => console.log("Check"));
});
```

#### 模拟一个模块加载函数

```js
const path = require("path");
const fs = require("fs");
const vm = require("vm");

class Module {
  // 模块的导出对象，类似于 CommonJS 中的 `module.exports`
  exports = {};

  // 模块缓存，用于存储已加载的模块，避免重复加载
  static cache = {};

  // 文件扩展名及对应的加载器方法
  static extensions = {
    ".js": (module) => {
      // 读取 JavaScript 文件内容
      let content = fs.readFileSync(module.id, "utf-8");

      // 将文件内容包装成 CommonJS 模块的函数形式
      content = Module.wrap(content);

      // 将包装后的代码编译为可执行的函数
      const script = new vm.Script(content);
      const fn = script.runInThisContext();

      // 调用包装函数，将 `exports`、`require` 等注入到模块上下文
      fn(module.exports, myRequire, module, module.id, path.dirname(module.id));
    },
    ".json": (module) => {
      // 读取 JSON 文件内容
      const content = fs.readFileSync(module.id, "utf-8");

      // 将 JSON 内容解析为对象，并赋值给模块的 `exports`
      module.exports = JSON.parse(content);
    },
  };

  constructor(id) {
    // 模块的唯一标识符，通常为文件的绝对路径
    this.id = id;
  }

  // 包装模块代码，模拟 CommonJS 的运行环境
  static wrap(content) {
    return `(function(exports, require, module, __filename, __dirname) { ${content} })`;
  }

  // 解析文件名，包括支持自动添加扩展名
  static resolveFileName(filePath) {
    // 将文件路径转换为绝对路径
    const absolutePath = path.resolve(filePath);

    // 检查文件是否存在
    if (fs.existsSync(absolutePath)) {
      return absolutePath;
    }

    // 检查支持的文件扩展名
    for (const ext of Object.keys(Module.extensions)) {
      const fullPath = absolutePath + ext;
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }

    // 如果文件未找到，抛出错误
    throw new Error(`无法找到模块 '${filePath}'`);
  }

  // 加载模块，根据扩展名选择合适的加载器
  load() {
    const ext = path.extname(this.id); // 获取文件扩展名
    const loader = Module.extensions[ext]; // 根据扩展名找到对应的加载器

    if (loader) {
      loader(this); // 执行加载器
    } else {
      throw new Error(`不支持的文件扩展名 '${ext}'`);
    }
  }
}

// 自定义的 `require` 方法，用于加载模块
function myRequire(filePath) {
  // 解析文件名，确保获取的是有效路径
  const resolvedPath = Module.resolveFileName(filePath);

  // 如果模块已缓存，直接返回缓存中的 `exports`
  if (Module.cache[resolvedPath]) {
    return Module.cache[resolvedPath].exports;
  }

  // 创建一个新的模块实例
  const module = new Module(resolvedPath);

  // 将模块实例存入缓存
  Module.cache[resolvedPath] = module;

  // 加载模块内容
  module.load();

  // 返回模块的导出对象
  return module.exports;
}

// 示例：加载一个模块
const res = myRequire("./path");
```

#### 模拟一个 WriteStream

```js
const fs = require("fs");
const EventEmitter = require("events");

function createWriteStream(path, options = {}) {
  // 解构并设置默认参数
  const {
    flags = "w", // 文件打开模式（默认为写入模式）
    encoding = "utf8", // 默认编码
    autoClose = true, // 是否自动关闭文件描述符
    emitClose = true, // 是否在关闭时触发 "close" 事件
    start = 0, // 文件写入的起始位置
    highWaterMark = 16 * 1024, // 写入的高水位标记（默认 16KB）
  } = options;

  // 内部状态变量
  let offset = start; // 文件写入偏移量
  let written = 0; // 当前已写入的字节数
  let writing = false; // 是否正在写入
  let cache = []; // 缓存区，用于存储等待写入的数据

  // 定义一个可写流类
  class WriteStream extends EventEmitter {
    fd = null; // 文件描述符

    // 打开文件
    open() {
      fs.open(path, flags, (err, fd) => {
        if (err) {
          this.emit("error", err); // 打开文件失败，触发错误事件
          if (autoClose) {
            this.destroy(); // 发生错误时自动关闭
          }
          return;
        }
        this.fd = fd; // 保存文件描述符
        this.emit("open", fd); // 触发 open 事件
      });
    }

    // 写入数据
    write(chunk, encoding = "utf8", callback = () => {}) {
      const buffer = Buffer.isBuffer(chunk)
        ? chunk
        : Buffer.from(chunk, encoding);

      const canWrite = written < highWaterMark; // 判断当前写入是否超出高水位标记

      // writeStream 首次会直接写入数据，后面的数据会写入缓存
      if (writing) {
        // 如果正在写入，缓存数据并延迟写入
        cache.push({ buffer, callback });
      } else {
        writing = true;
        this._write(buffer, callback);
      }

      return canWrite; // 返回是否可以继续写入
    }

    // 实际写入操作
    _write(buffer, callback) {
      if (this.fd === null) {
        // 如果文件描述符尚未打开，等待 open 事件后再写入
        return this.once("open", () => this._write(buffer, callback));
      }

      fs.write(
        this.fd,
        buffer,
        0,
        buffer.length,
        offset,
        (err, bytesWritten) => {
          if (err) {
            this.emit("error", err); // 写入失败，触发错误事件
            if (autoClose) {
              this.destroy();
            }
            return;
          }

          offset += bytesWritten; // 更新写入偏移量
          written -= bytesWritten; // 更新已写入的字节数

          // 检查缓存区中是否还有待写入的数据
          const next = cache.shift();
          if (next) {
            this._write(next.buffer, next.callback);
          } else {
            writing = false; // 当前写入完成
            callback(); // 执行回调
            if (written < highWaterMark) {
              this.emit("drain"); // 缓存区清空，触发 drain 事件
            }
          }
        }
      );
    }

    // 销毁流（关闭文件描述符）
    destroy() {
      if (this.fd !== null) {
        fs.close(this.fd, (err) => {
          if (emitClose) {
            this.emit("close"); // 触发 close 事件
          }
        });
        this.fd = null;
      }
    }
  }

  // 创建流实例并打开文件
  const stream = new WriteStream();
  stream.open();

  return stream;
}

// 使用示例
const writeStream = createWriteStream("./package.txt");

// 监听事件
writeStream.on("open", (fd) => console.log("文件已打开，描述符:", fd));
writeStream.on("error", (err) => console.error("发生错误:", err));
writeStream.on("drain", () => console.log("缓存已清空，可以继续写入"));

// 写入数据
writeStream.write("Hello, World!", "utf-8", (err) => {
  if (err) console.error("写入失败:", err);
  else console.log("写入成功");
});

writeStream.write("Another line.", "utf-8", (err) => {
  if (err) console.error("写入失败:", err);
  else console.log("写入成功");
});
```

#### 模拟 TCP 粘包的解决方法

```js
// util.js
const Buffer = require("buffer").Buffer;

// 获取数据包长度
const getLength = (chunk) => {
  if (chunk.length < 12) return 0; // 不满足最小长度的包直接返回 0
  return 12 + chunk.readInt32LE(4); // 长度字段存储在偏移量为 4 的位置
};

// 编码消息为特定格式的 Buffer
const encode = (string, id = 1) => {
  const strBuffer = Buffer.from(string); // 将字符串转为 Buffer
  const headerBuffer = Buffer.allocUnsafe(12); // 创建 12 字节的头部
  headerBuffer.writeInt32LE(id, 0); // 写入消息 ID (4 字节)
  headerBuffer.writeInt32LE(strBuffer.length, 4); // 写入消息长度 (4 字节)
  return Buffer.concat([headerBuffer, strBuffer]); // 合并头部和消息
};

// 解码 Buffer 为字符串
const decode = (chunk) => {
  const bodyLength = chunk.readInt32LE(4); // 获取消息体的长度
  return chunk.subarray(12, 12 + bodyLength).toString(); // 提取消息体并转为字符串
};

module.exports = { getLength, encode, decode };
```

```js
// server.js
const net = require("net");
const { getLength, encode, decode } = require("./utils");

// 创建服务端
const server = net.createServer();

server.listen(8080, "127.0.0.1", () => {
  console.log("服务端启动，监听端口 8080");
});

server.on("connection", (socket) => {
  console.log("客户端连接成功");

  let unReadChunks = Buffer.alloc(0); // 存储未处理的缓冲区数据

  socket.on("data", (chunk) => {
    unReadChunks = Buffer.concat([unReadChunks, chunk]); // 拼接收到的数据
    let len;

    // 循环处理完整的数据包
    while ((len = getLength(unReadChunks))) {
      const cur = unReadChunks.subarray(0, len); // 提取当前完整数据包
      unReadChunks = unReadChunks.subarray(len); // 更新未处理数据

      // 解码消息，生成回复
      const response = encode(decode(cur) + " 服务端恢复", cur.readInt32LE(0));
      socket.write(response); // 发送回复消息
    }
  });

  socket.on("close", () => console.log("客户端连接关闭"));
  socket.on("error", (err) => console.error("服务端错误:", err));
});
```

```js
// client.js
const net = require("net");
const { getLength, encode, decode } = require("./utils");

// 创建客户端
const client = net.createConnection(8080, "127.0.0.1", () => {
  console.log("客户端连接成功");

  // 发送多条消息
  client.write(encode("消息1"));
  client.write(encode("消息2"));
  client.write(encode("消息3"));
  client.write(encode("消息4"));
  client.write(encode("消息5"));
});

let unReadChunks = Buffer.alloc(0); // 存储未处理的缓冲区数据

client.on("data", (chunk) => {
  unReadChunks = Buffer.concat([unReadChunks, chunk]); // 拼接收到的数据
  let len;

  // 循环处理完整的数据包
  while ((len = getLength(unReadChunks))) {
    const cur = unReadChunks.subarray(0, len); // 提取当前完整数据包
    unReadChunks = unReadChunks.subarray(len); // 更新未处理数据

    // 解码消息并输出
    console.log("收到服务端回复:", decode(cur));
  }
});

client.on("close", () => console.log("客户端连接关闭"));
client.on("error", (err) => console.error("客户端错误:", err));
```
