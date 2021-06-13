---
title: 信号机制
date: 2021-06-12 08:53:49
tags: unix
categories:
- apue
---
# 信号机制
信号用于处理异步事件，例如用户输入`ctrl + c`，调用`kill`杀死一个进程等

## 流程

### 生成信号
生成信号的方法有许多种：
- 用户在终端输入，例如`ctrl + c`向前台进程发送`SIGINT`
- 硬件异常，由内核产生信号，例如无效内存访问`SIGSEGV`
- `kill(1)`命令与`kill(2)`函数，在权限允许情况下可以向其他进程发送任意信号
- 某些软件条件达成

### 接收与处理信号
进程收到信号时，必须选择以下三个行为之一：
- 忽略信号。例如通过`signal`函数注册忽略`SIGINT`：`signal(SIGINT, SIG_IGN);`
- 捕获信号。需要通过`signal`函数注册，可自定义处理行为
- 默认动作。不注册行为，则在收到信号时执行系统默认动作。查看系统默认行为，Linux：`man 7 signal`，FreeBSD：`man signal`

有两个不能忽略也不能捕获的信号：
- `SIGKILL`：直接杀死进程，进程无法选择安全退出，不能继续运行
- `SIGSTOP`：停止运行进程，收到`SIGCONT`后继续运行

## `signal`函数
```c
// Linux
#include <signal.h>
typedef void (*sighandler_t)(int);
sighandler_t signal(int signum, sighandler_t handler);

// FreeBSD中的定义相同，不过属于库函数，而Linux中属于系统调用
```
这个复杂的定义，有两行：
1. `typedef`定义了`sighandler_t`类型，它是：
    - 一个函数指针类型
    - 它指向的函数返回`void`，有一个参数`int`
2. 下一行定义了`signal`函数：
    - 返回`sighandler_t`类型，它就是传入的第二个参数，或者`SIG_ERR`
    - 两个参数，`int signum`代表希望处理的信号，`sighandler_t handler`是自定义的信号处理函数，这个函数必须是返回`void`，参数`int`

## 示例
`kill`命令默认会发出`SIGTERM`信号，如果不注册处理函数，则系统默认行为是：
```
15  SIGTERM  terminate process    software termination signal
```

一般情况下，用`kill`杀死进程的过程如下：
1. `kill`向指定进程发出`SIGTERM`，
2. 进程接受到信号，寻找信号处理函数
3. 执行系统默认行为，终止进程

如果捕获了`SIGTERM`，则可以在进程停止前进行保存工作，安全退出，甚至可以选择不退出，但这不符合`SIGTERM`的意义。

代码的含义是：进程在接受到两次`SIGTERM`后，才正常退出。
```c
#include <stdio.h>
#include <stdlib.h>
#include <signal.h>
#include <unistd.h>

static int c = 2;
static void sigterm_handler(int signo) {
    printf("handle signal: %d\n", signo);
    c--;
}

int
main() {
    signal(SIGTERM, &sigterm_handler);
    while (c > 0)
        pause();
    printf("exit\n");
    exit(0);
}
```
让进程后台运行，通过`kill`发送两次`SIGTERM`，等待其正常退出
```powershell
$ ./a.out &
[1] 2587
$ kill 2587
$ handle signal: 15

$ kill 2587
handle signal: 15
exit
$
```