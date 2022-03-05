---
title: 实现一个CLI工具
mathjax: true
categories:
  - DevOps
tags:
  - DevOps

date: 2021-09-14 13:08:51
---

#### CLI与GUI

CLI（Command Line Interface） 命令行接口, 在服务器端通常是没有可视化界面的，所有的操作都是在黑窗口的命令行中操作。

GUI（Graphical User Interface）图形用户界面接口， 通过可视化的界面， 可以避免CLI中的命令操作， 某些场景可以增加效率，减少学习成本， 例如 mysql-workbanch 提供的可视化数据库管理工具，或者是 GitHub for Desktop 一个基于 git 命令的 GUI 工具。

而 node 中的 CLI 工具就是通过命令行的方式，可以让我们快速根据交互中输入的配置初始化项目。或实现其他工具。

#### 必备npm包

+ [commander](https://github.com/tj/commander.js/blob/master/Readme_zh-CN.md) 完整的 node.js 命令行解决方案。

**option** 用于定义选项， **默认提供-h选项，可以查看命令行当前的命令提示**


```javascript
program
    // 通过 node xxx-cli.js -v 可以查看指定版本
	.version(require('../package').version, "-v, --version")

    // 可以修改首行的信息
    // 默认 Usage: sun-cra-cli [options] [command]
    // 修改为： sun-cra-cli [options-my] [command-my]
    .usage('<options-my> [command-my]')

    // 如果指定了-h 选项，默认-h 选项会被覆盖
    // .option('-h, --help', 'help information')
    .option('-s, --small', 'small pizza size')
    .option('-p, --pizza-type <type>', 'flavour of pizza')

    // 一定要放在参数处理的逻辑之前,否则不能执行
    program.parse(process.argv);

    // 获取选项执行其他的逻辑
    const options = program.opts();
    if (options.small) console.log('- small pizza size');
    if (options.pizzaType) console.log(`- ${options.pizzaType}`);
```

如果参数不全可以手动打印提示信息

```javascript
function help () {
  program.parse(process.argv)
  if (program.args.length < 1) return program.help()
}
help()
```

**command** 定义命令

当执行 `node xxx-cli.js` 会打印所有的提示信息

当执行 `node xxx-cli.js init` 会自动执行全局注册的 `xxx-cli-init.js`

```javascript
program
    .command('init', 'generate a new project from a template')
```

打印：

```
Usage: sun-cra-cli [options] [command]

Options:
  -h, --help      display help for command

Commands:
  init            generate a new project from a template
  help [command]  display help for command
```

也可以让命令有可选参数

```javascript
program
  // 如果想让命令带上参数，就不能把命令描述写在第二个参数上，要用description方法
  .command('init')
  .description('clone a repository into a newly created directory')
  // 两个都是必选参数
  .argument('<username>', 'user to login')
  .argument('<password>', 'password for user, if required')

  // 这时执行 `node xxx-cli.js init` 并不会自动执行init命令所对应的文件
  // 需要在action中处理执行逻辑
  .action((username, password) => {
    console.log('username:', username);
    console.log('password:', password);
  });

program.parse(process.argv);

```

+ [chalk](https://github.com/chalk/chalk) 一个可以让命令行带上颜色工具

+ [Inquirer](https://github.com/SBoudrias/Inquirer.js) 交互式命令行用户界面。可以收集用户的输入

+ [ora](https://www.npmjs.com/package/ora) 一个终端加载过度效果 

连续调用可以输出多行信息

```javascript
spinner.start('waiting')
spinner.succeed('successfully')
spinner.start('waiting')
spinner.succeed('successfully')

/**
✔ Initialization successful.
✔ Initialization successful.
*/
```

+ [boxen](https://www.npmjs.com/package/boxen) 可以在终端展示矩形框

#### 收集信息

```javascript
#!/usr/bin/env node
const { program } = require("commander");

/**
 * Usage: create-bigdata-frontend [options] <name>
 * name 项目名称 --ts 是否使用ts模板
 */
program
	.version(require('../package').version, "-v, --version") // 定义版本选项
	// .command('create [name]', 'create a project') // 定义命令+描述
	.arguments("<name>") // 定义命令参数
	.option("--ts", "using the typescript template") // 定义可提供的选项+描述: 是否使用ts
	.description("Create a project", { name: "Project name" }) // 描述+参数，描述
	.action((name, options, command) => { // 处理函数：(命令声明的所有参数, 选项, 命令对象自身)
		require("../lib/create.js")(name, options && options.ts);
	})
	.program.parse();

```


#### 初始化逻辑

```javascript
const CLIManager = require("./CLIManager");
module.exports = async (appName, ts) => {
  const cliM = new CLIManager({ appName });
  await cliM.downloadTemplate('https//:xxx.xxx.xxx/xx.git'); // 获取远程模板
  await cliM.writePackageJson(); // 修改package.json
  await cliM.rmGit(); // 移除原有.git信息
  await cliM.install(); // 安装依赖
};
```

#### CLIManager类

```javascript
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
module.exports = class CLIManager {
  constructor({ appName }) {
    this.appName = appName;
    // 获取当前命令执行是的目录
    this.cwd = process.cwd();
    this.targetDir = path.join(process.cwd(), appName);
  }

  // 执行命令
  run(command, options, cb) {
    exec(command, options, (error, stdout, stderr) => {
      if (error !== null) {
        console.log(chalk.red("X"), "exec error: " + error);
        return;
      }
      cb(stdout);
    });
  }

  // 拉取远程模板
  downloadTemplate(repositiry) {
    return new Promise((resolve, reject) => {
      exec(
        `git clone https://github.com/jquery/jquery.git ${this.appName}`,
        (error, stdout, stderr) => {
          if (error !== null) {
            spinner.fail(`Failed fetching remote git repo`);
            reject(error);
            return;
          }
          resolve(stdout);
        }
      );
    });
  }

  // 删除.git
  rmGit() {
    return new Promise((resolve) => {
      this.run("rm -rf .git", { cwd: this.targetDir }, (stdout) => {
        resolve(stdout);
      });
    });
  }

  // 安装依赖
  install() {
    return new Promise((resolve) => {
      this.run("npm ci", { cwd: this.targetDir }, (stdout) => {
        resolve(stdout);
      });
    });
  }
};
```