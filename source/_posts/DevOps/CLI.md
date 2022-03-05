---
title: CLI
mathjax: true

date: 2020-12-20 14:51:27
categories:
  - DevOps
tags:
  - DevOps
---



##### 命令行工具 

基于文本查看，处理，操作计算机上面文件的程序

##### 开发环境

webpack 打包 编译 图片压缩 

##### 命令

vue <command> [options]

主命令 + 子命令 + 参数

init           generate a new project from a template
list           list available official templates
build          prototype a new project
create         (for v3 warning only)
help [cmd]     display help for [cmd]

通过用户的配置拉取远程的模板，来生成模板

`vue list` 查看模板的种类

Available official templates:
  ★  browserify - A full-featured Browserify + vueify setup with hot-reload, linting & unit testing.
  ★  browserify-simple - A simple Browserify + vueify setup for quick prototyping.
  ★  pwa - PWA template for vue-cli based on the webpack template
  ★  simple - The simplest possible Vue setup in a single HTML file
  ★  webpack - A full-featured Webpack + vue-loader setup with hot reload, linting, testing & css extraction.
  ★  webpack-simple - A simple Webpack + vue-loader setup for quick prototyping.

borwserify 是有另一种打包规范，用于处理使用CMD打包规范，引用的模块

##### 初始化

`vue help init` 查看初始化命令

Usage: vue-init <template-name> [project-name]

Options:
  -c, --clone  use git clone
  --offline    use cached template
  -h, --help   output usage information
  Examples:

    # create a new project with an official template
    $ vue init webpack my-project

    # create a new project straight from a github template
    $ vue init username/repo my-project

流程：

+ vue 输入命令 命令内部初始化
+ 获取用户配置：交互
+ 解析配置 基础配置+用户配置=配置
+ 生成项目文件 通过配置来拉取远程官方模板 + 自己写的模板
  自己写的模板必须包含 ：meta.js / json  
  prompts=>收集弹框信息
  helpers=>模板引擎的扩展
  complete=>钩子函数
  metalsmith=>站点生成器 通过配置和模板生成文件

  还必须包含模板文件：template
+ 完善工作

##### 包

+ [commander](https://github.com/tj/commander.js) 完整的 node.js 命令行解决方案

+ [Inquirer](https://github.com/SBoudrias/Inquirer.js) 弹窗交互

+ [chalk](https://github.com/chalk/chalk) 命令行美化工具

+ [ora](https://github.com/sindresorhus/ora) 命令行加载动画

+ [execa](https://github.com/sindresorhus/execa) 持续集成 提交到主分支

+ [lerna](https://github.com/lerna/lerna) 处理多包相互依赖

##### 目录

+ docs 文档

+ scripts 脚本

+ packages => lerna

+ lib 核心逻辑

+ package.json
    bin 放置用户自定义命令

    为什么没有全局安装的命令可以使用 npm run 来执行，但是不能直接调用？

    如果一个命令想要全局执行，需要添加到全局的环境变量 PATH 中

    在执 npm run 或者 yarn 的时候，会自动在node_modules中查找需要执行的文件，通过npm link 软连接，添加到全局的环境变量PATH中，在执行完成后再删除

    全局安装的命令，会安装在 `/usr/local/node12.18.4/lib/node_modules/`,执行的时候会自动link,和scripts中写的命令同理

    bin 文件夹下面的命令需要手动link,在入口文件改变时需要重新link

    所以写一个命令的步骤： 1）创建bin文件夹，添加文件 2） 文件头部添加 `#!/usr/bin/env node ` 表示可执行文件 3） link 到全局

##### vue-cli

**vue-list** 请求模板

```javascript
#!/usr/bin/env node

const logger = require('../lib/logger')
const request = require('request')
const chalk = require('chalk')

// 监听ctrl + c退出事件
process.on('exit', () => {
  console.log()
})

//请求模板使用到的包
// 如果没有报错，拼接包的名字 返回上面的列表
request({
  url: 'https://api.github.com/users/vuejs-templates/repos',
  headers: {
    'User-Agent': 'vue-cli'
  }
}, (err, res, body) => {
  if (err) logger.fatal(err)
  const requestBody = JSON.parse(body)
  if (Array.isArray(requestBody)) {
    console.log('  Available official templates:')
    console.log()
    requestBody.forEach(repo => {
      console.log(
        '  ' + chalk.yellow('★') +
        '  ' + chalk.blue(repo.name) +
        ' - ' + repo.description)
    })
  } else {
    console.error(requestBody.message)
  }
})

```

**vue-init**

```javascript
#!/usr/bin/env node

const download = require('download-git-repo')
const program = require('commander')
const exists = require('fs').existsSync
const path = require('path')
const ora = require('ora')
const home = require('user-home')
const tildify = require('tildify')
const chalk = require('chalk')
const inquirer = require('inquirer')
const rm = require('rimraf').sync
const logger = require('../lib/logger')
const generate = require('../lib/generate')
const checkVersion = require('../lib/check-version')
const warnings = require('../lib/warnings')
const localPath = require('../lib/local-path')

const isLocalPath = localPath.isLocalPath
const getTemplatePath = localPath.getTemplatePath

program
  .usage('<template-name> [project-name]')
  .option('-c, --clone', 'use git clone')
  .option('--offline', 'use cached template')

/**
 * Help.
 */

program.on('--help', () => {
  console.log('  Examples:')
  console.log()
  console.log(chalk.gray('    # create a new project with an official template'))
  console.log('    $ vue init webpack my-project')
  console.log()
  console.log(chalk.gray('    # create a new project straight from a github template'))
  console.log('    $ vue init username/repo my-project')
  console.log()
})

/**
 * Help.
 */

function help () {
  program.parse(process.argv)
  if (program.args.length < 1) return program.help()
}
help()

/**
 * Settings.
 */

let template = program.args[0]
const hasSlash = template.indexOf('/') > -1
const rawName = program.args[1]
const inPlace = !rawName || rawName === '.'
const name = inPlace ? path.relative('../', process.cwd()) : rawName
const to = path.resolve(rawName || '.')
const clone = program.clone || false

const tmp = path.join(home, '.vue-templates', template.replace(/[\/:]/g, '-'))
if (program.offline) {
  console.log(`> Use cached template at ${chalk.yellow(tildify(tmp))}`)
  template = tmp
}

/**
 * Padding.
 */

console.log()
process.on('exit', () => {
  console.log()
})

if (inPlace || exists(to)) {
  inquirer.prompt([{
    type: 'confirm',
    message: inPlace
      ? 'Generate project in current directory?'
      : 'Target directory exists. Continue?',
    name: 'ok'
  }]).then(answers => {
    if (answers.ok) {
      run()
    }
  }).catch(logger.fatal)
} else {
  run()
}

/**
 * Check, download and generate the project.
 */

function run () {
  // check if template is local
  if (isLocalPath(template)) {
    const templatePath = getTemplatePath(template)
    if (exists(templatePath)) {
      generate(name, templatePath, to, err => {
        if (err) logger.fatal(err)
        console.log()
        logger.success('Generated "%s".', name)
      })
    } else {
      logger.fatal('Local template "%s" not found.', template)
    }
  } else {
    checkVersion(() => {
      if (!hasSlash) {
        // use official templates
        const officialTemplate = 'vuejs-templates/' + template
        if (template.indexOf('#') !== -1) {
          downloadAndGenerate(officialTemplate)
        } else {
          if (template.indexOf('-2.0') !== -1) {
            warnings.v2SuffixTemplatesDeprecated(template, inPlace ? '' : name)
            return
          }

          // warnings.v2BranchIsNowDefault(template, inPlace ? '' : name)
          downloadAndGenerate(officialTemplate)
        }
      } else {
        downloadAndGenerate(template)
      }
    })
  }
}

/**
 * Download a generate from a template repo.
 *
 * @param {String} template
 */

function downloadAndGenerate (template) {
  const spinner = ora('downloading template')
  spinner.start()
  // Remove if local template exists
  if (exists(tmp)) rm(tmp)
  download(template, tmp, { clone }, err => {
    spinner.stop()
    if (err) logger.fatal('Failed to download repo ' + template + ': ' + err.message.trim())
    generate(name, tmp, to, err => {
      if (err) logger.fatal(err)
      console.log()
      logger.success('Generated "%s".', name)
    })
  })
}

```