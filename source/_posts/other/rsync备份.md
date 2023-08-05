---
layout: posts
title: inotify + rsync 实现数据本地实时备份
date: 2022-03-04 22:06:48
categories: 
- 其他
tags:
- Ubuntu
- rsync
- inotify
---

#### 实现过程

用 `inotify` 工具监听文件改变，将改变的文件使用 `rsync` 同步

#### inotify介绍

inotify 是一种强大的、细粒度的、异步文件系统监控机制，它满足各种各样的文件监控需要，可以监控文件系统的访问属性、读写属性、权限属性、创建删除、移动等操作，也可以监控文件发生的一切变化。

inotify-tools 是一个C库和一组命令行的工作提供Linux下inotify的简单接口。

inotify-tools 中包含 inotifywait 和 inotifywatch 两个命令

inotifywatch 命令用于收集关于被监控的文件系统的统计数据，包括每个inotify事件发生多少次。

```bash
[root@backup ~]# inotifywait --help
inotifywait 3.14
Wait for a particular event on a file or set of files.
Usage: inotifywait [ options ] file1 [ file2 ] [ file3 ] [ ... ]
Options:
    -h|--help         Show this help text.
    @<file>           Exclude the specified file from being watched.
    --exclude <pattern>
                      Exclude all events on files matching the
                      extended regular expression <pattern>.指定排除部分文件
    --excludei <pattern>
                      Like --exclude but case insensitive.（同上，排除且忽略大小写）
    -m|--monitor      Keep listening for events forever.  Without
                      this option, inotifywait will exit after one
                      event is received.(持续监听）
    -d|--daemon       Same as --monitor, except run in the background
                      logging events to a file specified by --outfile.
                      Implies --syslog.（daemon模式）
    -r|--recursive    Watch directories recursively.（递归子目录）
    --fromfile <file>
                      Read files to watch from <file> or '-' for stdin.
    -o|--outfile <file>
                      Print events to <file> rather than stdout. （将事件输出到文件，而不是屏幕）
    -s|--syslog       Send errors to syslog rather than stderr.
    -q|--quiet        Print less (only print events).（打印事件）
    -qq               Print nothing (not even events).（不打印事件）
    --format <fmt>    Print using a specified printf-like format
                      string; read the man page for more details. (设置打印格式%T时间；%w触发事件文件所在绝对路径；%f触发事件文件名称；%e触发的事件名称；)
    --timefmt <fmt>    strftime-compatible format string for use with
                      %T in --format string.（指定输出内容，相当于将时间赋值给%T）
    -c|--csv          Print events in CSV format.
    -t|--timeout <seconds>
                      When listening for a single event, time out after
                      waiting for an event for <seconds> seconds.
                      If <seconds> is 0, inotifywait will never time out.
    -e|--event <event1> [ -e|--event <event2> ... ]
        Listen for specific event(s).  If omitted, all events are 
        listened for.（指定要监听的事件，多个事件用逗号隔开）

Exit status:
    0  -  An event you asked to watch for was received.
    1  -  An event you did not ask to watch for was received
          (usually delete_self or unmount), or some error occurred.
    2  -  The --timeout option was given and no events occurred
          in the specified interval of time.

Events:     （事件）
    access        file or directory contents were read
    modify        file or directory contents were written
    attrib        file or directory attributes changed
    close_write    file or directory closed, after being opened in
                   writeable mode
    close_nowrite    file or directory closed, after being opened in
                   read-only mode
    close        file or directory closed, regardless of read/write mode
    open        file or directory opened
    moved_to    file or directory moved to watched directory
    moved_from    file or directory moved from watched directory
    move        file or directory moved to or from watched directory
    create        file or directory created within watched directory
    delete        file or directory deleted within watched directory
    delete_self    file or directory was deleted
    unmount        file system containing file or directory unmounted
```

**示例** 监听/backup/目录下所有文件和目录的增删改操作

```bash
inotifywait -mrq -e 'create,delete,close_write,attrib,moved_to' --timefmt '%Y-%m-%d %H:%M' --format '%T %w%f %e' /backup/
```

#### rsync介绍

rsync是可以实现增量备份的工具。配合任务计划，rsync能实现定时或间隔同步，配合inotify或sersync，可以实现触发式的实时同步。

Rsync的命令格式可以为以下六种：

```bash
rsync [OPTION]... SRC DEST
rsync [OPTION]... SRC [USER@]HOST:DEST
rsync [OPTION]... [USER@]HOST:SRC DEST
rsync [OPTION]... [USER@]HOST::SRC DEST
rsync [OPTION]... SRC [USER@]HOST::DEST
rsync [OPTION]... rsync://[USER@]HOST[:PORT]/SRC [DEST]
```

对应于以上六种命令格式，rsync有六种不同的工作模式：

　　1)拷贝本地文件。当SRC和DES路径信息都不包含有单个冒号”:”分隔符时就启动这种工作模式。如：rsync -a /data /backup

　　2)使用一个远程shell程序(如rsh、ssh)来实现将本地机器的内容拷贝到远程机器。当DST路径地址包含单个冒号”:”分隔符时启动该模式。如：rsync -avz *.c foo:src

　　3)使用一个远程shell程序(如rsh、ssh)来实现将远程机器的内容拷贝到本地机器。当SRC地址路径包含单个冒号”:”分隔符时启动该模式。如：rsync -avz foo:src/bar /data

　　4)从远程rsync服务器中拷贝文件到本地机。当SRC路径信息包含”::”分隔符时启动该模式。如：rsync -av root@172.16.78.192::www /databack

　　5)从本地机器拷贝文件到远程rsync服务器中。当DST路径信息包含”::”分隔符时启动该模式。如：rsync -av /databack root@172.16.78.192::www

　　6)列远程机的文件列表。这类似于rsync传输，不过只要在命令中省略掉本地机信息即可。如：rsync -v rsync://172.16.78.192/www

rsync参数的具体解释如下：

```bash
-v, --verbose 详细模式输出
-q, --quiet 精简输出模式
-c, --checksum 打开校验开关，强制对文件传输进行校验
-a, --archive 归档模式，表示以递归方式传输文件，并保持所有文件属性，等于-rlptgoD
-r, --recursive 对子目录以递归模式处理
-R, --relative 使用相对路径信息
-b, --backup 创建备份，也就是对于目的已经存在有同样的文件名时，将老的文件重新命名为~filename。可以使用--suffix选项来指定不同的备份文件前缀。
--backup-dir 将备份文件(如~filename)存放在在目录下。
-suffix=SUFFIX 定义备份文件前缀
-u, --update 仅仅进行更新，也就是跳过所有已经存在于DST，并且文件时间晚于要备份的文件。(不覆盖更新的文件)
-l, --links 保留软链结
-L, --copy-links 想对待常规文件一样处理软链结
--copy-unsafe-links 仅仅拷贝指向SRC路径目录树以外的链结
--safe-links 忽略指向SRC路径目录树以外的链结
-H, --hard-links 保留硬链结
-p, --perms 保持文件权限
-o, --owner 保持文件属主信息
-g, --group 保持文件属组信息
-D, --devices 保持设备文件信息
-t, --times 保持文件时间信息
-S, --sparse 对稀疏文件进行特殊处理以节省DST的空间
-n, --dry-run现实哪些文件将被传输
-W, --whole-file 拷贝文件，不进行增量检测
-x, --one-file-system 不要跨越文件系统边界
-B, --block-size=SIZE 检验算法使用的块尺寸，默认是700字节
-e, --rsh=COMMAND 指定使用rsh、ssh方式进行数据同步
--rsync-path=PATH 指定远程服务器上的rsync命令所在路径信息
-C, --cvs-exclude 使用和CVS一样的方法自动忽略文件，用来排除那些不希望传输的文件
--existing 仅仅更新那些已经存在于DST的文件，而不备份那些新创建的文件
--delete 删除那些DST中SRC没有的文件
--delete-excluded 同样删除接收端那些被该选项指定排除的文件
--delete-after 传输结束以后再删除
--ignore-errors 及时出现IO错误也进行删除
--max-delete=NUM 最多删除NUM个文件
--partial 保留那些因故没有完全传输的文件，以是加快随后的再次传输
--force 强制删除目录，即使不为空
--numeric-ids 不将数字的用户和组ID匹配为用户名和组名
--timeout=TIME IP超时时间，单位为秒
-I, --ignore-times 不跳过那些有同样的时间和长度的文件
--size-only 当决定是否要备份文件时，仅仅察看文件大小而不考虑文件时间
--modify-window=NUM 决定文件是否时间相同时使用的时间戳窗口，默认为0
-T --temp-dir=DIR 在DIR中创建临时文件
--compare-dest=DIR 同样比较DIR中的文件来决定是否需要备份
-P 等同于 --partial
--progress 显示备份过程
-z, --compress 对备份的文件在传输时进行压缩处理
--exclude=PATTERN 指定排除不需要传输的文件模式
--include=PATTERN 指定不排除而需要传输的文件模式
--exclude-from=FILE 排除FILE中指定模式的文件
--include-from=FILE 不排除FILE指定模式匹配的文件
--version 打印版本信息
--address 绑定到特定的地址
--config=FILE 指定其他的配置文件，不使用默认的rsyncd.conf文件
--port=PORT 指定其他的rsync服务端口
--blocking-io 对远程shell使用阻塞IO
-stats 给出某些文件的传输状态
--progress 在传输时现实传输过程
--log-format=formAT 指定日志文件格式
--password-file=FILE 从FILE中得到密码
--bwlimit=KBPS 限制I/O带宽，KBytes per second
-h, --help 显示帮助信息
```

**示例1** 将/etc/fstab拷贝到/tmp目录下。

```bash
rsync /etc/fstab /tmp
```

**示例2** 将/etc/cron.d目录拷贝到/tmp下。

```bash
rsync -r /etc/cron.d /tmp
```

**说明**：为了保持文件夹一致，可以将路径写为

```bash
rsync -avr /src/ /backup/
```

这样src下面的所有目录会被备份到 backup目录下面,而不会在backup文件夹下面创建src文件夹

#### 创建同步脚本

```bash
#!/bin/bash

fn() {

	src=$1     # 需要同步的源路径
	des=$2     # 目标路径

	cd ${src} #定位到源文件下面

	# 此方法中，由于rsync同步的特性，这里必须要先cd到源目录，inotify再监听 ./ 才能rsync同步后目录结构一致

	# 把监控到有发生更改的"文件路径列表"循环
	/usr/bin/inotifywait -mrq --format '%Xe %w%f' -e modify,create,delete,attrib,close_write,move ./ | while read file; do
		INO_EVENT=$(echo $file | awk '{print $1}') # 把inotify输出切割 把事件类型部分赋值给INO_EVENT
		INO_FILE=$(echo $file | awk '{print $2}')  # 把inotify输出切割 把文件路径部分赋值给INO_FILE
		echo "-------------------------------$(date)------------------------------------"
		echo $file
		#增加、修改、写入完成、移动进事件
		#增、改放在同一个判断，因为他们都肯定是针对文件的操作，即使是新建目录，要同步的也只是一个空目录，不会影响速度。
		if [[ $INO_EVENT =~ 'CREATE' ]] || [[ $INO_EVENT =~ 'MODIFY' ]] || [[ $INO_EVENT =~ 'CLOSE_WRITE' ]] || [[ $INO_EVENT =~ 'MOVED_TO' ]]; then # 判断事件类型
			echo 'CREATE or MODIFY or CLOSE_WRITE or MOVED_TO'
			# INO_FILE变量代表路径  -c校验文件内容
			rsync -avzcR $(dirname ${INO_FILE}) ${des}

			#上面的rsync同步命令 源是用了$(dirname ${INO_FILE})变量 即每次只针对性的同步发生改变的文件的目录
			#只同步目标文件的方法在生产环境的某些极端环境下会漏文件 现在可以在不漏文件下也有不错的速度 做到平衡)
			#然后用-R参数把源的目录结构递归到目标后面 保证目录结构一致性
		fi
		#删除、移动出事件
		if [[ $INO_EVENT =~ 'DELETE' ]] || [[ $INO_EVENT =~ 'MOVED_FROM' ]]; then
			echo 'DELETE or MOVED_FROM'
			#并加上--delete来删除目标上有而源中没有的文件，这里不能做到指定文件删除，如果删除的路径越靠近根，则同步的目录月多，同步删除的操作就越花时间。
			rsync -avzr --delete $(dirname ${INO_FILE}) ${des}
		fi
		#修改属性事件 指 touch chmod chown等操作
		if [[ $INO_EVENT =~ 'ATTRIB' ]]; then
			echo 'ATTRIB'
			if [ ! -d "$INO_FILE" ]; then # 如果修改属性的是目录 则不同步，因为同步目录会发生递归扫描，等此目录下的文件发生同步时，rsync会顺带更新此目录。
				rsync -avzcR $(dirname ${INO_FILE}) ${des}
			fi
		fi
	done 
}

fn /home/supreme/Workspace/ /media/supreme/yes/Workspace/ & #加上&符号表示在后台执行
fn 源路径2 目标路径2 & #加上&符号表示在后台执行
```

#### 添加开机启动项

将写好的脚本放到指定目录中

```bash
sudo cp ./sync.sh /usr/sbin
```
创建一个服务文件 sync.service

systemd有系统和用户区分；系统（/user/lib/systemd/system/）、用户（/etc/lib/systemd/user/）.

一般系统管理员手工创建的单元文件建议存放在/etc/systemd/system/目录下面。

```bash
[Unit]
Description= 服务的简单描述
Documentation= 服务文档
# Before、After:定义启动顺序。Before=xxx.service,代表本服务在xxx.service启动之前启动。After=xxx.service,代表本服务在xxx.service之后启动。
After=network.target

[Service]
# systemd认为当该服务进程fork，且父进程退出后服务启动成功。对于常规的守护进程 daemon
# 除非你确定此启动方式无法满足需求，使用此类型启动即可。使用此启动类型应同时指定 PIDFile=，以便systemd能够跟踪服务的主进程。
Type=forking

ExecStart=/usr/sbin/sync.sh

[Install]
# 单元被允许运行需要的弱依赖性单元，WantBy从Want列表获得依赖信息。
WantedBy=multi-user.target
```

添加开机启动并重载服务

```bash
sudo systemctl daemon-reload

sudo systemctl enable sync.service

sudo systemctl start sync.service
sudo systemctl stop sync.service
sudo systemctl reload sync.service

```