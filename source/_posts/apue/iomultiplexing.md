---
title: IO多路复用
date: 2021-06-21 11:04:24
tags: unix
categories:
- apue
---
## select
`select`函数，可以传入想观察的`fd_set`类型的三个集合，分别表示读、写、异常的fd。`nfds`表示监听的最大fd值+1，可以设置为`FD_SETSIZE`表示最大值。

返回已就绪的fd数量，它是三个集合中已就绪的fd数之和。

select对于`n`个fd，其时间复杂度为`O(n)`
```c
 #include <sys/select.h>
int select(int nfds, fd_set *readfds, fd_set *writefds,
            fd_set *exceptfds, struct timeval *timeout);
```

## poll
`poll`函数与`select`类似，不过不分成3个fd集合，而合并成一个`pollfd`结构。`event`表示关心的事件，例如读、写。`revent`表示返回的事件，其中除了包含关心的时间外，还包含了fd是否出错、挂断、是否打开一个文件等。

`poll`同样具有`O(n)`时间复杂度
```c
#include <poll.h>
int poll(struct pollfd *fds, nfds_t nfds, int timeout);

struct pollfd {
    int   fd;         /* file descriptor */
    short events;     /* requested events */
    short revents;    /* returned events */
};
```
