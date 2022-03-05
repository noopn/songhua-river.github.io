---
title: 'OpenGL,WebGL,ThreeJS是什么关系'
mathjax: true
categories:
  - ThreeJS
tags:
  - ThreeJS
  - 动画
  - 3D

date: 2021-09-18 14:57:16
---

#### OpenGL是什么

OpenGL（英语：Open Graphics Library，译名：开放图形库或者“开放式图形库”）是用于渲染2D、3D矢量图形的跨语言、跨平台的应用程序编程接口（API）。这个接口由近350个不同的函数调用组成，用来从简单的图形比特绘制复杂的三维景象。而另一种程序接口系统是仅用于Microsoft Windows上的Direct3D。OpenGL常用于CAD、虚拟现实、科学可视化程序和电子游戏开发。

OpenGL的高效实现（利用图形加速硬件）存在于Windows，部分UNIX平台和Mac OS。这些实现一般由显示设备厂商提供，而且非常依赖于该厂商提供的硬件。开放源代码库Mesa是一个纯基于软件的图形API，它的代码兼容于OpenGL。但是，由于许可证的原因，它只声称是一个“非常相似”的API。

OpenGL规范由1992年成立的OpenGL架构评审委员会（ARB）维护。ARB由一些对创建一个统一的、普遍可用的API特别感兴趣的公司组成。根据OpenGL官方网站，2002年6月的ARB投票成员包括3Dlabs、Apple Computer、ATI Technologies、Dell Computer、Evans & Sutherland、Hewlett-Packard、IBM、Intel、Matrox、NVIDIA、SGI和Sun Microsystems，Microsoft曾是创立成员之一，但已于2003年3月退出。

**设计**

OpenGL规范描述了绘制2D和3D图形的抽象API。尽管这些API可以完全通过软件实现，但它是为大部分或者全部使用硬件加速而设计的。

OpenGL的API定义了若干可被客户端程序调用的函数，以及一些具名整型常量（例如，常量GL_TEXTURE_2D对应的十进制整数为3553）。虽然这些函数的定义表面上类似于C编程语言，但它们是语言独立的。因此，OpenGL有许多语言绑定，**值得一提的包括：JavaScript绑定的WebGL（基于OpenGL ES 2.0在Web浏览器中的进行3D渲染的API）；C绑定的WGL、GLX和CGL；iOS提供的C绑定；Android提供的Java和C绑定。**

OpenGL不仅语言无关，而且平台无关。规范只字未提获得和管理OpenGL上下文相关的内容，而是将这些作为细节交给底层的窗口系统。出于同样的原因，OpenGL纯粹专注于渲染，而不提供输入、音频以及窗口相关的API。

OpenGL是一个不断进化的API。新版OpenGL规范会定期由Khronos Group发布，新版本通过扩展API来支持各种新功能。每个版本的细节由Khronos Group的成员一致决定，包括显卡厂商、操作系统设计人员以及类似Mozilla和谷歌的一般性科技公司。

除了核心API要求的功能之外，GPU供应商可以通过扩展的形式提供额外功能。扩展可能会引入新功能和新常量，并且可能放松或取消现有的OpenGL函数的限制。然后一个扩展就分成两部分发布：包含扩展函数原型的头文件和作为厂商的设备驱动。供应商使用扩展公开自定义的API而无需获得其他供应商或Khronos Group的支持，这大大增加了OpenGL的灵活性。OpenGL Registry负责所有扩展的收集和定义。

每个扩展都与一个简短的标识符关系，该标识符基于开发公司的名称。例如，英伟达（NVIDIA）的标识符是NV。如果多个供应商同意使用相同的API来实现相同的功能，那么就用EXT标志符。这种情况更进一步，Khronos Group的架构评审委员（Architecture Review Board，ARB）正式批准该扩展，那么这就被称为一个“标准扩展”，标识符使用ARB。第一个ARB扩展是GL_ARB_multitexture。

OpenGL每个新版本中引入的功能，特别是ARB和EXT类型的扩展，通常由数个被广泛实现的扩展功能组合而成。


#### WebGL是什么

WebGL是一种JavaScript API，用于在不使用插件的情况下在任何兼容的网页浏览器中呈现交互式2D和3D图形。WebGL完全集成到浏览器的所有网页标准中，可将影像处理和效果的GPU加速使用方式当做网页Canvas的一部分。WebGL元素可以加入其他HTML元素之中并与网页或网页背景的其他部分混合。WebGL程序由JavaScript编写的句柄和OpenGL Shading Language（GLSL）编写的着色器代码组成，该语言类似于C或C++，并在电脑的图形处理器（GPU）上运行。WebGL由非营利Khronos Group设计和维护。

WebGL 1.0基于OpenGL ES 2.0，并提供了3D图形的API。它使用HTML5 Canvas并允许利用文档对象模型接口。WebGL 2.0基于OpenGL ES 3.0，确保了提供许多选择性的WebGL 1.0扩展，并引入新的API。可利用部分Javascript实现自动存储器管理。

#### ThreeJS是什么

Three.js是一款webGL框架，由于其易用性被广泛应用。Three.js在WebGL的api接口基础上，又进行的一层封装。它是由居住在西班牙巴塞罗那的程序员Ricardo Cabbello Miguel开发的，此人更出名的网名叫做Mr.doob。Three.js以简单、直观的方式封装了3D图形编程中常用的对象。Three.js在开发中使用了很多图形引擎的高级技巧，极大地提高了性能。另外，由于内置了很多常用对象和极易上手的工具。

WebGL原生的api是一种非常低级的接口，而且还需要一些数学和图形学的相关技术。对于没有相关基础的人来说，入门真的很难，Three.js将入门的门槛降低了整整的一大截，对WebGL进行封装，简化我们创建三维动画场景的过程。

最简单的一句话概括：WebGL和Three.js的关系，相当于JavaScript和Jquery的关系。

**框架优点**

+ Three.js掩盖了3D渲染的细节：Three.js将WebGL原生API的细节抽象化，将3D场景拆解为网格、材质和光源(即它内置了图形编程常用的一些对象种类)。

+ 面向对象：开发者可以使用上层的JavaScript对象，而不是仅仅调用JavaScript函数。

+ 功能非常丰富：Three.js除了封装了WebGL原始API之外，Three.js还包含了许多实用的内置对象，可以方便地应用于游戏开发、动画制作、幻灯片制作、髙分辨率模型和一些特殊的视觉效果制作。

+ 速度很快：Three.js采用了3D图形最佳实践来保证在不失可用性的前提下，保持极高的性能。

+ 支持交互：WebGL本身并不提供拾取（picking)功能（即是否知道鼠标正处于某个物体上）。而Three.js则固化了拾取支持，这就使得你可以轻松为你的应用添加交互功能。

+ 包含数学库：Three.js拥有一个强大易用的数学库，你可以在其中进行矩阵、投影和矢量运算。

+ 内置文件格式支持：你可以使用流行的3D建模软件导出文本格式的文件，然后使用Three.js加载；也可以使用Three.js自己的JSON格式或二进制格式。

+ 扩展性很强：为Three.js添加新的特性或进行自定义优化是很容易的事情。如果你需要某个特殊的数据结构，那么只需要封装到Three.js即可。

+ 支持HTML5 canvas：Three.js不但支持WebGL，而且还支持使用Canvas2D、Css3D和SVG进行渲染。在未兼容WebGL的环境中可以回退到其它的解决方案。


**框架缺点**

Three.js不是游戏引擎，一些游戏相关的功能没有封装在里面，如果需要相关的功能需要进行二次开发。

#### 其他相关框架

**[Babylon.js](https://www.babylonjs.com/)**

Babylon.JS是最好的JavaScript3D游戏引擎，它能创建专业级三维游戏。主要以游戏开发和易用性为主。与Three.js之间的对比：

+ Three.js比较全面，而Babylon.js专注于游戏方面。

+ Babylon.js提供了对碰撞检测、场景重力、面向游戏的照相机，Three.js本身不自带，需要依靠引入插件实现。

+ 对于WebGL的封装，双方做的各有千秋，Three.js浅一些，好处是易于扩展，易于向更底层学习；Babylon.js深一些，好处是易用扩展难度大一些。

**[Cesium](https://cesium.com/)**

Cesium是国外一个基于JavaScript编写的使用WebGL的地图引擎，支持3D,2D,2.5D形式的地图展示，可以自行绘制图形，高亮区域。Cesium是一个地图引擎，专注于Gis，相关项目推荐使用它。

#### ThreeJS 目录结构

![](0001.png)

+ Build目录：包含两个文件，three.js 和three.min.js 。这是three.js最终被引用的文件。一个已经压缩，一个没有压缩的js文件,还包括ES6语法的模块化文件。

+ Docs目录：这里是three.js的帮助文档，里面是各个函数的api，可惜并没有详细的解释。试图用这些文档来学会three.js是不可能的。

+ Editor目录：一个类似3D-max的简单编辑程序，它能创建一些三维物体。

+ Examples目录：一些很有趣的例子demo，可惜没有文档介绍。对图像学理解不深入的同学，学习成本非常高。

+ Src目录：源代码目录，里面是所有源代码。

+ Test目录：一些测试代码，基本没用。

+ Utils目录：存放一些脚本，python文件的工具目录。例如将3D-Max格式的模型转换为three.js特有的json模型。

+ CONTRIBUTING.md文件：一个怎么报bug，怎么获得帮助的说明文档。

+ LICENSE文件：版权信息。

+ README.md文件：介绍three.js的一个文件，里面还包含了各个版本的更新内容列表。