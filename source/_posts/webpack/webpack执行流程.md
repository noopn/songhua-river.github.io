---
layout: posts
title: webpack执行流程
date: 2022-11-15 09:50:56
categories:
  - webpack
tags:
  - 工程化
  - webpack
---

### 主要流程

- 初始化阶段（Initialization）:

  解析配置：Webpack 开始处理配置文件（如 webpack.config.js），包括解析入口点、加载器、插件等。
  初始化插件：加载并初始化配置中指定的插件。
  环境准备：设置编译环境，例如选择开发模式或生产模式。

- 编译阶段（Compilation）:

  创建编译器：Webpack 创建一个编译器实例，它管理整个编译过程。
  创建编译对象：创建一个新的编译对象，它包含了此次编译的所有细节。
  读取记录：从之前的编译中读取记录（如果有），以优化编译。
  解析入口：根据配置的入口点，分析出所有依赖的模块。

- 构建阶段（Building）:

  加载模块：Webpack 递归地加载每个依赖模块，这可能涉及到使用不同的加载器处理不同类型的文件。
  模块转换：应用加载器和插件，转换模块内容（如 TS 转 JS，SASS 转 CSS）。
  构建依赖图：构建模块间的依赖关系图。

- 优化阶段（Optimization）:

  优化模块：应用各种优化策略，以减小最终资产的大小。
  代码分割：根据需要将代码分割成不同的块。
  树摇（Tree Shaking）：移除未使用的代码。

- 输出阶段（Output）:

  生成资产：根据依赖图，Webpack 将所有模块打包成
  少量的打包文件（资产），通常是一个或多个 JavaScript 文件、CSS 文件和其他静态资源文件。

- 输出资源：将生成的打包文件写入到文件系统中，通常是输出到指定的 dist 目录。

  完成阶段（Completion）:
  执行插件：执行各种插件的完成钩子，完成额外的任务或清理工作。
  输出结果：Webpack 提供编译过程的摘要和详情，如编译时间、打包后的文件大小等。
  监听模式：如果启用了监听模式（watch mode），Webpack 将保持活跃状态，并在源文件更改时重新编译。
  在这个过程中，Webpack 通过其强大的插件系统和加载器机制，提供了高度的可扩展性和灵活性，允许开发人员针对不同的需求和场景进行定制和优化。

### Initialization

#### cli.run

使用 commander 处理命令行参数

```js
// 重写异常退出
this.program.exitOverride(async((async) => {}));

// 监听选项 以及选项触发时的处理函数
this.program.option("--no-color", "Disable colors on console.");
this.program.on("option:no-color", function () {});

// 绑定处理函数
// 最终执行webpack
this.program.action(async () => {
  compiler = this.webpack(config.options);
});
```

#### 创建 compiler

> > node_modules\webpack\lib\webpack.js

```js
const createCompiler = (rawOptions) => {
  const options = getNormalizedWebpackOptions(rawOptions);
  applyWebpackOptionsBaseDefaults(options);
  const compiler = new Compiler(options);
  new NodeEnvironmentPlugin({
    infrastructureLogging: options.infrastructureLogging,
  }).apply(compiler);
  // 初始化所有的插件
  if (Array.isArray(options.plugins)) {
    for (const plugin of options.plugins) {
      if (typeof plugin === "function") {
        plugin.call(compiler, compiler);
      } else if (plugin) {
        plugin.apply(compiler);
      }
    }
  }
  applyWebpackOptionsDefaults(options);
  compiler.hooks.environment.call();
  compiler.hooks.afterEnvironment.call();

  // 注册内部依赖插件
  // ExternalsPlugin
  // ChunkPrefetchPreloadPlugin
  // ArrayPushCallbackChunkFormatPlugin
  // EnableChunkLoadingPlugin
  // JsonpChunkLoadingPlugin
  // ImportScriptsChunkLoadingPlugin
  // EnableWasmLoadingPlugin
  // CleanPlugin
  // JavascriptModulesPlugin
  // JsonModulesPlugin
  // AssetModulesPlugin
  // EntryOptionPlugin
  // EntryPlugin
  // RuntimePlugin
  // InferAsyncModulesPlugin
  // DataUriPlugin
  // FileUriPlugin
  // CompatibilityPlugin

  // HarmonyModulesPlugin
  // 模块解析和绑定：它帮助 Webpack 解析和绑定 ES6 模块的 import 和 export 语句，确保模块之间的依赖关系被正确处理。
  // 树摇（Tree Shaking）：这个插件支持树摇优化，即移除未使用的模块或模块部分，以减小最终打包文件的大小。这是通过静态分析 import 和 export 语句来实现的。
  // ES6 模块的原生支持：由于 ES6 模块是 JavaScript 语言的一部分，HarmonyModulesPlugin 提供了对这些模块的原生支持，无需转换为其他格式。
  // 代码分割和异步加载：插件支持基于 ES6 模块的代码分割和异步加载，这有助于提高大型应用的性能。
  // 与其他 Webpack 特性的集成：HarmonyModulesPlugin 与 Webpack 的其他功能（如模块热替换、代码压缩等）紧密集成。

  // InferAsyncModulesPlugin
  // DataUriPlugin
  // FileUriPlugin
  // CompatibilityPlugin
  // HarmonyModulesPlugin
  // AMDPlugin
  // RequireJsStuffPlugin
  // CommonJsPlugin
  // LoaderPlugin
  // NodeStuffPlugin
  // APIPlugin
  // ExportsInfoApiPlugin
  // WebpackIsIncludedPlugin
  // ConstPlugin
  // UseStrictPlugin
  // RequireIncludePlugin
  // RequireEnsurePlugin
  // RequireContextPlugin
  // ImportPlugin
  // ImportMetaContextPlugin
  // SystemPlugin
  // ImportMetaPlugin
  // URLPlugin
  // DefaultStatsFactoryPlugin
  // DefaultStatsPresetPlugin
  // DefaultStatsPrinterPlugin
  // JavascriptMetaInfoPlugin
  // EnsureChunkConditionsPlugin
  // RemoveEmptyChunksPlugin
  // MergeDuplicateChunksPlugin
  // FlagIncludedChunksPlugin
  // SideEffectsFlagPlugin
  // FlagDependencyExportsPlugin
  // FlagDependencyUsagePlugin
  // InnerGraphPlugin
  // MangleExportsPlugin
  // ModuleConcatenationPlugin
  // SplitChunksPlugin
  // RuntimeChunkPlugin
  // NoEmitOnErrorsPlugin
  // RealContentHashPlugin
  // WasmFinalizeExportsPlugin
  // DeterministicModuleIdsPlugin
  // DeterministicChunkIdsPlugin
  // DefinePlugin
  // SizeLimitsPlugin
  // TemplatedPathPlugin
  // RecordIdsPlugin
  // WarnCaseSensitiveModulesPlugin
  // AddManagedPathsPlugin
  // ResolverCachePlugin

  WorkerPlugin;
  new WebpackOptionsApply().process(options, compiler);
  compiler.hooks.initialize.call();
  return compiler;
};
```

#### compiler.run()

```js
this.hooks.beforeRun.callAsync(this, (err) => {
  this.hooks.run.callAsync(this, (err) => {
    this.readRecords((err) => {
      this.compile(onCompiled);
    });
  });
});
```
