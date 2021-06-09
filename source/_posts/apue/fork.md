---
title: fork exec
date: 2021-06-09 03:34:58
tags: unix
categories:
- apue
---
# `fork`
## 定义
```c
// Linux
#include <sys/types.h>
#include <unistd.h>
pid_t fork(void);
```
## 父进程与子进程的关系 
1. `fork`函数父进程返回子进程pid，子进程返回`0`
2. 父进程与子进程的全局变量不共享。出于效率，变量是“写时复制”的，父子任意进程写入变量前，创建存储区副本
3. 父进程与子进程的文件描述符也是复制的，在父进程打开文件后`fork`，则子进程也已打开了文件，需要同步措施防止它们同时读写文件
4. 子进程继承了实际id、有效id，工作目录等等

# `exec`
## 定义
```c
#include <unistd.h>
extern char **environ;
int execl(const char *pathname, const char *arg, ...
                /* (char  *) NULL */);
int execlp(const char *file, const char *arg, ...
                /* (char  *) NULL */);
int execle(const char *pathname, const char *arg, ...
                /*, (char *) NULL, char *const envp[] */);
int execv(const char *pathname, char *const argv[]);
int execvp(const char *file, char *const argv[]);
int execvpe(const char *file, char *const argv[],
                char *const envp[]);
```
## 说明
1. `pathname`为路径名，绝对相对均可；`file`为文件名，若含`"/"`字符，视为文件名，否则在`PATH`环境变量中路径搜索可执行文件或shell脚本
2. 与`fork`不同，`exec`并不产生新进程，它将原始进程的代码段、全局变量数据段、堆、栈替换为新进程，新进程`pid`并不会改变

## 示例
```c
// t18.c，可执行文件为mypid，由exec启动这个进程
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

int
main(void)
{
    printf("my pid: %d\n", getpid());
    exit(0);
}

// t19.c，原始进程，将启动./mypid
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

int
main(void)
{
    printf("before exec, my pid: %d\n", getpid());
    execl("./mypid", NULL);
    printf("this line\n");
    exit(0);
}
```
编译，运行：
```powershell
$ cc t18.c -o mypid
$ cc t19.c
$ ./a.out 
before exec, my pid: 1520
my pid: 1520
```