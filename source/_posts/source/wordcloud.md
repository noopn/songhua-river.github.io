---
layout: posts
title: wordcloud2 源码分析
mathjax: true
date: 2022-04-27 13:36:43
categories:
  - 源码分析
  - 其他
tags:
  - wordcloud
---

[wordcloud2](https://github.com/timdream/wordcloud2.js) 是一个词云工具,根据文字的不同权重,铺满整个图形.

与 jquery 类似,通过立即执行函数,根据不同的模块化规范导出 WordCloud 方法

```ts
(() => {
  // ...

  // Expose the library as an AMD module
  if (typeof define === "function" && define.amd) {
    global.WordCloud = WordCloud;
    define("wordcloud", [], function () {
      return WordCloud;
    });
  } else if (typeof module !== "undefined" && module.exports) {
    module.exports = WordCloud;
  } else {
    global.WordCloud = WordCloud;
  }
})();
```

#### 事件设计

实现 setImmediate , 为了保证每次绘制一个单词,需要在每次绘制之后,重新调用绘制方法, 并传入下一个单词.

源码中使用 postMessage 事件模拟, 回比 `setTimeout(fn,0)` 执行时机提前一些,如果不支持则回退到 `setTimeout`

```ts
window.setImmediate = (function setupSetImmediate () {
    return window.msSetImmediate ||
    window.webkitSetImmediate ||
    window.mozSetImmediate ||
    window.oSetImmediate ||
    (function setupSetZeroTimeout () {
        if (!window.postMessage || !window.addEventListener) {
        return null
        }

        var callbacks = [undefined]
        var message = 'zero-timeout-message'

        // Like setTimeout, but only takes a function argument.  There's
        // no time argument (always zero) and no arguments (you have to
        // use a closure).
        var setZeroTimeout = function setZeroTimeout (callback) {
        var id = callbacks.length
        callbacks.push(callback)
        window.postMessage(message + id.toString(36), '*')

        return id
        }

        window.addEventListener('message', function setZeroTimeoutMessage (evt) {
        // Skipping checking event source, retarded IE confused this window
        // object with another in the presence of iframe
        if (typeof evt.data !== 'string' ||
            evt.data.substr(0, message.length) !== message/* ||
            evt.source !== window */) {
            return
        }

        evt.stopImmediatePropagation()

        var id = parseInt(evt.data.substr(message.length), 36)
        if (!callbacks[id]) {
            return
        }

        callbacks[id]()
        callbacks[id] = undefined
        }, true)

        /* specify clearImmediate() here since we need the scope */
        window.clearImmediate = function clearZeroTimeout (id) {
        if (!callbacks[id]) {
            return
        }

        callbacks[id] = undefined
        }

        return setZeroTimeout
    })()
```

list 是需要渲染词条的数组, 事件绑定在 canvas 元素上, 如果还有词条需要渲染就递归执行渲染方法. 超出长度或超时则停止执行.

```js
function start() {
  addEventListener("wordcloudstart", anotherWordCloudStart);
  timer[timerId] = loopingFunction(function loop() {
    if (i >= settings.list.length) {
      stoppingFunction(timer[timerId]);
      removeEventListener("wordcloudstart", anotherWordCloudStart);
      delete timer[timerId];
      return;
    }
    var drawn = putWord(settings.list[i]);

    if (exceedTime() || canceled) {
      stoppingFunction(timer[timerId]);
      removeEventListener("wordcloudstart", anotherWordCloudStart);
      delete timer[timerId];
      return;
    }
    i++;
    timer[timerId] = loopingFunction(loop, settings.wait);
  }, settings.wait);
}

start();
```

#### 源码设计

- 合并初始化和默认参数,判断元素合法性

- 定义默认图形的[函数表达式](http://www.wolframalpha.com),

  ```js
  switch (settings.shape) {
    case "cardioid":
      settings.shape = function shapeCardioid(theta) {
        return 1 - Math.sin(theta);
      };
  }

  // 如果不是极坐标表示的方式,需要自行转换 \
  // http://timdream.org/wordcloud2.js/shape-generator.html 用于生成图形坐标
  const shape = () => {
    const max = 1026;
    const leng = [
      290, 296, 299, 301, 305, 309, 311, 313, 315, 316, 318, 321, 325, 326, 327,
      328, 330, 330, 331, 334, 335, 338, 340, 343, 343, 343, 346, 349, 353, 356,
      360, 365, 378, 380, 381, 381,
    ];
    return leng[((theta / (2 * Math.PI)) * leng.length) | 0] / max;
  };
  ```

- 随机颜色方法 **randomHslColor**

  ```js
  function randomHslColor(min, max) {
    return (
      "hsl(" +
      (Math.random() * 360).toFixed() +
      "," +
      (Math.random() * 30 + 70).toFixed() +
      "%," +
      (Math.random() * (max - min) + min).toFixed() +
      "%)"
    );
  }
  ```

- 获取随机角度 **getRotateDeg**

  有几个变量可以控制这个值:

  `rotateRatio` 旋转角度的概率
  `maxRotation` 最大值 `Math.PI / 2`
  `minRotation` 最小值 `-Math.PI / 2`
  `rotationRange` 旋转角度区间默认在 `[-Math.PI / 2 , Math.PI / 2]`
  `rotationSteps` 固定递进旋转角度, 如果是 3 旋转角度只会是 `[-90deg,-30deg,30deg,90deg]`

  ```js
  function getRotateDeg() {
    // 最大角度和最小角度相同
    if (rotationRange === 0) {
      return minRotation;
    }
    // 概率以外不旋转
    if (Math.random() > settings.rotateRatio) {
      return 0;
    }
    //固定角度区随机值
    if (rotationSteps > 0) {
      return (
        minRotation +
        (Math.floor(Math.random() * rotationSteps) * rotationRange) /
          (rotationSteps - 1)
      );
    } else {
      return minRotation + Math.random() * rotationRange;
    }
  }
  ```

- 获取渲染相关数据 **getTextInfo**

  传入需要渲染的 词条,权重,旋转角度

  采用双缓存的方法,创建另一个不可见的 canvas 画布,将词条绘制在另一个画布上,将画布转成图片,并分析像素点信息,最终返回文字信息

  定义一个网格大小,将画布分成若干个格子,一旦一个有效像素点落在格子中,那么这个格子中的其他像素点无需在判断,从而优化性能

  ```js
  function getTextInfo() {
    // 根据权重计算字体大小 weightFactor 指定权重基数
    var fontSize = weight * weightFactor;
    // 不绘制
    if (fontSize <= settings.minSize) {
      return false;
    }
    var mu = 1;
    // 网格大小
    var g = settings.gridSize;
    // 创建新画布
    var fcanvas = document.createElement("canvas");

    // 绘制词条前获取词条的宽高
    var fw = fctx.measureText(word).width / mu;
    var fh =
      Math.max(
        fontSize * mu,
        fctx.measureText("m").width,
        fctx.measureText("\uFF37").width
      ) / mu;
    // 创建一个包围盒, 让他足够容纳文字
    var boxWidth = fw + fh * 2;
    var boxHeight = fh * 3;

    // 计算网格的长宽个数
    var fgw = Math.ceil(boxWidth / g);
    var fgh = Math.ceil(boxHeight / g);
    boxWidth = fgw * g;
    boxHeight = fgh * g;
    // 绘制文字时候的偏移量
    var fillTextOffsetX = -fw / 2;
    // 希腊字母在 0.4 高度的位置,视觉效果会在中间位置
    var fillTextOffsetY = -fh * 0.4;

    // 计算考虑到旋转角度后的盒子大小
    var cgh = Math.ceil(
      (boxWidth * Math.abs(Math.sin(rotateDeg)) +
        boxHeight * Math.abs(Math.cos(rotateDeg))) /
        g
    );
    var cgw = Math.ceil(
      (boxWidth * Math.abs(Math.cos(rotateDeg)) +
        boxHeight * Math.abs(Math.sin(rotateDeg))) /
        g
    );
    var width = cgw * g;
    var height = cgh * g;

    // 把文字绘制到临时画布上
    fctx.fillStyle = "#000";
    fctx.textBaseline = "middle";
    fctx.fillText(
      word,
      fillTextOffsetX * mu,
      (fillTextOffsetY + fontSize * 0.5) * mu
    );

    // 将画布转为 像素点

    var imageData = fctx.getImageData(0, 0, width, height).data;

    // 计算像素占据的网格
    var occupied = [];
    var gx = cgw;
    var gy, x, y;
    //  文字占据区域的网格坐标 [x1,x2,y1,y2]
    var bounds = [cgh / 2, cgw / 2, cgh / 2, cgw / 2];
    while (gx--) {
      gy = cgh;
      while (gy--) {
        y = g;
        singleGridLoop: while (y--) {
          x = g;
          while (x--) {
            if (imageData[((gy * g + y) * width + (gx * g + x)) * 4 + 3]) {
              // 如果像素点落在格子中则添加到数列中
              occupied.push([gx, gy]);

              if (gx < bounds[3]) {
                bounds[3] = gx;
              }
              if (gx > bounds[1]) {
                bounds[1] = gx;
              }
              if (gy < bounds[0]) {
                bounds[0] = gy;
              }
              if (gy > bounds[2]) {
                bounds[2] = gy;
              }

              break singleGridLoop;
            }
          }
        }
      }
    }
    return {
      mu: mu,
      occupied: occupied,
      bounds: bounds,
      gw: cgw,
      gh: cgh,
      fillTextOffsetX: fillTextOffsetX,
      fillTextOffsetY: fillTextOffsetY,
      fillTextWidth: fw,
      fillTextHeight: fh,
      fontSize: fontSize,
    };
  }
  ```

  ![](0001.png)
  ![](0002.png)

- 绘制策略

  现在有了文字包围盒的尺寸和坐标,需要利用这些信息将图形填充满

  首先拿到一个词条, 以中心点为圆心,这个中心点可能是用户自定义的中心点,所以不一定在图形的中心. 以指定的半径画圆 (也可能是其他图形的极坐标表达式产生的图形),在这个圆上平均取若干个采样点,半径越大采样点越多.

  从圆心开始,初始半径为 0,也就表示词条放在中心点. 下一个词条进来的时候,因为半径为 0 的圆上已经有了一个词条,所以扩大半径画圆,产生采样点,循环这些采样点,并检测词条是否发生碰撞.

  如果不能放下就继续循环采样点,如果所有采样点都不符合条件,则扩大半径重新读取采样点,重新遍历

  如果可以放下,则跳出所有循环,传入下一个词条,重复以上过程

- 计算绘制点

  最终绘制的过程,是以中心点为原点,指定半径长度画圆, 在圆周上平均取八个点作为绘制点,半径每增加一次,绘制点增加 8 个,其中半径的最大值是包围盒对角线的长度(当中心点在包围盒的一个顶点时)

  ```js
  // 绘制的中心点
  center = settings.origin
    ? [settings.origin[0] / g, settings.origin[1] / g]
    : [ngx / 2, ngy / 2];

  // 最大绘制半径,当中心点在包围盒的四个顶点时,绘制最大半径就是对角线的长度
  //
  maxRadius = Math.floor(Math.sqrt(ngx * ngx + ngy * ngy));

  var r = maxRadius + 1;

  while (r--) {
    // 获取不同半径圆周上的点的坐标
    var points = getPointsAtRadius(maxRadius - r);

    // 检查是否可以绘制
    var drawn = points.some(tryToPutWordAtPoint);

    if (drawn) {
      // leave putWord() and return true
      return true;
    }
  }

  var getPointsAtRadius = function getPointsAtRadius(radius) {
    // 采样点的个数随半径的增加增大
    var T = radius * 8;

    // Getting all the points at this radius
    var t = T;
    var points = [];

    // 半径为 0 时,词条放在中心点
    if (radius === 0) {
      points.push([center[0], center[1], 0]);
    }

    // 半径不为 0 时获取采样点的坐标,共有t个采样点
    while (t--) {
      var rx = 1;
      // 图形的数学表达式建立在极坐标系中, x 的取值范围 [0, 2*Math.PI] 值域为 [0,1]
      // 这个值会和半径相乘,得到半径的实际长度
      // 这个过程可以想象乘等比放大一个图形的过程,而在放大的过程中,图形上的采样点也越来越多
      if (settings.shape !== "circle") {
        rx = settings.shape((t / T) * 2 * Math.PI); // 0 to 1
      }

      // Push [x, y, t] t is used solely for getTextColor()
      points.push([
        center[0] + radius * rx * Math.cos((-t / T) * 2 * Math.PI),
        center[1] +
          radius * rx * Math.sin((-t / T) * 2 * Math.PI) * settings.ellipticity,
        (t / T) * 2 * Math.PI,
      ]);
    }

    pointsAtRadius[radius] = points;
    return points;
  };
  ```

- 碰撞检测

  ```js
  var tryToPutWordAtPoint = function (gxy) {
    // gxy [x1,y1] 采样点坐标

    // info.gw info.gh 旋转周的包围和宽度和高度
    // 将包围盒中心和采样点对其
    var gx = Math.floor(gxy[0] - info.gw / 2);
    var gy = Math.floor(gxy[1] - info.gh / 2);
    var gw = info.gw;
    var gh = info.gh;

    // occupied 所有包含有效像素的格子的坐标
    // ngx ngy 整个画布被分成的格子数
    // grid 所有格子的二维数组
    var canFitText = function canFitText(gx, gy, gw, gh, occupied) {
      var i = occupied.length;
      while (i--) {
        // 从偏移后的采样点位置,每次加上格子的坐标
        var px = gx + occupied[i][0];
        var py = gy + occupied[i][1];

        // 是否超出画布的情况
        if (px >= ngx || py >= ngy || px < 0 || py < 0) {
          if (!settings.drawOutOfBound) {
            return false;
          }
          continue;
        }

        // 只要有一个格子放不下就是重叠的情况直接跳出
        if (!grid[px][py]) {
          return false;
        }
      }
      return true;
    };
    // If we cannot fit the text at this position, return false
    // and go to the next position.
    if (!canFitText(gx, gy, gw, gh, info.occupied)) {
      return false;
    }

    // Actually put the text on the canvas
    drawText(
      gx,
      gy,
      info,
      word,
      weight,
      maxRadius - r,
      gxy[2],
      rotateDeg,
      attributes,
      extraDataArray
    );

    // Mark the spaces on the grid as filled
    updateGrid(gx, gy, gw, gh, info, item);
    // Return true so some() will stop and also return true.
    return true;
  };
  ```

#### 其他实现思路

填充过程可以使用 阿基米德螺线

```js
const points = []; // 所有放置点

let dxdy,
  maxDelta = Math.sqrt(size[0] * size[0] + size[1] * size[1]), // 最大半径
  t = 1, // 阿基米德弧度
  index = 0, // 当前位置序号
  dx, // x坐标
  dy; // y坐标

// 通过每次增加的步长固定为1，实际步长为 step * 1，来获取下一个放置点

while ((dxdy = getPosition((t += 1)))) {
  dx = dxdy[0];

  dy = dxdy[1];

  if (Math.min(Math.abs(dx), Math.abs(dy)) >= maxDelta) break; // (dx, dy)距离中心超过maxDelta，跳出螺旋返回false

  points.push([dx, dy, index++]);
}
```
