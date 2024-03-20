---
layout: posts
title: canvas 画板
date: 2023-01-31 21:51:37
categories:
  - JavaScript
tags:
  - canvas
---

#### 橡皮擦

依赖于 ctx.globalCompositeOperation 配置，有以下可选项

source-over（默认值）：新图形绘制在现有图形上方。
source-in：新图形仅在与现有图形重叠的区域内绘制。
source-out：新图形仅在与现有图形不重叠的区域内绘制。
source-atop：新图形绘制在现有图形上方，但只在它们重叠的区域内可见。
destination-over：新图形绘制在现有图形下方。
destination-in：现有图形仅保留与新图形重叠的部分。
destination-out：现有图形中与新图形不重叠的部分保留。
destination-atop：现有图形绘制在新图形上方，但只在它们重叠的区域内可见。
lighter：重叠区域的颜色通过加法混合。
copy：只有新图形可见，现有内容被清除。
xor：重叠区域变透明。

```js
ctx.globalCompositeOperation = "destination-out";
// 线宽影响橡皮擦大小
ctx.lineWidth = 10;
ctx.strokeStyle = "red";
ctx.lineTo(x, y);
ctx.stroke();
```

#### 使用 rfa 逐帧绘制

```ts
const queue = [];
const draw = () => {
  requestAnimationFrame(() => {
    let len = queue.length;
    for (var i = 0; i < len; i++) {
      const a = queue[i];
      ctx.lineTo(a[0], a[1]);
    }
    if (len) {
      ctx.stroke();
    }
    queue = [];
    if (mark) draw();
  });
};

canvas?.addEventListener("pointerdown", () => {
  mark = true;
  // 取整数减少浮点运算
  queue.push([
    Math.floor(e.clientX * window.devicePixelRatio),
    Math.floor(e.clientY * window.devicePixelRatio),
  ]);
  ctx.beginPath();
  draw();
});
```

#### 平滑曲线

使用贝塞尔曲线拟合

- 取 B C 中点 B1, A 为起点，B 为控制点，B1 为终点
- 取 C D 中点 C1, B1 为起点，C 为控制点，C1 为终点

![](001.png)

```js
let rfa = 0;
const draw = (index = 0) => {
  if (!index && rfa) return;
  rfa = requestAnimationFrame(() => {
    let len = queue.length;
    if (len && !index) {
      const a = queue[index];
      ctx.lineTo(a[0], a[1]);
      index++;
    }
    while (len >= 3 && index < len - 1) {
      const cur = queue[index];
      const next = queue[index + 1];
      const cx = (cur[0] + next[0]) >> 1;
      const cy = (cur[1] + next[1]) >> 1;
      ctx.quadraticCurveTo(cur[0], cur[1], cx, cy);
      index += 1;
    }

    if (len) {
      ctx.stroke();
    }
    if (mark) {
      draw(index);
    } else {
      rfa = 0;
    }
  });
};
```

#### 离屏 canvas 模拟粉笔效果

```ts
let queue: any[] = [];
const offScreen = new OffscreenCanvas(dimension.width, dimension.height);
const offCtx = offScreen.getContext("2d") as OffscreenCanvasRenderingContext2D;
offCtx.scale(width / dimension.width, height / dimension.height);
offCtx.strokeStyle = "red";
offCtx.lineWidth = 6;
offCtx.lineCap = "round";

const draw = () => {
  requestAnimationFrame(() => {
    let len = queue.length;
    offCtx.clearRect(0, 0, dimension.width, dimension.height);
    // 在清除画布之后必须使用 beginPath
    offCtx.beginPath();
    for (var i = 0; i < len; i++) {
      const a = queue[i];
      offCtx.lineTo(a[0], a[1]);
    }
    if (len) {
      offCtx.stroke();
    }

    for (let i = 1; i < len; i++) {
      const pre = queue[i - 1];
      const cur = queue[i];
      const length = Math.round(
        Math.sqrt(Math.pow(pre[0] - cur[0], 2) + Math.pow(pre[1] - cur[1], 2))
      );
      const xUnit = (cur[0] - pre[0]) / length;
      const yUnit = (cur[1] - pre[1]) / length;
      for (let i = 0; i < length; i++) {
        const xCurrent = pre[0] + i * xUnit;
        const yCurrent = pre[1] + i * yUnit;
        const xRandom = xCurrent + (Math.random() - 0.5) * 6 * 1.2;
        const yRandom = yCurrent + (Math.random() - 0.5) * 6 * 1.2;
        offCtx.clearRect(
          xRandom,
          yRandom,
          Math.random() * 2 + 2,
          Math.random() + 1
        );
      }
    }

    queue = [];

    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(offScreen, 0, 0, dimension.width, dimension.height);
    if (mark) draw();
  });
};
```
