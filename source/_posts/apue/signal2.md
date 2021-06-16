---
title: 信号机制（2）
date: 2021-06-15 12:22:09
tags: unix
categories:
- apue
---
# 可重入函数
某些库函数中调用了`malloc`等函数，若在其调用期间被信号中断，可能引起内存分配错误。

可重入函数是异步信号安全的，它们调用时会阻塞信号，不会引起因信号产生的安全问题。

# signal相关函数
## sigaction
检查、修改某个信号的动作，`act`为新动作，可为`NULL`；`oldact`为已存在动作
```c
#include <signal.h>
int sigaction(int signum, const struct sigaction *act,
                struct sigaction *oldact);

struct sigaction {
    void     (*sa_handler)(int);
    void     (*sa_sigaction)(int, siginfo_t *, void *);
    sigset_t   sa_mask;
    int        sa_flags;
    void     (*sa_restorer)(void);
};
```

## setjmp longjmp 与 sigsetjmp siglongjmp
这几个函数都用于非本地跳转，类似`goto`。`long`处的函数调用后，会从`set`处返回。

`setjmp longjmp`不恢复信号屏蔽字，而`sigsetjmp siglongjmp`在`set`处先保存当前信号屏蔽字，`long`回来时，恢复之前保存的屏蔽字。
```c
#include <setjmp.h>
int setjmp(jmp_buf env);
int sigsetjmp(sigjmp_buf env, int savesigs);

void longjmp(jmp_buf env, int val);
void siglongjmp(sigjmp_buf env, int val);
```

## sigsuspend
原子操作，保存当前信号屏蔽字，设置信号屏蔽字`mask`后`pause`，在接收到信号并处理好后，恢复保存的屏蔽字再返回。它不存在临界区内收到信号的问题
```c
 #include <signal.h>
int sigsuspend(const sigset_t *mask);
```

## system
执行shell命令，注意`system`的返回值<font color=red>**不一定**</font>是命令返回值，其实返回值是shell返回值，在shell异常退出时，会返回`128 + 信号值`