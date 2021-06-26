---
title: 进程间通信
date: 2021-06-23 08:24:05
tags: unix
categories:
- apue
---
# 进程间通信
有五种进程间通信的方式：
- 管道
- FIFO
- 消息队列
- 信号量
- 共享存储器

# 管道 
管道是进程间通信的一种方式，普通的管道只能在父进程与子进程之间通信。
## pipe

`pipe`需要传入两个文件描述符`fd`，其中`pipefd[0]`用于读，`pipefd[1]`用于写。

父进程`fork`子进程后，内存也被复制了一份，已打开的管道仍然是能相互通信的。

一般`fork`之后，进程关闭两个`fd`中的一个，留下另一个用于通信。
```c
#include <unistd.h>
int pipe(int pipefd[2]);
```
## popen pclose
用于执行一个shell命令，同时返回的文件描述符连接到那个shell命令的`stdin`或`stdout`。

若`type = "r"`，则连接到命令的`stdout`；`type = "w"`则连接到`stdin`。
```c
#include <stdio.h>
FILE *popen(const char *command, const char *type);
int pclose(FILE *stream);
```

unix中调用`date`命令，可以获取当前时间，并格式化字符串：
```cpp
string date_string;
char buf[128];
int n;
FILE *pf = popen("date +%c", "r");
while ((n = fread(buf, sizeof(char), 127, pf)) > 0) {
    buf[n] = '\0';
    date_string += string(buf);
}
fclose(pf);
// date_string 最后会有一个换行符'\n'
cout << date_string;
// Fri Jun 25 17:31:24 2021
```

# FIFO（命名管道）
命名管道可用于两个无关的进程间通信。

机制同pipe，`pathname`指定了FIFO的路径，也是命名管道的名称。

`mode`与系统调用`open`一样，可指定读写等。
```c
#include <sys/types.h>
#include <sys/stat.h>
int mkfifo(const char *pathname, mode_t mode);
```
# 消息队列
消息的链表，由内核维护，有最大容量

# 信号量
信号量保证一定数量的进程能够访问临界区。二元信号量类似互斥锁，不过是在进程间互斥。

信号量由内核维护。

# 共享存储器
也叫共享内存。共享内存效率非常高，因为内存访问速度一般很快。进程间共享内存也会产生读写同步问题，因此需要信号量来保护共享内存。