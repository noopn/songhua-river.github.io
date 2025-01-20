---
layout: posts
title: Three.js 基础
mathjax: true
date: 2024-08-30 09:13:10
categories:
  - Three.js
tags:
  - Three.js
  - webGL
---

#### 模型类型

.fbx

FBX 是 FilmBoX 这套软件所使用的格式，后改称 Motionbuilder。因为 Motionbuilder 扮演的是动作制作的平台，所以在前端的 modeling 和后端的 rendering 也都有赖于其它软件的配合，所以 Motionbuilder 在档案的转换上自然下了一番功夫。

FBX 最大的用途是用在诸如在 Max、Maya、Softimage 等软件间进行模型、材质、动作和摄影机信息的互导，这样就可以发挥 Max 和 Maya 等软件的优势。可以说，FBX 方案是非常好的互导方案。

.glTF

glTF 是一种可以减少 3D 格式中与渲染无关的冗余数据并且在更加适合 OpenGL 簇加载的一种 3D 文件格式。glTF 的提出是源自于 3D 工业和媒体发展的过程中，对 3D 格式统一化的急迫需求。如果用一句话来描述：glTF 就是三维文件的 JPEG ，三维格式的 MP3。在没有 glTF 的时候，大家都要花很长的的时间来处理模型的载入。

很多的游戏引擎或者工控渲染引擎，都使用的是插件的方式来载入各种格式的模型。可是，各种格式的模型都包含了很多无关的信息。就 glTF 格式而言，虽然以前有很多 3D 格式，但是各种 3D 模型渲染程序都要处理很多种的格式。对于那些对载入格式不是那么重要的软件，可以显著减少代码量，所以也有人说，最大的受益者是那些对程序大小敏感的 3D Web 渲染引擎，只需要很少的代码就可以顺利地载入各种模型了。

此外，glTF 是对近二十年来各种 3D 格式的总结，使用最优的数据结构，来保证最大的兼容性以及可伸缩性。这就好比是本世纪初 xml 的提出。glTF 使用 json 格式进行描述，也可以编译成二进制的内容：bglTF。glTF 可以包括场景、摄像机、动画等，也可以包括网格、材质、纹理，甚至包括了渲染技术（technique）、着色器以及着色器程序。同时由于 json 格式的特点，它支持预留一般以及特定供应商的扩展。

.obj

OBJ 文件是 Alias|Wavefront 公司为它的一套基于工作站的 3D 建模和动画软件"Advanced Visualizer"开发的一种标准 3D 模型文件格式，很适合用于 3D 软件模型之间的互导。目前几乎所有知名的 3D 软件都支持 OBJ 文件的读写。OBJ 文件是一种文本文件，可以直接用写字板打开进行查看和编辑修改。

#### 物体 位移/缩放/旋转

```js
cube.position.x = 0;
cube.position.set(0, 0, 0);

cube.scale.y = 1;
cube.scale.set(0, 1, 0);

cube.rotate.z = Math.PI / 4;
cube.rotate.set(0, 0, Math.PI / 4);
```

一个物体的 `position/scale/rotate` 属性描述一个物体的 位置/缩放/旋转，当这个物体再世界坐标系中，那么他的 位移/缩放/旋转 相对于世界坐标系。

如果物体在另一个物体中，那么他的 位移/缩放/旋转 相对于父元素的位置。

```js
// 由于物体位置相对于父元素，因此cube在坐标原点
parentCube.add(cube);
parentCube.position.x = -3;
cube.position.x = 3;
```

#### 画布适应窗口的变化

```js
window.addEventListener("resize", () => {
  // 更新摄像头宽高比
  camera.aspect = window.innerWidth / window.innerHeight;
  // 更新摄像机的投影矩阵
  camera.updateProjectionMatrix();
  // 更新渲染器
  renderer.setSize(window.innerWidth, window.innerHeight);
});
```

#### 通过 GUI 快速调试参数

通过安装 `dat.gui` （不推荐）

```js
import * as dat from "dat.gui";
```

新方法是使用 `threejs` 自带的 GUI (推荐)

```js
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min";

const gui = new GUI();
const handle = {
  click: () => console.log("click"),
  fullscreen: () => console.log("fullscreen"),
};
// 添加两个按钮，点击和全屏
gui.add(handle, "click").name("点击");
gui.add(handle, "fullscreen").name("全屏");

//修改数值,最小值-10，最大值10，步长1
gui.add(cube.position, "x").name("x轴位置").min(-10).max(10).step(1);

//使用 folder 分组
let folder = gui.addFolder("按钮组");
folder.add(handle, "click").name("点击");
folder.add(handle, "fullscreen").name("全屏");

//事件
gui.add(handle, "click").onChange(noop).onFinishChange(noop);

//颜色
const colors = {
  cubeColor: "#ff0000",
};
gui
  .addColor(colors, "cubeColor")
  .name("颜色")
  .onChange(() => cube.material.color.set(val));
```

#### Geometry 几何体

##### 顶点/索引

threejs 中使用 `position` 中**类型化数组**描述顶点的位置信息。三个为一组，绘制时会将一组顶点绘制为一个三角形，复杂的几何体也是由多个三角形构成。

顶点的排列顺序(**绕序**)影响绘制的效果，逆时针 (Counter Clockwise, CCW) 排列的面视为正面， 顺时针排列视为反面。模型情况下，背面不会渲染以便提高性能。

Three.js 使用相机的视角和顶点位置之间的关系来判断一个面是正面还是反面。当从相机位置看时，顶点按照逆时针排列的面会被认为是正面；相反，顺时针排列的面会被认为是背面。顶点顺序的判断依赖于面法向量（normal vector）。法向量是垂直于面的一个矢量，它通过面顶点的排列顺序来决定。如果法向量指向相机方向，面被认为是正面，否则是反面。

```js
const position = new Float32Array([
  1, 1, 0, -1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0, -1, -1, 0,
]);
const geometry = new THREE.BufferGeometry();

const indices = new Uint16Array();
geometry.setAttribute("position", new THREE.BufferAttribute(position, 3));
const mesh = new THREE.Mesh(geometry, material);
```

但是查看 `position` 属性会发现有 6 个顶点，这时可以通过建立索引，共用顶点优化顶点数量。

```js
// 去除掉可以公用的顶点，
const position = new Float32Array([1, 1, 0, -1, -1, 0, 1, -1, 0, -1, 1, 0]);

// 使用索引来描述
const indices = new Uint16Array([0, 1, 2, 0, 3, 1]);
geometry.setIndex(new THREE.BufferAttribute(indices, 1));
```

##### 顶点分组

为几何体的顶点分组，可以为每个组设置单独的材质。

```js
geometry.addGroup(0, 3, 0); // 开始位置，数量，材质索引
geometry.addGroup(3, 3, 1);

const mesh = new THREE.Mesh(geometry, [material, material2]);
```

##### 顶点转换

对几何体的顶点操作（position, rotate, translate）通常是不推荐的，这会改变几何体原有的顶点信息（attribute.position）, 通常在物体（Mesh）上修改。

##### UV

UV 决定了 2D 纹理如何映射到 3D 空间中，U V 分别代表 2D 纹理的横纵坐标（为了与 3D 中的 X Y Z 坐标区分）。在模型建好之后会将纹理展开到 2D 平面中,这一过程叫做 UV 展开。常用的算法有投影展开法（Projection Mapping）,迭代展开法（Iterative Unwrapping）,Least Squares Conformal Mapping (LSCM) 和 Angle-Based Flattening (ABF) 等。

如果一个物体缺失 UV 信息，那么纹理将无法映射到物体表面。如果 UV 坐标没有覆盖（1，1）区域，剩余位置颜色会自动按 UV 坐标边缘采集。

##### 法线

法线是垂直与平面的向量，决定了光纤如何反射。

```js
// 法线辅助器
import { VertexNormalsHelper } from "three/examples/jsm/helpers/VertexNormalsHelper.js";
const geometry = new THREE.BufferGeometry();
// ...
// 自动计算法线
geometry.computeVertexNormals();
// ...
// 添加法线辅助器
const helper = new VertexNormalsHelper(mesh, 0.2, 0x00ff00);
scene.add(helper);
```

##### 包围盒

包围盒用于可视化的检视物体，或用于碰撞检测。

```js
fbxLoader.load(floorFbx, function (group) {
  // 通过名称或ID查找到模型中指定的物体
  const mesh = group.getObjectById(40);
  // const mesh =  group.getObjectByName('a23')

  // 由于物体的父级可能存在几何变化导致与物体的尺寸不同，因此需要更新物体的世界矩阵
  //                    更新父级， 更新子集
  mesh.updateWorldMatrix(true, true);

  // 需要手动调用几何体包围盒计算函数
  const geometry = mesh.geometry;
  geometry.computeBoundingBox();

  // 获取包围盒计算结果
  const box = geometry.boundingBox;

  // 使用世界矩阵更新包围盒
  box.applyMatrix4(mesh.matrixWorld);

  // 创建包围盒辅助器显示包围盒
  const boxHelper = new THREE.Box3Helper(box, 0xff0000);

  // 添加到场景中
  scene.add(boxHelper);
});
```

多个物体包围盒

```js
const mesh = group.getObjectById(40);
const mesh1 = group.getObjectById(41);
const mesh2 = group.getObjectById(42);

const boxUnion = new THREE.Box3();
[mesh, mesh1, mesh2].forEach((mesh) => {
  mesh.updateWorldMatrix(true, true);
  const geometry = mesh.geometry;
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  box.applyMatrix4(mesh.matrixWorld);
  const boxHelper = new THREE.Box3Helper(box, 0xff0000);
  scene.add(boxHelper);

  boxUnion.union(box);
});

const boxHelper = new THREE.Box3Helper(boxUnion, 0xff0000);
scene.add(boxHelper);
```

使用 setFromObject，自动计算和世界轴对齐的一个对象 Object3D （含其子对象）的包围盒，计算对象和子对象的世界坐标变换。

```js
const boxUnion = new THREE.Box3();
[mesh, mesh1, mesh2].forEach((mesh) => {
  const box = new THREE.Box3().setFromObject(mesh);
  const boxHelper = new THREE.Box3Helper(box, 0xff0000);
  scene.add(boxHelper);
  boxUnion.union(box);
});

const boxHelper = new THREE.Box3Helper(boxUnion, 0xff0000);
scene.add(boxHelper);
```

##### 几何体居中/获取中心

```js
// 会将几何体的中心放到世界中心
geometry.center();

// 但是Mesh对象可能有几何变换，导致物体看上去仍然偏移
// 需要重置Mesh的几何信息
mesh.position.set(0, 0, 0);

// 获取包围盒的中心点
const vec3 = box.getCenter(new THREE.Vector3());
```

#### 边缘几何体/线框几何体

```js
// 通过名称或ID查找到模型中指定的物体
const mesh = group.getObjectById(40);

const geometry = mesh.geometry;

// 创建边缘几何体
const edgeGeometry = new THREE.EdgesGeometry(geometry);

// 创建线框几何体
// const wireGeometry = new THREE.WireframeGeometry(geometry);

// 创建线段材质
const lineMaterial = new THREE.LineBasicMaterial({
  color: 0xffffff,
});

// 创建线段物体
const lineMesh = new THREE.LineSegments(edgeGeometry, lineMaterial);

// 由于新创建的物体丢失了源物体的世界矩阵信息，因此位置大小可能表现不同
// 需要使用源物体的世界矩阵信息重新赋值

// 更新源物体的世界矩阵信息
// mesh.updateWorldMatrix();

// 应用源物体的世界矩阵
lineMesh.matrix.copy(mesh.matrixWorld);

//将矩阵信息解构到物体的变换信息上
lineMesh.matrix.decompose(
  lineMesh.position,
  lineMesh.quaternion,
  lineMesh.scale
);
scene.add(lineMesh);
```

#### 材质与纹理

three.js 中的材质就是几何体表面的材料。所有材质均继承自 Material。ThreeJS 的材质分为：基础材质、深度材质、法向量材质、琥珀材质、冯氏材质、标准材质、着色器材质、基础线材质以及虚线材质。材质就像物体的皮肤，让几何体看起来像金属还是木板，是否透明，什么颜色。

纹理的基类是 Texture，通过给其属性 Image 传入一个图片从而构造出一个纹理。纹理是材质的属性，材质和几何体 Gemotry 构成 Mesh

##### 材质基类 Material

- transparent: 定义此材质是否透明,可以配合 opacity 使用，控制透明程度。

##### 纹理基类（Texture）

- colorSpace

  1.THREE.NoColorSpace: 这意味着没有应用任何特定的颜色空间，纹理的颜色数据会被原样使用。这个选项通常用于已经处于需要的颜色空间中的纹理，或者那些不依赖于颜色空间的特定用途。

  2.THREE.SRGBColorSpace:在此颜色空间中，颜色数据以 SRGB 格式存储。SRGB 是一个 RGB 标准，它试图将色彩的表现和人眼感知到的颜色更好地匹配。相对于线性颜色空间，SRGB 颜色空间在暗区提供了更多的颜色级别。使用此颜色空间时，需要注意图像的颜色可能会被转换为非线性的 SRGB 格式。

  3.THREE.LinearSRGBColorSpace 这也是一个以 SRGB 格式存储颜色数据的颜色空间，但颜色数据被当作线线性性数据处理。在进行计算和处理时，这种颜色空间可以提供更精确的结果。但是由于人眼对光线的感知，50%感觉的亮度只需要 18%的发光强度，这可能导致物体颜色过浅。

- needsUpdate 指定需要重新编译材质。如果动态设置纹理需要将此属性设置为`true`。

##### 基础材质 MeshBasicMaterial

- map: 颜色贴图。默认会随几何体的大小拉伸。 **开启 transparent 属性，会影响有透明通道图片的效果**。

##### MeshMatcapMaterial

由一个材质捕捉（MatCap，或光照球（Lit Sphere））纹理定义。mapcap 编码了光照，颜色等信息，因此不对光照做出反应。可以投射阴影，但是不会接受阴影。
是一个低成本实现光照效果得材质，缺点是固定了光照信息，不能对光照反应。

##### MeshLambertMaterial

该材质使用基于非物理的 Lambertian 模型来计算反射率。 这可以很好地模拟一些表面（例如未经处理的木材或石材），但不能模拟具有镜面高光的光泽表面（例如涂漆木材）

##### MeshPhongMaterial

该材质使用非物理的 Blinn-Phong 模型来计算反射率。可以模拟高光的或玻璃效果，但是由于不是物理模型，因此玻璃效果不能与场景中其他物体作用，只能通过透明度设置。

```js
// 实现玻璃效果，只限于与环境光线相互作用
// 加载环境贴图是必须的，映射模式需要修改为折射
envMap.mapping = THREE.EquirectangularRefractionMapping;
// scene.environment = envMap;
// scene.background = envMap;

const box = new THREE.BoxGeometry(1, 1, 1);
const bujianMatertal = new THREE.MeshPhongMaterial({
  refractionRatio: 0.7, // 空气的折射|反射率
  // 当设置为 THREE.EquirectangularRefractionMapping 值为折射系数
  // 越高越像玻璃
  reflectivity: 0.99,
  envMap: envMap,
});

const boxMesh = new THREE.Mesh(box, bujianMatertal);

// 必须要有环境光，与环境光相互作用
const light = new THREE.AmbientLight(0xffffff, 1);
scene.add(light);
```

#### FOG 雾

通常会把背景颜色和雾的颜色设置成相同颜色，可以让雾融入到场景中

#### 镭射光纤，选择物体

```js
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
window.addEventListener("pointermove", onPointerMove);
function onPointerMove(event) {
  // 将鼠标位置归一化为设备坐标。x 和 y 方向的取值范围是 (-1 to +1)
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function rayTest() {
  raycaster.setFromCamera(pointer, camera);

  const intersects = raycaster.intersectObjects(mesharr);
  if (intersects.length === mesharr.length) return;

  // intersects 是一个按深度排序的数组
  for (let i = 0; i < intersects.length; i++) {}
}

function animate() {
  rayTest();
  //...
}
```

#### 补间动画

THREE.js 集成了 [Tween](https://github.com/tweenjs/tween.js/blob/main/docs/user_guide_zh-CN.md) 动画库

```js
import { Tween, Easing } from "three/examples/jsm/libs/tween.module.js";

const tween = new Tween(mesh.position);
// 移动到某个位置
tween.to({ x: 2 }, 1000);
// 位置更新时回调
tween.onUpdate(() => {
  // console.log(mesh.position.x);
});
//重复次数
tween.repeat(10);
// 是否往返
tween.yoyo(true);
// 是否延迟
tween.delay(1000);

// 设置缓动
tween.easing(Easing.Bounce.In);
tween.start();

// 动画链
// tween.chain(tween2);
// tween2.chain(tween);

// 更新动画
function animate() {
  tween.update();
}
```
