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

## epoll
`select poll` 都采用轮询fd的方式确认是否有IO准备就绪，在网络中，如果fd数量非常多，则效率比较低下。

epool中，每个fd对应一个回调函数，当IO就绪时，对应的fd调用回调函数，将fd加入一个链表，epoll会检查这个链表，若有fd已就绪，则在`epoll_wait`函数处返回。

epoll有两种模式
- LT模式下，fd就绪，被读取后，如果fd中还有未读完的信息，则epoll会将它放回链表，下次还会报告这个fd
- ET模式，fd就绪，被读取后，就算有未读完的信息，epoll也不再监听这个fd，因此必须每次读完fd中的内容。这种方式效率更高。